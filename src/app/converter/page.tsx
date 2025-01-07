'use client';

import { DropZone } from '@/components/converter/DropZone';
import { ImageList } from '@/components/converter/ImageList';
import { useAppState } from '@/hooks/useAppState';
import { convertImage } from '@/lib/imageConverter';
import { Download, ReplaceAll, Trash2 } from 'lucide-react';
import type { OutputFormat } from '@/types/image';
import { createZipFile } from '@/utils/zipUtils';

export default function ConverterPage() {
  const { state, dispatch } = useAppState();
  const { images, outputFormat } = state;
  
  const handleConvert = async () => {
    for (const image of images) {
      if (image.status !== 'idle') continue;

      try {
        dispatch({
          type: 'UPDATE_IMAGE_STATUS',
          payload: { id: image.id, status: 'processing' }
        });
        const result = await convertImage(
          image.file.contents,
          outputFormat,
          (progress) => {
            dispatch({
              type: 'UPDATE_IMAGE_PROGRESS',
              payload: { id: image.id, progress }
            });
          }
        );

        const url = URL.createObjectURL(result.blob);

        dispatch({
          type: 'UPDATE_IMAGE_STATUS',
          payload: {
            id: image.id,
            status: 'done',
            convertedFile: {
              url: url,
              size: result.size,
              blob: result.blob
            }
          }
        });
    } catch (error) {
        dispatch({
          type: 'UPDATE_IMAGE_STATUS',
          payload: {
            id: image.id,
            status: 'error',
            error: error instanceof Error ? error.message : 'Conversion failed'
    }
        });
      }
    }
  };

  const areAllImagesDone = images.length > 0 && images.every(img => img.status === 'done');
  const isQueueProcessing = images.some(img => img.status === 'processing');
  const hasIdleImages = images.some(img => img.status === 'idle');

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
      // Optionally show an error message to the user
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Convert Images</h1>

        <DropZone />
        
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Convert to:</span>
                <select
                  value={outputFormat}
                  onChange={(e) => dispatch({ 
                    type: 'SET_OUTPUT_FORMAT', 
                    payload: e.target.value as OutputFormat 
                  })}
                  className="block rounded-lg border border-gray-300 bg-white p-2 text-sm"
                >
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/gif">GIF</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/avif">AVIF</option>
                  <option value="image/heic">HEIC</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4 ml-auto">

                {!areAllImagesDone ? (
                  <button
                    onClick={handleConvert}
                    disabled={isQueueProcessing || !hasIdleImages}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isQueueProcessing || !hasIdleImages
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <ReplaceAll className="w-4 h-4 mr-2" />
                    Convert
                  </button>
                ) : ( 
                  <button
                    onClick={handleDownloadAll}
                    disabled={!areAllImagesDone}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                      areAllImagesDone
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-400 cursor-not-allowed text-gray-200'
                    }`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </button>
                )}

                <button
                  onClick={() => dispatch({ type: 'CLEAR_IMAGES' })}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </button>
              </div>
            </div>
            
            <ImageList />
          </div>
        )}
      </div>
    </div>
  );
}
