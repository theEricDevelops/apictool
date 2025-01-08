import { describe, expect, test, jest } from '@jest/globals';
import { readFile, writeFile, fileExists } from '@/utils/file.utils';
import fs from 'fs/promises';

// Mock fs/promises module
jest.mock('fs/promises');

describe('FileSystem', () => {
  describe('fileExists', () => {
    test('should return true when file exists', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      
      const exists = await fileExists('/path/to/existing.jpg');
      expect(exists).toBe(true);
    });

    test('should return false when file does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      
      const exists = await fileExists('/path/to/nonexistent.jpg');
      expect(exists).toBe(false);
    });
  });

  describe('readFile', () => {
    test('should successfully read a file', async () => {
      const mockBuffer = Buffer.from('test data');
      (fs.readFile as jest.Mock).mockResolvedValue(mockBuffer);
      
      const data = await readFile('/path/to/file.jpg');
      expect(data).toBe(mockBuffer);
    });

    test('should throw when file cannot be read', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Read error'));
      
      await expect(readFile('/path/to/error.jpg')).rejects.toThrow('Read error');
    });
  });

  describe('writeFile', () => {
    test('should successfully write a file', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      const data = Buffer.from('test data');
      await expect(writeFile('/path/to/output.jpg', data)).resolves.not.toThrow();
      expect(fs.writeFile).toHaveBeenCalledWith('/path/to/output.jpg', data);
    });

    test('should throw when file cannot be written', async () => {
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write error'));
      
      const data = Buffer.from('test data');
      await expect(writeFile('/path/to/error.jpg', data)).rejects.toThrow('Write error');
    });
  });
});