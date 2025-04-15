/**
 * Pattern Detection System for Knowledge Constellation
 * Detects when specific patterns (constellations) are formed based on documentation
 */

import { ConceptNode, ConceptConnection, KnowledgeDomain } from '@/app/store/knowledgeStore';
// Replace static import with runtime import for ESM compatibility
// import { nanoid } from 'nanoid';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';

// Helper function to generate a random ID (fallback if nanoid import fails)
const generateId = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Pattern formation type from documentation
export type PatternFormation = 'circuit' | 'triangle' | 'chain' | 'star' | 'grid';

// Pattern reward type from documentation
export interface PatternReward {
  type: 'sp' | 'ability' | 'insight' | 'challenge_bonus';
  value: number | string;  // Amount of SP or name of ability/insight
  description: string;     // Description of the reward
}

// Constellation pattern interface from documentation
export interface ConstellationPattern {
  id: string;                   // Unique identifier
  name: string;                 // Display name
  description: string;          // Description of the pattern meaning
  starIds: string[];            // Stars that form this pattern
  connectionIds: string[];      // Specific connections required
  discovered: boolean;          // Whether player has discovered this pattern
  formation: PatternFormation;  // Geometric shape of pattern
  reward: PatternReward;        // Reward for completing pattern
  hint?: string;                // Optional hint for discovering pattern
}

/**
 * TODO: SP Reward System Integration
 * The Star Points (SP) reward system will be implemented in a future phase.
 * Currently, pattern detection is functional but the reward distribution is deferred.
 * When implementing:
 * 1. Integrate with the useKnowledgeStore.addStarPoints() method
 * 2. Add visual feedback for SP rewards
 * 3. Consider experience scaling based on player progress
 */

// Predefined patterns based on documentation
export const CONSTELLATION_PATTERNS: ConstellationPattern[] = [
  // Quality Assurance Circuit
  {
    id: 'pattern-qa-circuit',
    name: 'Quality Assurance Circuit',
    description: 'Fundamental cycle of quality verification in radiation oncology',
    starIds: ['do-output-cal', 'do-patient-qa', 'tp-plan-qa', 'rt-imaging-guidance'],
    connectionIds: [], // Auto-filled during detection
    discovered: false,
    formation: 'circuit',
    reward: {
      type: 'sp',
      value: 25,
      description: 'Improved accuracy in QA challenges'
    }
  },
  
  // ALARA Principle Triangle
  {
    id: 'pattern-alara',
    name: 'ALARA Principle Triangle',
    description: 'As Low As Reasonably Achievable radiation safety principle',
    starIds: ['do-core', 'tp-dose-constraints', 'rt-patient-pos'],
    connectionIds: [],
    discovered: false,
    formation: 'triangle',
    reward: {
      type: 'sp',
      value: 15,
      description: 'Reduced error rate in safety challenges'
    }
  },
  
  // Treatment Planning Cascade
  {
    id: 'pattern-planning-cascade',
    name: 'Treatment Planning Cascade',
    description: 'Sequential flow of treatment planning process',
    starIds: ['tp-target-volumes', 'tp-prescription', 'tp-plan-eval', 'tp-dvh', 'tp-plan-qa'],
    connectionIds: [],
    discovered: false,
    formation: 'chain',
    reward: {
      type: 'sp',
      value: 30,
      description: 'Improved performance in planning challenges'
    }
  },
  
  // Beam Delivery Precision Star
  {
    id: 'pattern-beam-precision',
    name: 'Beam Delivery Precision Star',
    description: 'Key components for precise beam delivery',
    starIds: ['rt-imrt', 'la-mlc', 'do-small-field', 'la-beam-mod', 'rt-imaging-guidance'],
    connectionIds: [],
    discovered: false,
    formation: 'star',
    reward: {
      type: 'sp',
      value: 35,
      description: 'Unlocks special beam configuration options'
    }
  },
  
  // Plan Optimization Diamond
  {
    id: 'pattern-plan-optimization',
    name: 'Plan Optimization Diamond',
    description: 'Core concepts for optimizing treatment plans',
    starIds: ['tp-plan-eval', 'tp-dvh', 'tp-mco', 'tp-plan-qa'],
    connectionIds: [],
    discovered: false,
    formation: 'circuit',
    reward: {
      type: 'sp',
      value: 20,
      description: 'Improved performance in optimization challenges'
    }
  }
];

/**
 * Checks if a pattern is complete based on discovered nodes and connections
 * @param pattern The pattern to check
 * @param nodes Array of discovered concept nodes
 * @param connections Array of discovered connections
 * @returns Boolean indicating if pattern is complete
 */
