
/**
 * Converts an SVG file to a raster image (PNG) File object.
 * Uses a canvas to render the SVG and convert it to a PNG with proper dimensions.
 */
export async function convertSVGToImage(file: File | Blob, fileName: string): Promise<File> {
  console.log('Starting SVG conversion...', {
    name: fileName,
    size: file.size,
    type: file.type
  });

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        // Log original SVG dimensions
        console.log('SVG loaded with dimensions:', {
          width: img.width,
          height: img.height
        });

        // Set dimensions to maintain quality
        canvas.width = img.width || 800;  // Default to 800 if width is 0
        canvas.height = img.height || 800; // Default to 800 if height is 0
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Set white background for JPG
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to convert SVG to image');
          }
          
          // Convert blob to File
          const convertedFile = new File([blob], fileName.replace('.svg', '.png'), {
            type: 'image/png'
          });
          
          console.log('SVG conversion complete:', {
            originalSize: file.size,
            convertedSize: convertedFile.size,
            width: canvas.width,
            height: canvas.height
          });

          resolve(convertedFile);
        }, 'image/png', 1.0); // Using maximum quality for PNG conversion
      } catch (error) {
        console.error('SVG conversion error:', error);
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = (error) => {
      console.error('Failed to load SVG:', error);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };

    img.src = url;
  });
}

/**
 * Checks if a file is an SVG based on its type.
 */
export function isSVG(file: File | Blob): boolean {
  const isSVGMimeType = file.type === 'image/svg+xml';

  if (isSVGMimeType) {
    return true;
  } 

  return file instanceof File && file.name.toLowerCase().endsWith('.svg');  
}