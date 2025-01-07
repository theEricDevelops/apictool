import { useCallback, useRef, useMemo } from 'react';

export function useBlobManager() {
  const isMounted = useRef(true);
  
  const blobUrlsRef = useMemo(() => ({
    current: new Map<string, Set<string>>(),
    add: (url: string, imageId: string) => {
      if (!blobUrlsRef.current.has(imageId)) {
        blobUrlsRef.current.set(imageId, new Set());
      }
      blobUrlsRef.current.get(imageId)?.add(url);
    },
    delete: (imageId: string) => {
      const urls = blobUrlsRef.current.get(imageId);
      if (urls) {
        urls.forEach(URL.revokeObjectURL);
        blobUrlsRef.current.delete(imageId);
      }
    },
    cleanup: () => {
      blobUrlsRef.current.forEach((urls) => {
        urls.forEach(URL.revokeObjectURL);
      });
      blobUrlsRef.current.clear();
    }
  }), []);

  const trackBlobUrl = useCallback((url: string, imageId: string) => {
    if (isMounted.current) {
      blobUrlsRef.add(url, imageId);
    }
  }, [blobUrlsRef]);

  return {
    trackBlobUrl,
    cleanupBlob: blobUrlsRef.delete,
    cleanupAllBlobs: blobUrlsRef.cleanup,
    isMounted
  };
}