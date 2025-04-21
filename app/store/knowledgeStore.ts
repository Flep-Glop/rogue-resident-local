// app/store/knowledgeStore.ts
/**
 * Knowledge Constellation System - Chamber Pattern Compliant
 * 
 * This store manages the player's evolving understanding of medical physics
 * represented as a personal constellation in the night sky. Stars (concepts)
 * illuminate as mastery increases, forming connections that represent
 * true expertise development.
 * 
 * Chamber Pattern enhancements:
 * - Primitive selectors for performance-optimized component binding
 * - Memoized calculations for domain mastery metrics
 * - Stable function references for callback consistency 
 * - Atomic state updates for visualization consistency
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer'; // Added immer for simpler updates
// Use require for CommonJS compatibility
const { nanoid } = require('nanoid');
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { allConcepts } from '@/app/data/concepts/medicalPhysicsConcepts';
import { updateNodePositions, buildDomainAngles } from '@/app/components/knowledge/ConstellationLayout';

// Define custom event types - now using GameEventType enum for standard events
const CUSTOM_EVENTS = {
  KNOWLEDGE_DISCOVERED: GameEventType.KNOWLEDGE_DISCOVERED,
  CONNECTION_CREATED: GameEventType.KNOWLEDGE_CONNECTION_CREATED,
  CONNECTION_DISCOVERED: GameEventType.INSIGHT_CONNECTED,
  CONCEPT_SELECTED: GameEventType.UI_NODE_SELECTED,
  PATTERN_DISCOVERED: GameEventType.PATTERN_DISCOVERED,
  CONCEPT_UNLOCKED: GameEventType.CONCEPT_UNLOCKED,
  CONCEPT_ACTIVATED: GameEventType.CONCEPT_ACTIVATION_CHANGED
  // Removed KNOWLEDGE_DECAY_APPLIED as decay system is paused
};

// Knowledge domains with visual styling properties - single source of truth
export const KNOWLEDGE_DOMAINS = {
  'treatment-planning': {
    name: 'Treatment Planning',
    color: '#3b82f6', // Blue
    textClass: 'text-clinical-light',
    bgClass: 'bg-clinical',
    angle: 45 // Northeast - used for orbital-quadrant layout
  },
  'radiation-therapy': {
    name: 'Radiation Therapy',
    color: '#10b981', // Green
    textClass: 'text-qa-light',
    bgClass: 'bg-qa',
    angle: 135 // Southeast
  },
  'linac-anatomy': {
    name: 'Linac Anatomy',
    color: '#f59e0b', // Amber
    textClass: 'text-warning',
    bgClass: 'bg-warning',
    angle: 225 // Southwest
  },
  'dosimetry': {
    name: 'Dosimetry',
    color: '#ec4899', // Pink
    textClass: 'text-clinical-light',
    bgClass: 'bg-clinical-dark',
    angle: 315 // Northwest
  }
  // Legacy domains removed as requested
};

// Type Definitions
export type KnowledgeDomain = keyof typeof KNOWLEDGE_DOMAINS;
export type MasteryLevel = 'undiscovered' | 'introduced' | 'practicing' | 'mastered';

// Core Interfaces
export interface ConceptNode {
  id: string;
  name: string;
  domain: KnowledgeDomain;
  description: string;
  mastery: number; // 0-100% mastery level
  connections: string[]; // IDs of connected concepts
  discovered: boolean; // Whether player has encountered this concept (Day phase)
  unlocked: boolean; // Whether player has spent SP to unlock this concept (Night phase)
  active: boolean; // Whether concept is currently "active" in mind
  position?: { x: number; y: number }; // For visual layout
  
  // Additional fields from documentation
  orbit: 0 | 1 | 2 | 3; // Specialization level (0=core, 3=specialized) - now required
  spCost: number; // Star Points required to unlock
  maxConnections?: number; // Maximum number of connections allowed
  prerequisites?: string[]; // Stars that must be unlocked first
  crossDomainPotential?: 'Low' | 'Medium' | 'High'; // Likelihood of cross-domain connections
  journalEntryIds?: string[]; // Associated journal entries
  
  // lastPracticed removed as knowledge decay system is paused
}

export interface ConceptConnection {
  source: string;
  target: string;
  strength: number; // 0-100%
  discovered: boolean;
  
  // Additional fields from documentation
  id?: string; // Unique identifier
  type?: 'fundamental' | 'application' | 'theoretical' | 'cross-domain'; // Type of connection
  description?: string; // Optional description of relationship
  patternIds?: string[]; // Patterns this connection is part of
}

export interface JournalEntry {
  id: string;
  conceptId: string;
  timestamp: number;
  content: string;
  masteryGained: number;
  source: 'challenge' | 'dialogue' | 'item' | 'observation';
}

export interface KnowledgeState {
  // Core data structures
  nodes: ConceptNode[];
  connections: ConceptConnection[];
  journalEntries: JournalEntry[];
  
  // Ephemeral tracking
  pendingInsights: Array<{conceptId: string, amount: number}>;
  newlyDiscovered: string[]; // Concept IDs for animation
  activeInsight: string | null; // Currently focused insight
  
  // SP Economy
  starPoints: number; // Star Points (SP) for unlocking concepts
  
  // Derived metrics
  domainMastery: Record<KnowledgeDomain, number>; // 0-100%
  totalMastery: number; // 0-100% across all domains
  constellationVisible: boolean; // UI state tracking
  
  // Actions
  addConcept: (concept: Omit<ConceptNode, 'id' | 'discovered' | 'unlocked' | 'active' | 'connections'>) => string;
  discoverConcept: (conceptId: string) => void;
  unlockConcept: (conceptId: string) => boolean; // New: Unlock a discovered concept by spending SP
  setConceptActivation: (conceptId: string, isActive: boolean) => void; // New: Toggle activation state
  updateMastery: (conceptId: string, amount: number) => void;
  createConnection: (sourceId: string, targetId: string) => void;
  discoverConnection: (sourceId: string, targetId: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  transferInsights: () => void;
  resetNewlyDiscovered: () => void;
  setActiveInsight: (conceptId: string | null) => void;
  setConstellationVisibility: (isVisible: boolean) => void;
  
  // SP Economy actions - NOTE: SP Economy system will be fully implemented later
  addStarPoints: (amount: number, source?: string) => void;
  spendStarPoints: (amount: number, target?: string) => boolean;
  
  // Selectors for concept states
  isConceptDiscovered: (conceptId: string) => boolean; // New: Check if concept is discovered
  isConceptUnlocked: (conceptId: string) => boolean; // New: Check if concept is unlocked
  isConceptActive: (conceptId: string) => boolean; // New: Check if concept is active
  
  // Legacy compatibility
  unlockKnowledge: (knowledgeId: string) => void;
  addInsight: (insightId: string) => void; // Legacy method
  unlockTopic: (topicId: string) => void; // Legacy method
  
  // Development helpers
  importKnowledgeData: (data: Partial<KnowledgeState>) => void;
  resetKnowledge: () => void;
}

/**
 * Builds visual constellation connections from node data
 * Only creates connections between unlocked nodes
 */
