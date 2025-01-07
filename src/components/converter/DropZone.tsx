'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { cn } from '@/utils/utils';

export function DropZone() {
  const { dispatch } = useAppState();
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      console.log('Files dropped:', acceptedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      })));

      dispatch({ type: 'ADD_IMAGES', payload: acceptedFiles });
    },
    [dispatch]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.avif']
    }
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="w-10 h-10 mb-3 text-gray-400" />
      <p className="mb-2 text-sm text-gray-500">
        <span className="font-semibold">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500">
      Supports JPG, PNG, GIF, WebP, HEIC, and AVIF (max files: 10)
      </p>
    </div>
  );
}
