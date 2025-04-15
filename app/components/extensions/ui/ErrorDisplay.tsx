// app/components/extensions/ui/ErrorDisplay.tsx
'use client';

/**
 * Error Display Component for Extensions
 * 
 * Provides a standardized error display for extension components.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ErrorDisplayProps {
  message: string;
  fallbackText?: string;
  onComplete: () => void;
}

/**
 * Error Display Component
 * 
 * Shows an error message and provides a way to continue
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  fallbackText,
  onComplete
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="error-display bg-black/70 border border-red-900/50 rounded-md p-4"
    >
      <div className="flex items-start">
        <div className="text-red-500 mr-3 text-2xl">⚠</div>
        <div>
          <h3 className="text-red-400 text-lg mb-2">Extension Error</h3>
          
          {/* Technical error (only in development) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="bg-red-900/20 p-2 rounded mb-3 text-sm text-red-300 font-mono">
              {message}
            </div>
          )}
          
          {/* User-friendly fallback text */}
          <p className="text-gray-300 mb-4">
            {fallbackText || "We're having technical difficulties with this visualization. Let's continue with the dialogue instead."}
          </p>
          
          {/* Continue button */}
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-blue-700 rounded text-white"
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorDisplay;