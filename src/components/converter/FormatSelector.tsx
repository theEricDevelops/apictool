'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { isHEICSupported } from '@/utils/heicUtils';
import { SUPPORTED_IMAGE_FORMATS } from '@/constants/formats';

const IMAGE_FORMATS: Record<string, string> = SUPPORTED_IMAGE_FORMATS.reduce((formats: Record<string, string>, extension: string) => ({
  ...formats,
  [extension]: extension.split('/')[1].toLowerCase()
}), {} as Record<string, string>);

export function FormatSelector() {
  const [heicSupported, setHeicSupported] = useState(false);

  useEffect(() => {
    const checkHEICSupport = async () => {
      const supported = await isHEICSupported();
      setHeicSupported(supported);
    };
    checkHEICSupport();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="format" className="text-sm font-medium text-gray-700">
        Convert to:
      </label>
      <select
        id="format"
        value={selectedFormat}
        onChange={setSelectedFormat}
        className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      >
        {Object.entries(IMAGE_FORMATS)
          .filter(([key]) => key !== 'image/heic' || heicSupported)
          .map(([key, value]) => (
          <option key={key} value={key}>
            {value.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}