const buildInitialConnections = (nodes: ConceptNode[]): ConceptConnection[] => {
  const connections: ConceptConnection[] = [];
  const processedPairs = new Set<string>();
  
  const unlockedNodes = nodes.filter(n => n.unlocked);
  console.log(`[Knowledge] Building connections between unlocked nodes. Found ${unlockedNodes.length}/${nodes.length} unlocked nodes`);
  
  nodes.forEach(node => {
    // Only unlocked nodes can form connections
    if (!node.unlocked) return;
    
    node.connections.forEach(targetId => {
      // Prevent duplicate connections
      const pairKey = [node.id, targetId].sort().join('-');
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);
      
      // Only create connection if target node exists and is unlocked
      const targetNode = nodes.find(n => n.id === targetId);
      if (targetNode?.unlocked) {
        connections.push({
          source: node.id,
          target: targetId,
          strength: (node.mastery + (targetNode?.mastery || 0)) / 2,
          discovered: true
        });
      }
    });
  });
  
  console.log(`[Knowledge] Created ${connections.length} connections between unlocked nodes`);
  return connections;
};

/**
 * Calculates mastery level for each knowledge domain
 * with safety checks for domain validity
 * Only includes discovered and unlocked nodes in calculation
 */
const calculateDomainMastery = (nodes: ConceptNode[]): Record<KnowledgeDomain, number> => {
  // Initialize accumulator for each domain
  const domainTotals: Record<string, {sum: number, count: number}> = {};
  
  // Ensure all domains are initialized
  (Object.keys(KNOWLEDGE_DOMAINS) as KnowledgeDomain[]).forEach(domain => {
    domainTotals[domain] = {sum: 0, count: 0};
  });
  
  // Only consider discovered and unlocked nodes
  nodes.filter(node => node.discovered && node.unlocked).forEach(node => {
    // Safely access the domain
    if (domainTotals[node.domain]) {
      domainTotals[node.domain].sum += node.mastery;
      domainTotals[node.domain].count += 1;
    }
  });
  
  // Calculate average mastery for each domain
  const result = {} as Record<KnowledgeDomain, number>;
  Object.keys(domainTotals).forEach(domain => {
    const { sum, count } = domainTotals[domain];
    result[domain as KnowledgeDomain] = count > 0 ? Math.round(sum / count) : 0;
  });
  
  return result;
};

/**
 * Calculates overall mastery across all domains
 * Weighted by number of concepts in each domain
 * Only includes discovered and unlocked nodes in calculation
 */
