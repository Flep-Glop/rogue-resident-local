import type { Metadata, Viewport } from "next";
import "./globals.css";
import PixelThemeProvider from "./providers/ThemeProvider";
import LoadingProvider from "./providers/LoadingProvider";
import { VT323, Press_Start_2P } from 'next/font/google';
import { Roboto_Mono } from 'next/font/google';
import InitScripts from './components/InitScripts';
import LoadingTransition from "./components/ui/LoadingTransition";
import { MathJaxContext } from 'better-react-mathjax';

// Define fonts
const vt323 = VT323({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-vt323',
});

const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-press-start-2p',
});

const robotoMono = Roboto_Mono({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

// MathJax configuration
const mathJaxConfig = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]]
  }
};

export const metadata: Metadata = {
  title: "Rogue Resident - Medical Physics Educational Game",
  description: "An educational roguelike game that transforms medical physics education into a narrative-driven experience.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${vt323.variable} ${pressStart2P.variable} ${robotoMono.variable}`}>
      <head>
        <InitScripts />
      </head>
      <body>
        <MathJaxContext config={mathJaxConfig}>
          <LoadingProvider>
            <PixelThemeProvider>
              {children}
              <LoadingTransition />
            </PixelThemeProvider>
          </LoadingProvider>
        </MathJaxContext>
      </body>
    </html>
  );
}
