import { ReplaceAll, Download, Trash2 } from 'lucide-react';

interface ConversionButtonsProps {
  onConvert: () => void;
  onDownload: () => void;
  onClear: () => void;
  canConvert: boolean;
  showDownload: boolean;
}

export function ConversionButtons({
  onConvert,
  onDownload,
  onClear,
  canConvert,
  showDownload
}: ConversionButtonsProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onConvert}
        disabled={!canConvert}
        className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
          canConvert
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-400 cursor-not-allowed text-gray-200'
        }`}
      >
        <ReplaceAll className="w-4 h-4 mr-2" />
        Convert
      </button>

      {showDownload && (
        <button
          onClick={onDownload}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download All
        </button>
      )}

      <button
        onClick={onClear}
        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Clear All
      </button>
    </div>
  );
}