'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { convertImage } from '@/lib/image-converter.lib';
import { useAppState } from '@/hooks/useAppState';
import { ImageFile, OutputFormat } from '@/types/image.types';
import { FileInfo } from '@/types/file.types';
import { TIER_LIMITS, DEFAULT_USER_TIER } from '@/constants/tier.constants';
import { CONVERSION_TIMEOUT } from '@/constants/states.constants';
import { debugStep } from '@/utils/debug.utils';
import { ConversionStatus } from '@/types/state.types';

interface ImageConversionHookResult {
  processImages: () => Promise<void>;
  isProcessing: boolean;
  canStartNewConversion: boolean;
  areAllImagesDone: boolean;
  selectedFormat: OutputFormat;
  setSelectedFormat: (format: OutputFormat) => void;
  activeConversions: number;
}

export function useImageConversion(): ImageConversionHookResult {
  const { state, dispatch } = useAppState();
  const { images, 
    outputFormat, 
    userTier = DEFAULT_USER_TIER, 
    conversionStatus,
    conversionQueue
  } = state;
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(outputFormat);
  const MAX_CONCURRENT_CONVERSIONS = TIER_LIMITS[userTier];
  const activeConversions = useRef(0);
  const isProcessingRef = useRef<boolean>(false);
  const retryMap = useRef<Map<string, number>>(new Map());

  const areAllImagesDone = images.length > 0 && images.every(img =>
    img.status === 'done' &&
    img.convertedFile?.format === outputFormat
  );

  useEffect(() => {
    retryMap.current.clear();
    images.forEach(img => {
      if (img.status === 'error') {
        retryMap.current.set(img.id, 0);
      }
    });
  }, [images]);

  const updateConversionStatus = useCallback(async (newStatus: ConversionStatus) => {
    console.log('Updating conversion status to:', newStatus);
    await dispatch({ type: 'SET_CONVERSION_STATUS', payload: newStatus });
  }, [dispatch]);

  const addToQueue = useCallback((image: ImageFile) => {
    dispatch({ type: 'SET_CONVERSION_QUEUE', payload: [...conversionQueue, image ] });
  }, []);
  
  const removeFromQueue = useCallback((image: ImageFile) => {
    const updatedQueue = conversionQueue.filter(img => img.id !== image.id);

    // Update the conversionQueue state
    dispatch({ type: 'SET_CONVERSION_QUEUE', payload: updatedQueue });
  }, []);

  const updateImageProgress = useCallback(async (imageId: string, progress: number) => {
    console.log('Updating image progress:', { imageId, progress });
    await dispatch({
      type: 'UPDATE_IMAGE_PROGRESS',
      payload: { id: imageId, progress }
    });
  }, [dispatch]);

  const updateImageStatus = useCallback(async (
    imageId: string,
    status: ConversionStatus,
    convertedFile?: FileInfo,
    error?: string
  ) => {
    console.log('Updating image status:', { imageId, status, convertedFile, error });
    await dispatch({
      type: 'UPDATE_IMAGE_STATUS',
      payload: {
        id: imageId,
        status: status,
        convertedFile: convertedFile,
        error: error
      }
    });
  }, [dispatch]);

  const updateActiveConversions = useCallback((delta: number) => {
    console.log('Updating active conversions:', { delta });
    activeConversions.current += delta;
    dispatch({ type: 'UPDATE_ACTIVE_CONVERSIONS', payload: activeConversions.current });
  }, [dispatch]);

  async function convertSingleImage(file: ImageFile, outputFormat: OutputFormat) {
    // Find the image in the images array
    const image = images.find((img) => img.id === file.id);

    // If the image is not found, log an error and return
    
    if (!image) {
      console.error(`Image with id ${file.id} not found`);
      return;
    }

    // If the image is already in the queue, log a message and return
    if (conversionQueue.some(img => img.id === image.id)) {
      console.log('Image already in queue:', image.id);
      return;
    }

    // Add the image to active count
    updateActiveConversions(+1);

    // Update the image status to processing
    updateImageStatus(image.id, 'processing', undefined, undefined);

    try {
      await debugStep('Converting image:', {
        id: image.id,
        name: image.file.name,
        format: outputFormat
      });

      // Convert the image
      const result = await Promise.race([
        convertImage(
          image.file.contents,
          image.file.name,
          outputFormat,
          (progress: number) => {
            updateImageProgress(image.id, progress);
          }
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Conversion timeout')), CONVERSION_TIMEOUT)
        )
      ]) as { contents: Blob; name: string; size: number; url: string };

      if (!result) { throw new Error('Conversion failed'); }

      const convertedFileInfo: FileInfo = {
        contents: result.contents,
        name: result.name,
        size: result.size,
        format: outputFormat,
        url: result.url
      } as FileInfo;

      updateImageStatus(image.id, 'done', convertedFileInfo);
      retryMap.current.delete(image.id);

      await debugStep('Conversion completed:', {
        id: image.id,
        url: result.url,
        size: result.size
      });
    } catch (error) {
      updateImageStatus(
        image.id,
        'error',
        undefined,
        error instanceof Error ? error.message : 'Conversion failed'
      );
    } finally {

      removeFromQueue(image);
      updateActiveConversions(-1);
      
      if (conversionQueue.length === 0) {
        const hasErrors = images.some(img => img.status === 'error');
        const allDone = images.every(img => img.status === 'done');

        if (allDone) {
          updateConversionStatus(hasErrors ? 'error' : 'completed');
          isProcessingRef.current = false;
        }
      } else {
        startNextConversion();
      }
    }
  }

  const processImages = useCallback(async () => {
    console.log('processImages called');
    await debugStep('🎬 Starting processImages with:', {
      totalImages: images.filter(img => img.status === 'idle').length,
      activeConversions: activeConversions.current,
      maxConcurrent: MAX_CONCURRENT_CONVERSIONS,
      outputFormat: outputFormat,
      imageStatuses: images.map(img => ({
        id: img.id,
        status: img.status
      }))
    });

    // Set the selected format to the output format
    setSelectedFormat(outputFormat);   

    try {
      // If the conversion status is paused, set it to processing
      if (state.conversionStatus !== 'processing') {
        updateConversionStatus('processing');
      }
      dispatch({ type: 'SET_CAN_CONVERT', payload: false });

      // For each image in the queue (up to the max concurrent conversions)
      // convert the image

      // Get the initial images to convert
      const initialImages = conversionQueue
        .filter(img => img.status === 'idle')
        .slice(0, MAX_CONCURRENT_CONVERSIONS);

      await debugStep('Starting initial conversions:', {
        count: initialImages.length,
        maxConcurrent: MAX_CONCURRENT_CONVERSIONS
      });


      

      

      // Convert the images
      for (const image of initialImages) {
        convertSingleImage(image, outputFormat);
      }
    } catch (error) {
      console.error('❌ Error processing images:', error);
      updateConversionStatus('error');
    }
  }, [
    MAX_CONCURRENT_CONVERSIONS,
    images,
    state.conversionStatus,
    conversionQueue,
    updateConversionStatus,
    dispatch,
    setSelectedFormat,
    outputFormat,
    convertSingleImage
  ]);

  useEffect(() => {
    if (conversionStatus === 'processing' && activeConversions.current < MAX_CONCURRENT_CONVERSIONS) {
      processImages();
    }
  }, [MAX_CONCURRENT_CONVERSIONS, processImages, conversionStatus]);

  return {
    processImages,
    isProcessing: isProcessingRef.current,
    canStartNewConversion: activeConversions.current < MAX_CONCURRENT_CONVERSIONS && images.some(img => !['processing', 'done'].includes(img.status)),
    areAllImagesDone,
    selectedFormat,
    setSelectedFormat,
    activeConversions: activeConversions.current
  };
}
