'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { convertImage } from '@/lib/image-converter.lib';
import { useAppState } from '@/hooks/useAppState';
import { ImageFile, OutputFormat } from '@/types/image.types';
import { FileInfo } from '@/types/file.types';
import { TIER_LIMITS, DEFAULT_USER_TIER } from '@/constants/tier.constants';
import { debugStep } from '@/utils/debug.utils';
import { ConversionStatus } from '@/types/state.types';

const CONVERSION_POLL_INTERVAL = 100; //ms
const MAX_RETRIES = 3;
const CONVERSION_TIMEOUT = 30000; // 30 seconds

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
  const { images, outputFormat, userTier = DEFAULT_USER_TIER } = state;
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(outputFormat);
  const MAX_CONCURRENT_CONVERSIONS = TIER_LIMITS[userTier];
  const activeConversions = useRef(0);
  const isProcessingRef = useRef<boolean>(false);
  const conversionQueue = useRef<Set<string>>(new Set());
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
    await dispatch({ type: 'SET_CONVERSION_STATUS', payload: newStatus });
  }, [dispatch]);

  const pauseConversion = useCallback(() => {
    updateConversionStatus('paused');
  }, [updateConversionStatus]);

  const resumeConversion = useCallback(() => {
    updateConversionStatus('processing');
  }, [updateConversionStatus]);

  const addToQueue = useCallback((imageId: string) => {
    conversionQueue.current.add(imageId);
  }, []);

  const removeFromQueue = useCallback((imageId: string) => {
    conversionQueue.current.delete(imageId);
  }, []);

  const checForPausedStatus = useCallback(async (): Promise<void> => {
    if (state.conversionStatus === 'paused') {
      await debugStep('⏸️ Conversion paused, waiting...', {
        remainingImages: images.filter(img =>
          img.status === 'idle' && !img.convertedFile
        ).length
      });
    }

    await new Promise<void>(resolve => {
      const checkStatus = setInterval(() => {
        if (state.conversionStatus === 'processing') {
          clearInterval(checkStatus);
          resolve();
        }
      }, CONVERSION_POLL_INTERVAL);
    });
    return;
  }, [state.conversionStatus, images]);

  const checkConversionComplete = useCallback(async (): Promise<boolean> => {
    const pendingImages = images.filter(img =>
      img.status === 'idle' && !img.convertedFile
    );

    if (pendingImages.length === 0) {
      await debugStep('🏁 All images processed', {
        finalStatuses: images.map(img => ({
          id: img.id,
          name: img.file.name,
          status: img.status,
          hasConvertedFile: !!img.convertedFile
        }))
      });
      return true;
    }
    return false;
  }, [images]);

  const handleConversionCompletion = useCallback(async () => {
    const hasUnprocessedImages = images.some(img =>
      ['idle', 'error'].includes(img.status)
    );

    if (hasUnprocessedImages) {
      const newStatus: ConversionStatus =
        state.conversionStatus === 'paused' ? 'completed' : 'paused';
      updateConversionStatus(newStatus);

      await debugStep('🏁 ProcessImages finished. Final status:', images.map(img => ({
          id: img.id,
          name: img.file.name,
          status: img.status
        }))
      )
      ;
    }
  }, [images, state.conversionStatus, updateConversionStatus]);

  const updateImageProgress = useCallback(async (imageId: string, progress: number) => {
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
    activeConversions.current += delta;
    dispatch({ type: 'UPDATE_ACTIVE_CONVERSIONS', payload: activeConversions.current });
  }, [dispatch]);

  const resetActiveConversions = useCallback(() => {
    activeConversions.current = 0;
  }, []);

  const handleFormatChange = useCallback(() => {
    dispatch({ type: 'SET_OUTPUT_FORMAT', payload: selectedFormat });
  }, [dispatch, selectedFormat]);

  const convertSingleImage: ImageFile = useCallback(async (file: ImageFile, outputFormat: OutputFormat) => {
    const image = images.find((img) => img.id === file.id);
    if (!image) {
      console.error(`Image with id ${file.id} not found`);
      return;
    }

    if (conversionQueue.current.has(image.id)) {
      return;
    }

    addToQueue(image.id);
    updateActiveConversions(1);
    updateImageStatus(image.id, 'processing', undefined, undefined);

    try {
      await debugStep('Converting image:', {
        id: image.id,
        name: image.file.name,
        format: outputFormat
      });

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
      ]);
      
      const convertedFileInfo: FileInfo = {
        contents: result.contents,
        name: result.name,
        size: result.size,
        format: outputFormat,
        url: result.url
      };

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
        removeFromQueue(image.id);
        updateActiveConversions(-1);

        if (isProcessingRef.current) {
          startNextConversion();
        }

        if (conversionQueue.current.size === 0) {
          const hasErrors = images.some(img => img.status === 'error');
          const allDone = images.every(img => img.status === 'done');

          if (allDone) {
            updateConversionStatus(hasErrors ? 'error' : 'completed');
            isProcessingRef.current = false;
          }
        }
      }
    }, [
      images,
      updateImageProgress,
      updateImageStatus,
      updateActiveConversions,
      updateConversionStatus,
      addToQueue,
      removeFromQueue,
      startNextConversion,
    ]);

  const processNextImage = useCallback(async () => {
    await debugStep('Process Next Image Start', {
      activeConversions,
      maxConversions: MAX_CONCURRENT_CONVERSIONS,
      totalImages: images.length
    });

    if (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
      await debugStep('Max Conversions Reached', {
        active: activeConversions,
        max: MAX_CONCURRENT_CONVERSIONS
      });
      return;
    }

    // Find the next unprocessed image
    const nextImage = images.find(image => image.status === 'idle' && !image.convertedFile);

    if (!nextImage) {
      await debugStep('No Next Image Found', {
        imageStatuses: images.map(img => ({
          id: img.id,
          name: img.file.name,
          status: img.status,
          hasConvertedFile: !!img.convertedFile
        }))
      });
      return;
    }

    await debugStep('▶️ Starting next image:', {
      id: nextImage.id,
      name: nextImage.file.name,
      status: nextImage.status
    });

    await convertSingleImage(nextImage, selectedFormat);

    // Debug state after processing
    await debugStep('✅ After processing:', {
      id: nextImage.id,
      name: nextImage.file.name,
      newStatus: images.find(img => img.id === nextImage.id)?.status,
      activeConversions
    });

  }, [images, activeConversions, MAX_CONCURRENT_CONVERSIONS, convertSingleImage, selectedFormat]);

  const startNextConversion = useCallback(async () => {
    if (conversionQueue.current.size >= MAX_CONCURRENT_CONVERSIONS) {
      await debugStep('⏸️ Max conversions reached, waiting...', {
        current: conversionQueue.current.size,
        max: MAX_CONCURRENT_CONVERSIONS
      });
      return;
    }

    const nextImage = images.find(img =>
      img.status === 'idle' && !img.convertedFile &&
      !conversionQueue.current.has(img.id)
    );

    if (!nextImage) {
      await debugStep('No more images to convert', {
        activeConversions: Array.from(conversionQueue.current)
      });
      return;
    }

    await debugStep('▶️ Starting next image:', {
      imageId: nextImage.id,
      activeCount: conversionQueue.current.size,
      maxConcurrent: MAX_CONCURRENT_CONVERSIONS
    });

    convertSingleImage(nextImage, selectedFormat);
  }, [images, convertSingleImage, selectedFormat, MAX_CONCURRENT_CONVERSIONS]);

  const processImages = useCallback(async () => {
    await debugStep('🎬 Starting processImages with:', {
      totalImages: images.filter(img => img.status === 'idle').length,
      activeConversions,
      maxConcurrent: MAX_CONCURRENT_CONVERSIONS,
      imageStatuses: images.map(img => ({
        id: img.id,
        status: img.status
      }))
    });

    setSelectedFormat(outputFormat);

    if(state.conversionStatus !== 'processing') {
      updateConversionStatus('processing');
    }

    try {
      isProcessingRef.current = true;
      dispatch({ type: 'SET_CAN_CONVERT', payload: false });

      const initialImages = images
        .filter(img => img.status === 'idle')
        .slice(0, MAX_CONCURRENT_CONVERSIONS);
      
      await debugStep('Starting initial conversions:', {
        count: initialImages.length,
        maxConcurrent: MAX_CONCURRENT_CONVERSIONS
      })

      for (const image of initialImages) {
        convertSingleImage(image, selectedFormat);
      }
    } catch (error) {
      console.error('❌ Error processing images:', error);
      updateConversionStatus('error');
    } finally {
      isProcessingRef.current = false;
      resetActiveConversions();
    }
  }, [
    MAX_CONCURRENT_CONVERSIONS,
    activeConversions,
    images,
    state.conversionStatus,
    selectedFormat,
    updateConversionStatus,
    handleFormatChange,
    convertSingleImage,
    dispatch,
    resetActiveConversions
  ]);

  return {
    processImages,
    isProcessing: isProcessingRef.current,
    canStartNewConversion: activeConversions.current < MAX_CONCURRENT_CONVERSIONS && images.some(img => !['processing', 'done'].includes(img.status)),
    areAllImagesDone: images.length > 0 && 
      images.every(img => img.status === 'done' && img.convertedFile?.format === outputFormat),
    selectedFormat,
    setSelectedFormat,
    activeConversions: conversionQueue.current.size
  };
}
