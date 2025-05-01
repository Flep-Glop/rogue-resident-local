'use client';

import React, { useEffect } from 'react';

export default function InitScripts() {
  useEffect(() => {
    // Apply loading class and styles on client side only
    document.documentElement.classList.add('loading');
    
    // Remove loading class after everything has loaded
    const removeLoadingClass = () => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('loading');
      });
    };
    
    if (document.readyState === 'complete') {
      removeLoadingClass();
    } else {
      window.addEventListener('load', removeLoadingClass);
      return () => window.removeEventListener('load', removeLoadingClass);
    }
  }, []);
  
  return null;
} 