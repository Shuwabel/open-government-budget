import { createClient } from '@supabase/supabase-js';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  ipfsHash?: string;
  fileId?: string;
  error?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  ipfsHash?: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  tags?: string[];
}

export class FileUploadService {
  private supabase;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    // Use public anon key for client-side, service role key is server-only
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.maxFileSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'); // 10MB
    this.allowedTypes = (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx').split(',');
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    file: File,
    bucket: string = 'documents',
    path?: string,
    metadata?: {
      description?: string;
      tags?: string[];
      uploadedBy?: string;
    }
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomId}.${fileExtension}`;
      
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Store metadata in database
      const { data: fileRecord, error: dbError } = await this.supabase
        .from('documents')
        .insert({
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          uploaded_by: metadata?.uploadedBy || 'system',
          description: metadata?.description,
          tags: metadata?.tags || [],
          storage_path: filePath,
          bucket_name: bucket
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from(bucket).remove([filePath]);
        return {
          success: false,
          error: `Database error: ${dbError.message}`
        };
      }

      return {
        success: true,
        url: urlData.publicUrl,
        fileId: fileRecord.id
      };
    } catch (error) {
      return {
        success: false,
        error: `Upload error: ${error}`
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    bucket: string = 'documents',
    path?: string,
    metadata?: {
      description?: string;
      tags?: string[];
      uploadedBy?: string;
    }
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, bucket, path, metadata);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Upload to IPFS (using Pinata as a service)
   */
  async uploadToIPFS(
    file: File,
    metadata?: {
      name?: string;
      description?: string;
      attributes?: any[];
    }
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Convert file to FormData
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: metadata.name || file.name,
          description: metadata.description || '',
          attributes: metadata.attributes || []
        }));
      }

      // Upload to Pinata
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': process.env.PINATA_API_KEY!,
          'pinata_secret_api_key': process.env.PINATA_SECRET_KEY!
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `IPFS upload failed: ${error}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      };
    } catch (error) {
      return {
        success: false,
        error: `IPFS upload error: ${error}`
      };
    }
  }

  /**
   * Upload file to both Supabase and IPFS
   */
  async uploadWithIPFSBackup(
    file: File,
    bucket: string = 'documents',
    path?: string,
    metadata?: {
      description?: string;
      tags?: string[];
      uploadedBy?: string;
    }
  ): Promise<FileUploadResult> {
    try {
      // Upload to Supabase first
      const supabaseResult = await this.uploadFile(file, bucket, path, metadata);
      
      if (!supabaseResult.success) {
        return supabaseResult;
      }

      // Upload to IPFS as backup
      const ipfsResult = await this.uploadToIPFS(file, {
        name: file.name,
        description: metadata?.description,
        attributes: [
          { trait_type: 'File Type', value: file.type },
          { trait_type: 'File Size', value: file.size.toString() },
          { trait_type: 'Upload Date', value: new Date().toISOString() }
        ]
      });

      // Update database record with IPFS hash
      if (ipfsResult.success && supabaseResult.fileId) {
        await this.supabase
          .from('documents')
          .update({ ipfs_hash: ipfsResult.ipfsHash })
          .eq('id', supabaseResult.fileId);
      }

      return {
        success: true,
        url: supabaseResult.url,
        ipfsHash: ipfsResult.ipfsHash,
        fileId: supabaseResult.fileId
      };
    } catch (error) {
      return {
        success: false,
        error: `Upload with IPFS backup failed: ${error}`
      };
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) {
        console.error('Error fetching file metadata:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        size: data.size,
        type: data.type,
        url: data.url,
        ipfsHash: data.ipfs_hash,
        uploadedBy: data.uploaded_by,
        uploadedAt: data.created_at,
        description: data.description,
        tags: data.tags
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Get file metadata first
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return false;
      }

      // Delete from Supabase Storage
      const { error: storageError } = await this.supabase.storage
        .from('documents')
        .remove([metadata.url.split('/').pop() || '']);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('documents')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${this.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${this.allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(fileId: string): Promise<string | null> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return null;
      }

      // Return IPFS URL if available, otherwise Supabase URL
      return metadata.ipfsHash 
        ? `https://gateway.pinata.cloud/ipfs/${metadata.ipfsHash}`
        : metadata.url;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }

  /**
   * Search files by metadata
   */
  async searchFiles(query: {
    uploadedBy?: string;
    tags?: string[];
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<FileMetadata[]> {
    try {
      let supabaseQuery = this.supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (query.uploadedBy) {
        supabaseQuery = supabaseQuery.eq('uploaded_by', query.uploadedBy);
      }

      if (query.type) {
        supabaseQuery = supabaseQuery.like('type', `%${query.type}%`);
      }

      if (query.dateFrom) {
        supabaseQuery = supabaseQuery.gte('created_at', query.dateFrom);
      }

      if (query.dateTo) {
        supabaseQuery = supabaseQuery.lte('created_at', query.dateTo);
      }

      if (query.tags && query.tags.length > 0) {
        supabaseQuery = supabaseQuery.contains('tags', query.tags);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Error searching files:', error);
        return [];
      }

      return data.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        ipfsHash: file.ipfs_hash,
        uploadedBy: file.uploaded_by,
        uploadedAt: file.created_at,
        description: file.description,
        tags: file.tags
      }));
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }
}

export const fileUploadService = new FileUploadService();

