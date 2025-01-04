import { create } from 'zustand';
import { ImageFile, OutputFormat } from '../types/image';
import { generatePreview } from '../utils/utils';

interface ImageStore {
  images: ImageFile[];
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  updateImageProgress: (id: string, progress: number) => void;
  updateImageStatus: (id: string, status: ImageFile['status'], convertedFile?: {url:string, size:number}, error?: string) => void;
  clearImages: () => void;
}

export const useImageStore = create<ImageStore>((set) => ({
  images: [],
  outputFormat: 'image/jpeg',
  setOutputFormat: (format) => set({ outputFormat: format }),
  addImages: async (files) => {
    const newImages = await Promise.all(files.map(async (file) => {
      const preview = await generatePreview(file);
      return {
        id: crypto.randomUUID(),
        file: { contents: file, format: file.type, name: file.name, size: file.size },
        preview,
        convertedFile: undefined,
        error: undefined,
        progress: 0,
        status: 'idle' as const,
      };
    }));
    set((state) => ({ images: [...state.images, ...newImages] }));
  },
  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
    })),
  updateImageProgress: (id, progress) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, progress } : img
      ),
    })),
  updateImageStatus: (id, status, convertedFile, error) => {
    console.log('Updating image status =>', {
      id,
      status,
      convertedFileURL: convertedFile?.url,
      convertedFileSize: convertedFile?.size,
      error,
    });
    set((state) => ({
      images: state.images.map((img) => {
        if (img.id === id) {
          console.log('Before update =>', img);
          const updated = { ...img, status, convertedFile, error};
          console.log('After update =>', updated);
          return updated;
        }
        return img;
      }),
    }));
  },
  clearImages: () => set({ images: [] }),
}));