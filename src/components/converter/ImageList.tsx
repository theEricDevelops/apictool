'use client';

import { Download, Trash2, AlertCircle } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { 
  formatBytes, 
  getNewFileName, 
  getNewFileSize,
  getProcessingStage 
} from '@/utils/utils';
import type { ImageListProps } from '@/types/image';

export const ImageList: React.FC<ImageListProps> = ({ onRemove }) => {
  const { state } = useAppState();
  const { images: processingQueue } = state;

  const handleRemove = (imageId: string) => {
    onRemove(imageId);
  };

  if (processingQueue.length === 0) return null;

  return (
    <div className="space-y-4">
      {processingQueue.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 p-4 bg-white rounded-lg shadow"
        >
          <img
            src={item.preview}
            alt={item.file.name}
            className="w-16 h-16 object-cover rounded"
          />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {item.file.name}
            </p>
            <p className="text-sm text-gray-500">
              Original: {formatBytes(item.file.size)}
            </p>
            <p className="text-sm text-gray-500">
              Converted: {item.status === 'idle' ? (
                'Ready...'
              ) : item.status === 'processing' ? (
                <span className="flex items-center gap-2">
                  Processing... <span className="text-gray-400">({getProcessingStage(item.progress)})</span>
                </span>
              ) : (
                getNewFileSize(item.file.size, item.convertedFile?.size ?? 0)
              )}
            </p>
            {item.status === 'processing' && (
              <div className="relative mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="absolute top-0 left-0 bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${item.progress ?? 0}%`, maxWidth: '100%' }}
                />
              </div>
            )}
            
            {item.status === 'error' && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{item.error || 'Conversion failed'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {item.status === 'done' && item.convertedFile?.url && (
            <button
              onClick={() => {
                const url = item.convertedFile?.url;
                if (!url) return;

                const link = document.createElement('a');
                link.href = url;
                link.download = getNewFileName(
                  item.file.name, 
                  state.outputFormat
                );
                link.click();
              }}
              className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
            
            <button
              onClick={() => handleRemove(item.id)}
              className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
