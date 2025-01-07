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
    if (!file) {
      throw new Error('No file provided for conversion');
    }

    console.log('Starting image conversion...', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      targetFormat: format
    });
    
    onProgress(0);
    await delay(300);
    
    // Pre-conversion checks
    let processedFile = file;
    
    if (isSVG(processedFile)) {
      const svgStart = performance.now();
      console.log('Converting SVG to PNG first');
      onProgress(10);
      processedFile = await convertSVGToImage(processedFile);
      timing.svgConversion = performance.now() - svgStart;
      onProgress(20);
    } else if (isHEIC(processedFile)) {
      const heicStart = performance.now();
      console.log('Converting HEIC to PNG first');
      onProgress(10);
      processedFile = await convertHEICToImage(processedFile);
      timing.heicConversion = performance.now() - heicStart;
      onProgress(20);
    }

    console.log('Stage: Preparing');
    onProgress(15);
    await delay(300);

    // Compression stage
    const shouldCompress = processedFile.size > 102400 && !isSVG(processedFile);
    console.log('Compression needed:', shouldCompress);

    if (shouldCompress) {
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

      if (processedFile.size / (1024 * 1024) < options.maxSizeMB) {
        options.maxSizeMB = (processedFile.size / (1024 * 1024)) * 0.8;
      }

      try {
        processedFile = await imageCompression(processedFile, options);
        timing.compression = performance.now() - compressionStart;
        console.log('Compression complete');
        onProgress(80);
      } catch (compressionError) {
        console.error('Compression failed:', compressionError);
        // Continue with uncompressed file
        console.log('Continuing with uncompressed file');
      }
    } else {
      console.log('Stage: Processing (small file)');
      for (let p = 20; p <= 80; p += 15) {
        onProgress(p);
        await delay(100);
      }
    }

    // Format conversion stage
    if (processedFile.type !== format) {
      const canvasStart = performance.now();
      console.log('Format conversion needed:', processedFile.type, '->', format);
      console.log('Stage: Format conversion');
      onProgress(85);
      
      try {
        const bitmap = await createImageBitmap(processedFile);
        const canvas = document.createElement('canvas');

        const { width, height } = format === 'image/gif' 
          ? calculateOptimalDimensions(bitmap.width, bitmap.height, 800)
          : { width: bitmap.width, height: bitmap.height };
          
        canvas.width = width;
        canvas.height = height;

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
              else reject(new Error('Failed to create blob from canvas'));
            },
            format,
            format === 'image/gif' ? undefined : 0.7
          );
        });

        timing.canvasConversion = performance.now() - canvasStart;
        timing.total = performance.now() - timing.start;

        console.log('Conversion complete for', processedFile.name, timing);
        
        onProgress(100);
        const url = URL.createObjectURL(blob);
        console.log('Created blob URL:', url);
        
        return { url, size: blob.size, blob };
        
      } catch (conversionError) {
        console.error('Format conversion failed:', conversionError);
        throw new Error(`Format conversion failed: ${conversionError.message}`);
      }
    } else {
      console.log('No format conversion needed');
      onProgress(100);
      const url = URL.createObjectURL(processedFile);
      console.log('Created blob URL:', url);
      
      return { 
        url,
        size: processedFile.size,
        blob: processedFile
      };
    }
  } catch (error) {
    console.error('Image conversion failed:', error);
    throw error instanceof Error ? error : new Error('Failed to convert image');
  }
}