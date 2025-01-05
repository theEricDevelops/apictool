import { fileExists, readFile } from '@/utils/fileSystem';
import type { OutputFormat } from '@/types/image';

// Create a type that only includes the config-related properties we need
export type ImageConfig = {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  progressive: boolean;
  file: {
    format: OutputFormat;
  }
};

export const validateConfig = (config: ImageConfig): void => {
  // Validate dimensions first
  if (typeof config.maxWidth !== 'number' || 
      typeof config.maxHeight !== 'number' || 
      config.maxWidth <= 0 || 
      config.maxHeight <= 0) {
    throw new Error('Dimensions must be positive numbers');
  }

  // Then validate quality
  if (typeof config.quality !== 'number' || config.quality < 0 || config.quality > 100) {
    throw new Error('Quality must be between 0 and 100');
  }

  // Validate format
  const validFormats: OutputFormat[] = [
    'image/webp',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/avif',
    'image/heic'
  ];
  if (!validFormats.includes(config.file.format)) {
    throw new Error('Unsupported image format');
  }

  // Validate progressive flag
  if (typeof config.progressive !== 'boolean') {
    throw new Error('Progressive flag must be a boolean');
  }
};

export const loadConfig = async (path: string): Promise<ImageConfig> => {
  const exists = await fileExists(path);
  if (!exists) {
    throw new Error('Config file not found');
  }

  try {
    const configBuffer = await readFile(path);
    const config = JSON.parse(configBuffer.toString()) as ImageConfig;
    validateConfig(config);
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in config file');
    }
    throw error;
  }
};

export const DEFAULT_CONFIG: ImageConfig = {
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
  file: {
    format: 'image/webp'
  },
  progressive: true
};