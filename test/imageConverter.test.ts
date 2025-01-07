import { convertImage } from '@/lib/image-converter.lib';
import { convertHEICIfNeeded } from '@/utils/heic.utils';

jest.mock('../utils/heicUtils', () => ({
  convertHEICIfNeeded: jest.fn(file => Promise.resolve(file))
}));

describe('Image Converter', () => {
  const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
  const mockProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should convert an image successfully', async () => {
    const result = await convertImage(mockFile, 'image/webp', mockProgress);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('size');
    expect(result.url).toMatch(/^blob:/);
  });

  it('should call progress callback during conversion', async () => {
    await convertImage(mockFile, 'image/webp', mockProgress);
    expect(mockProgress).toHaveBeenCalled();
  });
});
