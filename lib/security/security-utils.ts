import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { RateLimiter } from 'limiter';
import { createHash, randomBytes } from 'crypto';

// Rate limiting configuration
const rateLimiters = new Map<string, RateLimiter>();

// Input validation schemas
export const BudgetAllocationSchema = z.object({
  fiscalYearId: z.string().uuid('Invalid fiscal year ID'),
  ministryId: z.string().uuid('Invalid ministry ID'),
  categoryId: z.string().uuid('Invalid category ID'),
  projectName: z.string()
    .min(3, 'Project name must be at least 3 characters')
    .max(255, 'Project name must not exceed 255 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,()]+$/, 'Project name contains invalid characters'),
  projectDescription: z.string()
    .max(2000, 'Project description must not exceed 2000 characters')
    .optional(),
  allocatedAmount: z.number()
    .positive('Allocated amount must be positive')
    .max(1000000000000, 'Allocated amount exceeds maximum limit'), // 1 trillion
  projectCode: z.string()
    .regex(/^[A-Z0-9\-_]{3,20}$/, 'Invalid project code format')
    .optional(),
  priorityLevel: z.number()
    .int('Priority level must be an integer')
    .min(1, 'Priority level must be at least 1')
    .max(10, 'Priority level must not exceed 10')
    .optional(),
  expectedStartDate: z.string()
    .datetime('Invalid start date format')
    .optional(),
  expectedEndDate: z.string()
    .datetime('Invalid end date format')
    .optional(),
  createdBy: z.string().uuid('Invalid creator ID')
});

export const DisbursementSchema = z.object({
  allocationId: z.string().uuid('Invalid allocation ID'),
  contractorId: z.string().uuid('Invalid contractor ID'),
  disbursedAmount: z.number()
    .positive('Disbursed amount must be positive')
    .max(1000000000000, 'Disbursed amount exceeds maximum limit'),
  disbursementDate: z.string().datetime('Invalid disbursement date format'),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  createdBy: z.string().uuid('Invalid creator ID')
});

export const ExpenditureReportSchema = z.object({
  disbursementId: z.string().uuid('Invalid disbursement ID'),
  totalAmount: z.number()
    .positive('Total amount must be positive')
    .max(1000000000000, 'Total amount exceeds maximum limit'),
  description: z.string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  items: z.array(z.object({
    description: z.string()
      .min(3, 'Item description must be at least 3 characters')
      .max(500, 'Item description must not exceed 500 characters'),
    amount: z.number()
      .positive('Item amount must be positive')
      .max(1000000000, 'Item amount exceeds maximum limit'),
    category: z.string()
      .min(2, 'Category must be at least 2 characters')
      .max(100, 'Category must not exceed 100 characters'),
    date: z.string().datetime('Invalid item date format'),
    receiptUrl: z.string().url('Invalid receipt URL').optional()
  }))
    .min(1, 'At least one expenditure item is required')
    .max(1000, 'Maximum 1000 expenditure items allowed'),
  submittedBy: z.string().uuid('Invalid submitter ID')
});

export const SignatureDataSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  signature: z.string()
    .regex(/^0x[a-fA-F0-9]{130}$/, 'Invalid signature format'),
  signer: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid signer address format'),
  timestamp: z.number()
    .int('Timestamp must be an integer')
    .positive('Timestamp must be positive'),
  nonce: z.string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid nonce format')
});

// Security utilities
export class SecurityUtils {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  /**
   * Sanitize text input to prevent injection attacks
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .trim();
  }

  /**
   * Validate and sanitize file upload
   */
  static validateFileUpload(file: File): {
    isValid: boolean;
    error?: string;
    sanitizedName?: string;
  } {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit'
      };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not allowed'
      };
    }

    // Sanitize filename
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);

    return {
      isValid: true,
      sanitizedName
    };
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data
   */
  static hashData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate IP address
   */
  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Extract client IP from request
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('x-vercel-forwarded-for');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    if (remoteAddr) {
      return remoteAddr;
    }
    
    return 'unknown';
  }

  /**
   * Validate request origin
   */
  static isValidOrigin(origin: string, allowedOrigins: string[]): boolean {
    try {
      const url = new URL(origin);
      return allowedOrigins.includes(url.origin);
    } catch {
      return false;
    }
  }
}

