// app/components/knowledge/constellationCanvasUtils.ts
'use client';

import { KnowledgeDomain, ConceptNode, ConceptConnection } from '../../store/knowledgeStore';
import { DOMAIN_COLORS, DOMAIN_COLORS_LIGHT } from '../../core/themeConstants';

// Helper type for particle effects
type ParticleEffect = {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  opacity?: number;
  velocity?: { x: number, y: number }
};

/**
 * Converts a hex color string to an rgba string.
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Cache background images - only initialize in browser environment
const backgroundImages: {[key: string]: HTMLImageElement | null} = {};
const backgroundPaths = [
  '/backgrounds/night-sky.png',
  '/backgrounds/night-moon.png',
  '/backgrounds/night-clouds.png',
  '/backgrounds/night-clouds-2.png'
];

// Function to initialize images - only call this in browser context
export const initializeImages = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Add star image
  try {
    const starImage = new window.Image();
    starImage.src = '/icons/star.png';  // Fix path to use /icons/ directory
    starImage.crossOrigin = 'anonymous'; // Add cross-origin handling if needed
    backgroundImages['star'] = starImage;
    
    // Preload background images
    backgroundPaths.forEach(path => {
      const img = new window.Image();
      img.src = path;
      backgroundImages[path] = img;
    });
    
    // Log successful loading for debugging
    console.log('Constellation images initialized', Object.keys(backgroundImages));
  } catch (err) {
    console.error('Error initializing images:', err);
  }
};

/**
 * Draws a starry background with night sky images.
 */
export const drawStarryBackground = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  // Disable image smoothing for pixel-perfect rendering
  ctx.imageSmoothingEnabled = false;
  
  // Fill with deep space color
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  // Draw the layered night sky images
  const drawImage = (path: string, opacity: number = 1) => {
    const img = backgroundImages[path];
    if (img && img.complete && img.naturalHeight !== 0) {
      ctx.globalAlpha = opacity;
      
      // Calculate dimensions to cover the entire canvas while maintaining aspect ratio
      let drawWidth, drawHeight;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = width / height;
      
      if (canvasRatio > imgRatio) {
        // Canvas is wider than image aspect ratio
        drawWidth = width;
        drawHeight = width / imgRatio;
      } else {
        // Canvas is taller than image aspect ratio
        drawHeight = height;
        drawWidth = height * imgRatio;
      }
      
      // Center the image
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      ctx.globalAlpha = 1;
    }
  };

  // Draw the base sky
  drawImage('/backgrounds/night-sky.png');
  
  // Draw the moon with full opacity
  drawImage('/backgrounds/night-moon.png');
  
  // Draw the clouds with slight transparency
  drawImage('/backgrounds/night-clouds.png', 0.8);
  drawImage('/backgrounds/night-clouds-2.png', 0.7);

  // Create distant stars for additional effect
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.2;
    const opacity = Math.random() * 0.5 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
  }

  // Add subtle nebula effect
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 150 + 100;
    const domainKeys = Object.keys(DOMAIN_COLORS);
    const randomDomain = domainKeys[Math.floor(Math.random() * domainKeys.length)] as KnowledgeDomain;
    const color = DOMAIN_COLORS[randomDomain];
    const nebula = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const colorRgba = hexToRgba(color, 0.05);
    nebula.addColorStop(0, colorRgba);
    nebula.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);
  }
};

/**
 * Draws the connections between discovered concept nodes.
 */
