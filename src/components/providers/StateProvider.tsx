'use client';

import React, { createContext, useReducer, useCallback } from 'react';
import { generatePreview } from '@/utils/utils';
import { ImageFile, OutputFormat } from '@/types/image';
import { QueueItem, ConvertedFile } from '@/types/files';

interface AppState {
  images: ImageFile[];
  outputFormat: OutputFormat;
  settings: {
    compressionQuality: number;
    maxConcurrentProcessing: number;
  };
  hasParallelConversion?: boolean;
  activeConversions: number;
}

type Action =
  | { type: 'SET_OUTPUT_FORMAT'; payload: OutputFormat }
  | { type: 'INCREMENT_ACTIVE_CONVERSIONS' }
  | { type: 'DECREMENT_ACTIVE_CONVERSIONS' }
  | { type: 'ADD_IMAGES'; payload: ImageFile[] }
  | { type: 'ADD_IMAGE'; payload: ImageFile }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'UPDATE_IMAGE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'UPDATE_IMAGE_STATUS'; payload: { id: string; status: QueueItem['status']; convertedFile?: ConvertedFile; error?: string }}
  | { type: 'CLEAR_IMAGES' };

const initialState: AppState = {
  images: [],
  outputFormat: 'image/jpeg',
  settings: {
    compressionQuality: 80,
    maxConcurrentProcessing: 3,
  },
  hasParallelConversion: true, // Default to false for free tier
  activeConversions: 0,
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_OUTPUT_FORMAT': {
      return {
        ...state,
        outputFormat: action.payload,
      };
    }

    case 'INCREMENT_ACTIVE_CONVERSIONS':
      return {
        ...state,
        activeConversions: state.activeConversions + 1,
      };
    
    case 'DECREMENT_ACTIVE_CONVERSIONS':
      return {
        ...state,
        activeConversions: state.activeConversions - 1,
      };

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
      console.log('Updating QueueItem:', {
        id: action.payload.id,
        status: action.payload.status,
        convertedFile: action.payload.convertedFile,
        error: action.payload.error
      });
      
      return {
        ...state,
        images: state.images.map(img => 
          img.id === action.payload.id
            ? { ...img, 
                status: action.payload.status,
                convertedFile: action.payload.convertedFile,
                error: action.payload.error 
              }
            : img
        ),
      };
    }

    case 'CLEAR_IMAGES': {
      state.images.forEach(img => {
        if (img.convertedFile) {
          URL.revokeObjectURL(img.convertedFile.url);
        }
      });
      return { ...state, images: [] };
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
          const preview = await generatePreview(image.file.contents);
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
