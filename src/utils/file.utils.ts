
import { formatBytes } from '@/utils/utils';

export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type });
}

export function getNewFileSize(originalSize: number, convertedSize: number): string {
  if (convertedSize === undefined) return 'Error';
  const reduction = ((1 - convertedSize / originalSize) * 100).toFixed(2);
  return `${formatBytes(convertedSize)} (reduced by ${reduction}%)`;
}