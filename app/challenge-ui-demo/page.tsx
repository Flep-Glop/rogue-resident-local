'use client';

import React from 'react';
import ChallengeUIExample from '../components/examples/ChallengeUIExample';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  * {
    box-sizing: border-box;
  }
  
  html, body {
    margin: 0;
    padding: 0;
    background-color: #0f172a; /* Dark blue-slate background */
    font-family: 'VT323', monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #cbd5e1; /* Softer base text color (slate-300) */
  }

  /* Ensure headings and other text elements inherit the font and base color */
  h1, h2, h3, h4, h5, h6, p, span, div, button, input, textarea, select {
    font-family: inherit;
    color: inherit; /* Inherit the new base color */
  }
`;

export default function ChallengeUIDemo() {
  return (
    <>
      <GlobalStyle />
      <ChallengeUIExample />
    </>
  );
} 