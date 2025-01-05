import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { cn } from '@/utils/utils';

export function DropZone() {
  const addImages = useImageStore((state) => state.addImages);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addImages(acceptedFiles);
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.avif'],
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        Drag 'n' drop images here, or click to select files
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Supports JPG, PNG, GIF, WebP, HEIC, and AVIF
      </p>
    </div>
  );
}

