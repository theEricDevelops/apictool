import type { QueueItem } from "@/types/file.types";
import { FileStatus } from "@/types/state.types";

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/avif' | 'image/heic';

export interface ImageFile extends QueueItem {
  maxWidth: number;
  maxHeight: number;
  preview: string;
  convertedPreview?: string;
  progressive: boolean;
  quality: number;
  status: FileStatus;
}

export interface ImageListProps {
  onRemove: (imageId: string) => void;
}