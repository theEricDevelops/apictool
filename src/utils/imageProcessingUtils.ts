/**
 * Image processing utility functions for color and pixel manipulation
 */

/**
 * Reduces the color depth of an image context
 * @param ctx - The 2D rendering context of a canvas
 * @param width - The width of the image
 * @param height - The height of the image
 * @param levels - Number of levels per color channel (default: 8 gives 512 colors)
 */
export function reduceColors(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  levels: number = 8
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  const step = Math.floor(256 / levels);
  
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = Math.round(pixels[i] / step) * step;     // Red
    pixels[i + 1] = Math.round(pixels[i + 1] / step) * step; // Green
    pixels[i + 2] = Math.round(pixels[i + 2] / step) * step; // Blue
    // Alpha channel (pixels[i + 3]) is left unchanged
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Calculates the optimal dimensions for an image while maintaining aspect ratio
 * @param width - Original width
 * @param height - Original height
 * @param maxDimension - Maximum allowed dimension
 * @returns Object containing new width and height
 */
export function calculateOptimalDimensions(
  width: number, 
  height: number, 
  maxDimension: number
): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}