const calculateTotalMastery = (domainMastery: Record<KnowledgeDomain, number>, nodes: ConceptNode[]): number => {
  // Count discovered and unlocked nodes per domain for weighting
  const domainCounts: Record<KnowledgeDomain, number> = {} as Record<KnowledgeDomain, number>;
  let totalNodes = 0;
  
  // Initialize all domains with 0
  (Object.keys(KNOWLEDGE_DOMAINS) as KnowledgeDomain[]).forEach(domain => {
    domainCounts[domain] = 0;
  });
  
  // Count discovered and unlocked nodes in each domain
  nodes.filter(node => node.discovered && node.unlocked).forEach(node => {
    if (domainCounts[node.domain] !== undefined) {
      domainCounts[node.domain]++;
      totalNodes++;
    }
  });
  
  // If no nodes discovered yet, return 0
  if (totalNodes === 0) return 0;
  
  // Calculate weighted average
  let weightedSum = 0;
  (Object.keys(KNOWLEDGE_DOMAINS) as KnowledgeDomain[]).forEach(domain => {
    weightedSum += domainMastery[domain] * (domainCounts[domain] / totalNodes);
  });
  
  return Math.round(weightedSum);
};

/**
 * Determines mastery level category based on numeric value
 */
export const getMasteryLevel = (mastery: number): MasteryLevel => {
  if (mastery < 10) return 'undiscovered';
  if (mastery < 40) return 'introduced';
  if (mastery < 80) return 'practicing';
  return 'mastered';
};

// Initial state preparation
const initialConnections = buildInitialConnections(allConcepts);
const initialDomainMastery = calculateDomainMastery(allConcepts);
const initialTotalMastery = calculateTotalMastery(initialDomainMastery, allConcepts);

