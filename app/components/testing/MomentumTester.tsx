'use client';

import { useState } from 'react';
import { useResourceStore } from '../../store/resourceStore';
import { 
  ResourceOutcomeService, 
  ResourceTier 
} from '../../core/resources/ResourceTierSystem';

/**
 * MomentumTester - A simple component to test and visualize momentum mechanics
 * Add this to any page for testing, remove for production
 */
export default function MomentumTester() {
  const [resultLog, setResultLog] = useState<string[]>([]);
  const { 
    momentum, 
    incrementMomentum, 
    resetMomentum,
    updateInsight 
  } = useResourceStore();
  
  // Apply a specific resource tier
  const applyTier = (tier: ResourceTier) => {
    const store = useResourceStore.getState();
    ResourceOutcomeService.applyTierOutcome(tier, store, 'system');
    
    // Log the result
    setResultLog(prev => [
      `Applied ${tier} tier. New momentum: ${store.momentum}`,
      ...prev
    ]);
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg text-white max-w-xs">
      <h3 className="font-bold mb-2">Resource System Tester</h3>
      <div className="mb-3">
        <div>Current Momentum: {momentum}</div>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <button 
          onClick={() => {
            incrementMomentum();
            setResultLog(prev => [`Momentum incremented to ${momentum + 1}`, ...prev]);
          }}
          className="px-2 py-1 bg-blue-500 rounded text-sm"
        >
          Increment Momentum
        </button>
        
        <button
          onClick={() => {
            resetMomentum();
            setResultLog(prev => ['Momentum reset to 0', ...prev]);
          }} 
          className="px-2 py-1 bg-red-500 rounded text-sm"
        >
          Reset Momentum
        </button>
        
        <button
          onClick={() => updateInsight(10, 'test')}
          className="px-2 py-1 bg-green-500 rounded text-sm"
        >
          +10 Insight
        </button>
      </div>
      
      <div className="mb-3">
        <div className="text-sm font-bold mb-1">Apply Resource Tier:</div>
        <div className="grid grid-cols-2 gap-2">
          {(['MINOR', 'STANDARD', 'MAJOR', 'CRITICAL', 'FAILURE'] as ResourceTier[]).map(tier => (
            <button
              key={tier}
              onClick={() => applyTier(tier)}
              className={`px-2 py-1 rounded text-xs 
                ${tier === 'FAILURE' ? 'bg-red-600' : 
                  tier === 'MINOR' ? 'bg-blue-400' :
                  tier === 'STANDARD' ? 'bg-green-500' :
                  tier === 'MAJOR' ? 'bg-purple-500' :
                  'bg-yellow-500'}`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-3">
        <div className="text-xs font-bold">Results Log:</div>
        <div className="mt-1 h-24 overflow-y-auto text-xs border border-gray-600 rounded p-1">
          {resultLog.length === 0 ? (
            <div className="text-gray-400">No actions taken yet</div>
          ) : (
            resultLog.map((entry, i) => (
              <div key={i} className="py-0.5">{entry}</div>
            ))
          )}
        </div>
      </div>
      
      <button 
        onClick={() => setResultLog([])}
        className="mt-2 px-2 py-1 bg-gray-600 rounded text-xs"
      >
        Clear Log
      </button>
    </div>
  );
} 