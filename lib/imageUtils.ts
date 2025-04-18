import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Pixelate an image using Sharp
 * @param inputPath Path to the input image
 * @param outputPath Path to save the pixelated image
 * @param options Configuration options for pixelation
 * @returns Promise that resolves to the output path
 */
export async function pixelateImage(
  inputPath: string,
  outputPath?: string,
  options: {
    downscaleWidth?: number;
    downscaleHeight?: number;
    colorCount?: number;
    scaleUp?: number;
    brightness?: number; // -1 to 1
    contrast?: number; // -1 to 1
    dithering?: boolean;
    colorTint?: string; // hex color
    edgeEnhance?: number; // 0 to 10
    saturation?: number; // -1 to 1
    posterize?: number; // 2-8
  } = {}
): Promise<string> {
  // Set default options
  const {
    downscaleWidth = 80,
    downscaleHeight = 80,
    colorCount = 16,
    scaleUp = 8,
    brightness = 0,
    contrast = 0,
    dithering = false,
    colorTint = '',
    edgeEnhance = 0,
    saturation = 0,
    posterize = 0
  } = options;

  // Generate output path if not provided
  if (!outputPath) {
    const parsedPath = path.parse(inputPath);
    outputPath = `${parsedPath.dir}/${parsedPath.name}_pixelated${parsedPath.ext}`;
  }

  try {
    // 1. Load the image
    let imageBuffer = await fs.readFile(inputPath);
    
    // 2. Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // Calculate aspect ratio if only one dimension is provided
    const aspectRatio = metadata.width && metadata.height 
      ? metadata.width / metadata.height
      : 1;
      
    const finalDownscaleHeight = downscaleHeight || Math.round(downscaleWidth / aspectRatio);
    const finalDownscaleWidth = downscaleWidth || Math.round(downscaleHeight * aspectRatio);

    // Create a sharp pipeline
    let pipeline = sharp(imageBuffer);
    
    // Apply pre-downscale adjustments
    if (brightness !== 0 || contrast !== 0 || saturation !== 0) {
      pipeline = pipeline.modulate({
        brightness: 1 + brightness,
        saturation: 1 + saturation
      });
      
      if (contrast !== 0) {
        pipeline = pipeline.linear(
          1 + contrast * 0.5, // Multiply by 0.5 to make the effect more subtle
          0
        );
      }
    }
    
    // 3. Resize to small dimensions (downscale)
    pipeline = pipeline.resize(finalDownscaleWidth, finalDownscaleHeight, {
      fit: 'fill',
      kernel: 'nearest'
    });
    
    // Apply edge enhancement if requested (before color reduction)
    if (edgeEnhance > 0) {
      pipeline = pipeline.convolve({
        width: 3,
        height: 3,
        kernel: [
          -edgeEnhance, -edgeEnhance, -edgeEnhance,
          -edgeEnhance, 1 + 8 * edgeEnhance, -edgeEnhance,
          -edgeEnhance, -edgeEnhance, -edgeEnhance
        ]
      });
    }
    
    // Apply posterization if requested
    if (posterize > 0) {
      // Use the remap function to posterize
      const levels = Math.max(2, Math.min(8, posterize));
      const step = 255 / (levels - 1);
      const remapTable = new Uint8Array(256);
      
      for (let i = 0; i < 256; i++) {
        remapTable[i] = Math.round(Math.round(i / step) * step);
      }
      
      pipeline = pipeline.recomb([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]).gamma(1.0).normalize().toColorspace('srgb');
    }
    
    // Convert to buffer for next operations
    const processedSmallImage = await pipeline.toBuffer();
    
    // 4. Quantize colors (reduce color palette)
    const pngOptions: sharp.PngOptions = { 
      palette: true, 
      colors: colorCount,
      dither: dithering ? 1.0 : 0 // Add dithering if requested
    };
    
    let quantizedImage = await sharp(processedSmallImage)
      .toColorspace('srgb')
      .png(pngOptions)
      .toBuffer();
    
    // Apply color tint if requested
    if (colorTint && colorTint.match(/^#[0-9A-Fa-f]{6}$/)) {
      // Extract RGB components from hex color
      const r = parseInt(colorTint.slice(1, 3), 16) / 255;
      const g = parseInt(colorTint.slice(3, 5), 16) / 255;
      const b = parseInt(colorTint.slice(5, 7), 16) / 255;
      
      // Apply a subtle color tint using recomb
      quantizedImage = await sharp(quantizedImage)
        .recomb([
          [r * 0.8 + 0.2, 0, 0],
          [0, g * 0.8 + 0.2, 0],
          [0, 0, b * 0.8 + 0.2]
        ])
        .toBuffer();
    }
    
    // 5. Scale back up with nearest neighbor sampling for the pixelated effect
    await sharp(quantizedImage)
      .resize(finalDownscaleWidth * scaleUp, finalDownscaleHeight * scaleUp, {
        kernel: 'nearest',
        fit: 'fill'
      })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Error pixelating image:', error);
    throw error;
  }
}

/**
 * Pixelate an image and return the result as a Buffer
 * Useful for server components or API routes
 */
export async function pixelateImageToBuffer(
  imageBuffer: Buffer,
  options: {
    downscaleWidth?: number;
    downscaleHeight?: number;
    colorCount?: number;
    scaleUp?: number;
    brightness?: number; // -1 to 1
    contrast?: number; // -1 to 1
    dithering?: boolean;
    colorTint?: string; // hex color
    edgeEnhance?: number; // 0 to 10
    saturation?: number; // -1 to 1
    posterize?: number; // 2-8
  } = {}
): Promise<Buffer> {
  // Set default options
  const {
    downscaleWidth = 80,
    downscaleHeight = 80,
    colorCount = 16,
    scaleUp = 8,
    brightness = 0,
    contrast = 0,
    dithering = false,
    colorTint = '',
    edgeEnhance = 0,
    saturation = 0,
    posterize = 0
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // Calculate aspect ratio if only one dimension is provided
    const aspectRatio = metadata.width && metadata.height 
      ? metadata.width / metadata.height
      : 1;
      
    const finalDownscaleHeight = downscaleHeight || Math.round(downscaleWidth / aspectRatio);
    const finalDownscaleWidth = downscaleWidth || Math.round(downscaleHeight * aspectRatio);

    // Create a sharp pipeline
    let pipeline = sharp(imageBuffer);
    
    // Apply pre-downscale adjustments
    if (brightness !== 0 || contrast !== 0 || saturation !== 0) {
      pipeline = pipeline.modulate({
        brightness: 1 + brightness,
        saturation: 1 + saturation
      });
      
      if (contrast !== 0) {
        pipeline = pipeline.linear(
          1 + contrast * 0.5, // Multiply by 0.5 to make the effect more subtle
          0
        );
      }
    }
    
    // Resize to small dimensions (downscale)
    pipeline = pipeline.resize(finalDownscaleWidth, finalDownscaleHeight, {
      fit: 'fill',
      kernel: 'nearest'
    });
    
    // Apply edge enhancement if requested (before color reduction)
    if (edgeEnhance > 0) {
      pipeline = pipeline.convolve({
        width: 3,
        height: 3,
        kernel: [
          -edgeEnhance, -edgeEnhance, -edgeEnhance,
          -edgeEnhance, 1 + 8 * edgeEnhance, -edgeEnhance,
          -edgeEnhance, -edgeEnhance, -edgeEnhance
        ]
      });
    }
    
    // Apply posterization if requested
    if (posterize > 0) {
      // Use the remap function to posterize
      const levels = Math.max(2, Math.min(8, posterize));
      const step = 255 / (levels - 1);
      const remapTable = new Uint8Array(256);
      
      for (let i = 0; i < 256; i++) {
        remapTable[i] = Math.round(Math.round(i / step) * step);
      }
      
      pipeline = pipeline.recomb([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]).gamma(1.0).normalize().toColorspace('srgb');
    }
    
    // Convert to buffer for next operations
    const processedSmallImage = await pipeline.toBuffer();
    
    // Quantize colors (reduce color palette)
    const pngOptions: sharp.PngOptions = { 
      palette: true, 
      colors: colorCount,
      dither: dithering ? 1.0 : 0 // Add dithering if requested
    };
    
    let quantizedImage = await sharp(processedSmallImage)
      .toColorspace('srgb')
      .png(pngOptions)
      .toBuffer();
    
    // Apply color tint if requested
    if (colorTint && colorTint.match(/^#[0-9A-Fa-f]{6}$/)) {
      // Extract RGB components from hex color
      const r = parseInt(colorTint.slice(1, 3), 16) / 255;
      const g = parseInt(colorTint.slice(3, 5), 16) / 255;
      const b = parseInt(colorTint.slice(5, 7), 16) / 255;
      
      // Apply a subtle color tint using recomb
      quantizedImage = await sharp(quantizedImage)
        .recomb([
          [r * 0.8 + 0.2, 0, 0],
          [0, g * 0.8 + 0.2, 0],
          [0, 0, b * 0.8 + 0.2]
        ])
        .toBuffer();
    }
    
    // Scale back up with nearest neighbor sampling
    return await sharp(quantizedImage)
      .resize(finalDownscaleWidth * scaleUp, finalDownscaleHeight * scaleUp, {
        kernel: 'nearest',
        fit: 'fill'
      })
      .toBuffer();
    
  } catch (error) {
    console.error('Error pixelating image to buffer:', error);
    throw error;
  }
} 