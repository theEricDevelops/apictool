import { useCallback, useRef } from 'react';
import { convertImage } from '@/lib/imageConverter';
import { useAppState } from './useAppState';

export function useImageConversion() {
  const { state, dispatch } = useAppState();
  const { images, outputFormat, settings, hasParallelConversion } = state;
  const MAX_CONCURRENT_CONVERSIONS = 3;
  const activeConversions = images.filter(img => img.status === 'processing').length;
  const isProcessingRef = useRef(false);

  const processImage = useCallback(async (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (!image) {
      console.error(`Image with id ${imageId} not found`);
      return;
    }

    dispatch({
      type: 'UPDATE_IMAGE_STATUS',
      payload: { id: image.id, status: 'processing' }
    });

    try {
      const result = await convertImage(
        image.file.contents,
        outputFormat,
        (progress) => {
          dispatch({
            type: 'UPDATE_IMAGE_PROGRESS',
            payload: { id: image.id, progress }
          });
        }
      );

      console.log('Conversion completed:', {
        id: imageId,
        url: result.url,
        size: result.size
      });
  
      dispatch({
        type: 'UPDATE_IMAGE_STATUS',
        payload: {
          id: imageId,
          status: 'done',
          convertedFile: {
            url: result.url,
            size: result.size,
            blob: result.blob
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

  const processImages = useCallback(async () => {
    const imagesToProcess = images.filter(image => image.status === 'idle');
    if (imagesToProcess.length === 0) return;

    const availableSlots = MAX_CONCURRENT_CONVERSIONS - activeConversions;
    if (availableSlots <= 0) return;

    try {
      isProcessingRef.current = true;
      const selectedImages = imagesToProcess.slice(0, availableSlots);

      if (hasParallelConversion) {
        await Promise.all(selectedImages.map(async (image) => {
          dispatch({ type: 'INCREMENT_ACTIVE_CONVERSIONS' });
          await processImage(image.id);
          dispatch({ type: 'DECREMENT_ACTIVE_CONVERSIONS' });
        }));
      } else {
        for (const image of selectedImages) {
          dispatch({ type: 'INCREMENT_ACTIVE_CONVERSIONS' });
          await processImage(image.id);
          dispatch({ type: 'DECREMENT_ACTIVE_CONVERSIONS' });
        }
      }
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [images, activeConversions, hasParallelConversion, dispatch, processImage]);
  return {
    processImages,
    isProcessing: isProcessingRef.current,
    canStartNewConversion: activeConversions < MAX_CONCURRENT_CONVERSIONS
  };
}