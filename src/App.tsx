import { DropZone } from './components/DropZone';
import { FormatSelector } from './components/FormatSelector';
import { ImageList } from './components/ImageList';
import { useImageStore } from './store/useImageStore';
import { convertImage } from './lib/imageConverter';
import { Download } from 'lucide-react';
import { createZipFile } from './utils/zipUtils';

function App() {
  const { images, outputFormat, updateImageProgress, updateImageStatus, clearImages } = useImageStore();

  const handleConvert = async () => {
    const pendingImages = images.filter((img) => img.status === 'idle');
    
    for (const image of pendingImages) {
      try {
        updateImageStatus(image.id, 'processing');
        const convertedUrl = await convertImage(
          image.file.contents,
          outputFormat,
          (progress) => updateImageProgress(image.id, progress)
        );
        updateImageStatus(image.id, 'done', convertedUrl);
      } catch (error) {
        updateImageStatus(
          image.id,
          'error',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  };

  const handleDownloadAll = async () => {
    const convertedImages = images.filter(
      (img) => img.status === 'done' && img.convertedFile
    );

    if (convertedImages.length === 0) return;

    try {
      const zipBlob = await createZipFile(convertedImages, outputFormat);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted-images.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create zip file:', error);
    }
  };

  const hasConvertibleImages = images.some((img) => img.status === 'idle');
  const hasConvertedImages = images.some((img) => img.status === 'done');
  const hasAnyImages = images.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Image Converter</h1>
          <p className="mt-2 text-gray-600">
            Convert your images to different formats with ease
          </p>
        </div>

        <div className="space-y-6">
          <DropZone />
          
          <div className="flex items-center justify-between">
            <FormatSelector />
            
            <div className="flex gap-3">
              {hasConvertibleImages && (
                <button
                  onClick={handleConvert}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Convert
                </button>
              )}
              
              {hasConvertedImages && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              )}

              {hasAnyImages && (
                <button
                  onClick={clearImages}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <ImageList />
        </div>
      </div>
    </div>
  );
}

export default App;