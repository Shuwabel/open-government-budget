"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  X, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Cloud,
  HardDrive,
  Copy,
  Trash2
} from 'lucide-react';
import { fileUploadService, FileUploadResult, FileMetadata } from '@/lib/storage/file-upload-service';
import { toast } from 'sonner';

interface FileUploadProps {
  bucket?: string;
  path?: string;
  uploadedBy?: string;
  onUploadComplete?: (results: FileUploadResult[]) => void;
  onFileSelect?: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number;
  showPreview?: boolean;
  enableIPFS?: boolean;
}

interface UploadedFile {
  file: File;
  result?: FileUploadResult;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  metadata?: FileMetadata;
}

export function FileUpload({
  bucket = 'documents',
  path,
  uploadedBy = 'system',
  onUploadComplete,
  onFileSelect,
  multiple = true,
  maxFiles = 10,
  acceptedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
  maxSize = 10 * 1024 * 1024, // 10MB
  showPreview = true,
  enableIPFS = true
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }

      // Check file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !acceptedTypes.includes(fileExtension)) {
        errors.push(`${file.name}: File type not allowed`);
        return;
      }

      // Check max files limit
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`${file.name}: Maximum ${maxFiles} files allowed`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending'
      }));

      setFiles(prev => [...prev, ...newUploadedFiles]);
      onFileSelect?.(validFiles);
    }
  }, [files.length, maxFiles, maxSize, acceptedTypes, onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('No files to upload');
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = files.map(async (uploadedFile, index) => {
        // Update status to uploading
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'uploading' } : f
        ));

        try {
          const metadata = {
            description,
            tags,
            uploadedBy
          };

          let result: FileUploadResult;
          
          if (enableIPFS) {
            result = await fileUploadService.uploadWithIPFSBackup(
              uploadedFile.file,
              bucket,
              path,
              metadata
            );
          } else {
            result = await fileUploadService.uploadFile(
              uploadedFile.file,
              bucket,
              path,
              metadata
            );
          }

          // Update file with result
          setFiles(prev => prev.map((f, i) => 
            i === index ? { 
              ...f, 
              result, 
              progress: 100, 
              status: result.success ? 'completed' : 'error' 
            } : f
          ));

          return result;
        } catch (error) {
          setFiles(prev => prev.map((f, i) => 
            i === index ? { 
              ...f, 
              result: { success: false, error: String(error) }, 
              status: 'error' 
            } : f
          ));
          return { success: false, error: String(error) };
        }
      });

      const results = await Promise.all(uploadPromises);
      onUploadComplete?.(results);

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} file(s) uploaded successfully`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} file(s) failed to upload`);
      }
    } catch (error) {
      toast.error(`Upload failed: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const url = await fileUploadService.getDownloadUrl(fileId);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('File downloaded');
      } else {
        toast.error('Download URL not available');
      }
    } catch (error) {
      toast.error(`Download failed: ${error}`);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📁';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Accepted types: {acceptedTypes.join(', ')} • Max size: {maxSize / 1024 / 1024}MB
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={acceptedTypes.map(type => `.${type}`).join(',')}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the uploaded files..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (Optional)</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <Button
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
            className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} File{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5 text-primary" />
              Selected Files ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 border border-border rounded-lg"
                >
                  <div className="text-2xl">
                    {getFileIcon(uploadedFile.file.name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={uploadedFile.progress} className="h-2" />
                      </div>
                    )}
                    
                    {uploadedFile.status === 'completed' && uploadedFile.result?.success && (
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Upload successful</span>
                        {uploadedFile.result.ipfsHash && (
                          <Badge variant="outline" className="text-xs">
                            <Cloud className="w-3 h-3 mr-1" />
                            IPFS
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {uploadedFile.status === 'error' && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">
                          {uploadedFile.result?.error || 'Upload failed'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadedFile.status === 'completed' && uploadedFile.result?.success && (
                      <>
                        {uploadedFile.result.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyUrl(uploadedFile.result!.url!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        {uploadedFile.result.fileId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(
                              uploadedFile.result!.fileId!, 
                              uploadedFile.file.name
                            )}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                    
                    {uploadedFile.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