// Create the knowledge store with Zustand and Immer
export const useKnowledgeStore = create<KnowledgeState>()(
  immer((set, get) => ({
    // Initial state
    nodes: allConcepts, // Nodes for visualization (concepts)
    connections: initialConnections, // Connections for visualization
    journalEntries: [], // Journal entries linked to concepts
    pendingInsights: [],
    newlyDiscovered: [],
    activeInsight: null,
    constellationVisible: false,
    starPoints: 25, // Starting SP
    domainMastery: {
      'treatment-planning': 0,
      'radiation-therapy': 0,
      'linac-anatomy': 0,
      'dosimetry': 0
    },
    totalMastery: 0,
    
    // Add a new concept to the constellation
    addConcept: (concept) => {
      const id = nanoid(8);
      
      // Validate domain, enforce using only valid domains
      const validDomain = Object.keys(KNOWLEDGE_DOMAINS).includes(concept.domain)
        ? concept.domain
        : 'treatment-planning' as KnowledgeDomain; // Default to treatment-planning
      
      if (validDomain !== concept.domain) {
        console.warn(`Invalid domain "${concept.domain}" changed to "treatment-planning" for concept: ${concept.name}`);
      }
      
      set(state => {
        const newNode: ConceptNode = {
          id,
          ...concept,
          domain: validDomain,
          connections: [],
          discovered: false,
          unlocked: false,
          active: false,
          orbit: 0
        };
        
        state.nodes.push(newNode);
      });
      
      return id;
    },
    
    // Discover a previously unknown concept - Day Phase
    discoverConcept: (conceptId) => {
      console.log(`🔍 [KnowledgeStore] discoverConcept called with conceptId: ${conceptId}`);
      const node = get().nodes.find(n => n.id === conceptId);
      
      if (!node) {
        console.warn(`Concept with ID ${conceptId} not found`);
        return;
      }
      
      if (node.discovered) {
        console.warn(`Concept with ID ${conceptId} already discovered`);
        return;
      }
      
      console.log(`[Knowledge] Discovering concept: ${conceptId}, name: ${node.name}, domain: ${node.domain}`);
      
      set(state => {
        // Mark the node as discovered but NOT unlocked
        // Unlocking happens in night phase with SP cost
        const nodeIndex = state.nodes.findIndex(n => n.id === conceptId);
        if (nodeIndex >= 0) {
          state.nodes[nodeIndex].discovered = true;
          
          // Add to newly discovered for animation
          if (!state.newlyDiscovered.includes(conceptId)) {
            state.newlyDiscovered.push(conceptId);
          }

          console.log(`[Knowledge] Concept marked as discovered: ${conceptId}, discovered=${true}, unlocked=${false}, SP cost to unlock: ${node.spCost}`);
        }
        
        // Build domain angles from KNOWLEDGE_DOMAINS
        const domainAngles = buildDomainAngles(KNOWLEDGE_DOMAINS);
        
        // Update positions of all nodes (important for newly discovered nodes)
        state.nodes = updateNodePositions(state.nodes, domainAngles);
        
        // Don't update connections since the concept is only discovered but not unlocked
        // Connections are only updated when concepts are unlocked in the night phase
        
        // Recalculate mastery metrics
        state.domainMastery = calculateDomainMastery(state.nodes);
        state.totalMastery = calculateTotalMastery(state.domainMastery, state.nodes);
      });
      
      // Emit discovery event
      console.log(`🔍 [KnowledgeStore] Preparing to dispatch KNOWLEDGE_DISCOVERED event for conceptId: ${conceptId}`);
      try {
        const eventPayload = { 
          conceptId, 
          source: 'knowledgeStore.discoverConcept' 
        };
        console.log(`🔍 [KnowledgeStore] KNOWLEDGE_DISCOVERED event payload:`, eventPayload);
        
        safeDispatch(
          GameEventType.KNOWLEDGE_DISCOVERED,
          eventPayload,
          'knowledgeStore.discoverConcept'
        );
        console.log(`🔍 [KnowledgeStore] Successfully dispatched KNOWLEDGE_DISCOVERED event`);
      } catch (error) {
        console.error(`❌ [KnowledgeStore] Error dispatching KNOWLEDGE_DISCOVERED event:`, error);
      }
    },
    
    // Update mastery level for a concept
    updateMastery: (conceptId, amount) => {
      set(state => {
        const nodeIndex = state.nodes.findIndex(node => node.id === conceptId);
        
        if (nodeIndex === -1) {
          console.warn(`Cannot update mastery: Concept ${conceptId} not found`);
          return;
        }
        
        const node = state.nodes[nodeIndex];
        if (!node.discovered) {
          console.warn(`Cannot update mastery: Concept ${conceptId} not yet discovered`);
          return;
        }
        
        // Calculate new mastery value
        const newMastery = Math.max(0, Math.min(100, node.mastery + amount));
        
        // Only update if there's a change
        if (newMastery !== node.mastery) {
          // Update node mastery
          state.nodes[nodeIndex].mastery = newMastery;
          
          // Update connection strengths for this node
          node.connections.forEach(connectedId => {
            const connectedNode = state.nodes.find(n => n.id === connectedId);
            if (!connectedNode || !connectedNode.discovered) return;
            
            const connIndex = state.connections.findIndex(c => 
              (c.source === conceptId && c.target === connectedId) ||
              (c.source === connectedId && c.target === conceptId)
            );
            
            if (connIndex !== -1) {
              state.connections[connIndex].strength = 
                (newMastery + connectedNode.mastery) / 2;
            }
          });
          
          // Recalculate domain mastery
          state.domainMastery = calculateDomainMastery(state.nodes);
          state.totalMastery = calculateTotalMastery(state.domainMastery, state.nodes);
          
          // Emit mastery increased event
          try {
            safeDispatch(
              GameEventType.MASTERY_INCREASED,
              {
                conceptId: conceptId,
                amount: amount,
                domain: node.domain
              },
              'knowledgeStore.updateMastery'
            );
          } catch (e) {
            console.error('Error dispatching mastery event:', e);
          }
        }
      });
    },
    
    // Create a new connection between concepts
    createConnection: (sourceId, targetId) => {
      // Validate input
      if (sourceId === targetId) {
        console.warn('Cannot connect a concept to itself');
        return;
      }
      
      // Check for existing connection
      const connectionExists = get().connections.some(
        conn => (conn.source === sourceId && conn.target === targetId) ||
               (conn.source === targetId && conn.target === sourceId)
      );
      
      // Skip if connection already exists
      if (connectionExists) {
        console.warn('Connection already exists');
        return;
      }
      
      set(state => {
        // Validate nodes exist and are discovered
        const sourceNode = state.nodes.find(n => n.id === sourceId);
        const targetNode = state.nodes.find(n => n.id === targetId);
        
        if (!sourceNode || !targetNode) {
          console.warn('Cannot create connection: nodes not found');
          return;
        }
        
        if (!sourceNode.discovered || !targetNode.discovered) {
          console.warn('Cannot create connection: nodes not discovered');
          return;
        }
        
        // Create new connection with strength based on node mastery
        const newConnection: ConceptConnection = {
          source: sourceId,
          target: targetId,
          strength: (sourceNode.mastery + targetNode.mastery) / 2,
          discovered: true
        };
        
        // Add connection to array
        state.connections.push(newConnection);
        
        // Update node connection references
        const sourceNodeIndex = state.nodes.findIndex(n => n.id === sourceId);
        if (sourceNodeIndex !== -1 && !state.nodes[sourceNodeIndex].connections.includes(targetId)) {
          state.nodes[sourceNodeIndex].connections.push(targetId);
        }
        
        const targetNodeIndex = state.nodes.findIndex(n => n.id === targetId);
        if (targetNodeIndex !== -1 && !state.nodes[targetNodeIndex].connections.includes(sourceId)) {
          state.nodes[targetNodeIndex].connections.push(sourceId);
        }
      });
      
      // Emit connection created event
      try {
        safeDispatch(
          CUSTOM_EVENTS.CONNECTION_CREATED,
          { 
            sourceId, 
            targetId,
            sourceDomain: get().nodes.find(n => n.id === sourceId)?.domain,
            targetDomain: get().nodes.find(n => n.id === targetId)?.domain
          },
          'knowledgeStore.createConnection'
        );
      } catch (e) {
        console.error('Error dispatching connection event:', e);
      }
    },
    
    // Discover an existing but previously hidden connection
    discoverConnection: (sourceId, targetId) => {
      set(state => {
        // Find the connection
        const connectionIndex = state.connections.findIndex(
          conn => (conn.source === sourceId && conn.target === targetId) ||
                 (conn.source === targetId && conn.target === sourceId)
        );
        
        if (connectionIndex === -1) {
          console.warn('Connection not found');
          return;
        }
        
        // Update connection visibility
        if (!state.connections[connectionIndex].discovered) {
          state.connections[connectionIndex].discovered = true;
          
          // Emit discovery event
          try {
            safeDispatch(
              CUSTOM_EVENTS.CONNECTION_DISCOVERED,
              { sourceId, targetId },
              'knowledgeStore.discoverConnection'
            );
          } catch (e) {
            console.error('Error dispatching connection discovery event:', e);
          }
        }
      });
    },
    
    // Add a journal entry and apply its mastery gain
    addJournalEntry: (entry) => {
      if (!entry.conceptId || !entry.content) {
        console.warn('Invalid journal entry', entry);
        return;
      }
      
      const id = nanoid();
      
      set(state => {
        state.journalEntries.push({
          id,
          ...entry,
          timestamp: Date.now()
        });
      });
      
      // Also update concept mastery if specified
      if (entry.masteryGained > 0) {
        get().updateMastery(entry.conceptId, entry.masteryGained);
      }
      
      // Emit journal entry event
      try {
        safeDispatch(
          GameEventType.JOURNAL_ENTRY_ADDED,
          { 
            conceptId: entry.conceptId,
            source: entry.source,
            masteryGained: entry.masteryGained
          },
          'knowledgeStore.addJournalEntry'
        );
      } catch (e) {
        console.error('Error dispatching journal entry event:', e);
      }
    },
    
    // Transfer pending insights to the constellation (night phase)
    transferInsights: () => {
      // Skip if no insights to transfer
      if (get().pendingInsights.length === 0) return;
      
      set(state => {
        // Clear pending insights
        state.pendingInsights = [];
      });
      
      // Emit transfer event
      try {
        safeDispatch(
          GameEventType.KNOWLEDGE_TRANSFERRED,
          {
            insightCount: get().pendingInsights.length
          },
          'knowledgeStore.transferInsights'
        );
      } catch (e) {
        console.error('Error dispatching transfer event:', e);
      }
    },
    
    // Reset newly discovered tracking after animations complete
    resetNewlyDiscovered: () => {
      // Only update state if there are actually newly discovered items
      if (get().newlyDiscovered.length === 0) return;
      
      set(state => {
        state.newlyDiscovered = [];
      });
    },
    
    // Set the actively selected insight
    setActiveInsight: (conceptId: string | null) => {
      set(state => {
        state.activeInsight = conceptId;
        
        // Emit node selection event
        if (conceptId) {
          try {
            safeDispatch(
              GameEventType.UI_NODE_SELECTED,
              {
                nodeId: conceptId
              },
              'knowledgeStore.setActiveInsight'
            );
          } catch (e) {
            console.error('Error dispatching node selection event:', e);
          }
        }
      });
    },
    
    // Set constellation visualization visibility
    setConstellationVisibility: (isVisible: boolean) => {
      set(state => {
        state.constellationVisible = isVisible;
      });
    },
    
    /**
     * Implementation for SimplifiedKapoorMap compatibility
     * Now only discovers a knowledge node without unlocking it
     */
    unlockKnowledge: (knowledgeId: string) => {
      // Extract the concept ID from the knowledge ID if needed
      const conceptId = knowledgeId.includes(':') 
        ? knowledgeId.split(':')[1]
        : knowledgeId;
      
      // If conceptId doesn't exist, create a generic one
      const exists = get().nodes.some(node => node.id === conceptId);
      
      if (!exists) {
        const newConceptId = get().addConcept({
          name: `Unknown (${conceptId})`,
          domain: 'treatment-planning',
          description: 'A newly discovered concept.',
          mastery: 25,
          orbit: 1,
          spCost: 15 // Default SP cost for orbit 1 concepts
        });
        
        get().discoverConcept(newConceptId);
        return newConceptId;
      }
      
      // Only discover existing concept (not unlock)
      get().discoverConcept(conceptId);
      return conceptId;
    },
    
    // Legacy method for backward compatibility
    addInsight: (insightId: string) => {
      // Simply forward to unlockKnowledge
      get().unlockKnowledge(insightId);
    },
    
    // Legacy method for unlocking topic domains
    unlockTopic: (topicId: string) => {
      // Legacy method for backward compatibility
      console.warn('unlockTopic is deprecated, use discoverConcept instead');
      
      const topicToDomain: Record<string, KnowledgeDomain> = {
        'radiation-physics': 'treatment-planning',
        'dose-calculation': 'dosimetry',
        'patient-positioning': 'radiation-therapy',
        'linac-components': 'linac-anatomy',
        'physics-fundamentals': 'treatment-planning',
        'calibration': 'dosimetry'
      };
      
      // Default to treatment-planning if topic not found
      const domain = Object.keys(topicToDomain).includes(topicId) 
        ? topicToDomain[topicId] 
        : 'treatment-planning';
      
      // Create a new concept from the topic ID
      const newConceptId = get().addConcept({
        name: topicId.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: `Legacy topic: ${topicId}`,
        domain: domain,
        mastery: 25,
        orbit: 1
      });
      
      // Discover the new concept
      get().discoverConcept(newConceptId);
      
      return newConceptId;
    },
    
    // Import knowledge data (for development/testing)
    importKnowledgeData: (data) => {
      if (!data) return;
      
      set(state => {
        // Import provided data with fallbacks to current state
        if (data.nodes) state.nodes = data.nodes;
        if (data.connections) {
          state.connections = data.connections;
        } else {
          state.connections = buildInitialConnections(state.nodes);
        }
        if (data.journalEntries) state.journalEntries = data.journalEntries;
        if (data.pendingInsights) state.pendingInsights = data.pendingInsights;
        
        // Clear newly discovered tracking
        state.newlyDiscovered = [];
        
        // Recalculate domain mastery
        state.domainMastery = calculateDomainMastery(state.nodes);
        state.totalMastery = calculateTotalMastery(state.domainMastery, state.nodes);
      });
    },
    
    // Reset knowledge to initial state
    resetKnowledge: () => {
      // Start with a clean copy of all concepts but ensure they're all undiscovered
      const resetConcepts = allConcepts.map(concept => ({
        ...concept,
        discovered: false,
        unlocked: false,
        active: false,
        mastery: 0
      }));
      
      // Create empty array as additionalConcepts might not be defined
      const additionalConceptsArray = [];
      
      // Also include additional concepts used in dialogues (if they exist)
      const allResetConcepts = [
        ...resetConcepts,
        ...additionalConceptsArray
      ];
      
      console.log(`[KnowledgeStore] Resetting knowledge system with ${allResetConcepts.length} concepts`);
      
      set(state => {
        state.nodes = allResetConcepts;
        state.connections = buildInitialConnections(allResetConcepts);
        state.journalEntries = [];
        state.pendingInsights = [];
        state.newlyDiscovered = [];
        state.activeInsight = null;
        state.constellationVisible = false;
        state.starPoints = 25;
        
        // Recalculate domain mastery
        state.domainMastery = {
          'treatment-planning': 0,
          'radiation-therapy': 0,
          'linac-anatomy': 0,
          'dosimetry': 0
        };
        state.totalMastery = 0;
      });
    },
    
    // SP Economy actions
    addStarPoints: (amount: number, source?: string) => {
      set(state => {
        const previousValue = state.starPoints;
        state.starPoints += amount;
        
        // Emit resource changed event
        try {
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'sp',
              previousValue: previousValue,
              newValue: state.starPoints,
              change: amount,
              source: source || 'system'
            },
            'knowledgeStore.addStarPoints'
          );
        } catch (e) {
          console.error('Error dispatching SP gained event:', e);
        }
      });
    },
    
    spendStarPoints: (amount: number, target?: string): boolean => {
      let success = false;
      
      set(state => {
        // Check if we have enough points
        if (state.starPoints >= amount) {
          const previousValue = state.starPoints;
          state.starPoints -= amount;
          success = true;
          
          // Emit resource changed event
          try {
            safeDispatch(
              GameEventType.RESOURCE_CHANGED,
              {
                resourceType: 'sp',
                previousValue: previousValue,
                newValue: state.starPoints,
                change: -amount,
                source: target || 'system'
              },
              'knowledgeStore.spendStarPoints'
            );
          } catch (e) {
            console.error('Error dispatching SP spent event:', e);
          }
        }
      });
      
      return success;
    },
    
    // Reset all discovered connections - for testing purposes only
    resetConnections: () => {
      set(state => {
        // Create a new array without discovered connections
        const updatedConnections = state.connections.map(conn => ({
          ...conn, 
          discovered: false,
          strength: 0
        }));
        
        return {
          ...state,
          connections: updatedConnections
        };
      });
      
      // Log connection reset for analytics
      analytics.track('debug_reset_connections');
    },
    
    // Unlock a discovered concept by spending SP - Night Phase
    unlockConcept: (conceptId: string): boolean => {
      let success = false;
      
      set(state => {
        const node = state.nodes.find(n => n.id === conceptId);
        
        if (!node) {
          console.warn(`Cannot unlock concept: Concept ${conceptId} not found`);
          return;
        }
        
        if (!node.discovered) {
          console.warn(`Cannot unlock concept: Concept ${conceptId} not yet discovered`);
          return;
        }
        
        if (node.unlocked) {
          console.warn(`Concept ${conceptId} is already unlocked`);
          success = true;
          return;
        }
        
        console.log(`[Knowledge] Attempting to unlock concept: ${conceptId}, name: ${node.name}, SP cost: ${node.spCost}, current SP: ${state.starPoints}`);
        
        // Check if player has enough SP
        if (state.starPoints < node.spCost) {
          console.warn(`Not enough SP to unlock concept ${conceptId}. Required: ${node.spCost}, Available: ${state.starPoints}`);
          return;
        }
        
        // Spend the required SP
        const previousSP = state.starPoints;
        state.starPoints -= node.spCost;
        
        // Mark the concept as unlocked and also activate it
        const nodeIndex = state.nodes.findIndex(n => n.id === conceptId);
        state.nodes[nodeIndex].unlocked = true;
        state.nodes[nodeIndex].active = true; // Automatically activate newly unlocked concepts
        
        // Update connections - only unlocked concepts can form connections
        const updatedConnections = buildInitialConnections(state.nodes);
        state.connections = updatedConnections;
        
        console.log(`[Knowledge] Successfully unlocked concept: ${conceptId}, SP spent: ${node.spCost}, SP remaining: ${state.starPoints}`);
        
        // Count connections for debugging
        const nodeConnections = updatedConnections.filter(c => c.source === conceptId || c.target === conceptId);
        console.log(`[Knowledge] Concept ${conceptId} connected to ${nodeConnections.length} other concepts after unlocking`);
        
        // Recalculate domain mastery
        state.domainMastery = calculateDomainMastery(state.nodes);
        state.totalMastery = calculateTotalMastery(state.domainMastery, state.nodes);
        
        // Log SP expenditure
        try {
          safeDispatch(
            GameEventType.RESOURCE_CHANGED,
            {
              resourceType: 'sp',
              previousValue: previousSP,
              newValue: state.starPoints,
              change: -node.spCost,
              source: `unlock_concept_${conceptId}`
            },
            'knowledgeStore.unlockConcept'
          );
        } catch (e) {
          console.error('Error dispatching SP spent event:', e);
        }
        
        // Emit unlock event
        try {
          safeDispatch(
            CUSTOM_EVENTS.CONCEPT_UNLOCKED,
            { 
              conceptId,
              cost: node.spCost,
              isAutoActivated: true
            },
            'knowledgeStore.unlockConcept'
          );
        } catch (e) {
          console.error('Error dispatching concept unlock event:', e);
        }
        
        success = true;
      });
      
      return success;
    },
    
    // New: Toggle activation state
    setConceptActivation: (conceptId: string, isActive: boolean) => {
      set(state => {
        const node = state.nodes.find(n => n.id === conceptId);
        
        if (!node || !node.discovered) {
          console.warn(`Cannot set activation: Concept ${conceptId} not found or not discovered`);
          return;
        }
        
        if (!node.unlocked) {
          console.warn(`Cannot set activation: Concept ${conceptId} is discovered but not unlocked yet`);
          return;
        }
        
        console.log(`[Knowledge] Setting concept activation: ${conceptId}, name: ${node.name}, active=${isActive}`);
        
        // Mark the concept as active or inactive
        state.nodes[state.nodes.findIndex(n => n.id === conceptId)].active = isActive;
        
        // Emit activation event
        try {
          safeDispatch(
            CUSTOM_EVENTS.CONCEPT_ACTIVATED,
            { conceptId, isActive },
            'knowledgeStore.setConceptActivation'
          );
        } catch (e) {
          console.error('Error dispatching concept activation event:', e);
        }
      });
    },
    
    // New: Check if concept is discovered
    isConceptDiscovered: (conceptId: string) => {
      return get().nodes.some(n => n.id === conceptId && n.discovered);
    },
    
    // New: Check if concept is unlocked
    isConceptUnlocked: (conceptId: string) => {
      return get().nodes.some(n => n.id === conceptId && n.unlocked);
    },
    
    // New: Check if concept is active
    isConceptActive: (conceptId: string) => {
      return get().nodes.some(n => n.id === conceptId && n.active);
    }
  }))
);

