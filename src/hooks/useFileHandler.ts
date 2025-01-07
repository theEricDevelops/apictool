import { useCallback } from 'react';
import type { ImageFile } from '@/types/image';
import { useAppState } from './useAppState';
import { useBlobManager } from './useBlobManager';

export function useFileHandler() {
  const { dispatch } = useAppState();
  const { trackBlobUrl } = useBlobManager();

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: ImageFile[] = acceptedFiles.map(file => {
      const imageId = crypto.randomUUID();
      const blobUrl = URL.createObjectURL(file);
      trackBlobUrl(blobUrl, imageId);
      
      return {
        id: imageId,
        preview: blobUrl,
        file: {
          contents: file,
          format: file.type,
          name: file.name,
          size: file.size,
          url: blobUrl
        },
        status: 'idle',
        progress: 0,
        maxWidth: 1920,
        maxHeight: 1080,
        progressive: true,
        quality: 80
      };
    });

    dispatch({ type: 'ADD_IMAGES', payload: newImages });
  }, [trackBlobUrl, dispatch]);

  return { handleFileDrop };
}