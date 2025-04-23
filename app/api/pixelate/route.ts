import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic'; // Ensure endpoint is not statically optimized

export async function POST(req: NextRequest) {
  console.log('Pixelate API endpoint hit');
  
  try {
    // Parse the multipart form data
    const formData = await req.formData().catch(error => {
      console.error('Error parsing form data:', error);
      throw new Error('Failed to parse form data: ' + error.message);
    });
    
    console.log('Form data keys:', [...formData.keys()]);
    
    const imageFile = formData.get('image') as File | null;
    
    if (!imageFile) {
      console.error('No image file provided');
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    console.log('Image file received:', imageFile.name, 'Size:', imageFile.size, 'Type:', imageFile.type);

    // Get basic parameters
    const downscaleWidth = Number(formData.get('downscaleWidth')) || 80;
    const colorCount = Number(formData.get('colorCount')) || 16;
    const scaleUp = Number(formData.get('scaleUp')) || 8;
    
    // Get advanced parameters (with defaults)
    const brightness = Number(formData.get('brightness')) || 0;
    const contrast = Number(formData.get('contrast')) || 0;
    const saturation = Number(formData.get('saturation')) || 0;
    const dithering = formData.get('dithering') === 'true';
    const colorTint = formData.get('colorTint') as string || '';
    const edgeEnhance = Number(formData.get('edgeEnhance')) || 0;
    const posterize = Number(formData.get('posterize')) || 0;
    
    // Get color blocking parameters
    const colorBlockingEnabled = formData.get('colorBlockingEnabled') === 'true';
    const similarityThreshold = Number(formData.get('similarityThreshold')) || 30;
    const minRegionSize = Number(formData.get('minRegionSize')) || 10;
    const smoothingIterations = Number(formData.get('smoothingIterations')) || 1;
    
    // Get custom palette if provided
    const customPalette = formData.get('customPalette') as string || '';
    let customPaletteColors: number[][] = [];
    
    if (customPalette) {
      try {
        // Parse the custom palette string (format: "#RRGGBB,#RRGGBB,...")
        customPaletteColors = customPalette.split(',')
          .map(hex => hex.trim())
          .filter(hex => /^#[0-9A-Fa-f]{6}$/.test(hex))
          .map(hex => [
            parseInt(hex.slice(1, 3), 16),  // R
            parseInt(hex.slice(3, 5), 16),  // G
            parseInt(hex.slice(5, 7), 16)   // B
          ]);
        
        console.log('Using custom palette:', customPaletteColors);
      } catch (error) {
        console.error('Error parsing custom palette:', error);
        // If there's an error, we'll fall back to automatic palette generation
        customPaletteColors = [];
      }
    }
    
    // Convert file to buffer
    let buffer;
    try {
      buffer = Buffer.from(await imageFile.arrayBuffer());
      console.log('Successfully converted file to buffer, size:', buffer.length);
    } catch (bufferError) {
      console.error('Error converting file to buffer:', bufferError);
      return NextResponse.json({ 
        error: 'Failed to process image data', 
        details: bufferError instanceof Error ? bufferError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Calculate aspect ratio
    let metadata;
    let width, height, aspectRatio, downscaleHeight;
    
    try {
      metadata = await sharp(buffer).metadata();
      console.log('Image metadata:', metadata);
      
      width = metadata.width || 800;
      height = metadata.height || 600;
      aspectRatio = width / height;
      
      // Calculate downscale height based on aspect ratio
      downscaleHeight = Math.round(downscaleWidth / aspectRatio);
      
      console.log('Processing with params:', { 
        downscaleWidth, 
        downscaleHeight, 
        colorCount, 
        scaleUp,
        brightness,
        contrast,
        saturation,
        dithering,
        edgeEnhance,
        posterize,
        colorBlockingEnabled,
        similarityThreshold,
        minRegionSize,
        smoothingIterations,
        hasCustomPalette: customPaletteColors.length > 0
      });
    } catch (metadataError) {
      console.error('Error calculating image metadata:', metadataError);
      return NextResponse.json({ 
        error: 'Failed to process image', 
        details: metadataError instanceof Error ? metadataError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Create a sharp pipeline
    let pipeline = sharp(buffer);
    
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
    
    // 1. Resize to small dimensions (downscale)
    pipeline = pipeline.resize(downscaleWidth, downscaleHeight, {
      fit: 'fill',
      kernel: 'nearest'
    });
    
    // Apply edge enhancement if requested
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
      // Used simplified posterization with threshold
      pipeline = pipeline.threshold(posterize * 16);
    }
    
    // Convert to buffer for next operations
    const processedSmallImage = await pipeline.toBuffer();
    
    // 2. Quantize colors (reduce color palette)
    // If we have a custom palette, use a different approach
    let quantizedImage;
    
    if (customPaletteColors.length > 0) {
      // Extract raw pixels for manual quantization with custom palette
      const rawInput = await sharp(processedSmallImage)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { data: inputData, info: inputInfo } = rawInput;
      const { width: inputWidth, height: inputHeight, channels: inputChannels } = inputInfo;
      
      // Create output buffer with same dimensions
      const outputData = Buffer.alloc(inputData.length);
      
      // Simple helper to get pixel color from input
      const getInputPixel = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= inputWidth || y >= inputHeight) return null;
        const i = (y * inputWidth + x) * inputChannels;
        return [inputData[i], inputData[i + 1], inputData[i + 2]];
      };
      
      // Helper to set pixel in output
      const setOutputPixel = (x: number, y: number, color: number[]) => {
        const i = (y * inputWidth + x) * inputChannels;
        outputData[i] = color[0];
        outputData[i + 1] = color[1];
        outputData[i + 2] = color[2];
        if (inputChannels === 4) {
          outputData[i + 3] = inputData[i + 3]; // Preserve alpha
        }
      };
      
      // Color distance function
      const colorDistance = (color1: number[] | null, color2: number[] | null) => {
        if (!color1 || !color2) return 999;
        return Math.sqrt(
          Math.pow(color1[0] - color2[0], 2) +
          Math.pow(color1[1] - color2[1], 2) +
          Math.pow(color1[2] - color2[2], 2)
        );
      };
      
      // Simple dithering function (if enabled)
      const dither = (x: number, y: number, originalColor: number[], mappedColor: number[]) => {
        if (!dithering) return;
        
        // Calculate error
        const errors = [
          originalColor[0] - mappedColor[0],
          originalColor[1] - mappedColor[1],
          originalColor[2] - mappedColor[2]
        ];
        
        // Apply error diffusion (Floyd-Steinberg dithering)
        const applyError = (targetX: number, targetY: number, factor: number) => {
          if (targetX < 0 || targetY < 0 || targetX >= inputWidth || targetY >= inputHeight) return;
          
          const targetIdx = (targetY * inputWidth + targetX) * inputChannels;
          for (let c = 0; c < 3; c++) {
            inputData[targetIdx + c] = Math.max(0, Math.min(255, 
              inputData[targetIdx + c] + errors[c] * factor
            ));
          }
        };
        
        // Distribute error to neighboring pixels
        applyError(x + 1, y, 7/16);
        applyError(x - 1, y + 1, 3/16);
        applyError(x, y + 1, 5/16);
        applyError(x + 1, y + 1, 1/16);
      };
      
      // Map each pixel to closest color in custom palette
      for (let y = 0; y < inputHeight; y++) {
        for (let x = 0; x < inputWidth; x++) {
          const originalColor = getInputPixel(x, y);
          if (!originalColor) continue;
          
          // Find closest color in palette
          let minDist = Infinity;
          let closestColor = customPaletteColors[0];
          
          for (const paletteColor of customPaletteColors) {
            const dist = colorDistance(originalColor, paletteColor);
            if (dist < minDist) {
              minDist = dist;
              closestColor = paletteColor;
            }
          }
          
          // Set pixel in output
          setOutputPixel(x, y, closestColor);
          
          // Apply dithering if enabled
          dither(x, y, originalColor, closestColor);
        }
      }
      
      // Convert output buffer back to an image
      quantizedImage = await sharp(outputData, {
        raw: {
          width: inputWidth,
          height: inputHeight,
          channels: inputChannels
        }
      }).png().toBuffer();
      
    } else {
      // Use standard quantization with sharp
      const pngOptions: sharp.PngOptions = { 
        palette: true, 
        colors: colorCount,
        dither: dithering ? 1.0 : 0 // Add dithering if requested
      };
      
      quantizedImage = await sharp(processedSmallImage)
        .toColorspace('srgb')
        .png(pngOptions)
        .toBuffer();
    }
    
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
    
    // Apply color blocking if enabled
    if (colorBlockingEnabled) {
      console.log('Applying color blocking with parameters:', {
        similarityThreshold,
        minRegionSize,
        smoothingIterations
      });
      
      // Extract raw pixels from the image for processing
      const rawData = await sharp(quantizedImage)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { data, info } = rawData;
      const { width, height, channels } = info;
      
      console.log(`Processing image: ${width}x${height}, ${channels} channels`);
      
      // Helper functions
      const getPixel = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return null;
        const i = (y * width + x) * channels;
        return [data[i], data[i + 1], data[i + 2]];
      };
      
      const setPixel = (x: number, y: number, color: number[]) => {
        const i = (y * width + x) * channels;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
      };
      
      const colorDistance = (color1: number[] | null, color2: number[] | null) => {
        if (!color1 || !color2) return 999;
        return Math.sqrt(
          Math.pow(color1[0] - color2[0], 2) +
          Math.pow(color1[1] - color2[1], 2) +
          Math.pow(color1[2] - color2[2], 2)
        );
      };
      
      // OPTIMIZED SPATIAL COLOR BLOCKING
      
      // We'll use the provided custom palette if available, otherwise extract from image
      let palette = customPaletteColors.length > 0 
        ? [...customPaletteColors] 
        : [];
      
      // If we don't have a custom palette, extract one from the image
      if (palette.length === 0) {
        // Create a grid of cells to extract palette
        const GRID_SIZE = Math.max(8, Math.min(24, Math.floor(width / 20)));
        const cellWidth = Math.ceil(width / GRID_SIZE);
        const cellHeight = Math.ceil(height / GRID_SIZE);
        const gridCells = Array(GRID_SIZE * GRID_SIZE).fill(null).map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
        
        // Calculate average color for each grid cell
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const color = getPixel(x, y);
            if (!color) continue;
            
            const gridX = Math.floor(x / cellWidth);
            const gridY = Math.floor(y / cellHeight);
            const cellIndex = gridY * GRID_SIZE + gridX;
            
            if (cellIndex >= 0 && cellIndex < gridCells.length) {
              gridCells[cellIndex].r += color[0];
              gridCells[cellIndex].g += color[1];
              gridCells[cellIndex].b += color[2];
              gridCells[cellIndex].count++;
            }
          }
        }
        
        // Normalize grid cells
        gridCells.forEach(cell => {
          if (cell.count > 0) {
            cell.r = Math.round(cell.r / cell.count);
            cell.g = Math.round(cell.g / cell.count);
            cell.b = Math.round(cell.b / cell.count);
          }
        });
        
        // Extract unique colors from grid cells
        const uniqueColors = new Set();
        gridCells.forEach(cell => {
          if (cell.count > 0) {
            const colorKey = `${cell.r},${cell.g},${cell.b}`;
            if (!uniqueColors.has(colorKey)) {
              uniqueColors.add(colorKey);
              palette.push([cell.r, cell.g, cell.b]);
            }
          }
        });
        
        // Limit to requested color count if needed
        if (palette.length > colorCount) {
          // Sort colors by luminance (brightness) for better distribution
          palette.sort((a, b) => {
            const luminanceA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
            const luminanceB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
            return luminanceA - luminanceB;
          });
          
          // Take colors at regular intervals
          const step = palette.length / colorCount;
          const simplifiedPalette = [];
          for (let i = 0; i < colorCount; i++) {
            const index = Math.min(Math.floor(i * step), palette.length - 1);
            simplifiedPalette.push(palette[index]);
          }
          
          palette = simplifiedPalette;
        }
      }
      
      console.log(`Using palette with ${palette.length} colors`);
      
      // Create a spatial map for each color in the palette
      // This will help determine which colors are more likely in which areas
      const spatialMaps = palette.map(() => new Uint32Array(width * height).fill(0));
      
      // Build spatial maps - count occurrences of similar colors in each region
      const REGION_SIZE = Math.max(5, Math.min(20, Math.floor(Math.sqrt(width * height) / 20)));
      
      // For each pixel, find most similar palette color and update its spatial map
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = getPixel(x, y);
          if (!color) continue;
          
          // Find closest palette color
          let minDist = Infinity;
          let closestIndex = 0;
          
          for (let i = 0; i < palette.length; i++) {
            const dist = colorDistance(color, palette[i]);
            if (dist < minDist) {
              minDist = dist;
              closestIndex = i;
            }
          }
          
          // Update spatial map for this color
          // We use a region-based approach to reduce computational load
          const regionX = Math.floor(x / REGION_SIZE);
          const regionY = Math.floor(y / REGION_SIZE);
          
          // Add weight to this color in surrounding regions
          for (let ry = Math.max(0, regionY - 1); ry <= Math.min(Math.floor(height / REGION_SIZE), regionY + 1); ry++) {
            for (let rx = Math.max(0, regionX - 1); rx <= Math.min(Math.floor(width / REGION_SIZE), regionX + 1); rx++) {
              // Weight decreases with distance
              const distFactor = (rx === regionX && ry === regionY) ? 4 : 1;
              
              // Calculate region center
              const centerX = rx * REGION_SIZE + REGION_SIZE / 2;
              const centerY = ry * REGION_SIZE + REGION_SIZE / 2;
              
              // Add weight to spatial map
              const idx = Math.floor(centerY) * width + Math.floor(centerX);
              if (idx >= 0 && idx < spatialMaps[closestIndex].length) {
                spatialMaps[closestIndex][idx] += distFactor;
              }
            }
          }
        }
      }
      
      // Smooth the spatial maps
      for (const map of spatialMaps) {
        const tempMap = new Uint32Array(map.length);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            tempMap[idx] = Math.floor(
              (map[idx] * 4 +
               map[idx - 1] + map[idx + 1] +
               map[idx - width] + map[idx + width]) / 8
            );
          }
        }
        // Copy back
        for (let i = 0; i < map.length; i++) {
          map[i] = tempMap[i];
        }
      }
      
      // Now apply spatially-aware color mapping
      const colorAssignmentCache = new Map();
      
      // Calculate spatially-aware color for each pixel
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = getPixel(x, y);
          if (!color) continue;
          
          const colorKey = `${color[0]},${color[1]},${color[2]}`;
          
          // Check if we've already assigned this color
          if (colorAssignmentCache.has(colorKey)) {
            setPixel(x, y, colorAssignmentCache.get(colorKey));
            continue;
          }
          
          // Calculate the "position influence" based on similarity threshold
          // Lower threshold = more influence from position
          const spatialWeight = Math.max(0.1, Math.min(0.7, 1.0 - (similarityThreshold / 100)));
          
          // Find best matching color considering both color and position
          let bestMatch = palette[0];
          let bestScore = -Infinity;
          
          // Current pixel index
          const idx = y * width + x;
          
          for (let i = 0; i < palette.length; i++) {
            // Color similarity component (inverse of distance)
            const colorDist = colorDistance(color, palette[i]);
            const colorSimilarity = 255 - Math.min(255, colorDist);
            
            // Spatial component - how likely is this color in this region
            const spatialLikelihood = spatialMaps[i][idx];
            
            // Combined score - weighted sum of color similarity and spatial likelihood
            const score = (1 - spatialWeight) * colorSimilarity + spatialWeight * spatialLikelihood;
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = palette[i];
            }
          }
          
          // Cache this assignment for future lookups
          colorAssignmentCache.set(colorKey, bestMatch);
          
          // Assign the best color
          setPixel(x, y, bestMatch);
        }
      }
      
      // Clean up small regions
      if (minRegionSize > 1) {
        // Find connected regions
        const visited = new Uint8Array(width * height).fill(0);
        
        // Helper to get region color key
        const getColorKey = (color: number[]) => `${color[0]},${color[1]},${color[2]}`;
        
        // Flood fill to identify connected regions
        const floodFill = (startX: number, startY: number) => {
          const startColor = getPixel(startX, startY);
          if (!startColor) return { pixels: [] as [number, number][], colorKey: '' };
          
          const startColorKey = getColorKey(startColor);
          const queue = [[startX, startY]];
          const pixels: [number, number][] = [];
          
          while (queue.length > 0) {
            const [x, y] = queue.shift();
            const idx = y * width + x;
            
            if (visited[idx]) continue;
            visited[idx] = 1;
            
            const pixelColor = getPixel(x, y);
            if (!pixelColor || getColorKey(pixelColor) !== startColorKey) continue;
            
            pixels.push([x, y]);
            
            // Check 4-connected neighbors
            if (x > 0) queue.push([x - 1, y]);
            if (x < width - 1) queue.push([x + 1, y]);
            if (y > 0) queue.push([x, y - 1]);
            if (y < height - 1) queue.push([x, y + 1]);
          }
          
          return { pixels, colorKey: startColorKey };
        };
        
        // Find all regions
        const regions = [];
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (!visited[y * width + x]) {
              const region = floodFill(x, y);
              if (region.pixels.length > 0) {
                regions.push(region);
              }
            }
          }
        }
        
        // Identify small regions
        const smallRegions = regions.filter(r => r.pixels.length < minRegionSize);
        console.log(`Found ${smallRegions.length} small regions to clean up`);
        
        // For each small region, replace with most common neighbor color
        for (const region of smallRegions) {
          if (region.pixels.length === 0) continue;
          
          // Get all unique neighbor colors
          const neighborColors = new Map();
          
          for (const [px, py] of region.pixels) {
            // Check 4-connected neighbors
            const neighbors = [
              [px - 1, py],
              [px + 1, py],
              [px, py - 1],
              [px, py + 1]
            ];
            
            for (const [nx, ny] of neighbors) {
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
              
              const neighborColor = getPixel(nx, ny);
              if (!neighborColor) continue;
              
              const nColorKey = getColorKey(neighborColor);
              if (nColorKey !== region.colorKey) {
                neighborColors.set(nColorKey, 
                  (neighborColors.get(nColorKey) || { color: neighborColor, count: 0 }));
                neighborColors.get(nColorKey).count++;
              }
            }
          }
          
          // Find most common neighbor color
          let bestColor = null;
          let maxCount = 0;
          
          neighborColors.forEach((info, key) => {
            if (info.count > maxCount) {
              maxCount = info.count;
              bestColor = info.color;
            }
          });
          
          // Replace region with most common neighbor color
          if (bestColor) {
            for (const [px, py] of region.pixels) {
              setPixel(px, py, bestColor);
            }
          }
        }
      }
      
      // Apply optional smoothing
      if (smoothingIterations > 0) {
        console.log(`Applying ${smoothingIterations} smoothing iterations`);
        
        for (let iter = 0; iter < smoothingIterations; iter++) {
          const tempData = Buffer.from(data);
          
          const getTempPixel = (x: number, y: number) => {
            if (x < 0 || y < 0 || x >= width || y >= height) return null;
            const i = (y * width + x) * channels;
            return [tempData[i], tempData[i + 1], tempData[i + 2]];
          };
          
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const centerColor = getTempPixel(x, y);
              
              // Get the 4-connected neighbors
              const neighbors = [
                getTempPixel(x - 1, y),
                getTempPixel(x + 1, y),
                getTempPixel(x, y - 1),
                getTempPixel(x, y + 1)
              ].filter((color): color is number[] => Boolean(color));
              
              // Count color occurrences
              const colorCounts = new Map();
              neighbors.forEach(color => {
                const key = color.join(',');
                colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
              });
              
              // Find the most common color
              let maxCount = 0;
              let dominantColor = null;
              
              colorCounts.forEach((count, colorKey) => {
                if (count > maxCount) {
                  maxCount = count;
                  dominantColor = colorKey.split(',').map(Number);
                }
              });
              
              // If 3 or more neighbors have the same color and it's different from center
              if (
                dominantColor && 
                maxCount >= 3 && 
                colorDistance(centerColor, dominantColor) > 30
              ) {
                setPixel(x, y, dominantColor);
              }
            }
          }
        }
      }
      
      // Convert processed data back to an image
      quantizedImage = await sharp(Buffer.from(data), {
        raw: {
          width,
          height,
          channels
        }
      }).png().toBuffer();
    }
    
    // 3. Scale back up with nearest neighbor sampling for the pixelated effect
    const result = await sharp(quantizedImage)
      .resize(downscaleWidth * scaleUp, downscaleHeight * scaleUp, {
        kernel: 'nearest',
        fit: 'fill'
      })
      .toBuffer();
    
    console.log('Image processed successfully');
    
    // Return the processed image
    return new NextResponse(result, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('Error in pixelate API route:', error);
    return NextResponse.json({ 
      error: 'Failed to process image', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// App Router doesn't use this config format, this is only for backwards compatibility
// with Pages Router and will be ignored in App Router
export const config = {
  api: {
    bodyParser: false, // Disables body parsing, we'll handle it ourselves with formData
  },
};