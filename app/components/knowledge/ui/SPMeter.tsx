import React from 'react';
import { useKnowledgeStore, selectors } from '../../../store/knowledgeStore';
import { usePrimitiveStoreValue } from '../../../core/utils/storeHooks';

interface SPMeterProps {
  compact?: boolean;
}

/**
 * Displays the current Star Points (SP) available to the player
 * Used for unlocking new concepts in the constellation
 */
export default function SPMeter({ compact = false }: SPMeterProps) {
  // Use primitive store value for efficient rendering
  const starPoints = usePrimitiveStoreValue(
    useKnowledgeStore,
    selectors.getStarPoints,
    0
  );

  if (compact) {
    // Compact version for small spaces
    return (
      <div className="bg-black/70 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-sm sp-meter">
        <span className="text-yellow-400">✦</span>
        <span>{starPoints}</span>
      </div>
    );
  }

  return (
    <div className="bg-black/70 border border-yellow-500/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 sp-meter">
      <div className="text-xl text-yellow-400">✦</div>
      <div>
        <div className="font-bold">{starPoints}</div>
        <div className="text-xs text-gray-300">Star Points</div>
      </div>
    </div>
  );
} 