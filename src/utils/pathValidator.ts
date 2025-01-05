type ValidationError = {
    message: string;
    code: 'INVALID_CHARS' | 'EMPTY_PATH';
  };
  
  /**
   * Validates a file path for illegal characters and empty strings
   * @param path The file path to validate
   * @throws {ValidationError} If the path is invalid
   */
  export const validatePath = (path: string): void => {
    if (!path) {
      throw {
        message: 'File path cannot be empty',
        code: 'EMPTY_PATH'
      } as ValidationError;
    }
  
    // Regular expression to match invalid characters in file paths
    const invalidChars = /[<>:"|?*]/;
    
    if (invalidChars.test(path)) {
      throw {
        message: 'File path contains invalid characters',
        code: 'INVALID_CHARS'
      } as ValidationError;
    }
  };
  
  /**
   * Normalizes a file path by converting backslashes to forward slashes
   * and removing duplicate slashes
   * @param path The file path to normalize
   * @returns The normalized path
   */
  export const normalizePath = (path: string): string => {
    // Convert all backslashes to forward slashes
    let normalized = path.replace(/\\/g, '/');
    
    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');
    
    return normalized;
  };