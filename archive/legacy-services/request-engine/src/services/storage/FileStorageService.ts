// ============================================
// File Storage Service Interface
// ============================================

export interface FileStorageService {
  /**
   * Upload a file
   */
  upload(
    file: Buffer,
    filename: string,
    mimetype: string,
    path?: string
  ): Promise<string>;

  /**
   * Delete a file
   */
  delete(url: string): Promise<void>;

  /**
   * Get file URL
   */
  getUrl(path: string): Promise<string>;

  /**
   * Check if file exists
   */
  exists(path: string): Promise<boolean>;
}
