'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEventSubscription, safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType, FeedbackMessagePayload, ResourceChangedPayload, MomentumEffectPayload } from '@/app/core/events/EventTypes';
import InsightParticles from '@/app/components/effects/InsightParticles';
import MomentumParticles from '@/app/components/effects/MomentumParticles';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';

export interface FeedbackSystemProps {
  targetInsightRef?: React.RefObject<HTMLElement>;
  targetMomentumRef?: React.RefObject<HTMLElement>;
}

/**
 * Centralized Feedback System
 * 
 * This component listens for resource and feedback events and displays
 * appropriate visual feedback to the player.
 * 
 * Updated to fix infinite loops and properly handle position references.
 */
export default function FeedbackSystem({
  targetInsightRef,
  targetMomentumRef
}: FeedbackSystemProps) {
  // Track message queue to handle multiple messages
  const [messageQueue, setMessageQueue] = useState<Array<{
    id: string;
    message: string;
    type: string;
    timestamp: number;
    html?: boolean;
    duration?: number;
  }>>([]);
  
  // Track active message - the one currently being displayed
  const [activeMessage, setActiveMessage] = useState<{
    id: string;
    message: string;
    type: string;
    timestamp: number;
    html?: boolean;
    duration?: number;
  } | null>(null);
  
  // Timer ref to track and clean up message display timeouts
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track resource effects
  const [insightEffect, setInsightEffect] = useState<{
    active: boolean;
    amount: number;
    source: string;
  }>({ active: false, amount: 0, source: '' });
  
  const [momentumEffect, setMomentumEffect] = useState<{
    active: boolean;
    effect: 'increment' | 'reset' | 'maintain';
    source: string;
  }>({ active: false, effect: 'maintain', source: '' });
  
  // Track positions for effects
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showInsightParticles, setShowInsightParticles] = useState(false);
  const [showMomentumParticles, setShowMomentumParticles] = useState(false);
  
  // Refs for element positions with proper initialization
  const insightPositionRef = useRef<{ x: number; y: number }>({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? 150 : 0 
  });
  
  const momentumPositionRef = useRef<{ x: number; y: number }>({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? 100 : 0 
  });
  
  // Default fallback position - memoized to prevent re-creation
  const defaultPosition = useMemo(() => ({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 
  }), []);

  // Flags to track if we've found UI elements, to prevent unnecessary DOM queries
  const foundInsightMeterRef = useRef(false);
  const foundMomentumCounterRef = useRef(false);
  
  // Initialize element positions - with safeguards to prevent infinite updates
  useEffect(() => {
    const updatePositions = () => {
      let insightUpdated = false;
      let momentumUpdated = false;
      
      // Find insight meter position
      if (targetInsightRef?.current) {
        const rect = targetInsightRef.current.getBoundingClientRect();
        insightPositionRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        foundInsightMeterRef.current = true;
        insightUpdated = true;
      } else if (!foundInsightMeterRef.current) {
        // Try to find by class/data-testid
        const insightMeter = document.querySelector('.insight-meter') || 
                            document.querySelector('[data-testid="insight-meter"]');
        if (insightMeter) {
          const rect = insightMeter.getBoundingClientRect();
          insightPositionRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
          foundInsightMeterRef.current = true;
          insightUpdated = true;
        }
      }
      
      // Find momentum counter position
      if (targetMomentumRef?.current) {
        const rect = targetMomentumRef.current.getBoundingClientRect();
        momentumPositionRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        foundMomentumCounterRef.current = true;
        momentumUpdated = true;
      } else if (!foundMomentumCounterRef.current) {
        // Try to find by class/data-testid
        const momentumCounter = document.querySelector('.momentum-counter') ||
                              document.querySelector('[data-testid="momentum-counter"]');
        if (momentumCounter) {
          const rect = momentumCounter.getBoundingClientRect();
          momentumPositionRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
          foundMomentumCounterRef.current = true;
          momentumUpdated = true;
        }
      }
      
      // Only log if something actually changed
      if (insightUpdated) {
        console.log("[FeedbackSystem] Insight position updated:", insightPositionRef.current);
      }
      
      if (momentumUpdated) {
        console.log("[FeedbackSystem] Momentum position updated:", momentumPositionRef.current);
      }
    };
    
    // Initial update
    updatePositions();
    
    // Update on resize
    window.addEventListener('resize', updatePositions);
    
    // Set periodic updates at a reasonable interval
    const intervalId = setInterval(updatePositions, 5000);
    
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearInterval(intervalId);
    };
  }, [targetInsightRef, targetMomentumRef]);
  
  // Handle processing the message queue
  useEffect(() => {
    // If we have an active message, don't process the queue
    if (activeMessage) return;
    
    // If we have messages in the queue, show the next one
    if (messageQueue.length > 0) {
      // Get the first message and remove it from queue
      const nextMessage = messageQueue[0];
      
      // Update the state
      setActiveMessage(nextMessage);
      setMessageQueue(prev => prev.slice(1)); // Remove first message
      
      // Set up the timer to clear this message after its duration
      const duration = nextMessage.duration || 
        (nextMessage.type.includes('domain') ? 6000 : 5000);
      
      // Clear any existing timer
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      
      // Set a new timer
      messageTimerRef.current = setTimeout(() => {
        setActiveMessage(null);
        messageTimerRef.current = null;
      }, duration);
    }
  }, [activeMessage, messageQueue]);

  // Add a message to the queue
  const addMessage = useCallback((newMessage: {
    id: string;
    message: string;
    type: string;
    timestamp: number;
    html?: boolean;
    duration?: number;
  }) => {
    setMessageQueue(prev => [...prev, newMessage]);
  }, []);

  // Handle feedback messages
  useEventSubscription<FeedbackMessagePayload>(
    GameEventType.FEEDBACK_MESSAGE,
    (event) => {
      if (!event.payload || !event.payload.message) return;
      
      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: event.payload.message,
        type: event.payload.type || 'resource',
        timestamp: Date.now()
      };
      
      addMessage(newMessage);
      
      // Clean up message after duration
      const duration = event.payload.duration || 3000;
      setTimeout(() => {
        setMessageQueue(prev => prev.filter(m => m.id !== newMessage.id));
      }, duration);
    },
    []
  );
  
  // Handle insight gained events
  useEventSubscription<ResourceChangedPayload>(
    GameEventType.INSIGHT_GAINED,
    (event) => {
      if (!event.payload || event.payload.change <= 0) return;
      
      // Activate insight effect
      setInsightEffect({
        active: true,
        amount: event.payload.change,
        source: event.payload.source || 'unknown'
      });
      
      // Show particles with a slight delay
      setTimeout(() => {
        setShowInsightParticles(true);
      }, 200);
      
      // Reset effect state after animation
      setTimeout(() => {
        setInsightEffect({
          active: false,
          amount: 0,
          source: ''
        });
        setShowInsightParticles(false);
      }, 3000);
    },
    []
  );
  
  // Handle momentum effects
  useEventSubscription<MomentumEffectPayload>(
    GameEventType.MOMENTUM_EFFECT,
    (event) => {
      if (!event.payload) return;
      
      // Activate momentum effect
      setMomentumEffect({
        active: true,
        effect: event.payload.effect,
        source: event.payload.source || 'unknown'
      });
      
      // Show particles for momentum increases
      if (event.payload.effect === 'increment') {
        setTimeout(() => {
          setShowMomentumParticles(true);
        }, 200);
      }
      
      // Reset effect state after animation
      setTimeout(() => {
        setMomentumEffect({
          active: false,
          effect: 'maintain',
          source: ''
        });
        setShowMomentumParticles(false);
      }, 3000);
    },
    []
  );
  
  // Track UI interactions for position
  useEventSubscription(
    GameEventType.UI_OPTION_SELECTED,
    (event) => {
      if (event.payload?.position) {
        setClickPosition(event.payload.position);
      }
    },
    []
  );
  
  // Update the concept discovery event subscription to show the concept name
  useEventSubscription(
    GameEventType.KNOWLEDGE_GAINED,
    (event) => {
      if (!event.payload || !event.payload.conceptId) return;
      
      const conceptId = event.payload.conceptId;
      
      // Get the knowledge store to look up the concept name
      const knowledgeStore = useKnowledgeStore.getState();
      const concept = knowledgeStore.nodes.find(node => node.id === conceptId);
      const conceptName = concept?.name || conceptId;
      
      // Show a notification for concept discovery
      const newMessage = {
        id: `concept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: `🔮 Concept Discovered: ${conceptName}`,
        type: 'knowledge',
        timestamp: Date.now()
      };
      
      addMessage(newMessage);
      
      // Log to console
      console.log(`[Feedback] Concept Discovery Notification: ${conceptName} (${conceptId})`);
      
      // Clean up message after longer duration (5 seconds)
      setTimeout(() => {
        setMessageQueue(prev => prev.filter(m => m.id !== newMessage.id));
      }, 5000);
    },
    []
  );
  
  // Update the concept discovery event subscription to show the concept name
  useEventSubscription(
    GameEventType.KNOWLEDGE_DISCOVERED,
    (event) => {
      try {
        console.log('🔍 [FeedbackSystem] Received KNOWLEDGE_DISCOVERED event:', event);
        
        if (!event.payload || !event.payload.conceptId) {
          console.warn('⚠️ [FeedbackSystem] Missing conceptId in KNOWLEDGE_DISCOVERED payload');
          return;
        }
        
        const conceptId = event.payload.conceptId;
        console.log(`🔍 [FeedbackSystem] Processing concept discovery: ${conceptId}`);
        
        // Get the knowledge store to look up the concept name
        const knowledgeStore = useKnowledgeStore.getState();
        const concept = knowledgeStore.nodes.find(node => node.id === conceptId);
        console.log('🔍 [FeedbackSystem] Found concept:', concept);
        
        const conceptName = concept?.name || conceptId;
        const domainName = concept?.domain || 'unknown';
        
        // Get domain color based on the concept's domain
        let domainColor = "indigo";
        switch (concept?.domain) {
          case "dosimetry":
            domainColor = "pink-500";
            break;
          case "treatment-planning":
            domainColor = "teal-400";
            break;
          case "radiation-therapy":
            domainColor = "purple-500";
            break;
          case "linac-anatomy":
            domainColor = "amber-400";
            break;
        }
        
        // For regular concepts, show a styled notification
        // Only skip if this is actually a domain concept
        if (conceptId !== 'dosimetry' && conceptId !== 'treatment-planning' && 
            conceptId !== 'radiation-therapy' && conceptId !== 'linac-anatomy') {
          
          const newMessage = {
            id: `concept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message: `
              <div class="flex items-center gap-3 max-w-sm">
                <div class="relative">
                  <img src="/star.png" 
                      class="w-8 h-8 pixelated" alt="Concept star" />
                </div>
                <div>
                  <div class="font-pixel text-purple-400 text-sm">New Concept Discovered</div>
                  <div class="font-pixel text-white text-base tracking-wide">${conceptName}</div>
                </div>
              </div>
            `,
            type: 'concept-knowledge-compact',
            timestamp: Date.now(),
            html: true,
            duration: 5000
          };
          
          console.log('🔍 [FeedbackSystem] Adding message to queue:', newMessage);
          addMessage(newMessage);
        }
        
        // For domain stars, show a more prominent notification
        if (conceptId === 'dosimetry' || conceptId === 'treatment-planning' || 
            conceptId === 'radiation-therapy' || conceptId === 'linac-anatomy') {
          
          console.log(`🔍 [FeedbackSystem] Domain star detected: ${conceptId}`);
          
          // Get domain color based on conceptId
          let domainColor = "indigo";
          switch (conceptId) {
            case "dosimetry":
              domainColor = "pink-500";
              break;
            case "treatment-planning":
              domainColor = "teal-400";
              break;
            case "radiation-therapy":
              domainColor = "purple-500";
              break;
            case "linac-anatomy":
              domainColor = "amber-400";
              break;
          }
          
          // Create a compact, stylish notification
          const domainMessage = {
            id: `domain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message: `
              <div class="flex items-center gap-3 max-w-sm">
                <div class="relative">
                  <img src="/${conceptId === 'dosimetry' ? 'pink' : 
                             conceptId === 'treatment-planning' ? 'teal' : 
                             conceptId === 'radiation-therapy' ? 'purple' : 'red'}-star.png" 
                   class="w-10 h-10 pixelated animate-pulse" alt="${conceptName} star" />
                  <div class="absolute inset-0 animate-ping-slow opacity-50">
                    <img src="/${conceptId === 'dosimetry' ? 'pink' : 
                               conceptId === 'treatment-planning' ? 'teal' : 
                               conceptId === 'radiation-therapy' ? 'purple' : 'red'}-star.png" 
                     class="w-10 h-10 pixelated" alt="" />
                  </div>
                </div>
                <div>
                  <div class="font-pixel text-${domainColor} text-base flex items-center gap-1">
                    <span class="inline-block animate-pulse-slow">✨</span> 
                    <span>Domain Discovered!</span> 
                    <span class="inline-block animate-pulse-slow ml-1">✨</span>
                  </div>
                  <div class="font-pixel text-white text-sm tracking-wide">${conceptName}</div>
                </div>
              </div>
            `,
            type: 'domain-knowledge-compact',
            timestamp: Date.now(),
            html: true,
            duration: 6000
          };
          
          addMessage(domainMessage);
        }
      } catch (error) {
        console.error('❌ [FeedbackSystem] Error processing KNOWLEDGE_DISCOVERED event:', error);
      }
    },
    []
  );
  
  // Memoize insight and momentum particle components to avoid unnecessary re-renders
  const insightParticlesComponent = useMemo(() => {
    if (!showInsightParticles) return null;
    
    return (
      <InsightParticles
        originPosition={clickPosition || defaultPosition}
        targetPosition={insightPositionRef.current}
        amount={insightEffect.amount}
      />
    );
  }, [showInsightParticles, clickPosition, defaultPosition, insightEffect.amount]);
  
  const momentumParticlesComponent = useMemo(() => {
    if (!showMomentumParticles) return null;
    
    return (
      <MomentumParticles
        originPosition={clickPosition || defaultPosition}
        targetPosition={momentumPositionRef.current}
        effect={momentumEffect.effect}
      />
    );
  }, [showMomentumParticles, clickPosition, defaultPosition, momentumEffect.effect]);
  
  // Add a mounting log
  useEffect(() => {
    console.log('🔍 [FeedbackSystem] Component mounted');
    return () => {
      console.log('🔍 [FeedbackSystem] Component unmounted');
    };
  }, []);
  
  // Clean up any running timers when component unmounts
  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);
  
  return (
    <>
      {/* Message feedback display */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence mode="wait">
          {activeMessage && (
            <motion.div
              key={activeMessage.id}
              className={`mb-4 px-4 py-2 rounded-lg shadow-lg font-pixel text-white text-center
                ${activeMessage.type === 'resource' ? 'bg-blue-600/90' : 
                 activeMessage.type === 'error' ? 'bg-red-600/90' : 
                 activeMessage.type === 'success' ? 'bg-green-600/90' : 
                 activeMessage.type === 'knowledge' ? 'bg-purple-600/90' : 
                 activeMessage.type === 'domain-knowledge' ? 'bg-indigo-800/95 text-lg py-3 px-6 border border-indigo-300' :
                 activeMessage.type === 'domain-knowledge-compact' || activeMessage.type === 'concept-knowledge-compact' ? 'bg-black/95 border border-gray-700 backdrop-blur-sm p-2 shadow-[0_0_15px_rgba(255,255,255,0.15)]' :
                 'bg-gray-800/90'}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.5,
                ease: "easeOut" 
              }}
            >
              {activeMessage.html ? (
                <div dangerouslySetInnerHTML={{ __html: activeMessage.message }} />
              ) : (
                activeMessage.message
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Debug display for message queue - only in development */}
      {process.env.NODE_ENV === 'development' && process.env.SHOW_DEBUG_INDICATORS === 'true' && (
        <div className="fixed top-24 right-0 p-2 bg-black/50 text-white text-xs z-50 max-w-xs overflow-auto max-h-48">
          <div className="font-bold mb-1">Message Queue ({messageQueue.length})</div>
          <div>Active: {activeMessage?.type || 'none'}</div>
          {messageQueue.map((msg, i) => (
            <div key={i} className="text-xs mb-1 truncate">
              {i+1}: {msg.type}
            </div>
          ))}
        </div>
      )}
      
      {/* Resource effect animations */}
      {insightParticlesComponent}
      {momentumParticlesComponent}
    </>
  );
}

/**
 * Hook to get a ref to the FeedbackSystem
 */
export function useFeedbackSystem() {
  const ref = useRef(null);
  return ref;
} 