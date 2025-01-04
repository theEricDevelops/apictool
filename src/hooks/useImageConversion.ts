import { convertImage } from '../lib/imageConverter';
import { useImageStore } from '../store/useImageStore';

export async function startConversion(imageId: string) {
  const { images, outputFormat, updateImageStatus, updateImageProgress } = useImageStore.getState();
  const image = images.find((img) => img.id === imageId);
  if (!image) return;

  updateImageStatus(image.id, 'processing');
  console.log('startConversion called for:', imageId);

  try {
    const result = await convertImage(
          image.file.contents,
          outputFormat,
          (progress) => updateImageProgress(image.id, progress)
        );
    console.log('Image successfully converted => size:', result.size);
    updateImageStatus(image.id, 'done', { url: result.url, size: result.size }, undefined);
  } catch (error) {
    console.error('Conversion error:', error);
    updateImageStatus(image.id, 'error', undefined, (error as Error).message);
  }
}