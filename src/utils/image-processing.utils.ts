import { isHEIC, convertHEICToImage } from '@/utils/heic.utils';
import imageCompression from 'browser-image-compression';
import { OutputFormat } from '@/types/image.types';

/**
 * Image processing utility functions for color and pixel manipulation
 */

/**
 * Reduces the color depth of an image context
 * @param ctx - The 2D rendering context of a canvas
 * @param width - The width of the image
 * @param height - The height of the image
 * @param levels - Number of levels per color channel (default: 8 gives 512 colors)
 */
export function reduceColors(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  levels: number = 8
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  const step = Math.floor(256 / levels);
  
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = Math.round(pixels[i] / step) * step;     // Red
    pixels[i + 1] = Math.round(pixels[i + 1] / step) * step; // Green
    pixels[i + 2] = Math.round(pixels[i + 2] / step) * step; // Blue
    // Alpha channel (pixels[i + 3]) is left unchanged
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Calculates the optimal dimensions for an image while maintaining aspect ratio
 * @param width - Original width
 * @param height - Original height
 * @param maxDimension - Maximum allowed dimension
 * @returns Object containing new width and height
 */
export function calculateOptimalDimensions(
  width: number, 
  height: number, 
  maxDimension: number
): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}

export async function generateImagePreview(name: string, contents: Blob): Promise<string> {
  if (typeof window === 'undefined') {
      return '';
  }

  // Add validation logging
  console.log('Generating preview for:', {
      name,
      type: contents.type,
      size: contents.size,
      isFile: contents instanceof File,
      isBlob: contents instanceof Blob
  });

  if (isHEIC(contents)) {
      const convertedFile = await convertHEICToImage(contents);
      return URL.createObjectURL(convertedFile);
  } else {
      // Validate mime type
      if (!contents.type.startsWith('image/')) {
          console.error('Invalid file type:', contents.type);
          throw new Error(`File type ${contents.type} is not supported`);
      }

      const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 400,
          useWebWorker: true,
          initialQuality: 0.8,
          alwaysKeepResolution: true
      };
      
      try {
          const file = contents instanceof File ? contents : new File([contents], name, { type: contents.type });
          const compressedFile = await imageCompression(file, options);
          return URL.createObjectURL(compressedFile);
      } catch (error) {
          console.error('Error compressing image:', error);
          // If compression fails, try returning the original file
          return URL.createObjectURL(contents);
      }
  }
}

export function getImageExtension(format: OutputFormat): string {
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

export function getNewImageName(originalName: string, format: OutputFormat): string {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  return `${baseName}${getImageExtension(format)}`;
}

export function getImageProcessingStage(progress: number): string {
  if (progress <= 10) return 'Initializing';
  if (progress <= 20) return 'Preparing';
  if (progress <= 80) return 'Compressing';
  if (progress <= 95) return 'Converting';
  return 'Finalizing';
}