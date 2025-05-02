'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => Promise<void>;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export default function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending timers when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const startLoading = useCallback(async () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Set loading state to true
    setIsLoading(true);
    console.log('Loading started');
    
    // Return a promise that resolves after the minimum loading time
    return new Promise<void>(resolve => {
      timerRef.current = setTimeout(() => {
        console.log('Minimum loading time reached');
        resolve();
      }, 1500);
    });
  }, []);

  const stopLoading = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsLoading(false);
    console.log('Loading stopped');
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
} 