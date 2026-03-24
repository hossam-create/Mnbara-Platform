/**
 * 🔒 SECURITY-COMPLIANT IMAGE UPLOAD COMPONENTS
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - ALL image uploads are SECURITY-CRITICAL for preventing malicious uploads
 * - Backend validates ALL image data independently - Frontend validation is cosmetic only
 * - MIME type validation is MANDATORY - File extension validation is insufficient
 * - Image size limits prevent DoS attacks and storage abuse
 * - Malformed image detection prevents security bypass attempts
 * 
 * VIOLATION OF IMAGE UPLOAD POLICY COMPROMISES SYSTEM SECURITY
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  validateInputSecurity, 
  validateFileName,
  ValidationResult 
} from '@/utils/securityValidation';
import { useSecurityEventLogging, EventCategory, EventType, TargetType } from '@/hooks/useSecurityEventLogging';

/**
 * ⚠️ SECURITY: Allowed Image Formats - Backend validates independently
 * Frontend validation is COSMETIC ONLY - Backend validates final format
 */
export const ALLOWED_IMAGE_FORMATS = {
  MIME_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ],
  FILE_EXTENSIONS: [
    '.jpg',
    '.jpeg', 
    '.png',
    '.webp'
  ],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB absolute maximum
  PREFERRED_MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB preferred
  MIN_FILE_SIZE: 1024 // 1KB minimum (prevent empty files)
} as const;

/**
 * ⚠️ SECURITY: Image Upload Props
 * Backend validates ALL uploads - Frontend validation is cosmetic only
 */
interface SecureImageUploadProps {
  name: string;
  onImageUpload: (file: File, validation: ValidationResult, preview: string) => void;
  onImageRemove?: () => void;
  maxFileSize?: number;
  allowedFormats?: string[];
  required?: boolean;
  className?: string;
  previewClassName?: string;
  showPreview?: boolean;
  showFileInfo?: boolean;
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoLogEvents?: boolean;
}

/**
 * ⚠️ SECURITY: Image Validation Result
 * Backend validates ALL image data - Frontend validation is cosmetic only
 */
export interface ImageValidationResult extends ValidationResult {
  file?: File;
  preview?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  format?: string;
  mimeType?: string;
  fileSize?: number;
}

/**
 * 🔒 SECURITY: Validate Image File - Backend validates independently
 * Frontend validation is COSMETIC ONLY - Backend validates final image
 */
