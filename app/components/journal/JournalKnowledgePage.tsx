'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { PixelText } from '@/app/components/PixelThemeProvider';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { useStableCallback } from '@/app/core/utils/storeHooks';
import { getConnectionsForConcept } from '@/app/data/concepts/medical-physics-connections';
import { KNOWLEDGE_DOMAINS } from '@/app/store/knowledgeStore';
import Image from 'next/image';

export interface JournalPageProps {
  onElementClick?: (e: React.MouseEvent) => void;
}

// Define domain interface for the journal display
interface JournalDomain {
  id: string;
  name: string;
  color: string;
  textClass: string;
  unlocked: boolean;
  conceptCount: number;
  discoveredCount: number;
  mastery: number;
  concepts: JournalConcept[];
}

// Define concept interface for the journal display
interface JournalConcept {
  id: string;
  name: string;
  description: string;
  mastery: number;
  unlocked: boolean;
  discovered: boolean;
  connections: Array<{id: string, name: string}>;
  orbit: number;
  isNewlyDiscovered: boolean;
}

// Define stable primitive selectors to avoid object recreation on each render
const nodesSelector = state => state.nodes;
const connectionsSelector = state => state.connections; 
const domainMasterySelector = state => state.domainMastery;
const newlyDiscoveredSelector = state => state.newlyDiscovered;

/**
 * Journal Knowledge Page Component
 * 
 * Displays the player's acquired knowledge organized by domains.
 * Uses actual knowledge store data to reflect current game state.
 */
