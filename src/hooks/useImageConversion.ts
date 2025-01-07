import { useCallback } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { convertImage } from '../lib/imageConverter';

export function useImageConversion() {
  const { state, dispatch } = useAppState();
  const { images, outputFormat, settings } = state;

  const startConversion = useCallback(async (imageId: string) => {
  const image = images.find((img) => img.id === imageId);
  if (!image) return;

    const processingImages = images.filter(img => img.status === 'processing');
    if (processingImages.length >= settings.maxConcurrentProcessing) {
      console.log('Too many concurrent conversions, waiting...');
      return;
    }

  try {
    dispatch({
      type: 'UPDATE_IMAGE_STATUS',
      payload: { id: imageId, status: 'processing' }
    });

    const result = await convertImage(
          image.file.contents,
          outputFormat,
      (progress) => {
          if (progress % 10 === 0) {
        dispatch({
          type: 'UPDATE_IMAGE_PROGRESS',
          payload: { id: imageId, progress }
        });
      }
        }
        );

    dispatch({
      type: 'UPDATE_IMAGE_STATUS',
      payload: {
        id: imageId,
        status: 'done',
        convertedFile: {
            url: result.url,
            size: result.size
        }
      }
    });
  } catch (error) {
    dispatch({
      type: 'UPDATE_IMAGE_STATUS',
      payload: {
        id: imageId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Conversion failed'
  }
    });
}
  }, [dispatch, images, outputFormat, settings.maxConcurrentProcessing]);

  return { startConversion };
}