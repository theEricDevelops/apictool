import { useCallback, useRef, useState } from 'react';
import { convertImage } from '@/lib/image-converter.lib';
import { useAppState } from '@/hooks/useAppState';
import { TIER_LIMITS, DEFAULT_USER_TIER } from '@/constants/tier.constants';

export function useImageConversion() {
  const { state, dispatch } = useAppState();
  const { images, outputFormat, userTier = DEFAULT_USER_TIER } = state;
  const [ selectedFormat, setSelectedFormat ] = useState(outputFormat);
  const MAX_CONCURRENT_CONVERSIONS = TIER_LIMITS[userTier];
  const activeConversions = images.filter(img => img.status === 'processing').length;
  const isProcessingRef = useRef(false);

  const areAllImagesDone = images.length > 0 && images.every(img => 
    img.status === 'done' && img.convertedFile?.format === outputFormat
  );

  const handleFormatChange = useCallback(() => {
    dispatch({ type: 'SET_OUTPUT_FORMAT', payload: selectedFormat });
  }, [dispatch, selectedFormat]);

  const processImage = useCallback(async (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (!image) {
      console.error(`Image with id ${imageId} not found`);
      return;
    }

    dispatch({ type: 'INCREMENT_ACTIVE_CONVERSIONS' });

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
      } finally {
        dispatch({ type: 'DECREMENT_ACTIVE_CONVERSIONS' });
      }
    }, [dispatch, images, outputFormat]
  );

  const processNextImage = useCallback(async () => {
    // Debug current state
    console.log('Processing Status:', images.map(img => ({
      id: img.id,
      name: img.file.name,
      status: img.status,
      activeConversions
    })));

    if (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
      console.log('🛑 Max conversions reached:', {
        active: activeConversions,
        max: MAX_CONCURRENT_CONVERSIONS
      });
      return;
    }

    const nextImage = images.find(image => ['idle', 'error'].includes(image.status));
    if (!nextImage) {
      console.log('⏹️ No next image found. Current queue:', 
        images.map(img => ({
          id: img.id,
          name: img.file.name,
          status: img.status
        }))
      );
      return;
    }

    console.log('▶️ Starting next image:', {
      id: nextImage.id,
      name: nextImage.file.name,
      status: nextImage.status
    });

    await processImage(nextImage.id);

    // Debug state after processing
    console.log('✅ After processing:', {
      id: nextImage.id,
      name: nextImage.file.name,
      newStatus: images.find(img => img.id === nextImage.id)?.status,
      activeConversions
    });

  }, [images, activeConversions, MAX_CONCURRENT_CONVERSIONS, processImage]);
  
  const processImages = useCallback(async () => {
    console.log('🎬 Starting processImages with:', {
      totalImages: images.length,
      activeConversions,
      maxConcurrent: MAX_CONCURRENT_CONVERSIONS,
      imageStatuses: images.map(img => ({
        id: img.id,
        status: img.status
      }))
    });

    handleFormatChange();

    try {
      isProcessingRef.current = true;
      dispatch({ type: 'SET_CAN_CONVERT', payload: false });

      const initialPromises = Array.from({ length: MAX_CONCURRENT_CONVERSIONS }, () => 
        processNextImage()
      )
      
      await Promise.all(initialPromises);

    } catch (error) {
      console.error('❌ Error processing images:', error);
    } finally {
      isProcessingRef.current = false;
      if (images.some(img => img.status === 'idle' || img.status === 'error')){
        dispatch({ type: 'SET_CAN_CONVERT', payload: true });
      }
      console.log('🏁 ProcessImages finished. Final status:', 
        images.map(img => ({
          id: img.id,
          name: img.file.name,
          status: img.status
        }))
      );
    }
  }, [MAX_CONCURRENT_CONVERSIONS, activeConversions, images, handleFormatChange, dispatch, processNextImage]);
  
  return {
    processImages,
    isProcessing: isProcessingRef.current,
    canStartNewConversion: activeConversions < MAX_CONCURRENT_CONVERSIONS && images.some(img => !['processing', 'done'].includes(img.status)),
    areAllImagesDone,
    selectedFormat,
    setSelectedFormat
  };
}