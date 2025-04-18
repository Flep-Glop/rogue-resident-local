'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PixelText } from '../PixelThemeProvider';

interface MomentumPopupProps {
  position: { x: number; y: number };
  amount: number;
}

/**
 * MomentumPopup - A small popup notification that appears near the click position
 * to show momentum gain with a pixel art style.
 */
export default function MomentumPopup({ position, amount }: MomentumPopupProps) {
  // Offset slightly to not overlap exactly with the clicked element
  const displayX = position.x + 10;
  const displayY = position.y - 30;
  
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{
        left: displayX,
        top: displayY,
        transform: 'translate(-50%, -50%)'
      }}
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="pixel-borders bg-surface-dark p-2 px-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-orange-400 text-xl">🔥</span>
          <PixelText className="text-orange-300 font-bold">
            +{amount} Momentum
          </PixelText>
        </div>
        <motion.div
          className="h-1 bg-orange-500 mt-1"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
} 