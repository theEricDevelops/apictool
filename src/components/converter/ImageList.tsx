import { Download, Trash2, AlertCircle } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { formatBytes, getNewFileName, getNewFileSize } from '@/utils/utils';

export function ImageList() {
  const { images, removeImage, outputFormat } = useImageStore((state) => ({
    images: state.images,
    removeImage: state.removeImage,
    outputFormat: state.outputFormat,
  }));

  if (images.length === 0) return null;

  return (
    <div className="space-y-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="flex items-center gap-4 p-4 bg-white rounded-lg shadow"
        >
          <img
            src={image.preview}
            alt={image.file.name}
            className="w-16 h-16 object-cover rounded"
          />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {image.file.name}
            </p>
            <p className="text-sm text-gray-500">
              Original: {formatBytes(image.file.size)}
            </p>
            <p className="text-sm text-gray-500">
              Converted: {image.status === 'idle' ? (
                'Ready...'
              ) : image.status === 'processing' ? (
                'Processing...'
              ) : (
                getNewFileSize(image.file.size, image.convertedFile?.size ?? 0)
              )}
            </p>
            {image.status === 'processing' && (
              <div className="relative mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="absolute top-0 left-0 bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${image.progress}%`, maxWidth: '100%' }}
                />
              </div>
            )}
            
            {image.status === 'error' && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{image.error || 'Conversion failed'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
          {image.status === 'done' && image.convertedFile?.url && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                if (image.convertedFile) {
                  link.href = image.convertedFile.url;
                }
                link.download = getNewFileName(image.file.name, outputFormat);
                link.click();
              }}
              className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
            
            <button
              onClick={() => removeImage(image.id)}
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