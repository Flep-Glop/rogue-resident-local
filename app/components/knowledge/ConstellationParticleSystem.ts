// app/components/knowledge/ConstellationParticleSystem.ts
/**
 * Enhanced particle system for constellation visualizations
 * Supports standard connection particles and special shooting star effects
 */

import { ConceptNode } from '@/app/store/knowledgeStore';
import { DOMAIN_COLORS } from '@/app/core/themeConstants';

/**
 * Base particle interface with common properties
 */
export interface BaseParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  conceptId?: string;
}

/**
 * Define particle type string literals for type checking
 */
export type ParticleType = 
  | 'discovery' 
  | 'connection' 
  | 'reward' 
  | 'shootingStar' 
  | 'debug-discovery' 
  | 'debug-mastery' 
  | 'debug-connection';

/**
 * Discovery particle - drawn toward concept nodes
 */
export interface DiscoveryParticle extends BaseParticle {
  type: 'discovery';
  targetX: number;
  targetY: number;
}

/**
 * Connection particle - travels along connection paths
 */
export interface ConnectionParticle extends BaseParticle {
  type: 'connection';
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  progress: number;
}

/**
 * Reward particle - special effects for rewards
 */
export interface RewardParticle extends BaseParticle {
  type: 'reward';
  targetX: number;
  targetY: number;
}

/**
 * Shooting star with reward properties
 */
export interface ShootingStarParticle extends BaseParticle {
  type: 'shootingStar';
  angle: number;
  speed: number;
  length: number;
  wasClicked: boolean;
  reward?: {
    type: 'sp' | 'mastery' | 'discovery';
    value: number;
    message: string;
    targetId?: string; 
  };
}

/**
 * Debug visualization particles
 */
export interface DebugParticle extends BaseParticle {
  type: 'debug-discovery' | 'debug-mastery' | 'debug-connection';
  targetX?: number;
  targetY?: number;
}

/**
 * Union type for all particle effects
 */
export type ParticleEffect = 
  | DiscoveryParticle 
  | ConnectionParticle 
  | RewardParticle 
  | ShootingStarParticle
  | DebugParticle;

/**
 * Creates particles for a connection between two nodes
 */
export function createConnectionParticles(
  sourceNode: ConceptNode, 
  targetNode: ConceptNode
): ParticleEffect[] {
  const particles: ParticleEffect[] = [];
  
  if (!sourceNode.position || !targetNode.position) return particles;
  
  // Create particles along the connection path
  for (let i = 0; i < 15; i++) {
    const progress = i / 15;
    const particle: ConnectionParticle = {
      id: `conn-${sourceNode.id}-${targetNode.id}-${i}-${Date.now()}`,
      type: 'connection',
      x: sourceNode.position.x + (targetNode.position.x - sourceNode.position.x) * progress,
      y: sourceNode.position.y + (targetNode.position.y - sourceNode.position.y) * progress,
      sourceX: sourceNode.position.x,
      sourceY: sourceNode.position.y,
      targetX: targetNode.position.x,
      targetY: targetNode.position.y,
      progress: progress,
      color: DOMAIN_COLORS[sourceNode.domain],
      size: 2 + Math.random() * 2,
      life: 60 + Math.floor(Math.random() * 30),
      maxLife: 60 + Math.floor(Math.random() * 30),
      conceptId: sourceNode.id
    };
    
    particles.push(particle);
  }
  
  return particles;
}

/**
 * Creates a shooting star particle with reward functionality
 */
export function createShootingStar(
  x: number, 
  y: number, 
  angle: number, 
  speed: number = 4, 
  length: number = 40,
  reward?: ShootingStarParticle['reward']
): ShootingStarParticle {
  return {
    id: `shooting-star-${Date.now()}-${Math.random()}`,
    type: 'shootingStar',
    x,
    y,
    angle,
    speed,
    length,
    color: 'rgba(255, 255, 255, 0.9)',
    size: 3 + Math.random() * 2,
    life: 200 + Math.floor(Math.random() * 100),
    maxLife: 200 + Math.floor(Math.random() * 100),
    wasClicked: false,
    reward
  };
}

/**
 * Creates a set of random shooting stars across the constellation view
 */
