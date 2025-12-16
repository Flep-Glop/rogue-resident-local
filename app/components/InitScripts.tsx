'use client';

import React, { useEffect } from 'react';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';
import { initializeResourceStore } from '@/app/store/resourceStore';

export default function InitScripts() {
  useEffect(() => {
    // Apply loading class and styles on client side only
    document.documentElement.classList.add('loading');
    
    // Initialize our resource store with default values
    initializeResourceStore({
      insight: 30,      // Start with some insight
      momentum: 0,      // Start with no momentum
      starPoints: 0     // Start with no star points
    });
    
    console.log('[InitScripts] Resource store initialized');
    
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
  
  return <ServiceWorkerRegistration />;
} 