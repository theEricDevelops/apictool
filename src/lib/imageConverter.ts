import imageCompression from 'browser-image-compression';
import { OutputFormat } from '../types/image';
import { convertHEICIfNeeded } from '../utils/heicUtils';

export async function convertImage(
  file: File,
  format: OutputFormat,
  onProgress: (progress: number) => void
): Promise<{ url: string, size: number }> {
  try {
    console.log('Starting image compression...');

    file = await convertHEICIfNeeded(file); // Convert if HEIC

    const options = {
      maxSizeMB: 2,
      useWebWorker: true,
      maxWidthOrHeight: 2048,
      onProgress: (p: number) => onProgress(Math.round(p * 100)),
    };

    const compressedFile = await imageCompression(file, options);
    console.log('Image compressed:', compressedFile.type);

    console.log('Using file type:', compressedFile.type);

    const bitmap = await createImageBitmap(compressedFile);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image'));
        },
        format,
        0.9
      )
    });

    console.log('Image converted:', blob);
    return { url: URL.createObjectURL(blob), size: blob.size };
  } catch (error) {
    console.error('Image conversion error:', error);
    throw new Error('Failed to convert image');
  }
}
