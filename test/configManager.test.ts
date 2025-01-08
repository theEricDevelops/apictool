import { describe, expect, test, jest } from '@jest/globals';
import { loadConfig, validateConfig, type ImageConfig } from '@/utils/image-config.utils';
import { fileExists, readFile } from '@/utils/file.utils';
import type { OutputFormat } from '@/types/image.types';

// Create mock functions
const mockFileExists = jest.fn();
const mockReadFile = jest.fn();

// Mock the entire module
jest.mock('@/utils/fileSystem', () => ({
  fileExists: (path: string) => mockFileExists(path),
  readFile: (path: string) => mockReadFile(path)
}));

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    test('should load and parse valid JSON config file', async () => {
      const mockConfig: ImageConfig = {
        quality: 80,
        maxWidth: 1920,
        maxHeight: 1080,
        file: {
          format: 'image/webp'
        },
        progressive: true
      };

      mockFileExists.mockImplementation(() => Promise.resolve(true));
      mockReadFile.mockImplementation(() => 
        Promise.resolve(Buffer.from(JSON.stringify(mockConfig)))
      );

      const config = await loadConfig('config.json');
      expect(config).toEqual(mockConfig);
    });

    test('should throw when config file does not exist', async () => {
      mockFileExists.mockImplementation(() => Promise.resolve(false));

      await expect(loadConfig('nonexistent.json')).rejects.toThrow('Config file not found');
    });

    test('should throw when config file is invalid JSON', async () => {
      mockFileExists.mockImplementation(() => Promise.resolve(true));
      mockReadFile.mockImplementation(() => 
        Promise.resolve(Buffer.from('invalid json'))
      );

      await expect(loadConfig('invalid.json')).rejects.toThrow('Invalid JSON in config file');
    });
  });

  describe('validateConfig', () => {
    test('should accept valid config', () => {
      const validConfig: ImageConfig = {
        quality: 80,
        maxWidth: 1920,
        maxHeight: 1080,
        file: {
          format: 'image/webp'
        },
        progressive: true
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    test('should throw on invalid quality value', () => {
      const invalidConfig: ImageConfig = {
        quality: 101,
        maxWidth: 1920,
        maxHeight: 1080,
        file: {
          format: 'image/webp'
        },
        progressive: true
      };

      expect(() => validateConfig(invalidConfig)).toThrow('Quality must be between 0 and 100');
    });

    test('should throw on invalid dimensions', () => {
      const invalidConfig: ImageConfig = {
        quality: 80,
        maxWidth: -1,
        maxHeight: 1080,
        file: {
          format: 'image/webp'
        },
        progressive: true
      };

      expect(() => validateConfig(invalidConfig)).toThrow('Dimensions must be positive numbers');
    });

    test('should throw on invalid format', () => {
      const invalidConfig: ImageConfig = {
        quality: 80,
        maxWidth: 1920,
        maxHeight: 1080,
        file: {
          format: 'invalid/format' as OutputFormat
        },
        progressive: true
      };

      expect(() => validateConfig(invalidConfig)).toThrow('Unsupported image format');
    });
  });
});