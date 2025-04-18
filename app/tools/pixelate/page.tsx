import PixelateImage from '@/components/PixelateImage';
import PixelThemeProvider, { PixelText, PixelBox } from '@/app/components/PixelThemeProvider';

export const metadata = {
  title: 'Image Pixelator',
  description: 'Transform your images into pixel art with customizable settings'
};

export default function PixelatePage() {
  return (
    <PixelThemeProvider>
      <div className="container mx-auto py-8 px-4 min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <PixelText className="text-2xl font-bold mb-6">Image Pixelator Tool</PixelText>
        <PixelText className="mb-4">
          Upload an image and convert it to pixel art with customizable settings.
          Perfect for creating retro-style graphics for your projects.
        </PixelText>
        
        <PixelBox variant="dark" bordered className="p-6">
          <PixelateImage />
        </PixelBox>
      </div>
    </PixelThemeProvider>
  );
} 