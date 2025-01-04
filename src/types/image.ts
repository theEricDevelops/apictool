export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/avif' | 'image/heic';

export interface ImageFile {
  id: string;
  file: {
    contents: File;
    format: string;
    name: string;
    size: number;
  };
  preview: string;
  convertedPreview?: string;
  progress: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  convertedFile?: {
    url: string;
    size: number;
  };
  error?: string;
}