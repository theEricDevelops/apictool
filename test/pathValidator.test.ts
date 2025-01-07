import { describe, expect, test } from '@jest/globals';
import { validatePath, normalizePath } from '@/utils/path-validator.utils';

describe('PathValidator', () => {
  describe('validatePath', () => {
    test('should accept valid file paths', () => {
      const validPaths = [
        './images/test.jpg',
        '/absolute/path/image.png',
        'relative/path/photo.jpeg',
        'C:\\Windows\\image.jpg',
        'file.jpg'
      ];

      validPaths.forEach(path => {
        expect(() => validatePath(path)).not.toThrow();
      });
    });

    test('should reject paths with invalid characters', () => {
      const invalidPaths = [
        'image<.jpg',
        'image>.png',
        'image*.jpeg',
        'image?.jpg',
        'image|.png'
      ];

      invalidPaths.forEach(path => {
        expect(() => validatePath(path)).toThrow();
      });
    });

    test('should reject empty paths', () => {
      expect(() => validatePath('')).toThrow();
    });
  });

  describe('normalizePath', () => {
    test('should convert backslashes to forward slashes', () => {
      const input = 'path\\to\\image.jpg';
      expect(normalizePath(input)).toBe('path/to/image.jpg');
    });

    test('should remove duplicate slashes', () => {
      const input = 'path//to////image.jpg';
      expect(normalizePath(input)).toBe('path/to/image.jpg');
    });

    test('should handle paths with mixed slashes', () => {
      const input = 'path\\to//image\\test.jpg';
      expect(normalizePath(input)).toBe('path/to/image/test.jpg');
    });
  });
});