export function isPatternComplete(
  pattern: ConstellationPattern,
  nodes: ConceptNode[],
  connections: ConceptConnection[]
): boolean {
  // Check if all required stars are discovered
  const discoveredStarIds = nodes
    .filter(node => node.discovered)
    .map(node => node.id);
  
  const allStarsDiscovered = pattern.starIds.every(id => 
    discoveredStarIds.includes(id)
  );
  
  if (!allStarsDiscovered) return false;
  
  // Check if all required connections exist
  // For patterns without specific connectionIds, check if stars form a connected graph
  if (pattern.connectionIds.length > 0) {
    // Check specific connections
    const discoveredConnectionIds = connections
      .filter(conn => conn.discovered)
      .map(conn => `${conn.source}-${conn.target}`);
    
    return pattern.connectionIds.every(id => 
      discoveredConnectionIds.includes(id)
    );
  } else {
    // Check if stars form the pattern formation type
    return verifyFormation(pattern.formation, pattern.starIds, connections);
  }
}

/**
 * Verifies if connections between stars match the required formation pattern
 */
function verifyFormation(
  formation: PatternFormation,
  starIds: string[],
  connections: ConceptConnection[]
): boolean {
  // Filter connections for only those between pattern stars
  const relevantConnections = connections.filter(conn => 
    conn.discovered && 
    starIds.includes(conn.source) && 
    starIds.includes(conn.target)
  );
  
  // Graph representation for pattern checking
  const graph: Record<string, string[]> = {};
  starIds.forEach(id => graph[id] = []);
  
  // Build graph of connections
  relevantConnections.forEach(conn => {
    if (graph[conn.source]) graph[conn.source].push(conn.target);
    if (graph[conn.target]) graph[conn.target].push(conn.source);
  });
  
  // Check based on formation type
  switch(formation) {
    case 'circuit':
      return verifyCircuit(graph, starIds);
    case 'triangle':
      return verifyTriangle(graph, starIds);
    case 'chain':
      return verifyChain(graph, starIds);
    case 'star':
      return verifyStar(graph, starIds);
    case 'grid':
      return verifyGrid(graph, starIds);
    default:
      return false;
  }
}

/**
 * Verify if nodes form a circuit (closed loop)
 */
function verifyCircuit(graph: Record<string, string[]>, nodeIds: string[]): boolean {
  // A circuit requires each node to have exactly 2 connections
  return nodeIds.every(id => graph[id].length === 2) && 
    isConnected(graph, nodeIds);
}

/**
 * Verify if nodes form a triangle
 */
function verifyTriangle(graph: Record<string, string[]>, nodeIds: string[]): boolean {
  // Triangle needs exactly 3 nodes, each connected to the other 2
  return nodeIds.length === 3 && 
    nodeIds.every(id => graph[id].length === 2) && 
    isConnected(graph, nodeIds);
}

/**
 * Verify if nodes form a chain (linear sequence)
 */
function verifyChain(graph: Record<string, string[]>, nodeIds: string[]): boolean {
  // Chain requires a path where end nodes have 1 connection and others have 2
  const endPointCount = nodeIds.filter(id => graph[id].length === 1).length;
  const middlePointCount = nodeIds.filter(id => graph[id].length === 2).length;
  
  return endPointCount === 2 && 
    middlePointCount === (nodeIds.length - 2) && 
    isConnected(graph, nodeIds);
}

/**
 * Verify if nodes form a star pattern (one center, multiple rays)
 */
function verifyStar(graph: Record<string, string[]>, nodeIds: string[]): boolean {
  // Star requires one center node connected to all others
  const centerNode = nodeIds.find(id => graph[id].length === nodeIds.length - 1);
  const rayNodes = nodeIds.filter(id => id !== centerNode);
  
  return !!centerNode && 
    rayNodes.every(id => graph[id].length === 1 && graph[id].includes(centerNode as string));
}

/**
 * Verify if nodes form a grid pattern
 */
function verifyGrid(graph: Record<string, string[]>, nodeIds: string[]): boolean {
  // Grid requires a connected network with most nodes having multiple connections
  return nodeIds.length >= 4 && 
    nodeIds.filter(id => graph[id].length >= 2).length >= Math.ceil(nodeIds.length * 0.75) && 
    isConnected(graph, nodeIds);
}

/**
 * Check if all nodes form a single connected component
 */
