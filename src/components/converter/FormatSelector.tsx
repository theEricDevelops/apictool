'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { isHEICSupported } from '@/utils/heic.utils';
import { SUPPORTED_IMAGE_FORMATS } from '@/constants/format.constants';
import { OutputFormat } from '@/types/image.types';

export interface FormatSelectorRef {
  getSelectedFormat: () => OutputFormat;
}

const IMAGE_FORMATS: Record<string, string> = SUPPORTED_IMAGE_FORMATS.reduce((formats: Record<string, string>, extension: string) => ({
  ...formats,
  [extension]: extension.split('/')[1].toLowerCase()
}), {} as Record<string, string>);

export const FormatSelector = forwardRef<FormatSelectorRef>((props, ref) => {
  const [heicSupported, setHeicSupported] = useState(false);
  const { state, dispatch } = useAppState();
  const [ formatValue, setFormatValue ] = useState<OutputFormat>(state.outputFormat);

  useImperativeHandle(ref, () => ({
    getSelectedFormat: () => formatValue
  }), [formatValue]);

  useEffect(() => {
    const checkHEICSupport = async () => {
      const supported = await isHEICSupported();
      setHeicSupported(supported);
    };
    checkHEICSupport();
  }, []);

  const setTemporaryFormat = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = event.target.value as OutputFormat;
    if (newFormat === formatValue) return;

    setFormatValue(newFormat);
    dispatch({ type: 'SET_CAN_CONVERT', payload: true });
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="format" className="text-sm font-medium text-gray-700">
        Convert to:
      </label>
      <select
        id="format"
        value={formatValue}
        onChange={setTemporaryFormat}
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
});

FormatSelector.displayName = 'FormatSelector';

