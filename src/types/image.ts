import type { QueueItem } from "@/types/files";

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export interface ImageFile extends QueueItem {
  maxWidth: number;
  maxHeight: number;
  preview: string;
  convertedPreview?: string;
  progressive: boolean;
  quality: number;
}

export interface ImageListProps {
  onRemove: (imageId: string) => void;
}