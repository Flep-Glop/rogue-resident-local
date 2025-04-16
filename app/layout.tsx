import './globals.css';
import type { Metadata, Viewport } from 'next';
import PixelThemeProvider from './components/PixelThemeProvider';
import FontPreLoader from './components/FontPreLoader';
import { Inter } from 'next/font/google';

// Optional: Using the Next.js built-in font system
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Fixed: Move viewport-related settings to the viewport export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
  colorScheme: 'dark'
};

export const metadata: Metadata = {
  title: 'Rogue Resident: Vertical Slice',
  description: 'Medical physics education through roguelike gameplay',
  keywords: ['medical physics', 'education', 'game', 'roguelike'],
  authors: [{ name: 'Rogue Resident Team' }],
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} bg-black`}>
      <head>
        {/* Using non-blocking font loading with correct crossOrigin attributes */}
        <link
          rel="preconnect" 
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect" 
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        
        {/* Global styles to prevent white flash during transitions */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            background-color: #000 !important;
          }
          
          html.black-transition-active body,
          html.black-transition-active main {
            background-color: #000 !important;
            pointer-events: auto !important;
          }
          
          .transitioning-to-black {
            background-color: #000 !important;
          }
          
          /* Prevent any white flash during page transitions, but don't make everything immediately black */
          @keyframes fadeInFromBlack {
            from { background-color: #000; }
            to { background-color: #000; }
          }
          
          html {
            animation: fadeInFromBlack 0.1s;
          }
          
          /* More gradual fade for transitions */
          #map-fade-overlay {
            transition: opacity 1.5s ease-in-out !important;
          }
        `}} />
      </head>
      <body className="bg-black text-white antialiased">
        <PixelThemeProvider>
          {/* FontPreLoader is a client component that doesn't render anything visible */}
          <FontPreLoader />
          
          {/* Main content */}
          <main className="bg-black">
            {children}
          </main>
          
          {/* Debug components removed - using UnifiedDebugPanel instead */}
        </PixelThemeProvider>
      </body>
    </html>
  );
}