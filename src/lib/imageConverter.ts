import imageCompression from 'browser-image-compression';
import { OutputFormat } from '@/types/image';
import { ConvertedFile } from '@/types/files';
import { isHEIC, convertHEICToImage } from '@/utils/heicUtils';
import { isSVG, convertSVGToImage } from '@/utils/svgUtils';
import { reduceColors, calculateOptimalDimensions } from '@/utils/imageProcessingUtils';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function convertImage(
  file: File,
  format: OutputFormat,
  onProgress: (progress: number) => void
): Promise<ConvertedFile> {
  const timing = {
    start: performance.now(),
    heicConversion: 0,
    svgConversion: 0,
    compression: 0,
    canvasConversion: 0,
    total: 0
  };

  try {
    console.log('Starting image conversion...', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      targetFormat: format
  });
    onProgress(0);
    await delay(300);
    
    if (isSVG(file)) {
      const svgStart = performance.now();
      console.log('Converting SVG to PNG first');
      onProgress(10);
      file = await convertSVGToImage(file);
      timing.svgConversion = performance.now() - svgStart;
      onProgress(20);
    } else if (isHEIC(file)) {
      const heicStart = performance.now();
      console.log('Converting HEIC to PNG first');
      onProgress(10);
      file = await convertHEICToImage(file);
      timing.heicConversion = performance.now() - heicStart;
      onProgress(20);
    }

    console.log('Stage: Preparing');
    onProgress(15);
    await delay(300);

    const shouldCompress = file.size > 102400 && !isSVG(file);
    console.log('Compression needed:', shouldCompress);

    if (shouldCompress) {
      // Compression timing
      const compressionStart = performance.now();

      console.log('Stage: Compressing');
      onProgress(20);
      
      const options = {
        maxSizeMB: 0.5,
        useWebWorker: true,
        maxWidthOrHeight: 2048,
        initialQuality: 0.7,
        onProgress: (p: number) => {
          const mappedProgress = Math.round(20 + ((p / 100) * 60));
          console.log('Compression progress:', mappedProgress);
          onProgress(mappedProgress);
        },
      };

      if (file.size / (1024 * 1024) < options.maxSizeMB) {
        options.maxSizeMB = (file.size / (1024 * 1024)) * 0.8;
      }

      file = await imageCompression(file, options);
      timing.compression = performance.now() - compressionStart;
      console.log('Compression complete');
      onProgress(80);
    } else {
      console.log('Stage: Processing (small file)');
      for (let p = 20; p <= 80; p += 15) {
        onProgress(p);
        await delay(100);
      }
    }

    if (file.type !== format) {
      // Canvas conversion timing
      const canvasStart = performance.now();

      console.log('Format conversion needed:', file.type, '->', format);
      console.log('Stage: Format conversion');
      onProgress(85);
      await delay(300);
      
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');

      if (format === 'image/gif') {
        const { width, height } = calculateOptimalDimensions(bitmap.width, bitmap.height, 800);
        canvas.width = width;
        canvas.height = height;
    } else {
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      if (format === 'image/gif') {
        reduceColors(ctx, canvas.width, canvas.height);
      }
      onProgress(90);
      await delay(200);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert image'));
          },
          format,
          format === 'image/gif' ? undefined : 0.7
        );
      });

      timing.canvasConversion = performance.now() - canvasStart;

      // Calculate total time
      timing.total = performance.now() - timing.start;

      console.log('Conversion timing for', file.name, ':', {
        heicConversion: `${timing.heicConversion.toFixed(2)}ms`,
        svgConversion: `${timing.svgConversion.toFixed(2)}ms`,
        compression: `${timing.compression.toFixed(2)}ms`,
        canvasConversion: `${timing.canvasConversion.toFixed(2)}ms`,
        total: `${timing.total.toFixed(2)}ms`
      });

      console.log('Stage: Finalizing');
      onProgress(95);
      await delay(200);
      onProgress(100);
      return { 
        url: URL.createObjectURL(blob), 
        size: blob.size,
        blob 
      };
    } else {
      console.log('No format conversion needed');
      onProgress(95);
      await delay(200);
      onProgress(100);
      return { 
        url: URL.createObjectURL(file), 
        size: file.size,
        blob: file
      };
    }
  } catch (error) {
    console.error('Image conversion error:', error);
    throw new Error('Failed to convert image');
  }
}
