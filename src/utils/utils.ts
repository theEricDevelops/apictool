import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OutputFormat } from '../types/image';
import imageCompression from 'browser-image-compression';
import { getHEICConvertedURL } from './heicUtils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(format: OutputFormat): string {
  const extensions: Record<OutputFormat, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'image/heic': '.heic'
  };
  return extensions[format];
}

export async function generatePreview(file: File): Promise<string> {
    if (file.type === 'image/heic') {
        return await getHEICConvertedURL(file);
    } else {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 64,
            useWebWorker: true,
        };
        
        const compressedFile = await imageCompression(file, options);
        return URL.createObjectURL(compressedFile);
    }
}

export function getNewFileName(originalName: string, format: OutputFormat): string {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  return `${baseName}${getFileExtension(format)}`;
}

export function getNewFileSize(originalSize: number, convertedSize: number): string {
  if (convertedSize === undefined) return 'Error';
  const reduction = ((1 - convertedSize / originalSize) * 100).toFixed(2);
  return `${formatBytes(convertedSize)} (reduced by ${reduction}%)`;
}
