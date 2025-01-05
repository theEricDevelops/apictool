import heic2any from 'heic2any';

export async function getHEICConvertedURL(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('heic2any can only be used in the browser');
  }
  
  const heic2any = (await import('heic2any')).default;
  if (!file || file.type !== 'image/heic') {
    throw new Error('Provided file is not a HEIC image');
  }

  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
    });

    if (Array.isArray(convertedBlob)) {
      return URL.createObjectURL(convertedBlob[0]);
    }
    return URL.createObjectURL(convertedBlob);
  } catch (error) {
    console.error('Error converting HEIC file:', error);
    throw error;  // Re-throw the error for the caller to handle
  }
}

// Function to check format and convert if necessary
export async function convertHEICIfNeeded(file: File): Promise<File> {
  if (file.type === 'image/heic') {
    console.log('HEIC format detected, converting using heic2any...');
    const url = await getHEICConvertedURL(file);
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], file.name.replace(/\.\w+$/, '.jpeg'), {
      type: 'image/jpeg',
    });
  }
  return file;
}

export async function isHEICSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob(
      (blob) => {
        resolve(blob?.type === 'image/heic');
      },
      'image/heic'
    );
  });
}