export default function JournalKnowledgePage({ onElementClick }: JournalPageProps) {
  // DOM refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isAnimatingRef = useRef(false);
  
  // Extract knowledge data from store with stable references using primitive selectors
  const nodes = useKnowledgeStore(nodesSelector);
  const connections = useKnowledgeStore(connectionsSelector);
  const domainMastery = useKnowledgeStore(domainMasterySelector);
  const newlyDiscovered = useKnowledgeStore(newlyDiscoveredSelector);
  
  // Get stable references to methods to prevent recreation
  const isConceptDiscovered = useCallback((id: string) => {
    return nodes.some(n => n.id === id && n.discovered);
  }, [nodes]);
  
  const isConceptUnlocked = useCallback((id: string) => {
    return nodes.some(n => n.id === id && n.unlocked);
  }, [nodes]);

  // Transform knowledge store data into journal-friendly format - memoized to prevent infinite loops
  const journalDomains = useMemo(() => {
    // Create domain objects using knowledge domains from store
    const domains = Object.entries(KNOWLEDGE_DOMAINS).map(([domainId, domainData]) => {
      // Get concepts for this domain
      const domainConcepts = nodes
        .filter(node => node.domain === domainId && node.discovered)
        .map(node => {
          // Get connections for this concept
          const conceptConnections = node.connections
            .filter(connId => {
              const connectedNode = nodes.find(n => n.id === connId);
              return connectedNode && connectedNode.discovered;
            })
            .map(connId => {
              const connectedNode = nodes.find(n => n.id === connId);
              return {
                id: connId,
                name: connectedNode ? connectedNode.name : 'Unknown'
              };
            });

          return {
            id: node.id,
            name: node.name,
            description: node.description,
            mastery: node.mastery,
            unlocked: node.unlocked,
            discovered: node.discovered,
            connections: conceptConnections,
            orbit: node.orbit,
            isNewlyDiscovered: newlyDiscovered.includes(node.id)
          };
        });

      // Calculate statistics for the domain
      const totalDomainConcepts = nodes.filter(node => node.domain === domainId).length;
      const discoveredDomainConcepts = nodes.filter(node => node.domain === domainId && node.discovered).length;
      
      return {
        id: domainId,
        name: domainData.name,
        color: domainData.color,
        textClass: domainData.textClass,
        unlocked: discoveredDomainConcepts > 0, // Domain is unlocked if at least one concept is discovered
        conceptCount: totalDomainConcepts,
        discoveredCount: discoveredDomainConcepts,
        mastery: domainMastery[domainId] || 0,
        concepts: domainConcepts
      };
    });

    // Sort domains by unlock status and discovery count
    return domains.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return b.discoveredCount - a.discoveredCount;
    });
  }, [nodes, connections, domainMastery, newlyDiscovered]);
  
  // Track expanded domains for accordion behavior
  const [expandedDomains, setExpandedDomains] = useState<string[]>([]);
  
  // Track expanded concepts for detail view
  const [expandedConcepts, setExpandedConcepts] = useState<string[]>([]);
  
  // Set initially expanded domains (ones with discovered concepts)
  // Use a ref to track initialization to avoid re-running the effect
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    
    // Expand domains with discovered concepts by default
    const domainsWithDiscoveries = journalDomains
      .filter(domain => domain.unlocked && domain.concepts.length > 0)
      .map(domain => domain.id);
    
    // Initially expand the first unlocked domain
    if (domainsWithDiscoveries.length > 0) {
      setExpandedDomains([domainsWithDiscoveries[0]]);
      initializedRef.current = true;
    }
  }, [journalDomains]);
  
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
  
  // Toggle concept expansion
  const handleToggleConcept = useStableCallback((conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalKnowledge',
        action: 'toggleConcept',
        metadata: { conceptId }
      },
      'journalKnowledgePage'
    );
    
    // Toggle concept in expanded state
    setExpandedConcepts(prev => 
      prev.includes(conceptId)
        ? prev.filter(id => id !== conceptId)
        : [...prev, conceptId]
    );
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
  
  // Get strongest and weakest domains - memoized
  const strongestDomain = useMemo(() => {
    return journalDomains
      .filter(domain => domain.unlocked && domain.concepts.length > 0)
      .sort((a, b) => b.mastery - a.mastery)[0];
  }, [journalDomains]);
  
  const weakestDomain = useMemo(() => {
    const unlocked = journalDomains
      .filter(domain => domain.unlocked && domain.concepts.length > 0);
    
    return unlocked.length > 1 
      ? unlocked.sort((a, b) => a.mastery - b.mastery)[0]
      : null;
  }, [journalDomains]);
  
  // Get newly discovered concepts - memoized
  const newDiscoveries = useMemo(() => {
    return journalDomains
      .flatMap(domain => domain.concepts.filter(concept => concept.isNewlyDiscovered));
  }, [journalDomains]);
  
  // Helper function to convert hex to rgb for styling
  const hexToRgb = (hex: string) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    
    return `${r}, ${g}, ${b}`;
  };
  
  // Get icon for domain based on ID
  const getDomainIcon = (domainId: string) => {
    let imagePath = '';
    let altText = 'Domain Star';
    
    switch(domainId) {
      case 'clinical':
        imagePath = '/teal-star.png';
        altText = 'Clinical Star';
        break;
      case 'physics':
        imagePath = '/star.png';
        altText = 'Physics Star';
        break;
      case 'technology':
        imagePath = '/red-star.png';
        altText = 'Technology Star';
        break;
      case 'dosimetry':
        imagePath = '/purple-star.png';
        altText = 'Dosimetry Star';
        break;
      case 'biology':
        imagePath = '/pink-star.png';
        altText = 'Biology Star';
        break;
      case 'quality':
        imagePath = '/star.png';
        altText = 'Quality Star';
        break;
      default:
        imagePath = '/star.png';
        altText = 'Knowledge Star';
    }
    
    return (
      <div className="domain-star-container">
        <Image
          src={imagePath}
          alt={altText}
          width={24}
          height={24}
          className="domain-star-image"
        />
      </div>
    );
  };
  
  return (
    <div 
      ref={containerRef}
      onClick={onElementClick} 
      className="page-container relative"
    >
      <PixelText className="text-2xl mb-4">Knowledge Index</PixelText>
      
      {/* Display new discoveries if any */}
      {newDiscoveries.length > 0 && (
        <div className="mb-6 relative z-10 discovery-notification">
          <div className="pixel-borders-thin p-0 overflow-hidden">
            <div className="discovery-header flex items-center justify-center py-2 relative">
              <div className="absolute left-4 discovery-star">
                <div className="star-icon">★</div>
              </div>
              <PixelText className="text-xl text-purple-300">New Concept Discovered</PixelText>
            </div>
            
            <div className="discovery-content p-4">
              <div className="grid grid-cols-1 gap-3">
                {newDiscoveries.map(concept => {
                  // Find the domain for this concept
                  const domain = journalDomains.find(d => 
                    d.concepts.some(c => c.id === concept.id)
                  );
                  const domainColor = domain?.color || '#9370DB';
                  
                  return (
                    <div 
                      key={concept.id}
                      className="new-discovery-card"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderLeft: `3px solid ${domainColor}`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (domain) {
                          handleConceptClick(concept.id, domain.id);
                        }
                      }}
                    >
                      <div className="p-3 relative">
                        <PixelText className="text-white text-lg mb-1">{concept.name}</PixelText>
                        <PixelText className="text-sm text-white/70">{concept.description}</PixelText>
                        
                        <div className="absolute top-2 right-2 concept-orbit-badge"
                            style={{ backgroundColor: domainColor }}>
                          <PixelText className="text-xs">Orbit {concept.orbit}</PixelText>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {journalDomains.map(domain => (
          <div 
            key={domain.id}
            data-domain-id={domain.id}
            className={`domain-card pixel-borders-thin relative z-10 ${!domain.unlocked ? 'opacity-50' : ''}`}
            onClick={stopPropagation}
            style={{
              backgroundColor: domain.unlocked ? `rgba(${hexToRgb(domain.color)}, 0.2)` : 'rgba(30, 30, 40, 0.8)',
              overflow: 'hidden'
            }}
          >
            {/* Background patterns for unlocked domains */}
            {domain.unlocked && (
              <>
                <div className="absolute inset-0 w-full h-full domain-pattern" 
                  style={{ 
                    backgroundImage: `repeating-linear-gradient(45deg, ${domain.color}22 0px, ${domain.color}22 1px, transparent 1px, transparent 10px), 
                                     repeating-linear-gradient(-45deg, ${domain.color}22 0px, ${domain.color}22 1px, transparent 1px, transparent 10px)`,
                    opacity: 0.5
                  }}>
                </div>
                
                {/* Domain badge/icon in background */}
                <div className="absolute bottom-1/4 right-1/4 text-6xl opacity-10 domain-watermark" 
                  style={{ color: domain.color }}>
                  {domain.id.substring(0,1).toUpperCase()}
                </div>
              </>
            )}
            
            <button
              className="w-full flex justify-between items-center px-4 py-3 relative z-20 domain-header"
              onClick={() => domain.unlocked && handleToggleDomain(domain.id)}
              disabled={!domain.unlocked}
              style={{
                backgroundColor: domain.unlocked ? `${domain.color}44` : 'transparent',
                borderBottom: domain.unlocked ? `1px solid ${domain.color}66` : '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div className="flex items-center">
                <div className="domain-icon mr-3">
                  {getDomainIcon(domain.id)}
                </div>
                <div>
                  <PixelText className={`text-xl ${domain.unlocked ? domain.textClass : ''}`}>
                    {domain.name}
                  </PixelText>
                  {domain.unlocked && (
                    <div className="text-sm domain-stats">
                      <span className="mr-3">{domain.mastery}% Mastery</span>
                      <span>{domain.discoveredCount}/{domain.conceptCount} Concepts</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="domain-toggle-btn" style={{ color: domain.unlocked ? domain.color : 'rgba(255,255,255,0.3)' }}>
                {expandedDomains.includes(domain.id) ? '▼' : '►'}
              </div>
            </button>
            
            {!domain.unlocked ? (
              <div className="px-4 py-3">
                <PixelText className="text-sm text-text-secondary italic">
                  Knowledge in this domain will be revealed as you progress.
                </PixelText>
              </div>
            ) : (
              <div className={`p-4 domain-content relative ${expandedDomains.includes(domain.id) ? 'block' : 'hidden'}`}>
                {domain.concepts.length === 0 ? (
                  <PixelText className="text-sm text-text-secondary italic">
                    No concepts discovered yet in this domain.
                  </PixelText>
                ) : (
                  <>
                    <div className="space-y-3">
                      {domain.concepts.map(concept => (
                        <div 
                          key={concept.id}
                          data-concept-id={concept.id}
                          className={`concept-card relative 
                            ${concept.isNewlyDiscovered ? 'new-concept' : ''}
                            ${!concept.unlocked ? 'locked-concept' : ''}
                            ${expandedConcepts.includes(concept.id) ? 'concept-expanded' : 'concept-collapsed'}
                          `}
                          onClick={(e) => {
                            handleToggleConcept(concept.id, e);
                          }}
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            borderLeft: `2px solid ${domain.color}`
                          }}
                        >
                          {/* Orbit level visualization */}
                          <div className="absolute left-2 top-0 bottom-0 flex flex-col items-center justify-center">
                            <div className="orbit-connector" style={{ backgroundColor: domain.color }}></div>
                            <div className="orbit-node" style={{ 
                              backgroundColor: concept.mastery > 50 ? domain.color : 'rgba(0,0,0,0.5)',
                              borderColor: domain.color,
                              boxShadow: concept.mastery > 75 ? `0 0 8px ${domain.color}` : 'none'
                            }}>
                              {concept.orbit}
                            </div>
                            <div className="orbit-connector" style={{ backgroundColor: domain.color }}></div>
                          </div>
                          
                          <div className="pl-8 pr-3 py-2 w-full">
                            {/* Always visible compact header */}
                            <div className="flex justify-between items-center concept-header">
                              <div className="flex items-center concept-name-container">
                                <PixelText className="concept-name flex items-center">
                                  {concept.name}
                                  {concept.isNewlyDiscovered && (
                                    <span className="ml-2 new-badge" style={{ backgroundColor: domain.color }}>NEW</span>
                                  )}
                                </PixelText>
                              </div>
                              
                              {/* Mastery percentage */}
                              <div className="flex items-center">
                                <div className="concept-mastery" style={{ 
                                  backgroundColor: `${domain.color}44`, 
                                  border: `1px solid ${domain.color}66`
                                }}>
                                  <PixelText className="mastery-text" style={{ color: domain.color }}>
                                    {concept.mastery}%
                                  </PixelText>
                                </div>
                                <div className="ml-2 expand-icon">
                                  {expandedConcepts.includes(concept.id) ? '▼' : '►'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress bar - always visible */}
                            <div className="w-full h-1.5 bg-surface mt-1 progress-container">
                              <div 
                                className="h-full transition-all duration-300 progress-bar" 
                                style={{ 
                                  width: `${concept.mastery}%`,
                                  backgroundColor: domain.color 
                                }}
                              ></div>
                            </div>
                            
                            {/* Expandable content */}
                            <div className={`concept-details mt-2 ${expandedConcepts.includes(concept.id) ? 'block' : 'hidden'}`}>
                              {/* Concept description */}
                              <div className="mt-1 mb-2">
                                <PixelText className="text-sm text-text-secondary">
                                  {concept.description}
                                </PixelText>
                              </div>
                              
                              {/* Connection visualization */}
                              {concept.connections.length > 0 && (
                                <div className="mt-2 pt-1 connections-container">
                                  <PixelText className="text-xs flex items-center">
                                    <span className={`${domain.textClass} mr-1`}>Connected: </span>
                                    <div className="connections-list">
                                      {concept.connections.map((conn, i) => (
                                        <span key={conn.id} className="connection-pill" style={{ 
                                          backgroundColor: `${domain.color}33`,
                                          borderColor: `${domain.color}66`
                                        }}>
                                          {conn.name}
                                        </span>
                                      ))}
                                    </div>
                                  </PixelText>
                                </div>
                              )}
                              
                              {/* View details button */}
                              <div className="mt-2 text-right">
                                <button 
                                  className="view-details-btn"
                                  style={{ color: domain.color }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConceptClick(concept.id, domain.id);
                                  }}
                                >
                                  <PixelText className="text-xs">View in Knowledge Graph</PixelText>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Knowledge guidance section */}
      <div className="mt-8 p-4 bg-educational/10 pixel-borders-thin relative z-10">
        <PixelText className="text-educational-light">Knowledge Insights</PixelText>
        {strongestDomain ? (
          <>
            <PixelText className="text-sm mt-2">
              Your strongest area is {strongestDomain.name} with {strongestDomain.mastery}% mastery.
            </PixelText>
            {weakestDomain && (
              <PixelText className="text-sm mt-2">
                <span className="text-educational-light">Suggested focus: </span>
                Continue exploring {weakestDomain.name} to build a more balanced understanding.
              </PixelText>
            )}
          </>
        ) : (
          <PixelText className="text-sm mt-2">
            Continue exploring to unlock more concepts and connections between them.
          </PixelText>
        )}
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
        .new-concept {
          animation: glow 2s ease-in-out infinite;
        }
        .locked-concept {
          opacity: 0.7;
          border-left: 2px solid var(--border-color);
        }
        
        /* New Discovery Styling */
        .discovery-notification {
          box-shadow: 0 0 15px rgba(147, 112, 219, 0.3);
          background: rgba(0, 0, 0, 0.8);
          animation: discovery-pulse 3s infinite ease-in-out;
        }
        
        .discovery-header {
          background: linear-gradient(90deg, rgba(30, 0, 40, 0.8) 0%, rgba(80, 30, 120, 0.8) 50%, rgba(30, 0, 40, 0.8) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .discovery-content {
          background-color: rgba(20, 10, 30, 0.7);
        }
        
        .star-icon {
          color: #f0f0ff;
          font-size: 24px;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
          animation: star-pulse 2s infinite ease-in-out;
        }
        
        .new-discovery-card {
          border-radius: 3px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .new-discovery-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .new-discovery-card:after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 2s infinite;
        }
        
        .concept-orbit-badge {
          padding: 2px 5px;
          border-radius: 3px;
          color: white;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes star-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        @keyframes discovery-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(147, 112, 219, 0.3); }
          50% { box-shadow: 0 0 20px rgba(147, 112, 219, 0.5); }
        }
        
        .new-discovery-item {
          transition: all 0.2s ease-in-out;
        }
        .new-discovery-item:hover {
          background-color: rgba(var(--educational-rgb), 0.2);
        }
        @keyframes pulse {
          0%, 100% { background-color: rgba(var(--surface-dark-rgb), 0.5); }
          50% { background-color: rgba(var(--educational-rgb), 0.2); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 0 rgba(var(--educational-rgb), 0); }
          50% { box-shadow: 0 0 8px rgba(var(--educational-rgb), 0.5); }
        }
        
        /* Domain Styling */
        .domain-card {
          transition: all 0.3s ease;
          border-radius: 3px;
        }
        
        .domain-header {
          transition: background-color 0.3s ease;
        }
        
        .domain-card:hover .domain-header {
          background-color: rgba(var(--surface-dark-rgb), 0.6) !important;
        }
        
        .domain-icon {
          font-size: 1.5rem;
          opacity: 0.9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .domain-star-container {
          width: 24px;
          height: 24px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .domain-star-image {
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
          animation: star-pulse 3s infinite ease-in-out;
        }
        
        @keyframes star-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        .domain-watermark {
          transform: rotate(-10deg);
          font-family: sans-serif;
          user-select: none;
        }
        
        .domain-toggle-btn {
          font-size: 0.9rem;
          transition: transform 0.3s ease;
        }
        
        /* Concept Styling */
        .concept-card {
          padding: 0;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        
        .concept-card:hover {
          transform: translateX(3px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .concept-collapsed {
          max-height: 50px;
        }
        
        .concept-expanded {
          max-height: 500px;
        }
        
        .concept-name-container {
          max-width: 70%;
        }
        
        .concept-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.95rem;
        }
        
        .expand-icon {
          font-size: 0.7rem;
          opacity: 0.7;
          transition: transform 0.3s ease;
        }
        
        .concept-expanded .expand-icon {
          transform: rotate(180deg);
        }
        
        .concept-header {
          position: relative;
        }
        
        .concept-details {
          transition: all 0.3s ease-in-out;
        }
        
        .view-details-btn {
          background: transparent;
          border: none;
          text-decoration: underline;
          opacity: 0.8;
          transition: all 0.2s ease;
        }
        
        .view-details-btn:hover {
          opacity: 1;
        }
        
        .mastery-text {
          font-size: 0.75rem;
        }
        
        .orbit-connector {
          width: 1px;
          height: 6px;
          opacity: 0.6;
        }
        
        .progress-container {
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-bar {
          position: relative;
        }
        
        .progress-bar:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.3);
        }
        
        .new-badge {
          font-size: 0.6rem;
          padding: 1px 3px;
          border-radius: 2px;
          color: white;
          margin-left: 5px;
        }
        
        .connections-container {
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }
        
        .connections-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .connection-pill {
          font-size: 0.65rem;
          padding: 0px 4px;
          border-radius: 3px;
          border: 1px solid;
          white-space: nowrap;
        }
        
        .locked-concept {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}