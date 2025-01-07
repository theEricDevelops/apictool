import { useCallback, useRef, useState } from 'react';
import { convertImage } from '@/lib/imageConverter';
import { useAppState } from '@/hooks/useAppState';

export function useImageConversion() {
  const { state, dispatch } = useAppState();
  const { images, outputFormat, hasParallelConversion } = state;
  const [ selectedFormat, setSelectedFormat ] = useState(outputFormat);
  const MAX_CONCURRENT_CONVERSIONS = 3;
  const activeConversions = images.filter(img => img.status === 'processing').length;
  const isProcessingRef = useRef(false);

  const areAllImagesDone = images.length > 0 && images.every(img => 
    img.status === 'done' && img.convertedFile?.format === outputFormat
  );

  const canStartConversion = images.length > 0 && (
    images.some(img =>
      img.status === 'idle' ||
      img.convertedFile?.format !== selectedFormat
    )
  );

  const handleConversion = useCallback(() => {
    dispatch({ type: 'SET_OUTPUT_FORMAT', payload: selectedFormat });
  }, [dispatch, selectedFormat]);

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
            format: outputFormat,
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
    }, [dispatch, images, outputFormat]);

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
    handleConversion,
    isProcessing: isProcessingRef.current,
    canStartNewConversion: activeConversions < MAX_CONCURRENT_CONVERSIONS && images.some(img => !['processing', 'done'].includes(img.status)),
    areAllImagesDone,
    canConvert: canStartConversion,
    selectedFormat,
    setSelectedFormat
  };
}