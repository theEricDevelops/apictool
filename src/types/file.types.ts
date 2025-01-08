import { FileStatus } from "@/types/state.types";

export interface FileInfo {
  contents: Blob;
  format: string;
  name: string;
  size: number;
  url: string;
}

export interface QueueItem {
  id: string;
  file: FileInfo;
  preview: string;
  status: FileStatus
  progress: number;
  convertedFile?: FileInfo;
  error?: string;
}

export interface DropZoneProps {
  onDrop: (acceptedFiles: File[]) => void;
}