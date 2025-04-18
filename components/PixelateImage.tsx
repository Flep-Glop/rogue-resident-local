'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { PixelText, PixelButton, PixelBox } from '@/app/components/PixelThemeProvider';

// Type for preset configuration
interface PresetConfig {
  downscaleWidth: number;
  colorCount: number;
  scaleUp: number;
  brightness: number;
  contrast: number;
  saturation: number;
  dithering: boolean;
  colorTint: string;
  edgeEnhance: number;
  posterize: number;
  // Color blocking parameters
  colorBlockingEnabled: boolean;
  similarityThreshold: number;
  minRegionSize: number;
  smoothingIterations: number;
}

interface PixelateImageProps {
  className?: string;
  defaultImageSrc?: string;
}

// Default settings
const DEFAULT_SETTINGS = {
  downscaleWidth: 60,
  colorCount: 16,
  scaleUp: 1,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  dithering: false,
  colorTint: '',
  edgeEnhance: 0,
  posterize: 0,
  // Color blocking parameters
  colorBlockingEnabled: false,
  similarityThreshold: 30,
  minRegionSize: 10,
  smoothingIterations: 1
};

// Preset configurations
const PRESETS = {
  'rogue-equipment': {
    downscaleWidth: 120,
    colorCount: 24,
    scaleUp: 6,
    brightness: 0.05,
    contrast: 0.4,
    dithering: true,
    colorTint: '',
    edgeEnhance: 0.7,
    saturation: 0.2,
    posterize: 0,
    colorBlockingEnabled: true,
    similarityThreshold: 25,
    minRegionSize: 15,
    smoothingIterations: 2
  },
  'clean-pixel-art': {
    downscaleWidth: 80,
    colorCount: 12,
    scaleUp: 8,
    brightness: 0,
    contrast: 0.2,
    dithering: false,
    colorTint: '',
    edgeEnhance: 0.5,
    saturation: 0.1,
    posterize: 0,
    colorBlockingEnabled: true,
    similarityThreshold: 35,
    minRegionSize: 20,
    smoothingIterations: 3
  }
};

