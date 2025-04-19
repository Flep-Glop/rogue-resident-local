/**
 * Layout system for the Knowledge Constellation
 * Implements hybrid orbital-quadrant layout as described in the documentation
 */

import { ConceptNode, KnowledgeDomain } from '@/app/store/knowledgeStore';

// Orbit information from documentation
export interface OrbitConfig {
  orbitLevel: number;     // 0, 1, 2, or 3
  minRadius: number;      // Minimum radius from center
  maxRadius: number;      // Maximum radius from center
  name: string;           // Display name of the orbit
}

// Orbital configuration as per documentation
export const ORBIT_LEVELS: OrbitConfig[] = [
  { orbitLevel: 0, minRadius: 0, maxRadius: 100, name: "Core" },
  { orbitLevel: 1, minRadius: 175, maxRadius: 275, name: "Intermediate" },
  { orbitLevel: 2, minRadius: 350, maxRadius: 450, name: "Advanced" },
  { orbitLevel: 3, minRadius: 525, maxRadius: 625, name: "Specialized" }
];

// Helper function to build domain angles from knowledge domains
export function buildDomainAngles(knowledgeDomains: Record<string, {angle: number}>): Record<string, number> {
  return Object.entries(knowledgeDomains)
    .reduce((acc, [domain, config]) => {
      acc[domain] = config.angle;
      return acc;
    }, {} as Record<string, number>);
}

/**
 * Layout function that applies the hybrid orbital-quadrant layout to nodes
 * @param nodes Array of concept nodes to lay out
 * @param domainAngles Domain angles for positioning
 * @returns Nodes with position property set using orbital-quadrant layout
 */
export function applyOrbitalQuadrantLayout(
  nodes: ConceptNode[], 
  domainAngles: Record<string, number>
): ConceptNode[] {
  const result = [...nodes];
  
  // Group nodes by domain for quadrant placement
  const domainGroups: Record<string, ConceptNode[]> = {};
  
  // Find core nodes (orbit 0) first
  const coreNodes = result.filter(node => 
    // Ensure all nodes have an explicit orbit value
    node.orbit === 0
  );
  
  // Group nodes by domain for quadrant placement
  result.forEach(node => {
    const domain = node.domain;
    if (!domainGroups[domain]) {
      domainGroups[domain] = [];
    }
    domainGroups[domain].push(node);
  });
  
  // Process each domain group separately
  Object.entries(domainGroups).forEach(([domain, domainNodes]) => {
    // Default to first domain if not found
    const domainAngle = domainAngles[domain] || Object.values(domainAngles)[0];
    
    // First sort by orbit to ensure proper layering
    domainNodes.sort((a, b) => {
      // Get orbit value - we now require this to be explicitly set
      const orbitA = a.orbit;
      const orbitB = b.orbit;
      return orbitA - orbitB;
    });
    
    // Then position each node according to its orbit and domain
    domainNodes.forEach(node => {
      const orbitLevel = node.orbit;
      
      // Get orbit configuration
      const orbit = ORBIT_LEVELS[orbitLevel];
      
      // Calculate radius within orbit range - add some variance but respect min/max
      const radius = orbit.minRadius + 
        (Math.random() * 0.7 + 0.15) * (orbit.maxRadius - orbit.minRadius);
      
      // Calculate angular position based on domain and clustering
      // More precise clustering for higher orbits - reduced clustering factor to spread stars
      const clusteringFactor = orbitLevel === 0 ? 30 : 20 / (orbitLevel + 1);
      const angleDeviation = (Math.random() - 0.5) * clusteringFactor;
      const angle = (domainAngle + angleDeviation) * (Math.PI / 180);
      
      // Calculate position
      node.position = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    });
  });
  
  // Handle core nodes specially to ensure they're at the center
  coreNodes.forEach((node, index) => {
    const angleIncrement = (Math.PI * 2) / Math.max(1, coreNodes.length);
    const angle = index * angleIncrement;
    const radius = 30 + Math.random() * 40; // Increased radius for core
    
    node.position = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });
  
  // Apply collision detection and resolution
  resolveCollisions(result);
  
  return result;
}

/**
 * Resolve collisions between nodes to ensure they don't overlap
 * Enhanced with orbit respect - nodes should stay in their orbits
 */