export function createRandomShootingStars(
  width: number, 
  height: number, 
  count: number = 1
): ShootingStarParticle[] {
  const stars: ShootingStarParticle[] = [];
  
  for (let i = 0; i < count; i++) {
    // Randomize starting position from edge of screen
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x = 0, y = 0;
    let angle = 0;
    
    switch (side) {
      case 0: // Top
        x = Math.random() * width;
        y = -20;
        angle = Math.PI / 2 + (Math.random() * 0.5 - 0.25); // Downward with slight angle
        break;
      case 1: // Right
        x = width + 20;
        y = Math.random() * height;
        angle = Math.PI + (Math.random() * 0.5 - 0.25); // Leftward with slight angle
        break;
      case 2: // Bottom
        x = Math.random() * width;
        y = height + 20;
        angle = 3 * Math.PI / 2 + (Math.random() * 0.5 - 0.25); // Upward with slight angle
        break;
      case 3: // Left
        x = -20;
        y = Math.random() * height;
        angle = (Math.random() * 0.5 - 0.25); // Rightward with slight angle
        break;
    }
    
    // Random reward types based on probabilities
    let reward: ShootingStarParticle['reward'] | undefined = undefined;
    
    const rewardRoll = Math.random();
    if (rewardRoll < 0.7) { // 70% chance of reward
      const rewardType = Math.random();
      
      if (rewardType < 0.6) { // 60% chance of SP
        reward = {
          type: 'sp',
          value: 5 + Math.floor(Math.random() * 10), // 5-15 SP
          message: `${5 + Math.floor(Math.random() * 10)} Star Points gained!`
        };
      } else if (rewardType < 0.9) { // 30% chance of mastery
        reward = {
          type: 'mastery',
          value: 5 + Math.floor(Math.random() * 10), // 5-15% mastery
          message: `Mastery boost gained!`
        };
      } else { // 10% chance of discovery
        reward = {
          type: 'discovery',
          value: 1,
          message: `New concept discovered!`
        };
      }
    }
    
    const speed = 3 + Math.random() * 3;
    const length = 30 + Math.random() * 40;
    
    stars.push(createShootingStar(x, y, angle, speed, length, reward));
  }
  
  return stars;
}

/**
 * Updates the particle positions and properties for animation
 */
export function updateParticles(particles: ParticleEffect[]): ParticleEffect[] {
  return particles
    .map(particle => {
      // Common update: decrease life
      particle.life -= 1;

      // Type-specific updates
      if (particle.type === 'discovery' || particle.type === 'reward') {
        // Move discovery particles toward their target
        const dx = (particle as DiscoveryParticle | RewardParticle).targetX - particle.x;
        const dy = (particle as DiscoveryParticle | RewardParticle).targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
          const speed = Math.min(distance * 0.1, 5);
          particle.x += (dx / distance) * speed;
          particle.y += (dy / distance) * speed;
        } else {
          // Arrived at target, fade out faster
          particle.life = Math.min(particle.life, 10);
        }
      } else if (particle.type === 'connection') {
        // Move connection particles along the path
        const connParticle = particle as ConnectionParticle;
        connParticle.progress += 0.02;
        if (connParticle.progress > 1) connParticle.progress = 0;
        
        particle.x = connParticle.sourceX + (connParticle.targetX - connParticle.sourceX) * connParticle.progress;
        particle.y = connParticle.sourceY + (connParticle.targetY - connParticle.sourceY) * connParticle.progress;
      } else if (particle.type === 'shootingStar') {
        // Move shooting star along its trajectory
        const shootingStar = particle as ShootingStarParticle;
        particle.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        particle.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        
        // Check if star has moved off-screen
        if (particle.x < -50 || particle.x > 1050 || particle.y < -50 || particle.y > 1050) {
          particle.life = 0;
        }
      }

      return particle;
    })
    .filter(particle => particle.life > 0);
}

/**
 * Draws particles on the canvas
 */
export function drawParticles(ctx: CanvasRenderingContext2D, particles: ParticleEffect[]): void {
  particles.forEach(particle => {
    ctx.globalAlpha = (particle.life / particle.maxLife) * 0.8;
    
    if (particle.type === 'shootingStar') {
      // Draw shooting star with trail
      const star = particle as ShootingStarParticle;
      const tailX = particle.x - Math.cos(star.angle) * star.length;
      const tailY = particle.y - Math.sin(star.angle) * star.length;
      
      // Create gradient for trail
      const gradient = ctx.createLinearGradient(
        particle.x, particle.y, tailX, tailY
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(100, 100, 255, 0.1)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = star.size;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      
      // Draw bright head
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, star.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw standard particle
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Reset opacity
  ctx.globalAlpha = 1;
}

/**
 * Generates visualization particles for debug purposes
 */
export function generateVisualizationParticles(
  nodes: ConceptNode[],
  visualizationType: 'discovery' | 'mastery' | 'connection',
  count: number = 30
): ParticleEffect[] {
  const particles: ParticleEffect[] = [];
  const discoveredNodes = nodes.filter(n => n.discovered);
  
  if (discoveredNodes.length === 0) return particles;
  
  for (let i = 0; i < count; i++) {
    // Select random node
    const randomNode = discoveredNodes[Math.floor(Math.random() * discoveredNodes.length)];
    if (!randomNode.position) continue;
    
    // Generate particle based on visualization type
    const particle: DebugParticle = {
      id: `debug-${visualizationType}-${i}-${Date.now()}`,
      type: `debug-${visualizationType}` as 'debug-discovery' | 'debug-mastery' | 'debug-connection',
      x: randomNode.position.x + (Math.random() * 200 - 100),
      y: randomNode.position.y + (Math.random() * 200 - 100),
      targetX: randomNode.position.x,
      targetY: randomNode.position.y,
      color: DOMAIN_COLORS[randomNode.domain],
      size: 1 + Math.random() * 3,
      life: 100 + Math.floor(Math.random() * 100),
      maxLife: 100 + Math.floor(Math.random() * 100),
      conceptId: randomNode.id
    };
    
    particles.push(particle);
  }
  
  return particles;
}