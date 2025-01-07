'use client';

import React, { createContext, useReducer, useCallback } from 'react';
import { generatePreview } from '@/utils/utils';
import { OutputFormat } from '@/types/image';
import { QueueItem, ConvertedFile } from '@/types/files';

interface AppState {
  images: QueueItem[];
  outputFormat: OutputFormat;
  settings: {
    compressionQuality: number;
    maxConcurrentProcessing: number;
  };
}

type Action =
  | { type: 'SET_OUTPUT_FORMAT'; payload: OutputFormat }
  | { type: 'ADD_IMAGES'; payload: File[] }
  | { type: 'ADD_IMAGE'; payload: QueueItem }
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
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_OUTPUT_FORMAT': {
      return {
        ...state,
        outputFormat: action.payload,
      };
    }

    case 'ADD_IMAGES': {
      const newImages = action.payload.map((file) => {
        console.log('Adding to queue:', {
          name: file.name,
          type: file.type,
          size: file.size
        });
    
        return {
          id: crypto.randomUUID(),
          file: {
            contents: file,
            format: file.type,
            name: file.name,
            size: file.size,
          },
          preview: '',
          status: 'idle' as const,
          progress: 0,
        };
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

      await Promise.all(action.payload.map(async (file) => {
        try {
          const preview = await generatePreview(file);
          const id = crypto.randomUUID();

          const queueItem: QueueItem = {
            id,
            file: {
              contents: file,
              format: file.type,
              name: file.name,
              size: file.size,
            },
            preview,
            status: 'idle',
            progress: 0,
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
                contents: file,
                format: file.type,
                name: file.name,
                size: file.size,
              },
              preview: '',
              status: 'error',
              progress: 0,
              error: 'Failed to generate preview'
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
