import React, { useEffect, useState } from 'react';
import { useEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';

interface ConnectionMasteryFeedbackProps {
  // Optional props for customization
  duration?: number;
}

/**
 * Component to provide visual feedback when a connection's mastery level increases.
 * This is especially important for indicating when a connection crosses a mastery threshold.
 */
export default function ConnectionMasteryFeedback({ duration = 3000 }: ConnectionMasteryFeedbackProps) {
  const [feedbacks, setFeedbacks] = useState<Array<{
    id: string;
    sourceId: string;
    targetId: string;
    sourceName: string;
    targetName: string;
    oldMastery: number;
    newMastery: number;
    amount: number;
    timestamp: number;
    threshold: boolean;
  }>>([]);

  useEffect(() => {
    // Subscribe to connection mastery increased events
    const unsubscribe = useEventBus.getState().subscribe(
      GameEventType.CONNECTION_MASTERY_INCREASED,
      (event) => {
        const { sourceId, targetId, sourceName, targetName, oldMastery, newMastery, amount, threshold } = event.payload;
        
        // Generate a unique ID for this feedback
        const id = `${sourceId}-${targetId}-${Date.now()}`;
        
        // Add the new feedback
        setFeedbacks(prev => [
          ...prev,
          {
            id,
            sourceId,
            targetId,
            sourceName,
            targetName,
            oldMastery,
            newMastery,
            amount,
            timestamp: Date.now(),
            threshold
          }
        ]);
        
        // Remove feedback after duration
        setTimeout(() => {
          setFeedbacks(prev => prev.filter(f => f.id !== id));
        }, duration);
      }
    );
    
    return () => unsubscribe();
  }, [duration]);

  // Get the tier text based on mastery
  const getMasteryTierText = (mastery: number): string => {
    if (mastery < 30) return 'Low';
    if (mastery < 70) return 'Medium';
    return 'High';
  };

  // Get color class based on mastery
  const getMasteryTierColor = (mastery: number): string => {
    if (mastery < 30) return 'bg-gray-300 text-gray-800';
    if (mastery < 70) return 'bg-blue-400 text-blue-900';
    return 'bg-green-400 text-green-900';
  };

  if (feedbacks.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {feedbacks.map(feedback => (
        <div 
          key={feedback.id}
          className={`
            rounded-lg shadow-lg p-3 max-w-md bg-gray-800 border
            ${feedback.threshold ? 'animate-pulse border-yellow-400' : 'border-gray-700'}
            transform transition-all duration-300 ease-in-out animate-slide-left
          `}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Connection Mastery ▲</h3>
            <span className="text-green-400 font-bold">+{feedback.amount}%</span>
          </div>
          
          <div className="mt-1 flex items-center text-sm text-white">
            <span>{feedback.sourceName}</span>
            <span className="mx-1">→</span>
            <span>{feedback.targetName}</span>
          </div>
          
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
              {/* Animate mastery increase */}
              <div 
                className={`h-2 rounded-full transition-all duration-700 ease-out ${getMasteryTierColor(feedback.newMastery)}`}
                style={{ width: `${Math.round(feedback.newMastery)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs">
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">From</span>
                <span className={`px-1 rounded ${getMasteryTierColor(feedback.oldMastery)}`}>
                  {getMasteryTierText(feedback.oldMastery)}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">To</span>
                <span className={`px-1 rounded ${getMasteryTierColor(feedback.newMastery)}`}>
                  {getMasteryTierText(feedback.newMastery)}
                </span>
              </div>
            </div>
          </div>
          
          {feedback.threshold && (
            <div className="mt-2 text-xs text-yellow-400 animate-pulse">
              Mastery tier threshold crossed!
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Add some CSS animations to the global styles
const animations = `
@keyframes slide-left {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  10% {
    opacity: 1;
    transform: translateX(0);
  }
  90% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-20px);
  }
}

.animate-slide-left {
  animation: slide-left 3s ease-in-out;
}
`;

// You can add this to global.css or use a style tag in a layout component 