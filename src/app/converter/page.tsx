'use client';

import { useEffect, useRef } from 'react';
import { DropZone } from '@/components/converter/DropZone';
import { ImageList } from '@/components/converter/ImageList';
import { useAppState } from '@/hooks/useAppState';
import { createZipFile } from '@/utils/zipUtils';
import { useImageConversion } from '@/hooks/useImageConversion';
import { useFileHandler } from '@/hooks/useFileHandler';
import { useBlobManager } from '@/hooks/useBlobManager';
import { FormatSelector, FormatSelectorRef } from '@/components/converter/FormatSelector';
import { ConversionButtons } from '@/components/converter/ConversionButtons';

export default function ConverterPage() {
  const { state, dispatch } = useAppState();
  const { images, outputFormat, hasParallelConversion } = state;
  const {  
    areAllImagesDone,
    processImages
  } = useImageConversion();
  const { handleFileDrop } = useFileHandler();
  const { cleanupBlob, cleanupAllBlobs, isMounted } = useBlobManager();
  const formatRef = useRef<FormatSelectorRef>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      cleanupAllBlobs();
    };
  }, [cleanupAllBlobs, isMounted]);

  const handleConversion = async () => {
    const selectedFormat = formatRef.current?.getSelectedFormat();
    if (!selectedFormat) return;

    dispatch({ type: 'SET_OUTPUT_FORMAT', payload: selectedFormat });
    await processImages();
  };

  const handleClearImages = () => {
    cleanupAllBlobs();
    dispatch({ type: 'CLEAR_IMAGES' });
  };

  const handleRemoveImage = (imageId: string) => {
    cleanupBlob(imageId);
    dispatch({ type: 'REMOVE_IMAGE', payload: imageId });
  };

  const handleDownloadAll = async () => {
    try {
      const zipBlob = await createZipFile(images, outputFormat);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted-images.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create zip file:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Convert Images</h1>
        <DropZone onDrop={handleFileDrop} />
        
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormatSelector ref={formatRef} />
              <div className="flex items-center gap-4">
                {!hasParallelConversion && images.length > 1 && (
                  <div className="text-sm text-gray-500">
                    ⚡️ Upgrade to convert multiple images simultaneously
                  </div>
                )}
                <ConversionButtons
                  onConvert={handleConversion}
                  onDownload={handleDownloadAll}
                  onClear={handleClearImages}
                  canConvert={state.canConvert}
                  showDownload={areAllImagesDone}
                  doneImagesCount={images.filter(img => img.status === 'done').length}
                />
              </div>
              </div>
            <ImageList onRemove={handleRemoveImage} />
          </div>
        )}
      </div>
    </div>
  );
}
