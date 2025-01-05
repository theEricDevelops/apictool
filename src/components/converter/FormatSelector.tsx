'use client';

import { useEffect, useState } from 'react';
import { useImageStore } from '@/store/useImageStore';
import { OutputFormat } from '@/types/image';
import { isHEICSupported } from '@/utils/heicUtils';

const formats: { value: OutputFormat; label: string }[] = [
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/gif', label: 'GIF' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/avif', label: 'AVIF' },
  //{ value: 'image/heic', label: 'HEIC' }, Checking for this later.
];

export function FormatSelector() {
  const { outputFormat, setOutputFormat } = useImageStore((state) => ({
    outputFormat: state.outputFormat,
    setOutputFormat: state.setOutputFormat,
  }));

  const [heicSupported, setHeicSupported] = useState(false);

  useEffect(() => {
    isHEICSupported().then(setHeicSupported);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="format" className="text-sm font-medium text-gray-700">
        Output Format:
      </label>
      <select
        id="format"
        value={outputFormat}
        onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {formats.map((format) => (
          <option key={format.value} value={format.value}>
            {format.label}
          </option>
        ))}
        {heicSupported && (
          <option value="image/heic">HEIC</option>
        )}
      </select>
    </div>
  );
}