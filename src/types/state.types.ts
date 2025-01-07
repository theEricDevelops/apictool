import { UserState } from '@/types/user.type';
import { UserTier } from '@/types/user.type';
import { ImageFile, OutputFormat } from '@/types/image.types';
import type { ConvertedFile } from '@/types/file.types';


export interface AppState {
    user: UserState | null;
    images: ImageFile[];
    outputFormat: OutputFormat;
    canConvert: boolean;
    settings: {
        compressionQuality: number;
        maxConcurrentProcessing: number;
    };
    userTier?: UserTier;
    activeConversions: number;
    conversionStatus: string;
}

export type Action =
  | { type: 'SET_OUTPUT_FORMAT'; payload: OutputFormat }
  | { type: 'SET_CAN_CONVERT'; payload: boolean }
  | { type: 'INCREMENT_ACTIVE_CONVERSIONS' }
  | { type: 'DECREMENT_ACTIVE_CONVERSIONS' }
  | { type: 'ADD_IMAGES'; payload: ImageFile[] }
  | { type: 'ADD_IMAGE'; payload: ImageFile }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'UPDATE_IMAGE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'UPDATE_IMAGE_STATUS'; payload: { id: string; status: ImageFile['status']; convertedFile?: ConvertedFile; error?: string }}
  | { type: 'CLEAR_IMAGES' }
  | { type: 'SET_CONVERSION_STATUS'; payload: string };