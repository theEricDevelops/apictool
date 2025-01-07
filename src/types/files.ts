// Generic types for file handling
export interface ConvertedFile {
  url: string;
  size: number;
  blob: Blob;
}

export interface QueueItem {
  id: string;
  file: {
    contents: File;
    format: string;
    name: string;
    size: number;
    url: string;
  };
  preview: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  convertedFile?: ConvertedFile;
  error?: string;
}

export interface DropZoneProps {
  onDrop: (acceptedFiles: File[]) => void;
}