export async function validateImageFile(
  file: File,
  options: {
    maxFileSize?: number;
    allowedFormats?: string[];
    checkDimensions?: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  
  const maxSize = options.maxFileSize || ALLOWED_IMAGE_FORMATS.MAX_FILE_SIZE;
  const allowedFormats = options.allowedFormats || ALLOWED_IMAGE_FORMATS.MIME_TYPES;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] Validating image file:', {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
    });
  }
  
  // SECURITY: Validate file name
  const fileNameValidation = validateFileName(file.name);
  if (!fileNameValidation.is_valid) {
    errors.push(...fileNameValidation.errors);
    warnings.push(...fileNameValidation.warnings);
    securityLevel = 'HIGH';
  }
  
  // SECURITY: Validate file size (prevent DoS)
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum limit of ${Math.round(maxSize / (1024 * 1024))}MB`);
    warnings.push('Large file size detected - potential DoS attack');
    securityLevel = 'HIGH';
  }
  
  if (file.size < ALLOWED_IMAGE_FORMATS.MIN_FILE_SIZE) {
    errors.push('File is too small - minimum 1KB required');
    warnings.push('Suspiciously small file detected');
    securityLevel = 'MEDIUM';
  }
  
  // SECURITY: Validate MIME type (CRITICAL - not just extension)
  if (!allowedFormats.includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed`);
    errors.push('Only JPG, PNG, and WebP images are permitted');
    warnings.push('Invalid MIME type detected');
    securityLevel = 'CRITICAL';
  }
  
  // SECURITY: Validate file extension matches MIME type
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const expectedExtensions = ALLOWED_IMAGE_FORMATS.FILE_EXTENSIONS;
  
  if (!expectedExtensions.includes(fileExtension)) {
    errors.push(`File extension "${fileExtension}" is not allowed`);
    warnings.push('File extension does not match expected formats');
    securityLevel = 'HIGH';
  }
  
  // SECURITY: Check for MIME type spoofing
  const mimeTypeExtension = file.type.split('/')[1];
  const expectedMimeExtensions = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp']
  };
  
  const expectedExtensionsForMime = expectedMimeExtensions[file.type as keyof typeof expectedMimeExtensions];
  if (expectedExtensionsForMime && !expectedExtensionsForMime.some(ext => fileExtension === `.${ext}`)) {
    errors.push('File extension does not match MIME type - potential spoofing attack');
    warnings.push('MIME type spoofing detected');
    securityLevel = 'CRITICAL';
  }
  
  let dimensions: { width: number; height: number } | undefined;
  let preview: string | undefined;
  
  // SECURITY: Validate image dimensions if requested
  if (options.checkDimensions) {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          dimensions = {
            width: img.width,
            height: img.height
          };
          
          // SECURITY: Validate minimum dimensions
          if (options.minWidth && img.width < options.minWidth) {
            errors.push(`Image width must be at least ${options.minWidth}px`);
            warnings.push('Image too small - potential security issue');
          }
          
          if (options.minHeight && img.height < options.minHeight) {
            errors.push(`Image height must be at least ${options.minHeight}px`);
            warnings.push('Image too small - potential security issue');
          }
          
          // SECURITY: Validate maximum dimensions (prevent DoS)
          if (options.maxWidth && img.width > options.maxWidth) {
            errors.push(`Image width must not exceed ${options.maxWidth}px`);
            warnings.push('Image too large - potential DoS attack');
            securityLevel = 'HIGH';
          }
          
          if (options.maxHeight && img.height > options.maxHeight) {
            errors.push(`Image height must not exceed ${options.maxHeight}px`);
            warnings.push('Image too large - potential DoS attack');
            securityLevel = 'HIGH';
          }
          
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          errors.push('Invalid image file - cannot load image');
          warnings.push('Corrupted or malformed image detected');
          securityLevel = 'CRITICAL';
          reject(new Error('Image load failed'));
        };
        
        img.src = objectUrl;
      });
      
      // SECURITY: Create preview if validation passed
      if (errors.length === 0) {
        preview = await createImagePreview(file, 200, 200);
      }
      
    } catch (error) {
      errors.push('Failed to validate image dimensions');
      warnings.push('Image validation error - potential security issue');
      securityLevel = 'HIGH';
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] Image validation completed:', {
      file_name: file.name,
      is_valid: errors.length === 0,
      is_safe: errors.length === 0,
      security_level: securityLevel,
      error_count: errors.length,
      warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
    });
  }
  
  return {
    is_valid: errors.length === 0,
    is_safe: errors.length === 0,
    errors,
    warnings,
    sanitized_value: file.name,
    original_value: file.name,
    security_level: securityLevel,
    validation_timestamp: new Date().toISOString(),
    validation_source: 'FRONTEND',
    file,
    preview,
    dimensions,
    format: fileExtension,
    mimeType: file.type,
    fileSize: file.size
  };
}

/**
 * 🔒 SECURITY: Create Image Preview - Backend validates independently
 * Frontend preview is COSMETIC ONLY - Backend validates final image
 */
export async function createImagePreview(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        // SECURITY: Calculate dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // SECURITY: Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // SECURITY: Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // SECURITY: Convert to base64 (safe format)
        const preview = canvas.toDataURL('image/jpeg', 0.8);
        
        URL.revokeObjectURL(objectUrl);
        resolve(preview);
        
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to create image preview'));
    };
    
    img.src = objectUrl;
  });
}