// Rate limiting middleware
export class RateLimiter {
  private limiters: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is within rate limit
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const key = identifier;
    const current = this.limiters.get(key);

    if (!current) {
      this.limiters.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (now > current.resetTime) {
      this.limiters.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (current.count >= this.maxRequests) {
      return false;
    }

    current.count++;
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string): number {
    const current = this.limiters.get(identifier);
    if (!current) return this.maxRequests;
    
    const now = Date.now();
    if (now > current.resetTime) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - current.count);
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number {
    const current = this.limiters.get(identifier);
    return current?.resetTime || Date.now() + this.windowMs;
  }
}

// Input validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; error: string } => {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return { success: false, error: errorMessage };
      }
      return { success: false, error: 'Invalid input data' };
    }
  };
}

// Security middleware for API routes
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    rateLimit?: { windowMs: number; maxRequests: number };
    allowedOrigins?: string[];
    requireAuth?: boolean;
    validateInput?: z.ZodSchema<any>;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const clientIP = SecurityUtils.getClientIP(request);
        const rateLimiter = new RateLimiter(
          options.rateLimit.windowMs,
          options.rateLimit.maxRequests
        );

        if (!rateLimiter.isAllowed(clientIP)) {
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((rateLimiter.getResetTime(clientIP) - Date.now()) / 1000)
            },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil((rateLimiter.getResetTime(clientIP) - Date.now()) / 1000).toString(),
                'X-RateLimit-Limit': options.rateLimit.maxRequests.toString(),
                'X-RateLimit-Remaining': rateLimiter.getRemainingRequests(clientIP).toString(),
                'X-RateLimit-Reset': rateLimiter.getResetTime(clientIP).toString()
              }
            }
          );
        }
      }

      // Origin validation
      if (options.allowedOrigins) {
        const origin = request.headers.get('origin');
        if (origin && !SecurityUtils.isValidOrigin(origin, options.allowedOrigins)) {
          return NextResponse.json(
            { error: 'Invalid origin' },
            { status: 403 }
          );
        }
      }

      // Input validation
      if (options.validateInput) {
        const body = await request.json();
        const validation = validateInput(options.validateInput)(body);
        
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid input', details: validation.error },
            { status: 400 }
          );
        }
      }

      // Add security headers
      const response = await handler(request);
      
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
      
      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// SQL injection prevention
export function sanitizeSQLInput(input: string): string {
  return input
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;]/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments start
    .replace(/\*\//g, '') // Remove block comments end
    .replace(/union/gi, '') // Remove UNION keywords
    .replace(/select/gi, '') // Remove SELECT keywords
    .replace(/insert/gi, '') // Remove INSERT keywords
    .replace(/update/gi, '') // Remove UPDATE keywords
    .replace(/delete/gi, '') // Remove DELETE keywords
    .replace(/drop/gi, '') // Remove DROP keywords
    .trim();
}

// CSRF protection
export function generateCSRFToken(): string {
  return SecurityUtils.generateSecureToken(32);
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64;
}

// Content Security Policy
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://api.supabase.co https://polygon-rpc.com https://rpc-mumbai.maticvigil.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

export default {
  SecurityUtils,
  RateLimiter,
  validateInput,
  withSecurity,
  sanitizeSQLInput,
  generateCSRFToken,
  validateCSRFToken,
  CSP_HEADER,
  schemas: {
    BudgetAllocationSchema,
    DisbursementSchema,
    ExpenditureReportSchema,
    SignatureDataSchema
  }
};

