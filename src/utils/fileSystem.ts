import fs from 'fs/promises';

/**
 * Checks if a file exists at the given path
 * @param path The file path to check
 * @returns Promise<boolean> True if the file exists, false otherwise
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Reads a file from the given path
 * @param path The file path to read from
 * @returns Promise<Buffer> The file contents as a Buffer
 * @throws If the file cannot be read
 */
export const readFile = async (path: string): Promise<Buffer> => {
  try {
    return await fs.readFile(path);
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error('Unknown error reading file');
  }
};

/**
 * Writes data to a file at the given path
 * @param path The file path to write to
 * @param data The data to write
 * @throws If the file cannot be written
 */
export const writeFile = async (path: string, data: Buffer): Promise<void> => {
  try {
    await fs.writeFile(path, data);
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error('Unknown error writing file');
  }
};