export default function PixelateImage({ className = '', defaultImageSrc }: PixelateImageProps) {
  // Image state
  const [originalImage, setOriginalImage] = useState<string | null>(defaultImageSrc || null);
  const [pixelatedImage, setPixelatedImage] = useState<string | null>(null);
  const [originalPixelatedImage, setOriginalPixelatedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store the original file for direct access
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  
  // Original image dimensions
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);
  const [targetDimensions, setTargetDimensions] = useState<{width: number, height: number} | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'creative' | 'color-blocking' | 'palette' | 'presets'>('basic');
  
  // Color palette
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customPalette, setCustomPalette] = useState<string>('');
  
  // Basic parameters
  const [downscaleWidth, setDownscaleWidth] = useState<number>(DEFAULT_SETTINGS.downscaleWidth);
  const [colorCount, setColorCount] = useState<number>(DEFAULT_SETTINGS.colorCount);
  const [scaleUp, setScaleUp] = useState<number>(DEFAULT_SETTINGS.scaleUp);
  
  // Advanced parameters
  const [brightness, setBrightness] = useState<number>(DEFAULT_SETTINGS.brightness);
  const [contrast, setContrast] = useState<number>(DEFAULT_SETTINGS.contrast);
  const [saturation, setSaturation] = useState<number>(DEFAULT_SETTINGS.saturation);
  const [dithering, setDithering] = useState<boolean>(DEFAULT_SETTINGS.dithering);
  
  // Creative parameters
  const [colorTint, setColorTint] = useState<string>(DEFAULT_SETTINGS.colorTint);
  const [edgeEnhance, setEdgeEnhance] = useState<number>(DEFAULT_SETTINGS.edgeEnhance);
  const [posterize, setPosterize] = useState<number>(DEFAULT_SETTINGS.posterize);
  
  // Color blocking parameters
  const [colorBlockingEnabled, setColorBlockingEnabled] = useState<boolean>(DEFAULT_SETTINGS.colorBlockingEnabled);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(DEFAULT_SETTINGS.similarityThreshold);
  const [minRegionSize, setMinRegionSize] = useState<number>(DEFAULT_SETTINGS.minRegionSize);
  const [smoothingIterations, setSmoothingIterations] = useState<number>(DEFAULT_SETTINGS.smoothingIterations);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom presets state
  const [customPresets, setCustomPresets] = useState<Record<string, PresetConfig>>({});
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [showSavePresetForm, setShowSavePresetForm] = useState<boolean>(false);
  
  // Load custom presets from localStorage on mount
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem('pixelateCustomPresets');
      if (savedPresets) {
        setCustomPresets(JSON.parse(savedPresets));
      }
    } catch (e) {
      console.error('Failed to load custom presets:', e);
    }
  }, []);
  
  // Save custom presets to localStorage when they change
  useEffect(() => {
    if (Object.keys(customPresets).length > 0) {
      try {
        localStorage.setItem('pixelateCustomPresets', JSON.stringify(customPresets));
      } catch (e) {
        console.error('Failed to save custom presets:', e);
      }
    }
  }, [customPresets]);
  
  // Reset settings to default
  const resetSettings = () => {
    setDownscaleWidth(DEFAULT_SETTINGS.downscaleWidth);
    setColorCount(DEFAULT_SETTINGS.colorCount);
    setScaleUp(DEFAULT_SETTINGS.scaleUp);
    setBrightness(DEFAULT_SETTINGS.brightness);
    setContrast(DEFAULT_SETTINGS.contrast);
    setSaturation(DEFAULT_SETTINGS.saturation);
    setDithering(DEFAULT_SETTINGS.dithering);
    setColorTint(DEFAULT_SETTINGS.colorTint);
    setEdgeEnhance(DEFAULT_SETTINGS.edgeEnhance);
    setPosterize(DEFAULT_SETTINGS.posterize);
    setColorBlockingEnabled(DEFAULT_SETTINGS.colorBlockingEnabled);
    setSimilarityThreshold(DEFAULT_SETTINGS.similarityThreshold);
    setMinRegionSize(DEFAULT_SETTINGS.minRegionSize);
    setSmoothingIterations(DEFAULT_SETTINGS.smoothingIterations);
  };
  
  // Revert to original pixelated image with default settings
  const revertToOriginal = () => {
    if (originalPixelatedImage) {
      setPixelatedImage(originalPixelatedImage);
      resetSettings();
    }
  };
  
  // Load a preset
  const loadPreset = (presetName: keyof typeof PRESETS) => {
    const preset = PRESETS[presetName];
    
    // Basic parameters
    setDownscaleWidth(preset.downscaleWidth);
    setColorCount(preset.colorCount);
    setScaleUp(preset.scaleUp);
    
    // Advanced parameters
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setDithering(preset.dithering);
    
    // Creative parameters
    setColorTint(preset.colorTint);
    setEdgeEnhance(preset.edgeEnhance);
    setPosterize(preset.posterize);
    
    // Color blocking parameters
    setColorBlockingEnabled(preset.colorBlockingEnabled);
    setSimilarityThreshold(preset.similarityThreshold);
    setMinRegionSize(preset.minRegionSize);
    setSmoothingIterations(preset.smoothingIterations);
    
    // Process immediately if an image is already loaded
    if (originalImage) {
      pixelateImage();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset previous state
    setError(null);
    setPixelatedImage(null);
    setOriginalPixelatedImage(null);
    resetSettings();
    
    // Only allow image files
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Store the original file for direct access later
    setOriginalFile(file);
    
    // Create URL for the image
    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl);
    
    // Get image dimensions
    const img = new window.Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      updateTargetDimensions(img.width, img.height, downscaleWidth);
    };
    img.src = objectUrl;
  };
  
  // Update target dimensions whenever downscaleWidth changes
  useEffect(() => {
    if (originalDimensions) {
      // Only update target dimensions if we're actually downscaling
      if (downscaleWidth < originalDimensions.width) {
        updateTargetDimensions(originalDimensions.width, originalDimensions.height, downscaleWidth);
      } else {
        // Set target dimensions to original if we're not downscaling
        setTargetDimensions(originalDimensions);
      }
    }
  }, [downscaleWidth, originalDimensions]);
  
  // Calculate target dimensions based on downscaleWidth
  const updateTargetDimensions = (origWidth: number, origHeight: number, targetWidth: number) => {
    const aspectRatio = origHeight / origWidth;
    const targetHeight = Math.round(targetWidth * aspectRatio);
    setTargetDimensions({ width: targetWidth, height: targetHeight });
  };
  
  // Extract color palette from pixelated image
  const extractColorPalette = useCallback(async (imageUrl: string) => {
    try {
      console.log('Extracting palette from:', imageUrl.substring(0, 50) + '...');
      
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Palette extraction timed out'));
        }, 5000);
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        img.onerror = (err) => {
          clearTimeout(timeout);
          console.error('Failed to load image for palette:', err);
          reject(new Error('Failed to load image for palette extraction'));
        };
        
        img.src = imageUrl;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return [];
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Map to track unique colors
      const colorMap = new Map<string, number>();
      
      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Skip fully transparent pixels
        if (a === 0) continue;
        
        // Convert to hex
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        // Count occurrences
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
      
      // Sort colors by frequency (most used first)
      const sortedColors = [...colorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
      
      setColorPalette(sortedColors);
      
      return sortedColors;
    } catch (error) {
      console.error('Error extracting palette:', error);
      // Still return an empty array but don't fail completely
      setColorPalette([]);
      return [];
    }
  }, []);
  
  // After image is pixelated, extract color palette
  useEffect(() => {
    if (pixelatedImage) {
      extractColorPalette(pixelatedImage);
    }
  }, [pixelatedImage, extractColorPalette]);
  
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };
  
  const pixelateImage = useCallback(async () => {
    if (!originalImage) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const formData = new FormData();
      
      // Get the image data
      let imageBlob: Blob;
      
      try {
        // If we have the original file, use it directly - most reliable
        if (originalFile) {
          imageBlob = originalFile;
        } 
        // Otherwise try to access the image from the URL
        else {
          console.log('No originalFile available, trying to get from URL...');
          
          // Create a new image element
          const img = new window.Image();
          
          // Load the image
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (err) => {
              console.error('Error loading image:', err);
              reject(new Error('Failed to load image from URL'));
            };
            img.src = originalImage;
          });
          
          // Create a canvas to capture the image data
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to create canvas context');
          
          // Draw the image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data as a blob
          imageBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to convert image to blob'));
            }, 'image/png');
          });
        }
      } catch (error) {
        console.error('Error accessing image:', error);
        throw new Error('Failed to access the image. Please try selecting the file again.');
      }
      
      formData.append('image', imageBlob, 'image.png');
      
      // Only downscale if the width is less than the original
      if (originalDimensions && downscaleWidth < originalDimensions.width) {
        console.log(`Downscaling to ${downscaleWidth}px (original: ${originalDimensions.width}px)`);
        formData.append('downscaleWidth', downscaleWidth.toString());
      } else if (originalDimensions) {
        console.log(`Preserving original resolution: ${originalDimensions.width}px`);
        formData.append('skipDownsampling', 'true');
      }
      
      formData.append('colorCount', colorCount.toString());
      formData.append('scaleUp', scaleUp.toString());
      
      if (brightness !== 0) formData.append('brightness', brightness.toString());
      if (contrast !== 0) formData.append('contrast', contrast.toString());
      if (saturation !== 0) formData.append('saturation', saturation.toString());
      if (dithering) formData.append('dithering', 'true');
      if (colorTint) formData.append('colorTint', colorTint);
      if (edgeEnhance !== 0) formData.append('edgeEnhance', edgeEnhance.toString());
      if (posterize !== 0) formData.append('posterize', posterize.toString());
      
      // Add custom palette if provided
      if (customPalette.trim()) {
        formData.append('customPalette', customPalette);
      }
      
      // Add color blocking parameters
      if (colorBlockingEnabled) {
        formData.append('colorBlockingEnabled', 'true');
        formData.append('similarityThreshold', similarityThreshold.toString());
        formData.append('minRegionSize', minRegionSize.toString());
        formData.append('smoothingIterations', smoothingIterations.toString());
      }
      
      // API endpoint
      const origin = window.location.origin;
      const apiUrl = `${origin}/api/pixelate`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const responseBlob = await response.blob();
      const imageUrl = URL.createObjectURL(responseBlob);
      
      setPixelatedImage(imageUrl);
      
      // If this is the first pixelation with default settings, save it as the original
      const isDefaultSettings = 
        downscaleWidth === DEFAULT_SETTINGS.downscaleWidth &&
        colorCount === DEFAULT_SETTINGS.colorCount &&
        scaleUp === DEFAULT_SETTINGS.scaleUp &&
        brightness === DEFAULT_SETTINGS.brightness &&
        contrast === DEFAULT_SETTINGS.contrast &&
        saturation === DEFAULT_SETTINGS.saturation &&
        dithering === DEFAULT_SETTINGS.dithering &&
        colorTint === DEFAULT_SETTINGS.colorTint &&
        edgeEnhance === DEFAULT_SETTINGS.edgeEnhance &&
        posterize === DEFAULT_SETTINGS.posterize &&
        colorBlockingEnabled === DEFAULT_SETTINGS.colorBlockingEnabled;
      
      if (isDefaultSettings && !originalPixelatedImage) {
        setOriginalPixelatedImage(imageUrl);
      }
    } catch (error) {
      console.error('Pixelation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to pixelate image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    originalImage, 
    downscaleWidth, 
    colorCount, 
    scaleUp, 
    brightness, 
    contrast, 
    saturation,
    dithering, 
    colorTint, 
    edgeEnhance, 
    posterize,
    colorBlockingEnabled,
    similarityThreshold,
    minRegionSize,
    smoothingIterations,
    originalPixelatedImage,
    originalFile,
    originalDimensions,
    customPalette
  ]);
  
  // Process the image with default settings when a new image is loaded
  useEffect(() => {
    if (originalImage && !pixelatedImage && !isProcessing) {
      pixelateImage();
    }
  }, [originalImage, pixelatedImage, isProcessing, pixelateImage]);
  
  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
      if (pixelatedImage) URL.revokeObjectURL(pixelatedImage);
      if (originalPixelatedImage) URL.revokeObjectURL(originalPixelatedImage);
    };
  }, [originalImage, pixelatedImage, originalPixelatedImage]);
  
  // Create a custom preset from current settings
  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: PresetConfig = {
      downscaleWidth,
      colorCount,
      scaleUp,
      brightness,
      contrast,
      saturation,
      dithering,
      colorTint,
      edgeEnhance,
      posterize,
      colorBlockingEnabled,
      similarityThreshold,
      minRegionSize,
      smoothingIterations
    };
    
    setCustomPresets(prev => ({
      ...prev,
      [newPresetName]: newPreset
    }));
    
    setNewPresetName('');
    setShowSavePresetForm(false);
  };
  
  // Delete a custom preset
  const deleteCustomPreset = (presetName: string) => {
    setCustomPresets(prev => {
      const newPresets = { ...prev };
      delete newPresets[presetName];
      return newPresets;
    });
  };
  
  // Apply a custom preset
  const applyCustomPreset = (presetName: string) => {
    const preset = customPresets[presetName];
    if (!preset) return;
    
    // Apply all parameters
    setDownscaleWidth(preset.downscaleWidth);
    setColorCount(preset.colorCount);
    setScaleUp(preset.scaleUp);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setDithering(preset.dithering);
    setColorTint(preset.colorTint);
    setEdgeEnhance(preset.edgeEnhance);
    setPosterize(preset.posterize);
    setColorBlockingEnabled(preset.colorBlockingEnabled);
    setSimilarityThreshold(preset.similarityThreshold);
    setMinRegionSize(preset.minRegionSize);
    setSmoothingIterations(preset.smoothingIterations);
    
    // Process immediately if an image is already loaded
    if (originalImage) {
      pixelateImage();
    }
  };
  
  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Main Interface */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column - Controls */}
        <PixelBox variant="dark" bordered className="p-4 lg:w-1/3">
          <div className="flex flex-col h-full">
            <PixelText className="text-xl font-bold mb-4">Image Pixelator</PixelText>
            
            {/* Image Selection */}
            <PixelButton 
              onClick={handleSelectFile}
              variant="primary"
              size="md"
              className="mb-4"
            >
              Select Image
            </PixelButton>
            
            {originalImage && (
              <>
                {/* Tabs */}
                <div className="grid grid-cols-6 gap-1 mb-4">
                  <PixelButton
                    variant={activeTab === 'basic' ? 'primary' : 'default'}
                    size="sm"
                    onClick={() => setActiveTab('basic')}
                  >
                    Basic
                  </PixelButton>
                  <PixelButton
                    variant={activeTab === 'advanced' ? 'primary' : 'default'}
                    size="sm"
                    onClick={() => setActiveTab('advanced')}
                  >
                    Advanced
                  </PixelButton>
                  <PixelButton
                    variant={activeTab === 'creative' ? 'primary' : 'default'}
                    size="sm"
                    onClick={() => setActiveTab('creative')}
                  >
                    Creative
                  </PixelButton>
                  <PixelButton
                    variant={activeTab === 'color-blocking' ? 'primary' : 'default'}
                    size="sm"
                    onClick={() => setActiveTab('color-blocking')}
                  >
                    Blocking
                  </PixelButton>
                  <PixelButton
                    variant={activeTab === 'palette' ? 'primary' : 'default'}
                    size="sm"
                    onClick={() => setActiveTab('palette')}
                  >
                    Palette
                  </PixelButton>
                  <PixelButton
                    variant={activeTab === 'presets' ? 'primary' : 'default'}
                    size="sm"
                    onClick={() => setActiveTab('presets')}
                  >
                    Presets
                  </PixelButton>
                </div>
                
                {/* Tab Content */}
                <div className="flex-1 mb-4">
                  {/* Basic Parameters */}
                  {activeTab === 'basic' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <PixelText className="text-sm">Downscale Width (px)</PixelText>
                          <PixelText className="text-sm">{downscaleWidth}</PixelText>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max={originalDimensions ? Math.min(originalDimensions.width, 1024) : 1024}
                          value={downscaleWidth}
                          onChange={(e) => setDownscaleWidth(Number(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                        />
                        {originalDimensions && targetDimensions && (
                          <div className="text-xs text-gray-400 mt-1">
                            <div>Original: {originalDimensions.width} × {originalDimensions.height}</div>
                            <div>Target: {downscaleWidth >= originalDimensions.width ? 
                              'Same as original' : 
                              `${targetDimensions.width} × ${targetDimensions.height}`}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <PixelText className="text-sm">Color Count</PixelText>
                          <PixelText className="text-sm">{colorCount}</PixelText>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="64"
                          value={colorCount}
                          onChange={(e) => setColorCount(Number(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <PixelText className="text-sm">Scale Factor</PixelText>
                          <PixelText className="text-sm">{scaleUp}</PixelText>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={scaleUp}
                          onChange={(e) => setScaleUp(Number(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                        />
                        {originalDimensions && (
                          <div className="text-xs text-gray-400 mt-1">
                            <div>Output: {downscaleWidth >= originalDimensions.width ? 
                              `${originalDimensions.width * scaleUp} × ${originalDimensions.height * scaleUp}` : 
                              `${targetDimensions?.width ? targetDimensions.width * scaleUp : 0} × ${targetDimensions?.height ? targetDimensions.height * scaleUp : 0}`}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Advanced Parameters */}
                  {activeTab === 'advanced' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <PixelText className="text-sm">Brightness</PixelText>
                          <PixelText className="text-sm">{brightness.toFixed(1)}</PixelText>
                        </div>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.1"
                          value={brightness}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <PixelText className="text-sm">Contrast</PixelText>
                          <PixelText className="text-sm">{contrast.toFixed(1)}</PixelText>
                        </div>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.1"
                          value={contrast}
                          onChange={(e) => setContrast(Number(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <PixelText className="text-sm">Saturation</PixelText>
                          <PixelText className="text-sm">{saturation.toFixed(1)}</PixelText>
                        </div>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.1"
                          value={saturation}
                          onChange={(e) => setSaturation(Number(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="dithering"
                          checked={dithering}
                          onChange={(e) => setDithering(e.target.checked)}
                          className="w-4 h-4 bg-gray-700 rounded"
                        />
                        <label htmlFor="dithering">
                          <PixelText className="text-sm">Enable Dithering</PixelText>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Creative Parameters */}
                  {activeTab === 'creative' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <PixelText className="text-sm">Color Tint</PixelText>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={colorTint || '#ffffff'}
                            onChange={(e) => setColorTint(e.target.value)}
                            className="h-8 w-12 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorTint}
                            placeholder="e.g. #ff00ff"
                            onChange={(e) => setColorTint(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded"
                          />
                          {colorTint && (
                            <PixelButton
                              variant="default"
                              size="sm"
                              onClick={() => setColorTint('')}
                            >
                              Clear
                            </PixelButton>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <PixelText className="text-sm">Edge Enhancement</PixelText>
                          <PixelText className="text-sm">{edgeEnhance.toFixed(1)}</PixelText>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={edgeEnhance}
                          onChange={(e) => setEdgeEnhance(Number(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <PixelText className="text-sm">Posterize Levels</PixelText>
                          <PixelText className="text-sm">
                            {posterize > 0 ? posterize : 'Off'}
                          </PixelText>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          step="1"
                          value={posterize}
                          onChange={(e) => setPosterize(Number(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Color Blocking Parameters - NEW TAB */}
                  {activeTab === 'color-blocking' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="colorBlockingEnabled"
                            checked={colorBlockingEnabled}
                            onChange={(e) => setColorBlockingEnabled(e.target.checked)}
                            className="w-4 h-4 bg-gray-700 rounded"
                          />
                          <label htmlFor="colorBlockingEnabled">
                            <PixelText className="text-sm">Enable Color Blocking</PixelText>
                          </label>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          <div>Reduces speckled regions by grouping similar colors</div>
                        </div>
                      </div>
                      
                      {colorBlockingEnabled && (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <PixelText className="text-sm">Similarity Threshold</PixelText>
                              <PixelText className="text-sm">{similarityThreshold}</PixelText>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="100"
                              value={similarityThreshold}
                              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                              className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                              <div>Higher values merge more colors together (less detail)</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <PixelText className="text-sm">Minimum Region Size</PixelText>
                              <PixelText className="text-sm">{minRegionSize} px</PixelText>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="50"
                              value={minRegionSize}
                              onChange={(e) => setMinRegionSize(Number(e.target.value))}
                              className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                              <div>Removes small speckles below this size</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <PixelText className="text-sm">Smoothing Iterations</PixelText>
                              <PixelText className="text-sm">{smoothingIterations}</PixelText>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="5"
                              step="1"
                              value={smoothingIterations}
                              onChange={(e) => setSmoothingIterations(Number(e.target.value))}
                              className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer h-2"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                              <div>Number of passes for smoothing color regions</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Color Palette Tab */}
                  {activeTab === 'palette' && (
                    <div className="space-y-4">
                      <PixelText className="text-sm font-medium">Image Color Palette</PixelText>
                      
                      {colorPalette.length > 0 ? (
                        <>
                          <div className="grid grid-cols-6 gap-1 border border-gray-700 p-2">
                            {colorPalette.map((color, index) => (
                              <div 
                                key={index} 
                                className={`w-full aspect-square cursor-pointer ${selectedColor === color ? 'ring-2 ring-white' : 'ring-1 ring-gray-600'}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                                title={color}
                              />
                            ))}
                          </div>
                          
                          {selectedColor && (
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-8 h-8 border border-gray-600"
                                style={{ backgroundColor: selectedColor }}
                              />
                              <PixelText className="text-sm">{selectedColor}</PixelText>
                              <PixelButton
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedColor);
                                }}
                              >
                                Copy
                              </PixelButton>
                            </div>
                          )}
                          
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Total colors: {colorPalette.length}</span>
                            <span>Target: {colorCount}</span>
                          </div>
                        </>
                      ) : pixelatedImage ? (
                        <div className="text-gray-400 italic">
                          Processing palette...
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">
                          Pixelate an image to view its color palette
                        </div>
                      )}
                      
                      <div className="space-y-2 mt-4">
                        <PixelText className="text-sm font-medium">Custom Palette</PixelText>
                        <div className="text-xs text-gray-400 mb-2">
                          Enter hex colors separated by commas (e.g. #505747,#1e2819,#c2bda7,#8a8e7c,#586656)
                        </div>
                        <textarea
                          value={customPalette}
                          onChange={(e) => setCustomPalette(e.target.value)}
                          placeholder="#RRGGBB,#RRGGBB,..."
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm h-20"
                        />
                        <div className="flex space-x-2">
                          <PixelButton
                            variant="default"
                            size="sm"
                            onClick={() => setCustomPalette('')}
                            disabled={!customPalette}
                          >
                            Clear
                          </PixelButton>
                          <PixelButton
                            variant="primary"
                            size="sm"
                            onClick={() => pixelateImage()}
                            disabled={!originalImage || isProcessing}
                          >
                            Apply Custom Palette
                          </PixelButton>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <PixelText className="text-sm">Palette Actions</PixelText>
                        <div className="grid grid-cols-2 gap-2">
                          <PixelButton
                            variant="default"
                            size="sm"
                            onClick={() => {
                              const paletteText = colorPalette.join(',\n');
                              navigator.clipboard.writeText(paletteText);
                            }}
                            disabled={colorPalette.length === 0}
                          >
                            Copy All Colors
                          </PixelButton>
                          <PixelButton
                            variant="default"
                            size="sm"
                            onClick={() => extractColorPalette(pixelatedImage || '')}
                            disabled={!pixelatedImage}
                          >
                            Refresh Palette
                          </PixelButton>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Presets */}
                  {activeTab === 'presets' && (
                    <div className="space-y-4">
                      {/* Built-in presets */}
                      <div className="space-y-2">
                        <PixelText className="text-sm font-medium">Built-in Presets</PixelText>
                        <div className="grid grid-cols-1 gap-2">
                          <PixelButton
                            variant="primary"
                            size="sm"
                            onClick={() => loadPreset('rogue-equipment')}
                          >
                            Rogue Equipment (Game Aesthetic)
                          </PixelButton>
                          <PixelButton
                            variant="primary"
                            size="sm"
                            onClick={() => loadPreset('clean-pixel-art')}
                          >
                            Clean Pixel Art (No Speckles)
                          </PixelButton>
                        </div>
                      </div>
                      
                      {/* Custom presets */}
                      {Object.keys(customPresets).length > 0 && (
                        <div className="space-y-2 mt-4">
                          <PixelText className="text-sm font-medium">Your Saved Presets</PixelText>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.keys(customPresets).map((presetName) => (
                              <div key={presetName} className="flex items-center space-x-1">
                                <PixelButton
                                  variant="default"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => applyCustomPreset(presetName)}
                                >
                                  {presetName}
                                </PixelButton>
                                <PixelButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => deleteCustomPreset(presetName)}
                                >
                                  ×
                                </PixelButton>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Save current as preset */}
                      <div className="mt-4">
                        {!showSavePresetForm ? (
                          <PixelButton
                            variant="success"
                            size="sm"
                            onClick={() => setShowSavePresetForm(true)}
                            className="w-full"
                          >
                            Save Current Settings as Preset
                          </PixelButton>
                        ) : (
                          <div className="space-y-2">
                            <PixelText className="text-sm">Preset Name</PixelText>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                placeholder="My Custom Preset"
                                className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <PixelButton
                                variant="default"
                                size="sm"
                                onClick={() => setShowSavePresetForm(false)}
                              >
                                Cancel
                              </PixelButton>
                              <PixelButton
                                variant="success"
                                size="sm"
                                onClick={saveCurrentAsPreset}
                                disabled={!newPresetName.trim()}
                              >
                                Save Preset
                              </PixelButton>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <PixelButton
                    onClick={resetSettings}
                    variant="default"
                    size="sm"
                  >
                    Reset Settings
                  </PixelButton>
                  
                  <PixelButton
                    onClick={revertToOriginal}
                    variant="default"
                    size="sm"
                    disabled={!originalPixelatedImage}
                  >
                    Revert to Original
                  </PixelButton>
                </div>
                
                {/* Process Button */}
                <PixelButton
                  onClick={pixelateImage}
                  disabled={isProcessing}
                  variant="success"
                  size="md"
                >
                  {isProcessing ? 'Processing...' : 'Pixelate Image'}
                </PixelButton>
              </>
            )}
          </div>
        </PixelBox>
        
        {/* Right Column - Image Preview */}
        <PixelBox variant="dark" bordered className="p-4 flex-1">
          <div className="flex flex-col h-full">
            {/* Error message */}
            {error && (
              <PixelBox variant="dark" bordered className="p-3 mb-4 bg-red-900/30 text-red-400">
                <PixelText>{error}</PixelText>
              </PixelBox>
            )}
            
            {/* Image preview */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {originalImage ? (
                <div className="h-full">
                  <PixelText className="font-medium mb-2">Original Image</PixelText>
                  <div className="relative w-full h-[calc(100%-28px)] border border-gray-700 rounded overflow-hidden">
                    <Image
                      src={originalImage}
                      alt="Original"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] border border-gray-800 border-dashed rounded">
                  <PixelText className="text-gray-500">
                    Select an image to begin
                  </PixelText>
                </div>
              )}
              
              {pixelatedImage ? (
                <div className="h-full">
                  <PixelText className="font-medium mb-2">Pixelated Image</PixelText>
                  <div className="relative w-full h-[calc(100%-28px)] border border-gray-700 rounded overflow-hidden">
                    <Image
                      src={pixelatedImage}
                      alt="Pixelated"
                      fill
                      style={{ 
                        objectFit: 'contain',
                        imageRendering: 'pixelated' 
                      }}
                      className="pixel-art"
                      unoptimized={true}
                    />
                  </div>
                </div>
              ) : (
                originalImage && (
                  <div className="flex items-center justify-center h-[300px] border border-gray-800 border-dashed rounded">
                    {isProcessing ? (
                      <PixelText className="text-gray-500">
                        Processing image...
                      </PixelText>
                    ) : (
                      <PixelText className="text-gray-500">
                        Adjust parameters and click "Pixelate Image"
                      </PixelText>
                    )}
                  </div>
                )
              )}
            </div>
            
            {/* Download Button */}
            {pixelatedImage && (
              <div className="mt-4">
                <PixelButton
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = pixelatedImage;
                    a.download = 'pixelated_image.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  Download Pixelated Image
                </PixelButton>
              </div>
            )}
          </div>
        </PixelBox>
      </div>
    </div>
  );
}