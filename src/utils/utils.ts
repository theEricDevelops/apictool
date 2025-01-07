import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OutputFormat } from '../types/image.types';
import imageCompression from 'browser-image-compression';
import { isHEIC, convertHEICToImage } from './heic.utils';

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
    if (typeof window === 'undefined') {
        return '';
    }

    if (isHEIC(file)) {
        const convertedFile = await convertHEICToImage(file);
        return URL.createObjectURL(convertedFile);
    } else {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 400,
            useWebWorker: true,
            initialQuality: 0.8,
            alwaysKeepResolution: true
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

export function getProcessingStage(progress: number): string {
  if (progress <= 10) return 'Initializing';
  if (progress <= 20) return 'Preparing';
  if (progress <= 80) return 'Compressing';
  if (progress <= 95) return 'Converting';
  return 'Finalizing';
}
