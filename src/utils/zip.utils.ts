import { BlobWriter, ZipWriter } from '@zip.js/zip.js';
import { OutputFormat } from '@/types/image.types';
import { QueueItem } from '@/types/file.types';
import { getNewFileName } from '@/utils/utils';

export async function createZipFile(images: QueueItem[], outputFormat: OutputFormat): Promise<Blob> {
  const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
  const usedFileNames = new Set<string>();
  const processedBlobs = new Set<string>();

  try {
    const convertedImages = images.filter(img => img.status === 'done' && img.convertedFile);
    
    if (convertedImages.length === 0) {
      throw new Error('No contents available');
    }

    let extension = outputFormat.split('/')[1] || outputFormat;
    if (extension === 'jpeg') {
      extension = 'jpg';
    }

    for (const image of convertedImages) {
      if (!image.convertedFile) continue;
      
      const blob = image.convertedFile.blob;
      const blobHash = await hashBlob(blob);

      if (processedBlobs.has(blobHash)) {
        console.log('Skipping duplicate blob:', image.file.name);
        continue;
      }
      processedBlobs.add(blobHash);

      let fileName = getNewFileName(image.file.name, outputFormat);

      console.log('Original File name:', image.file.name);
      console.log('Generated File name:', fileName);
      console.log('Output Format:', outputFormat);

      let counter = 1;
      const baseFileName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, outputFormat);
      while (usedFileNames.has(fileName)) {
        fileName = `${baseFileName}_${counter}.${extension}`;
        counter++;
      }
      usedFileNames.add(fileName);

      console.log('Final File name:', fileName);

      await zipWriter.add(fileName, blob.stream());
    }

    return await zipWriter.close();
  } catch (error) {
    console.error('ZIP creation error:', error);
    await zipWriter.close();
    throw error;
  }
}

// Helper function to create a hash of a blob's content
async function hashBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}