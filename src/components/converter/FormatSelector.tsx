'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { OutputFormat } from '@/components/providers/StateProvider';
import { isHEICSupported } from '@/utils/heicUtils';

export function FormatSelector() {
  const { state, dispatch } = useAppState();
  const { outputFormat } = state;
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
        value={outputFormat}
        onChange={(e) => dispatch({ 
          type: 'SET_OUTPUT_FORMAT', 
          payload: e.target.value as OutputFormat 
        })}
        className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="image/jpeg">JPEG</option>
        <option value="image/gif">GIF</option>
        <option value="image/png">PNG</option>
        <option value="image/webp">WebP</option>
        {heicSupported && <option value="image/heic">HEIC</option>}
      </select>
    </div>
  );
}