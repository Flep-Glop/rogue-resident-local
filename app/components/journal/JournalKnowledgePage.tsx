'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { PixelText } from '@/app/components/PixelThemeProvider';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { useStableCallback } from '@/app/core/utils/storeHooks';

export interface JournalPageProps {
  onElementClick?: (e: React.MouseEvent) => void;
}

// Define domain interface
interface KnowledgeDomain {
  id: string;
  name: string;
  color: string;
  unlocked: boolean;
  concepts: KnowledgeConcept[];
}

// Define concept interface
interface KnowledgeConcept {
  id: string;
  name: string;
  description: string;
  mastery: number;
  unlocked: boolean;
}

/**
 * Journal Knowledge Page Component
 * 
 * Displays the player's acquired knowledge organized by domains.
 * Implements Chamber Pattern with optimized DOM manipulation
 * and stable callbacks.
 */
export default function JournalKnowledgePage({ onElementClick }: JournalPageProps) {
  // DOM refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isAnimatingRef = useRef(false);
  
  // In a full implementation, this would come from the knowledge store
  // For the prototype, we'll use some hardcoded domains and concepts
  const domains: KnowledgeDomain[] = [
    {
      id: 'radiation-physics',
      name: 'Radiation Physics',
      color: 'var(--clinical-color)',
      unlocked: true,
      concepts: [
        {
          id: 'electron-equilibrium',
          name: 'Electron Equilibrium',
          description: 'The condition where the number of electrons entering a volume equals the number leaving it.',
          mastery: 45,
          unlocked: true
        },
        {
          id: 'radiation-measurement',
          name: 'Radiation Measurement',
          description: 'Techniques for quantifying radiation exposure, dose, and other parameters.',
          mastery: 30,
          unlocked: true
        },
        {
          id: 'ptp-correction',
          name: 'PTP Correction',
          description: 'Temperature and pressure correction factors for ionization chamber measurements.',
          mastery: 50,
          unlocked: true
        },
        {
          id: 'dose-response',
          name: 'Dose-Response Relationship',
          description: 'The relationship between radiation dose and biological effect.',
          mastery: 15,
          unlocked: true
        }
      ]
    },
    {
      id: 'quality-assurance',
      name: 'Quality Assurance',
      color: 'var(--qa-color)',
      unlocked: true,
      concepts: [
        {
          id: 'output-calibration',
          name: 'Output Calibration',
          description: 'Procedures for ensuring accurate dose delivery from radiation therapy machines.',
          mastery: 60,
          unlocked: true
        },
        {
          id: 'tolerance-limits',
          name: 'Tolerance Limits',
          description: 'Acceptable deviation ranges for various QA parameters.',
          mastery: 40,
          unlocked: true
        }
      ]
    },
    {
      id: 'clinical-applications',
      name: 'Clinical Applications',
      color: 'var(--clinical-alt-color, var(--clinical-color))',
      unlocked: false,
      concepts: []
    },
    {
      id: 'experimental-methods',
      name: 'Experimental Methods',
      color: 'var(--educational-color)',
      unlocked: false,
      concepts: []
    }
  ];
  
  // Track expanded domains for accordion behavior
  const [expandedDomains, setExpandedDomains] = useState<string[]>(['radiation-physics']);
  
  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      Object.values(animationTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);
  
  // Toggle domain expansion with event dispatch
  const handleToggleDomain = useStableCallback((domainId: string) => {
    // Prevent rapid toggling
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalKnowledge',
        action: 'toggleDomain',
        metadata: { domainId }
      },
      'journalKnowledgePage'
    );
    
    // Toggle domain in state
    setExpandedDomains(prev => 
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
    
    // DOM-based animation
    if (containerRef.current) {
      const domainElement = containerRef.current.querySelector(`[data-domain-id="${domainId}"]`);
      
      if (domainElement instanceof HTMLElement) {
        domainElement.classList.add('domain-animating');
        
        // Remove animation class after transition
        animationTimersRef.current.domainAnimation = setTimeout(() => {
          if (domainElement) {
            domainElement.classList.remove('domain-animating');
            isAnimatingRef.current = false;
          }
        }, 300);
      } else {
        isAnimatingRef.current = false;
      }
    } else {
      isAnimatingRef.current = false;
    }
  });
  
  // Handle concept click with event dispatch
  const handleConceptClick = useStableCallback((conceptId: string, domainId: string) => {
    safeDispatch(
      GameEventType.UI_NODE_CLICKED,
      {
        nodeId: conceptId,
        metadata: { 
          domainId,
          source: 'journal'
        }
      },
      'journalKnowledgePage'
    );
    
    // Apply animation to concept
    if (containerRef.current) {
      const conceptElement = containerRef.current.querySelector(`[data-concept-id="${conceptId}"]`);
      
      if (conceptElement instanceof HTMLElement) {
        conceptElement.classList.add('concept-highlight');
        
        // Remove highlight after animation
        animationTimersRef.current.conceptHighlight = setTimeout(() => {
          if (conceptElement) {
            conceptElement.classList.remove('concept-highlight');
          }
        }, 800);
      }
    }
  });
  
  // Stop propagation helper
  const stopPropagation = useStableCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  });
  
  return (
    <div 
      ref={containerRef}
      onClick={onElementClick} 
      className="page-container relative"
    >
      <PixelText className="text-2xl mb-4">Knowledge Index</PixelText>
      
      <div className="space-y-6">
        {domains.map(domain => (
          <div 
            key={domain.id}
            data-domain-id={domain.id}
            className={`px-4 py-3 bg-surface-dark pixel-borders-thin relative z-10 ${!domain.unlocked ? 'opacity-50' : ''}`}
            onClick={stopPropagation}
          >
            <button
              className="w-full flex justify-between items-center mb-2 relative z-20"
              onClick={() => domain.unlocked && handleToggleDomain(domain.id)}
              disabled={!domain.unlocked}
            >
              <PixelText 
                className="text-xl" 
              >
                <span style={{ color: domain.unlocked ? domain.color : 'inherit' }}>
                  {domain.name}
                </span>
              </PixelText>
              <span>{expandedDomains.includes(domain.id) ? '▼' : '►'}</span>
            </button>
            
            {!domain.unlocked ? (
              <PixelText className="text-sm text-text-secondary italic">
                Knowledge in this domain will be revealed as you progress.
              </PixelText>
            ) : (
              <div className={`space-y-2 domain-content ${expandedDomains.includes(domain.id) ? 'block' : 'hidden'}`}>
                {domain.concepts.length === 0 ? (
                  <PixelText className="text-sm text-text-secondary italic">
                    No concepts discovered yet in this domain.
                  </PixelText>
                ) : (
                  domain.concepts.map(concept => (
                    <div 
                      key={concept.id}
                      data-concept-id={concept.id}
                      className="p-2 bg-surface-dark/50 concept-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConceptClick(concept.id, domain.id);
                      }}
                    >
                      <div className="flex justify-between">
                        <PixelText>{concept.name}</PixelText>
                        <PixelText>
                          <span style={{ color: domain.color }}>{concept.mastery}%</span>
                        </PixelText>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-surface mt-1">
                        <div 
                          className="h-full" 
                          style={{ 
                            width: `${concept.mastery}%`,
                            backgroundColor: domain.color 
                          }}
                        ></div>
                      </div>
                      
                      {/* Concept description */}
                      <div className="mt-2">
                        <PixelText className="text-sm text-text-secondary">
                          {concept.description}
                        </PixelText>
                      </div>
                      
                      {/* Connection visualization for advanced concepts */}
                      {concept.mastery >= 50 && (
                        <div className="mt-2 border-t border-border pt-1">
                          <PixelText className="text-xs">
                            <span style={{ color: domain.color }}>Connected to: </span>
                            Dosimetry, Calibration
                          </PixelText>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Knowledge guidance section */}
      <div className="mt-8 p-4 bg-educational/10 pixel-borders-thin relative z-10">
        <PixelText className="text-educational-light">Knowledge Insights</PixelText>
        <PixelText className="text-sm mt-2">
          Your strongest areas are in output calibration and PTP correction. These form the foundation for quality assurance procedures.
        </PixelText>
        <PixelText className="text-sm mt-2">
          <span className="text-educational-light">Suggested focus: </span>
          Deepen your understanding of electron equilibrium to strengthen your radiation physics knowledge base.
        </PixelText>
      </div>
      
      {/* CSS animations */}
      <style jsx>{`
        .domain-animating {
          transition: all 0.3s ease-in-out;
        }
        .concept-highlight {
          animation: pulse 0.8s ease-in-out;
        }
        .concept-item {
          cursor: pointer;
          transition: transform 0.2s ease-in-out;
        }
        .concept-item:hover {
          transform: translateX(4px);
        }
        @keyframes pulse {
          0%, 100% { background-color: rgba(var(--surface-dark-rgb), 0.5); }
          50% { background-color: rgba(var(--educational-rgb), 0.2); }
        }
      `}</style>
    </div>
  );
}