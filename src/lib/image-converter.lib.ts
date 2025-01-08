'use client';

import imageCompression from 'browser-image-compression';
import { OutputFormat } from '@/types/image.types';
import { FileInfo } from '@/types/file.types';
import { isHEIC, convertHEICToImage } from '@/utils/heic.utils';
import { isSVG, convertSVGToImage } from '@/utils/svg.utils';
import { reduceColors, calculateOptimalDimensions } from '@/utils/image-processing.utils';
import { debugStep } from '@/utils/debug.utils';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function convertImage(
  contents: File | Blob,
  fileName: string,
  format: OutputFormat,
  onProgress: (progress: number) => void
): Promise<FileInfo> {
  const timing = {
    start: performance.now(),
    heicConversion: 0,
    svgConversion: 0,
    compression: 0,
    canvasConversion: 0,
    total: 0
  };

  try {
    await debugStep('Initialization', {
      fileName: fileName,
      fileType: contents.type,
      fileSize: contents.size,
      targetFormat: format
    });

    if (!contents) {
      throw new Error('No file provided for conversion');
    }
    
    onProgress(0);
    
    // Pre-conversion checks
    let originalFile = contents;
    let processedFile = originalFile instanceof File 
      ? originalFile 
      : new File([originalFile], fileName, { type: originalFile.type });

    await debugStep('Pre-conversion checks', {
      isSVG: isSVG(originalFile),
      isHEIC: isHEIC(originalFile)
    });
    
    if (isSVG(originalFile)) {
      const svgStart = performance.now();
      console.log('Converting SVG to PNG first');
      onProgress(10);
      originalFile = await convertSVGToImage(originalFile, fileName);
      processedFile = originalFile instanceof File 
        ? originalFile 
        : new File([originalFile], fileName, { type: originalFile.type });
      timing.svgConversion = performance.now() - svgStart;
      onProgress(20);
    } else if (isHEIC(originalFile)) {
      const heicStart = performance.now();
      console.log('Converting HEIC to PNG first');
      onProgress(10);
      originalFile = await convertHEICToImage(originalFile);
      processedFile = originalFile instanceof File 
        ? originalFile 
        : new File([originalFile], fileName, { type: originalFile.type });
      timing.heicConversion = performance.now() - heicStart;
      onProgress(20);
    }

    console.log('Stage: Preparing');
    onProgress(15);
    await delay(300);

    // Compression stage
    const shouldCompress = originalFile.size > 102400 && !isSVG(originalFile);

    if (shouldCompress) {
      const compressionStart = performance.now();
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

      await debugStep('Starting Compression', {
        fileSize: originalFile.size,
        compressionOptions: options
      });

      if (originalFile.size / (1024 * 1024) < options.maxSizeMB) {
        options.maxSizeMB = (originalFile.size / (1024 * 1024)) * 0.8;
      }
      
      try {
        processedFile = await imageCompression(processedFile, options);
        timing.compression = performance.now() - compressionStart;
        console.log('Compression complete');
        onProgress(80);
        
        return {
          name: fileName,
          contents: processedFile,
          format: processedFile.type,
          url: URL.createObjectURL(processedFile),
          size: processedFile.size
        };
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

    await debugStep('Compression Complete', {
      isCompressed: processedFile.size < originalFile.size,
      compressedSize: processedFile.size
    });

    // Format conversion stage
    if (processedFile.type !== format) {
      const canvasStart = performance.now();
      await debugStep('Starting Format Conversion', { 
        currentFormat: processedFile.type, 
        targetFormat: format
      });
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

        await debugStep('Conversion Complete', { timing });

        onProgress(100);
        const url = URL.createObjectURL(blob);
        
        await debugStep('URL Created', { url });
        
        return {
          name: fileName,
          size: blob.size,
          contents: blob,
          format: format,
          url: url
        };
        
      } catch (conversionError) {
        await debugStep('Conversion Error', { conversionError });
        if (conversionError instanceof Error) {
          throw new Error(`Format conversion failed: ${conversionError.message}`);
        }
        throw new Error('Format conversion failed');
      }
    } else {
      await debugStep('No Format Conversion Needed');
      onProgress(100);
      const url = URL.createObjectURL(processedFile);
      await debugStep('URL Created', { url });
      
      return { 
        name: fileName,
        size: processedFile.size,
        contents: processedFile,
        format: processedFile.type,
        url: url
      };
    }
  } catch (error) {
    await debugStep('Fatal Error', { error });
    throw error instanceof Error ? error : new Error('Failed to convert image');
  }
}
