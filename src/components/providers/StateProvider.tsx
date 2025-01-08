'use client';

import React, { createContext, useReducer, useCallback } from 'react';
import { generateImagePreview } from '@/utils/image-processing.utils';
import { ImageFile } from '@/types/image.types';
import type { AppState, Action } from '@/types/state.types'
import { DEFAULT_USER_TIER } from '@/constants/tier.constants';
import { ConversionStatus, FileStatus } from '@/types/state.types';
import { CONVERSION_STATUS, FILE_STATUS } from '@/constants/states.constants';
import { blobToFile } from '@/utils/file.utils';

const initialState: AppState = {
  user: null,
  images: [],
  outputFormat: 'image/jpeg',
  canConvert: true,
  settings: {
    compressionQuality: 80,
    maxConcurrentProcessing: 3,
  },
  userTier: DEFAULT_USER_TIER,
  activeConversions: 0,
  conversionStatus: 'idle',
};

function isValidConversionStatus(status: string): status is ConversionStatus {
  return CONVERSION_STATUS.includes(status as ConversionStatus);
}

function isValidImageStatus(status: string): status is FileStatus {
  return FILE_STATUS.includes(status as FileStatus);
}

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_OUTPUT_FORMAT': {
      return {
        ...state,
        outputFormat: action.payload,
      };
    }

    case 'SET_CONVERSION_STATUS': {
      if (!isValidConversionStatus(action.payload)) {
        console.error('Invalid conversion status:', action.payload);
        return state;
      }

      console.log('🔄 Conversion status changing:', {
        from: state.conversionStatus,
        to: action.payload
      });
      
      return {
        ...state,
        conversionStatus: action.payload,
        // Automatically set canConvert based on status
        canConvert: ['idle', 'completed', 'error'].includes(action.payload)
      };
    }

    case 'SET_CAN_CONVERT': {
      return {
        ...state,
        canConvert: action.payload,
      };
    }

    case 'UPDATE_ACTIVE_CONNECTIONS': {
      const decrementedConversions = Math.max(0, state.activeConversions - 1);
      console.log('⏬ Decrementing active conversions:', {
        from: state.activeConversions,
        to: decrementedConversions
      });
      
      return {
        ...state,
        activeConversions: decrementedConversions,
        // Auto-resume if we were paused and now have capacity
        conversionStatus: state.conversionStatus === 'paused' && 
                         decrementedConversions < state.settings.maxConcurrentProcessing
                         ? 'running'
                         : state.conversionStatus
      };
    }

    case 'ADD_IMAGES': {
      const newImages = action.payload.map((image: ImageFile) => {
        console.log('Adding to queue:', {
          name: image.file.name,
          type: image.file.format,
          size: image.file.size,
          maxWidth: image.maxWidth,
          maxHeight: image.maxHeight,
          quality: image.quality,
          progressive: image.progressive
        });
        return image;
      });
    
      return {
        ...state,
        images: [...state.images, ...newImages],
      };
    }

    case 'ADD_IMAGE': {
      return {
        ...state,
        images: [...state.images, action.payload],
      };
    }
    
    case 'REMOVE_IMAGE': {
      return {
        ...state,
        images: state.images.filter(img => img.id !== action.payload),
      };
    }

    case 'UPDATE_IMAGE_PROGRESS': {
      return {
        ...state,
        images: state.images.map(img =>
          img.id === action.payload.id
            ? { ...img, progress: action.payload.progress }
            : img,
        ),
      };
    }

    case 'UPDATE_IMAGE_STATUS': {
      if (!isValidImageStatus(action.payload.status)) {
        console.error('Invalid image status:', action.payload.status);
        return state;
      }
      
      console.log('Updating QueueItem:', {
        id: action.payload.id,
        status: action.payload.status,
        convertedFile: action.payload.convertedFile,
        error: action.payload.error,
        conversionStatus: state.conversionStatus
      });

      const updatedImages = state.images.map(img =>
        img.id === action.payload.id
          ? { ...img, 
              status: action.payload.status,
              convertedFile: action.payload.convertedFile,
              error: action.payload.error 
            }
          : img
      );

      const allProcessed = updatedImages.every(img => 
        ['done', 'error'].includes(img.status)
      );
      
      return {
        ...state,
        images: updatedImages,
        conversionStatus: allProcessed ? 'complete' : state.conversionStatus
      };
    }

    case 'CLEAR_IMAGES': {
      state.images.forEach(img => {
        if (img.convertedFile) {
          URL.revokeObjectURL(img.convertedFile.url);
        }
      });
      return { 
        ...state, 
        images: [],
        conversionStatus: 'idle',
        activeConversions: 0
      };
    }
    default: {
      console.warn('Unknown action type:', action as Action);
      return state;
  }
  }
};

interface StateContextType {
  state: AppState;
  dispatch: (action: Action) => Promise<void>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, dispatchBase] = useReducer(reducer, initialState);

  const dispatch = useCallback(async (action: Action) => {
    if (action.type === 'ADD_IMAGES') {
      if (typeof window === 'undefined') return;

      await Promise.all(action.payload.map(async (image: ImageFile) => {
        try {
          if (!(image.file.contents instanceof File) &&
               (image.file.contents instanceof Blob)) {
                image.file.contents = blobToFile(image.file.contents, image.file.name);
          }
          const preview = await generateImagePreview(image.file.name, image.file.contents);
          const id = crypto.randomUUID();

          const queueItem: ImageFile = {
            id,
            file: {
              contents: image.file.contents,
              format: image.file.format,
              name: image.file.name,
              size: image.file.size,
              url: image.file.url
            },
            preview,
            status: 'idle',
            progress: 0,
            maxWidth: image.maxWidth,
            maxHeight: image.maxHeight,
            progressive: image.progressive,
            quality: image.quality,
          };

          dispatchBase({
            type: 'ADD_IMAGE',
            payload: queueItem,
          });
        } catch (error) {
          console.error('Error adding image:', error);
          dispatchBase({
            type: 'ADD_IMAGE',
            payload: {
              id: crypto.randomUUID(),
              file: {
                contents: image.file.contents,
                format: image.file.format,
                name: image.file.name,
                size: image.file.size,
                url: image.file.url
              },
              preview: '',
              status: 'error',
              progress: 0,
              error: 'Failed to generate preview',
              maxWidth: image.maxWidth,
              maxHeight: image.maxHeight,
              progressive: image.progressive,
              quality: image.quality,
            },
          });
        }
      }));
    } else {
      dispatchBase(action);
    }
  }, [dispatchBase]);

  React.useEffect(() => {
    return () => {
      state.images.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
        if (img.convertedFile?.url) {
          URL.revokeObjectURL(img.convertedFile.url);
        }
      });
    };
  }, [state.images]);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

export { StateContext };
