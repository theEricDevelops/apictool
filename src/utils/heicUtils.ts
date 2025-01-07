import type heic2any from 'heic2any';

/**
 * Checks if a file is a HEIC image based on its type or extension
 */
export function isHEIC(file: File): boolean {
  return file.type === 'image/heic' || 
         file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic');
}
  
/**
 * Converts a HEIC file to a PNG File object
 */
export async function convertHEICToImage(file: File): Promise<File> {
  console.log('Starting HEIC conversion...', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  try {
    // Dynamically import heic2any only on client side
    const heic2anyModule = await import('heic2any');
    const converter = heic2anyModule.default;

    const blob = await converter({
      blob: file,
      toType: 'image/png',
      quality: 1
    });

    // Convert single blob or array of blobs to a File  
    const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
    const convertedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.png'), {
      type: 'image/png'
    });

    console.log('HEIC conversion complete:', {
      originalSize: file.size, 
      convertedSize: convertedFile.size,
      convertedType: convertedFile.type
    });

    return convertedFile;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw new Error('Failed to convert HEIC image');
  }
}

/**
 * Function to check format and convert if necessary 
 */
export async function convertHEICIfNeeded(file: File): Promise<File> {
  if (isHEIC(file)) {
    return convertHEICToImage(file);
  }
  return file;
}

/**
 * Checks browser support for HEIC format
 */
export async function isHEICSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob(
      (blob) => {
        resolve(blob?.type === 'image/heic');
      },
      'image/heic'
    );
  });
}