/**
 * 🔒 SECURITY: Secure Image Upload Component
 * Backend validates ALL uploads - Frontend validation is cosmetic only
 */
export const SecureImageUpload: React.FC<SecureImageUploadProps> = ({
  name,
  onImageUpload,
  onImageRemove,
  maxFileSize = ALLOWED_IMAGE_FORMATS.PREFERRED_MAX_FILE_SIZE,
  allowedFormats = ALLOWED_IMAGE_FORMATS.MIME_TYPES,
  required = false,
  className = '',
  previewClassName = '',
  showPreview = true,
  showFileInfo = true,
  securityLevel = 'HIGH',
  autoLogEvents = true
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [validation, setValidation] = useState<ImageValidationResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createSecurityEvent } = useSecurityEventLogging();
  
  // SECURITY: Auto-log component access for high-security uploads
  useEffect(() => {
    if (autoLogEvents && (securityLevel === 'HIGH' || securityLevel === 'CRITICAL')) {
      createSecurityEvent(
        EventCategory.SECURITY,
        EventType.ACCESS_GRANTED,
        TargetType.USER,
        `image-upload-${name}`,
        { metadata: { security_level: securityLevel } },
        'SecureImageUpload'
      );
    }
  }, [name, securityLevel, autoLogEvents, createSecurityEvent]);
  
  /**
   * ⚠️ SECURITY: Handle file selection - Backend validates final file
   * Frontend validation is COSMETIC ONLY - Backend validates independently
   */
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] File selected for upload:', {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
      });
    }
    
    setIsUploading(true);
    
    try {
      // SECURITY: Validate image file (cosmetic check)
      const validationResult = await validateImageFile(file, {
        maxFileSize,
        allowedFormats,
        checkDimensions: true,
        minWidth: 100,
        minHeight: 100,
        maxWidth: 5000,
        maxHeight: 5000
      });
      
      setValidation(validationResult);
      
      if (!validationResult.is_valid) {
        // SECURITY: Log validation failure
        if (autoLogEvents) {
          createSecurityEvent(
            EventCategory.SECURITY,
            EventType.SECURITY_ALERT,
            TargetType.USER,
            `image-validation-failed-${name}`,
            { 
              metadata: { 
                file_name: file.name,
                errors: validationResult.errors,
                security_level: validationResult.security_level
              } 
            },
            'SecureImageUpload'
          );
        }
        
        setIsUploading(false);
        return;
      }
      
      // SECURITY: Create preview if validation passed
      if (validationResult.preview) {
        setPreview(validationResult.preview);
      }
      
      setSelectedFile(file);
      
      // SECURITY: Log successful validation
      if (autoLogEvents) {
        createSecurityEvent(
          EventCategory.SYSTEM,
          EventType.SYSTEM_STARTUP,
          TargetType.USER,
          `image-validation-success-${name}`,
          { 
            metadata: { 
              file_name: file.name,
              file_size: file.size,
              dimensions: validationResult.dimensions
            } 
          },
          'SecureImageUpload'
        );
      }
      
      // SECURITY: Pass to parent component (backend will validate independently)
      onImageUpload(file, validationResult, validationResult.preview || '');
      
    } catch (error) {
      console.error('[SECURITY CRITICAL] Image validation error:', error);
      
      // SECURITY: Log validation error
      if (autoLogEvents) {
        createSecurityEvent(
          EventCategory.ERROR,
          EventType.SYSTEM_ERROR,
          TargetType.USER,
          `image-validation-error-${name}`,
          { 
            metadata: { 
              error: error instanceof Error ? error.message : 'Unknown error'
            } 
          },
          'SecureImageUpload'
        );
      }
      
      const errorResult: ImageValidationResult = {
        is_valid: false,
        is_safe: false,
        errors: ['Failed to validate image file'],
        warnings: ['Image validation error - potential security issue'],
        sanitized_value: '',
        original_value: file.name,
        security_level: 'HIGH',
        validation_timestamp: new Date().toISOString(),
        validation_source: 'FRONTEND'
      };
      
      setValidation(errorResult);
    } finally {
      setIsUploading(false);
    }
  }, [name, maxFileSize, allowedFormats, onImageUpload, autoLogEvents, createSecurityEvent]);
  
  /**
   * ⚠️ SECURITY: Handle file input change
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);
  
  /**
   * ⚠️ SECURITY: Handle drag and drop
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);
  
  /**
   * ⚠️ SECURITY: Handle remove image
   */
  const handleRemoveImage = useCallback(() => {
    setSelectedFile(null);
    setPreview('');
    setValidation(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // SECURITY: Log image removal
    if (autoLogEvents) {
      createSecurityEvent(
        EventCategory.SYSTEM,
        EventType.SYSTEM_SHUTDOWN,
        TargetType.USER,
        `image-removed-${name}`,
        {},
        'SecureImageUpload'
      );
    }
    
    if (onImageRemove) {
      onImageRemove();
    }
  }, [name, onImageRemove, autoLogEvents, createSecurityEvent]);
  
  /**
   * ⚠️ SECURITY: Get upload area class name
   */
  const getUploadAreaClassName = useCallback(() => {
    let classes = `secure-image-upload ${className}`;
    
    if (dragOver) {
      classes += ' drag-over';
    }
    
    if (isUploading) {
      classes += ' uploading';
    }
    
    if (securityLevel === 'HIGH' || securityLevel === 'CRITICAL') {
      classes += ' security-critical';
    }
    
    if (validation && !validation.is_valid) {
      classes += ' validation-error';
    }
    
    return classes;
  }, [className, dragOver, isUploading, securityLevel, validation]);
  
  /**
   * ⚠️ SECURITY: Get file info display
   */
  const getFileInfo = useCallback(() => {
    if (!selectedFile || !validation) return null;
    
    return (
      <div className="file-info">
        <div className="file-name">{selectedFile.name}</div>
        <div className="file-size">{Math.round(selectedFile.size / 1024)}KB</div>
        {validation.dimensions && (
          <div className="file-dimensions">
            {validation.dimensions.width} × {validation.dimensions.height}px
          </div>
        )}
        <div className="file-format">{validation.mimeType}</div>
      </div>
    );
  }, [selectedFile, validation]);
  
  /**
   * ⚠️ SECURITY: Get validation feedback
   */
  const getValidationFeedback = useCallback(() => {
    if (!validation) return null;
    
    return (
      <div className={`validation-feedback ${validation.is_valid ? 'valid' : 'invalid'}`}>
        {validation.errors.map((error, index) => (
          <div key={index} className="validation-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        ))}
        {validation.warnings.map((warning, index) => (
          <div key={index} className="validation-warning">
            <span className="warning-icon">⚡</span>
            {warning}
          </div>
        ))}
        {!validation.is_valid && (
          <div className="security-notice">
            <span className="security-icon">🔒</span>
            Backend will validate independently
          </div>
        )}
      </div>
    );
  }, [validation]);
  
  return (
    <div className={getUploadAreaClassName()}>
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept={ALLOWED_IMAGE_FORMATS.MIME_TYPES.join(',')}
        onChange={handleFileInputChange}
        className="secure-file-input"
        disabled={isUploading}
        data-security-level={securityLevel}
        data-validation-source="FRONTEND"
        data-cosmetic-only="true"
      />
      
      {!selectedFile ? (
        <div 
          className={`upload-area ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="uploading-state">
              <div className="upload-spinner"></div>
              <p>Validating image...</p>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon">📷</div>
              <p>Click to upload or drag and drop</p>
              <p className="upload-requirements">
                JPG, PNG, WebP only • Max {Math.round(maxFileSize / (1024 * 1024))}MB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="image-preview-container">
          {showPreview && preview && (
            <div className="image-preview">
              <img src={preview} alt="Preview" className={previewClassName} />
            </div>
          )}
          
          {showFileInfo && getFileInfo()}
          
          <div className="image-actions">
            <button 
              onClick={handleRemoveImage}
              className="remove-button"
              disabled={isUploading}
            >
              Remove Image
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="replace-button"
              disabled={isUploading}
            >
              Replace Image
            </button>
          </div>
        </div>
      )}
      
      {getValidationFeedback()}
      
      <div className="security-info">
        <span className="security-badge">🔒 SECURE UPLOAD</span>
        <span className="security-text">Backend validates independently</span>
        {securityLevel === 'CRITICAL' && (
          <span className="critical-notice">🛡️ High security validation enabled</span>
        )}
      </div>
    </div>
  );
};

/**
 * 🔒 SECURITY: Multiple Image Upload Component
 * Backend validates ALL uploads - Frontend validation is cosmetic only
 */
export const SecureMultipleImageUpload: React.FC<{
  name: string;
  onImagesUpload: (files: File[], validations: ImageValidationResult[]) => void;
  maxImages?: number;
  maxFileSize?: number;
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoLogEvents?: boolean;
}> = ({
  name,
  onImagesUpload,
  maxImages = 5,
  maxFileSize = ALLOWED_IMAGE_FORMATS.PREFERRED_MAX_FILE_SIZE,
  securityLevel = 'HIGH',
  autoLogEvents = true
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validations, setValidations] = useState<ImageValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createSecurityEvent } = useSecurityEventLogging();
  
  /**
   * ⚠️ SECURITY: Handle multiple file selection
   */
  const handleFilesSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const fileArray = Array.from(files);
      const validationPromises = fileArray.map(file => 
        validateImageFile(file, {
          maxFileSize,
          checkDimensions: true
        })
      );
      
      const validationResults = await Promise.all(validationPromises);
      
      setSelectedFiles(fileArray);
      setValidations(validationResults);
      
      // SECURITY: Pass to parent component
      const validFiles = fileArray.filter((_, index) => validationResults[index].is_valid);
      const validValidations = validationResults.filter(result => result.is_valid);
      
      if (validFiles.length > 0) {
        onImagesUpload(validFiles, validValidations);
      }
      
    } catch (error) {
      console.error('[SECURITY CRITICAL] Multiple image validation error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [maxImages, maxFileSize, onImagesUpload]);
  
  return (
    <div className="secure-multiple-image-upload">
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept={ALLOWED_IMAGE_FORMATS.MIME_TYPES.join(',')}
        onChange={(e) => handleFilesSelect(e.target.files)}
        className="secure-file-input"
        multiple
        disabled={isProcessing}
        data-security-level={securityLevel}
        data-validation-source="FRONTEND"
        data-cosmetic-only="true"
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="upload-multiple-button"
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : `Upload up to ${maxImages} images`}
      </button>
      
      {selectedFiles.length > 0 && (
        <div className="multiple-images-preview">
          {selectedFiles.map((file, index) => (
            <div key={index} className="image-item">
              <div className="image-info">
                <span className="image-name">{file.name}</span>
                <span className="image-size">{Math.round(file.size / 1024)}KB</span>
                {validations[index] && (
                  <span className={`validation-status ${validations[index].is_valid ? 'valid' : 'invalid'}`}>
                    {validations[index].is_valid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="security-info">
        <span className="security-badge">🔒 SECURE MULTIPLE UPLOAD</span>
        <span className="security-text">Backend validates all images independently</span>
      </div>
    </div>
  );
};

export default {
  SecureImageUpload,
  SecureMultipleImageUpload,
  validateImageFile,
  createImagePreview,
  ALLOWED_IMAGE_FORMATS
};