import { UserState } from '@/types/user.type';
import { UserTier } from '@/types/user.type';
import { ImageFile, OutputFormat } from '@/types/image.types';
import type { FileInfo } from '@/types/file.types';
import { CONVERSION_STATUS, FILE_STATUS } from '@/constants/states.constants';

export type ConversionStatus = typeof CONVERSION_STATUS[number];
export type FileStatus = typeof FILE_STATUS[number];

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
    conversionStatus: ConversionStatus;
}

export type Action =
  | { type: 'SET_OUTPUT_FORMAT'; payload: OutputFormat }
  | { type: 'SET_CAN_CONVERT'; payload: boolean }
  | { type: 'UPDATE_ACTIVE_CONNECTIONS'; payload: number }
  | { type: 'ADD_IMAGES'; payload: ImageFile[] }
  | { type: 'ADD_IMAGE'; payload: ImageFile }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'UPDATE_IMAGE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'UPDATE_IMAGE_STATUS'; payload: { id: string; status: FileStatus; convertedFile?: FileInfo; error?: string }}
  | { type: 'CLEAR_IMAGES' }
  | { type: 'SET_CONVERSION_STATUS'; payload: ConversionStatus };