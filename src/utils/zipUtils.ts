import { BlobWriter, ZipWriter } from '@zip.js/zip.js';
import { ImageFile, OutputFormat } from '../types/image';
import { getNewFileName } from './utils';

export async function createZipFile(images: ImageFile[], outputFormat: OutputFormat): Promise<Blob> {
  const zipWriter = new ZipWriter(new BlobWriter('application/zip'));

  try {
    const convertedImages = images.filter(img => img.status === 'done' && img.convertedFile);
    
    if (convertedImages.length === 0) {
      throw new Error('No converted images available');
    }

    for (const image of convertedImages) {
      if (!image.convertedFile) continue;
      
      const response = await fetch(image.convertedFile.url);
      if (!response.ok) continue;
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const fileName = getNewFileName(image.file.name, outputFormat);
      const readableStream = new Response(new Uint8Array(arrayBuffer)).body;
      if (readableStream) {
        await zipWriter.add(fileName, readableStream);
      }
    }

    return await zipWriter.close();
  } catch (error) {
    console.error('ZIP creation error:', error);
    await zipWriter.close();
    throw error;
  }
}