// ======== SELECTORS ========
// Chamber Pattern compliant primitive value selectors

/**
 * Selectors for primitive values and derived state
 * These provide performance optimized access to store values
 */
export const selectors = {
  // Simple primitive values
  getTotalMastery: (state: KnowledgeState) => state.totalMastery,
  getActiveInsightId: (state: KnowledgeState) => state.activeInsight,
  getNewlyDiscoveredCount: (state: KnowledgeState) => state.newlyDiscovered.length,
  getPendingInsightCount: (state: KnowledgeState) => state.pendingInsights.length,
  getIsConstellationVisible: (state: KnowledgeState) => state.constellationVisible,
  getJournalEntryCount: (state: KnowledgeState) => state.journalEntries.length,
  getStarPoints: (state: KnowledgeState) => state.starPoints,
  
  // Domain-specific mastery
  getDomainMastery: (domain: KnowledgeDomain) => (state: KnowledgeState) => 
    state.domainMastery[domain] || 0,
  
  // Node-specific mastery
  getConceptMastery: (conceptId: string) => (state: KnowledgeState) => 
    state.nodes.find(n => n.id === conceptId)?.mastery || 0,
  
  isConceptDiscovered: (conceptId: string) => (state: KnowledgeState) => 
    state.nodes.find(n => n.id === conceptId)?.discovered || false,
  
  isNewlyDiscovered: (conceptId: string) => (state: KnowledgeState) => 
    state.newlyDiscovered.includes(conceptId),
  
  // Array filters with stable references
  getDiscoveredNodes: (state: KnowledgeState) => 
    state.nodes.filter(node => node.discovered),
  
  getUndiscoveredNodes: (state: KnowledgeState) => 
    state.nodes.filter(node => !node.discovered),
  
  getDiscoveredConnections: (state: KnowledgeState) => 
    state.connections.filter(conn => conn.discovered),
  
  getNodesByDomain: (domain: KnowledgeDomain) => (state: KnowledgeState) => 
    state.nodes.filter(node => node.domain === domain),
  
  getDiscoveredNodesByDomain: (domain: KnowledgeDomain) => (state: KnowledgeState) => 
    state.nodes.filter(node => node.domain === domain && node.discovered),
  
  getActiveNode: (state: KnowledgeState) => 
    state.activeInsight ? state.nodes.find(n => n.id === state.activeInsight) : null,
  
  getNewlyDiscoveredNodes: (state: KnowledgeState) => 
    state.nodes.filter(node => state.newlyDiscovered.includes(node.id)),
  
  // Connection lookups
  getConnectionsForNode: (nodeId: string) => (state: KnowledgeState) => 
    state.connections.filter(conn => conn.source === nodeId || conn.target === nodeId),
  
  getDiscoveredConnectionsForNode: (nodeId: string) => (state: KnowledgeState) => 
    state.connections.filter(conn => 
      (conn.source === nodeId || conn.target === nodeId) && conn.discovered),
  
  areNodesConnected: (nodeId1: string, nodeId2: string) => (state: KnowledgeState) => 
    state.connections.some(conn => 
      (conn.source === nodeId1 && conn.target === nodeId2) || 
      (conn.source === nodeId2 && conn.target === nodeId1)),
  
  // Journal queries
  getJournalEntriesForConcept: (conceptId: string) => (state: KnowledgeState) => 
    state.journalEntries.filter(entry => entry.conceptId === conceptId),
  
  getRecentJournalEntries: (count: number = 5) => (state: KnowledgeState) => 
    [...state.journalEntries]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count),
  
  // Computed values
  getDiscoveredNodesCount: (state: KnowledgeState) => 
    state.nodes.filter(node => node.discovered).length,
  
  getDiscoveredNodePercentage: (state: KnowledgeState) => 
    (state.nodes.filter(node => node.discovered).length / state.nodes.length) * 100,
  
  getDomainCompletionPercentages: (state: KnowledgeState) => {
    const domainCounts: Record<KnowledgeDomain, {discovered: number, total: number}> = 
      Object.keys(KNOWLEDGE_DOMAINS).reduce((acc, domain) => {
        acc[domain as KnowledgeDomain] = {discovered: 0, total: 0};
        return acc;
      }, {} as Record<KnowledgeDomain, {discovered: number, total: number}>);
    
    // Count nodes per domain
    state.nodes.forEach(node => {
      const domain = node.domain;
      if (domainCounts[domain]) {
        domainCounts[domain].total++;
        if (node.discovered) {
          domainCounts[domain].discovered++;
        }
      }
    });
    
    // Calculate percentages
    const percentages: Record<KnowledgeDomain, number> = 
      Object.keys(domainCounts).reduce((acc, domain) => {
        const counts = domainCounts[domain as KnowledgeDomain];
        acc[domain as KnowledgeDomain] = counts.total > 0
          ? Math.round((counts.discovered / counts.total) * 100)
          : 0;
        return acc;
      }, {} as Record<KnowledgeDomain, number>);
    
    return percentages;
  },
  
  // Node connection suggestions
  getPotentialConnections: (nodeId: string) => (state: KnowledgeState) => {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node || !node.discovered) return [];
    
    return state.nodes
      .filter(n => 
        // Must be discovered
        n.discovered && 
        // Not the same node
        n.id !== nodeId &&
        // Not already connected
        !state.connections.some(conn => 
          (conn.source === nodeId && conn.target === n.id) ||
          (conn.source === n.id && conn.target === nodeId)
        )
      )
      // Sort by relationship strength (same domain first, then by mastery)
      .sort((a, b) => {
        // Same domain bias
        if (a.domain === node.domain && b.domain !== node.domain) return -1;
        if (a.domain !== node.domain && b.domain === node.domain) return 1;
        // Then by mastery
        return b.mastery - a.mastery;
      })
      .slice(0, 5); // Limit to top 5
  }
};

// A wrapper hook to ease migration to the new pattern
export function useKnowledgeData() {
  const {
    totalMastery,
    domainMastery,
    nodes,
    connections,
    newlyDiscovered,
    pendingInsights
  } = useKnowledgeStore(state => ({
    totalMastery: state.totalMastery,
    domainMastery: state.domainMastery,
    nodes: state.nodes,
    connections: state.connections,
    newlyDiscovered: state.newlyDiscovered,
    pendingInsights: state.pendingInsights
  }));
  
  return {
    totalMastery,
    domainMastery,
    discoveredNodes: nodes.filter(n => n.discovered),
    totalNodes: nodes.length,
    discoveredNodeCount: nodes.filter(n => n.discovered).length,
    newlyDiscoveredCount: newlyDiscovered.length,
    hasPendingInsights: pendingInsights.length > 0,
    pendingInsightCount: pendingInsights.length
  };
}

export default useKnowledgeStore;