export const drawConnections = (
  ctx: CanvasRenderingContext2D,
  discoveredConnections: ConceptConnection[],
  discoveredNodes: ConceptNode[],
  selectedNode: ConceptNode | null,
  pendingConnection: string | null
): void => {
  discoveredConnections.forEach(connection => {
    const sourceNode = discoveredNodes.find(n => n.id === connection.source);
    const targetNode = discoveredNodes.find(n => n.id === connection.target);

    if (sourceNode && targetNode && sourceNode.position && targetNode.position) {
      const isActive =
        (selectedNode?.id === sourceNode.id || selectedNode?.id === targetNode.id) ||
        (pendingConnection === sourceNode.id || pendingConnection === targetNode.id);

      const opacity = connection.strength / 200 + 0.3;
      const width = connection.strength / 100 * 2 + 1;

      const sourceColor = DOMAIN_COLORS[sourceNode.domain];
      const targetColor = DOMAIN_COLORS[targetNode.domain];
      const gradient = ctx.createLinearGradient(
        sourceNode.position.x, sourceNode.position.y,
        targetNode.position.x, targetNode.position.y
      );
      gradient.addColorStop(0, sourceColor);
      gradient.addColorStop(1, targetColor);

      ctx.beginPath();
      ctx.moveTo(sourceNode.position.x, sourceNode.position.y);
      ctx.lineTo(targetNode.position.x, targetNode.position.y);

      if (isActive) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = width + 1;
        ctx.globalAlpha = opacity + 0.2;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = gradient;
        ctx.lineWidth = width;
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  });
};

/**
 * Draws the concept nodes on the canvas using star images.
 */
export const drawNodes = (
  ctx: CanvasRenderingContext2D,
  discoveredNodes: ConceptNode[],
  activeNode: ConceptNode | null,
  selectedNode: ConceptNode | null,
  pendingConnection: string | null,
  activeNodes: string[],
  newlyDiscovered: string[],
  showLabels: boolean
): void => {
  // Ensure image smoothing is disabled for pixel-perfect rendering
  ctx.imageSmoothingEnabled = false;
  
  // First draw all node glows (background layer)
  discoveredNodes.forEach(node => {
    if (!node.position) return;

    const domainColor = DOMAIN_COLORS[node.domain];
    const domainLightColor = DOMAIN_COLORS_LIGHT[node.domain];

    const isActiveNode = activeNode?.id === node.id;
    const isSelectedNode = selectedNode?.id === node.id;
    const isPendingConnection = pendingConnection === node.id;
    const isHighlighted = activeNodes.includes(node.id) || newlyDiscovered.includes(node.id);

    const baseSize = 10 + (node.mastery / 100) * 10;
    const size = isActiveNode || isSelectedNode || isPendingConnection || isHighlighted
      ? baseSize * 1.3
      : baseSize;

    // Draw glow for active/highlighted nodes
    if (isActiveNode || isSelectedNode || isPendingConnection || isHighlighted) {
      ctx.beginPath();
      const glowRadius = isHighlighted ? size * 3.0 : size * 2.0;
      ctx.arc(node.position.x, node.position.y, glowRadius, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(
        node.position.x, node.position.y, size * 0.5,
        node.position.x, node.position.y, glowRadius
      );
      const color = isHighlighted ? domainLightColor : domainColor;
      glow.addColorStop(0, color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fill();

      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, glowRadius * 1.5, 0, Math.PI * 2);
        const outerGlow = ctx.createRadialGradient(
          node.position.x, node.position.y, glowRadius,
          node.position.x, node.position.y, glowRadius * 1.5
        );
        outerGlow.addColorStop(0, hexToRgba(domainColor, 0.4));
        outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = outerGlow;
        ctx.fill();
      }
    }
  });
  
  // Now draw all node stars (foreground layer) - this separates the layers for better z-order
  discoveredNodes.forEach(node => {
    if (!node.position) return;

    const domainColor = DOMAIN_COLORS[node.domain];
    const domainLightColor = DOMAIN_COLORS_LIGHT[node.domain];

    const isActiveNode = activeNode?.id === node.id;
    const isSelectedNode = selectedNode?.id === node.id;
    const isPendingConnection = pendingConnection === node.id;
    const isHighlighted = activeNodes.includes(node.id) || newlyDiscovered.includes(node.id);

    const baseSize = 10 + (node.mastery / 100) * 10;
    const size = isActiveNode || isSelectedNode || isPendingConnection || isHighlighted
      ? baseSize * 1.3
      : baseSize;

    // Draw node using star image instead of a circle
    const starImg = backgroundImages['star'];
    if (starImg && starImg.complete && starImg.naturalHeight !== 0) {
      // Save context to isolate color modifications
      ctx.save();
      
      // Apply shadow effects for better visibility
      ctx.shadowColor = isHighlighted ? domainLightColor : domainColor;
      ctx.shadowBlur = isHighlighted ? 15 : 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Set blending for better color application
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = isHighlighted ? 1.0 : 0.9;
      
      // Calculate star size and position for center alignment - much larger stars
      const starSize = size * 6.0; // Significantly increased size
      const starX = node.position.x - starSize / 2;
      const starY = node.position.y - starSize / 2;
      
      // Draw the star image
      ctx.drawImage(starImg, starX, starY, starSize, starSize);
      
      // Add color overlay matching the domain
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = isHighlighted ? domainLightColor : domainColor;
      ctx.fillRect(starX, starY, starSize, starSize);
      
      // Add mastery indicator ring on top of the star
      if (node.mastery > 0) {
        ctx.restore(); // Restore to get back to normal blending
        ctx.save(); // Save again for new isolated context
        
        ctx.beginPath();
        const ringRadius = starSize / 1.5;
        ctx.arc(
          node.position.x,
          node.position.y,
          ringRadius,
          -Math.PI / 2,
          (Math.PI * 2) * (node.mastery / 100) - Math.PI / 2
        );
        ctx.strokeStyle = isHighlighted ? '#FFFFFF' : domainLightColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Restore context
      ctx.restore();
    } else {
      // Fallback if image isn't loaded yet
      console.log('Star image not loaded, using fallback circle');
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, size * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? domainLightColor : domainColor;
      ctx.fill();
      
      // Add inner highlight for better visibility in fallback
      ctx.beginPath();
      ctx.arc(node.position.x - size * 0.3, node.position.y - size * 0.3, size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
      
      // Add mastery indicator ring
      if (node.mastery > 0) {
        ctx.beginPath();
        ctx.arc(
          node.position.x,
          node.position.y,
          size * 1.8,
          -Math.PI / 2,
          (Math.PI * 2) * (node.mastery / 100) - Math.PI / 2
        );
        ctx.strokeStyle = domainLightColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    // Draw labels
    if ((isActiveNode || isSelectedNode || isHighlighted || showLabels)) {
      const isTemporaryLabel = isActiveNode && !isSelectedNode && !isHighlighted && !showLabels;
      ctx.font = '12px "Press Start 2P", monospace';
      const textWidth = ctx.measureText(node.name).width;
      const padding = 4;
      const rectX = node.position.x - textWidth / 2 - padding;
      const rectY = node.position.y + size * 3; // Position label below the star
      
      // Label background
      ctx.fillStyle = isTemporaryLabel ? 'rgba(26, 30, 36, 0.6)' : 'rgba(26, 30, 36, 0.8)';
      ctx.fillRect(rectX, rectY, textWidth + padding * 2, 18);
      
      // Label text
      ctx.fillStyle = isHighlighted ? '#FFFFFF' : domainColor;
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.position.x, rectY + 14);
      
      // Label accent color strip
      ctx.fillStyle = domainColor;
      ctx.fillRect(node.position.x - textWidth / 2 - padding, rectY, 3, 18);
    }
  });
};

/**
 * Draws the dashed line indicating a pending connection.
 */
export const drawPendingConnection = (
  ctx: CanvasRenderingContext2D,
  discoveredNodes: ConceptNode[],
  pendingConnection: string | null,
  activeNode: ConceptNode | null
): void => {
  if (pendingConnection && activeNode) {
    const sourceNode = discoveredNodes.find(n => n.id === pendingConnection);
    if (sourceNode && sourceNode.position && activeNode.position) {
      ctx.beginPath();
      ctx.moveTo(sourceNode.position.x, sourceNode.position.y);
      ctx.lineTo(activeNode.position.x, activeNode.position.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
};

/**
 * Draws the particle effects on the canvas.
 */
export const drawParticles = (
  ctx: CanvasRenderingContext2D,
  particleEffects: ParticleEffect[]
): void => {
  particleEffects.forEach(particle => {
    ctx.beginPath();
    const opacity = particle.opacity !== undefined
      ? particle.opacity
      : particle.life / particle.maxLife;
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(particle.color, opacity);
    ctx.fill();
  });
};