function resolveCollisions(nodes: ConceptNode[]): void {
  const minDistance = 80; // Minimum distance between nodes (increased from 60)
  
  // Simple repulsion algorithm with orbit constraints
  for (let i = 0; i < 8; i++) { // Apply more iterations for better results (increased from 5)
    for (let a = 0; a < nodes.length; a++) {
      const nodeA = nodes[a];
      if (!nodeA.position) continue;
      
      for (let b = a + 1; b < nodes.length; b++) {
        const nodeB = nodes[b];
        if (!nodeB.position) continue;
        
        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          // Calculate repulsion force - increased strength
          const repulsionForce = (minDistance - distance) / 1.5; // Increased force (was /2)
          const angle = Math.atan2(dy, dx);
          
          // Apply repulsion to both nodes in opposite directions
          if (distance > 0) { // Avoid division by zero
            nodeA.position.x -= Math.cos(angle) * repulsionForce;
            nodeA.position.y -= Math.sin(angle) * repulsionForce;
            nodeB.position.x += Math.cos(angle) * repulsionForce;
            nodeB.position.y += Math.sin(angle) * repulsionForce;
          }
        }
      }
    }
  }
  
  // Constrain nodes to stay within their orbital ranges
  nodes.forEach(node => {
    if (!node.position) return;
    
    const orbitLevel = node.orbit;
    const orbit = ORBIT_LEVELS[orbitLevel];
    
    // Get current distance from center
    const distance = Math.sqrt(
      node.position.x * node.position.x + 
      node.position.y * node.position.y
    );
    
    // If outside orbit range, constrain it
    if (distance < orbit.minRadius || distance > orbit.maxRadius) {
      const targetDistance = distance < orbit.minRadius
        ? orbit.minRadius
        : orbit.maxRadius;
      
      const scale = targetDistance / distance;
      node.position.x *= scale;
      node.position.y *= scale;
    }
  });
}

/**
 * Checks if a node is at a particular orbit level
 * @param node The node to check
 * @param orbitLevel The orbit level to check for
 */
export function isNodeInOrbit(node: ConceptNode, orbitLevel: number): boolean {
  // Check explicit orbit property - this is now required
  return node.orbit === orbitLevel;
}

/**
 * Gets the quadrant a node is in based on its position
 */
export function getNodeQuadrant(
  node: ConceptNode, 
  domainAngles: Record<string, number>
): KnowledgeDomain | null {
  if (!node.position) return null;
  
  // Calculate angle in degrees
  const angle = (Math.atan2(node.position.y, node.position.x) * 180 / Math.PI + 360) % 360;
  
  // Find domain with closest angle
  let closestDomain: KnowledgeDomain | null = null;
  let closestAngleDiff = 360;
  
  Object.entries(domainAngles).forEach(([domain, domainAngle]) => {
    const diff = Math.min(
      Math.abs(angle - domainAngle),
      Math.abs(angle - (domainAngle + 360))
    );
    
    if (diff < closestAngleDiff) {
      closestAngleDiff = diff;
      closestDomain = domain as KnowledgeDomain;
    }
  });
  
  return closestDomain;
}

/**
 * Updates node positions to ensure all nodes are properly placed
 * This is useful for newly discovered nodes that haven't been positioned yet
 * @param nodes Array of all nodes
 * @param domainAngles Domain angles for positioning
 * @returns Nodes with updated positions
 */
export function updateNodePositions(
  nodes: ConceptNode[],
  domainAngles: Record<string, number>
): ConceptNode[] {
  // Nodes that need positions assigned
  const unpositionedNodes = nodes.filter(node => node.discovered && !node.position);
  
  if (unpositionedNodes.length === 0) {
    return nodes; // Nothing to do
  }
  
  // Copy nodes to avoid mutating original
  const updatedNodes = [...nodes];
  
  // Group nodes by domain for quadrant placement
  const domainGroups: Record<string, ConceptNode[]> = {};
  
  // Collect nodes by domain
  unpositionedNodes.forEach(node => {
    const domain = node.domain;
    if (!domainGroups[domain]) {
      domainGroups[domain] = [];
    }
    domainGroups[domain].push(node);
  });
  
  // Position nodes by domain
  Object.entries(domainGroups).forEach(([domain, domainNodes]) => {
    const domainAngle = domainAngles[domain] || Object.values(domainAngles)[0];
    
    domainNodes.forEach(node => {
      const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
      if (nodeIndex === -1) return;
      
      const orbitLevel = node.orbit;
      const orbit = ORBIT_LEVELS[orbitLevel];
      
      // Calculate radius with some randomness
      const radius = orbit.minRadius + 
        (Math.random() * 0.7 + 0.15) * (orbit.maxRadius - orbit.minRadius);
      
      // Calculate angle with domain clustering
      const clusteringFactor = orbitLevel === 0 ? 30 : 20 / (orbitLevel + 1);
      const angleDeviation = (Math.random() - 0.5) * clusteringFactor;
      const angle = (domainAngle + angleDeviation) * (Math.PI / 180);
      
      // Assign position
      updatedNodes[nodeIndex].position = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    });
  });
  
  // Apply collision resolution to avoid overlaps
  resolveCollisions(updatedNodes);
  
  return updatedNodes;
} 