function isConnected(graph: Record<string, string[]>, nodeIds: string[]): boolean {
  if (nodeIds.length === 0) return true;
  
  const visited = new Set<string>();
  
  function dfs(node: string) {
    visited.add(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }
  
  dfs(nodeIds[0]);
  return visited.size === nodeIds.length;
}

/**
 * Detect completed patterns among nodes and connections
 * Note: Reward distribution from patterns is deferred to a future implementation phase
 */
export function detectPatterns(
  nodes: ConceptNode[],
  connections: ConceptConnection[],
  discoveredPatterns: Set<string> = new Set()
): { newPatterns: ConstellationPattern[], allComplete: ConstellationPattern[] } {
  const allCompletePatterns: ConstellationPattern[] = [];
  const newDiscoveries: ConstellationPattern[] = [];
  
  CONSTELLATION_PATTERNS.forEach(pattern => {
    // Skip already discovered patterns
    if (discoveredPatterns.has(pattern.id)) {
      if (isPatternComplete(pattern, nodes, connections)) {
        allCompletePatterns.push(pattern);
      }
      return;
    }
    
    // Check if pattern is newly complete
    if (isPatternComplete(pattern, nodes, connections)) {
      const completedPattern = { ...pattern, discovered: true };
      allCompletePatterns.push(completedPattern);
      newDiscoveries.push(completedPattern);
      
      // Event dispatch for pattern discovery - SP reward will be implemented in future phase
      try {
        safeDispatch(
          GameEventType.PATTERN_DISCOVERED, 
          { 
            patternId: pattern.id,
            patternName: pattern.name,
            // Reward handling deferred to future implementation
            rewardPending: true
          }, 
          'constellation-pattern-system'
        );
      } catch (error) {
        console.error('Error dispatching pattern discovery event:', error);
      }
    }
  });
  
  return {
    newPatterns: newDiscoveries,
    allComplete: allCompletePatterns
  };
}

/**
 * Generate a new random pattern based on the player's current state
 */
export async function generateCustomPattern(
  nodes: ConceptNode[],
  connections: ConceptConnection[]
): Promise<ConstellationPattern | null> {
  // Only consider discovered nodes with sufficient mastery
  const eligibleNodes = nodes.filter(node => 
    node.discovered && node.mastery >= 50
  );
  
  if (eligibleNodes.length < 3) return null;
  
  // Generate a unique ID - use dynamic import for nanoid if possible
  let randomId: string;
  try {
    const nanoidModule = await import('nanoid');
    randomId = nanoidModule.nanoid(6);
  } catch (error) {
    // Fallback to simple random ID if import fails
    randomId = generateId();
  }
  
  // Select 3-5 nodes for the pattern
  const patternSize = Math.floor(Math.random() * 3) + 3; // 3-5 nodes
  const shuffledNodes = [...eligibleNodes].sort(() => Math.random() - 0.5);
  const selectedNodes = shuffledNodes.slice(0, patternSize);
  
  // Choose a formation based on node count
  let formation: PatternFormation;
  if (patternSize === 3) {
    formation = 'triangle';
  } else if (patternSize === 4) {
    formation = Math.random() > 0.5 ? 'circuit' : 'grid';
  } else {
    formation = Math.random() > 0.5 ? 'star' : 'chain';
  }
  
  // Generate a name based on domains of selected nodes
  const domains = selectedNodes.map(n => n.domain);
  const dominantDomain = getDominantDomain(domains);
  const patternName = generatePatternName(dominantDomain, formation);
  
  // Create the pattern
  return {
    id: `pattern-custom-${randomId}`,
    name: patternName,
    description: `A unique pattern revealing insights about ${dominantDomain} concepts`,
    starIds: selectedNodes.map(n => n.id),
    connectionIds: [],
    discovered: false,
    formation,
    reward: {
      type: 'sp',
      value: 15 + patternSize * 5, // 30-40 SP based on size
      description: `Deep insight into ${dominantDomain} concepts`
    },
    hint: `Connect ${patternSize} ${dominantDomain} concepts in a ${formation} pattern`
  };
}

/**
 * Get the most common domain from a list
 */
function getDominantDomain(domains: KnowledgeDomain[]): KnowledgeDomain {
  const counts: Record<string, number> = {};
  domains.forEach(domain => {
    counts[domain] = (counts[domain] || 0) + 1;
  });
  
  let maxDomain = domains[0];
  let maxCount = 0;
  
  Object.entries(counts).forEach(([domain, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxDomain = domain as KnowledgeDomain;
    }
  });
  
  return maxDomain;
}

/**
 * Generate a thematic name for the pattern
 */
function generatePatternName(domain: KnowledgeDomain, formation: PatternFormation): string {
  const formationNames: Record<PatternFormation, string[]> = {
    'circuit': ['Circuit', 'Loop', 'Cycle', 'Orbit'],
    'triangle': ['Triangle', 'Triad', 'Trinity', 'Pyramid'],
    'chain': ['Chain', 'Sequence', 'Cascade', 'Stream'],
    'star': ['Star', 'Radiance', 'Brilliance', 'Nova'],
    'grid': ['Grid', 'Matrix', 'Network', 'Lattice']
  };
  
  const domainAdjectives: Record<KnowledgeDomain, string[]> = {
    'treatment-planning': ['Planning', 'Strategic', 'Preparatory', 'Targeting'],
    'radiation-therapy': ['Therapeutic', 'Healing', 'Curative', 'Treatment'],
    'linac-anatomy': ['Mechanical', 'Structural', 'Framework', 'Foundational'],
    'dosimetry': ['Measurement', 'Precision', 'Calibration', 'Quantification']
  };
  
  const randomFormation = formationNames[formation][Math.floor(Math.random() * formationNames[formation].length)];
  const randomAdjective = domainAdjectives[domain][Math.floor(Math.random() * domainAdjectives[domain].length)];
  
  return `${randomAdjective} ${randomFormation}`;
} 