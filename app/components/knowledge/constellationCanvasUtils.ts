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
  
  // Add star image - try multiple paths
  const starImagePaths = [
    '/icons/star.png',         // Primary path
    '/star.png',               // Root fallback
    '/public/icons/star.png'   // Alternate path
  ];

  // Try loading the star image from each path
  const loadStarImage = (pathIndex = 0) => {
    if (pathIndex >= starImagePaths.length) {
      console.error('Failed to load star image from all paths');
      return;
    }

    const currentPath = starImagePaths[pathIndex];
    const starImage = new window.Image();
    starImage.crossOrigin = 'anonymous';
    
    starImage.onload = () => {
      console.log(`Successfully loaded star image from: ${currentPath}`);
      console.log(`Star dimensions: ${starImage.width}x${starImage.height}`);
      backgroundImages['star'] = starImage;
    };
    
    starImage.onerror = () => {
      console.error(`Failed to load star image from: ${currentPath}, trying next path...`);
      loadStarImage(pathIndex + 1);
    };
    
    starImage.src = currentPath;
  };
  
  // Start loading the star image
  loadStarImage();
  
  // Preload background images
  backgroundPaths.forEach(path => {
    const img = new window.Image();
    img.src = path;
    backgroundImages[path] = img;
  });
  
  // Log successful loading for debugging
  console.log('Constellation images initialized', Object.keys(backgroundImages));
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
  const drawImage = (path: string, opacity: number = 1, scaleMultiplier: number = 1.5) => {
    const img = backgroundImages[path];
    if (img && img.complete && img.naturalHeight !== 0) {
      ctx.globalAlpha = opacity;
      
      // Calculate dimensions to cover the entire canvas while maintaining aspect ratio
      let drawWidth, drawHeight;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = width / height;
      
      // Adjust scale to prevent excessive zooming
      if (canvasRatio > imgRatio) {
        // Canvas is wider than image aspect ratio
        drawWidth = width * scaleMultiplier;
        drawHeight = (width * scaleMultiplier) / imgRatio;
      } else {
        // Canvas is taller than image aspect ratio
        drawHeight = height * scaleMultiplier;
        drawWidth = (height * scaleMultiplier) * imgRatio;
      }
      
      // Center the image
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      ctx.globalAlpha = 1;
    }
  };

  // Draw the base sky with moderate scale
  drawImage('/backgrounds/night-sky.png', 1.0, 1.8);
  
  // Draw the moon with moderate scale
  drawImage('/backgrounds/night-moon.png', 1.0, 1.8);
  
  // Draw the clouds with slightly reduced scale to avoid truncation
  drawImage('/backgrounds/night-clouds.png', 0.8, 1.9);
  drawImage('/backgrounds/night-clouds-2.png', 0.7, 1.9);

  // Fill the entire canvas with stars using buffer zones to ensure full coverage
  const buffer = Math.max(width, height) * 0.1; // 10% buffer zone
  for (let i = 0; i < 500; i++) {
    // Generate stars across the entire canvas plus buffer
    const x = Math.random() * (width + buffer * 2) - buffer;
    const y = Math.random() * (height + buffer * 2) - buffer;
    const radius = Math.random() * 1.5;
    const opacity = Math.random() * 0.5 + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
  }

  // Add nebula effects with better distribution
  for (let i = 0; i < 10; i++) {
    // Distribute nebulae more evenly across the canvas, including edges
    let x, y;
    
    // Divide the canvas into a 3x3 grid and place nebulae in each cell
    const gridX = i % 3;
    const gridY = Math.floor(i / 3) % 3;
    
    // Ensure coverage at edges with some randomness
    x = (width * gridX / 2) + (Math.random() * width / 3);
    y = (height * gridY / 2) + (Math.random() * height / 3);
    
    // Vary the nebula sizes
    const radius = Math.random() * 300 + 200 + (i % 3) * 50;
    const domainKeys = Object.keys(DOMAIN_COLORS);
    const randomDomain = domainKeys[Math.floor(Math.random() * domainKeys.length)] as KnowledgeDomain;
    const color = DOMAIN_COLORS[randomDomain];
    const nebula = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const colorRgba = hexToRgba(color, 0.07);
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
 * 
 * Mastery visualization:
 * 0-25%: Dim, small star (75% size, 40% opacity)
 * 25-50%: Brighter, medium star (85% size, 60% opacity, faint corona)
 * 50-75%: Bright star with corona (100% size, 80% opacity, clear corona)
 * 75-100%: Pulsing brilliant star (110% size, 100% opacity, bright corona, slow pulse)
 * 100%: Vibrant pulsing star (120% size, 100% opacity, vibrant corona, distinct pulse)
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
  
  // Track current animation time for pulsing effects
  const now = Date.now();
  const pulseSpeed = 1500; // 1.5 seconds per pulse cycle
  
  // First draw all node glows (background layer)
  discoveredNodes.forEach(node => {
    if (!node.position) return;

    const domainColor = DOMAIN_COLORS[node.domain];
    const domainLightColor = DOMAIN_COLORS_LIGHT[node.domain];

    const isActiveNode = activeNode?.id === node.id;
    const isSelectedNode = selectedNode?.id === node.id;
    const isPendingConnection = pendingConnection === node.id;
    const isHighlighted = activeNodes.includes(node.id) || newlyDiscovered.includes(node.id);

    // Calculate mastery-based visual properties
    let sizePercent, opacityPercent, coronaEffect = 'none', pulseEffect = false;
    
    // Set base properties according to mastery level
    if (node.mastery < 25) {
      sizePercent = 75;
      opacityPercent = 40;
      coronaEffect = 'none';
      pulseEffect = false;
    } else if (node.mastery < 50) {
      sizePercent = 85;
      opacityPercent = 60;
      coronaEffect = 'faint';
      pulseEffect = false;
    } else if (node.mastery < 75) {
      sizePercent = 100;
      opacityPercent = 80;
      coronaEffect = 'clear';
      pulseEffect = false;
    } else if (node.mastery < 100) {
      sizePercent = 110;
      opacityPercent = 100;
      coronaEffect = 'bright';
      pulseEffect = true;
    } else {
      sizePercent = 120;
      opacityPercent = 100;
      coronaEffect = 'vibrant';
      pulseEffect = true;
    }
    
    // Calculate pulse multiplier (1.0 to 1.2) for pulsing nodes
    const pulseMultiplier = pulseEffect ? 
      1.0 + 0.2 * (Math.sin(now / pulseSpeed * Math.PI * 2) * 0.5 + 0.5) : 1.0;
    
    // Apply pulse to size for pulsing nodes
    sizePercent = sizePercent * pulseMultiplier;
    
    // Calculate final size
    const baseSize = 10 * (sizePercent / 100) * 0.8;
    const size = isActiveNode || isSelectedNode || isPendingConnection || isHighlighted
      ? baseSize * 1.3
      : baseSize;

    // Draw glow/corona based on mastery level
    if (coronaEffect !== 'none' || isActiveNode || isSelectedNode || isPendingConnection || isHighlighted) {
      ctx.beginPath();
      
      // Corona radius based on mastery level and interaction state
      let coronaMultiplier = 1.0;
      switch(coronaEffect) {
        case 'faint': coronaMultiplier = 1.5; break;
        case 'clear': coronaMultiplier = 2.0; break;
        case 'bright': coronaMultiplier = 2.5; break; 
        case 'vibrant': coronaMultiplier = 3.0; break;
        default: coronaMultiplier = 1.0;
      }
      
      // Increase corona for highlighted/interacted nodes
      if (isHighlighted) coronaMultiplier *= 1.5;
      if (isActiveNode || isSelectedNode) coronaMultiplier *= 1.2;
      
      const glowRadius = size * coronaMultiplier;
      ctx.arc(node.position.x, node.position.y, glowRadius, 0, Math.PI * 2);
      
      const glow = ctx.createRadialGradient(
        node.position.x, node.position.y, size * 0.5,
        node.position.x, node.position.y, glowRadius
      );
      
      const color = isHighlighted ? domainLightColor : domainColor;
      // Opacity based on mastery
      const coronaOpacity = opacityPercent / 100;
      
      glow.addColorStop(0, hexToRgba(color, coronaOpacity));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fill();

      // Add outer glow for high mastery and highlighted nodes
      if (coronaEffect === 'bright' || coronaEffect === 'vibrant' || isHighlighted) {
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, glowRadius * 1.5, 0, Math.PI * 2);
        const outerGlow = ctx.createRadialGradient(
          node.position.x, node.position.y, glowRadius,
          node.position.x, node.position.y, glowRadius * 1.5
        );
        outerGlow.addColorStop(0, hexToRgba(domainColor, coronaOpacity * 0.6));
        outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = outerGlow;
        ctx.fill();
      }
      
      // Add animated pulse waves for pulsing stars
      if (pulseEffect) {
        // Create 3 expanding pulse rings for visual interest
        for (let i = 0; i < 3; i++) {
          // Offset each ring in the pulse cycle
          const offset = i * (Math.PI * 2 / 3);
          const pulseProgress = ((now / pulseSpeed + offset) % 1);
          
          // Only draw rings at appropriate times in the cycle
          if (pulseProgress > 0.1 && pulseProgress < 0.9) {
            const pulseRadius = glowRadius * (0.8 + pulseProgress);
            const pulseOpacity = 0.3 * (1 - pulseProgress);
            
            ctx.beginPath();
            ctx.arc(node.position.x, node.position.y, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = hexToRgba(domainLightColor, pulseOpacity);
            ctx.lineWidth = 2 * (1 - pulseProgress);
            ctx.stroke();
          }
        }
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

    // Calculate mastery-based visual properties
    let sizePercent, opacityPercent, coronaEffect = 'none', pulseEffect = false;
    
    // Set base properties according to mastery level
    if (node.mastery < 25) {
      sizePercent = 75;
      opacityPercent = 40;
    } else if (node.mastery < 50) {
      sizePercent = 85;
      opacityPercent = 60;
    } else if (node.mastery < 75) {
      sizePercent = 100;
      opacityPercent = 80;
    } else if (node.mastery < 100) {
      sizePercent = 110;
      opacityPercent = 100;
    } else {
      sizePercent = 120;
      opacityPercent = 100;
    }
    
    // Calculate pulse multiplier for pulsing nodes
    const pulseMultiplier = node.mastery >= 75 ? 
      1.0 + 0.2 * (Math.sin(now / pulseSpeed * Math.PI * 2) * 0.5 + 0.5) : 1.0;
    
    // Apply pulse to size for pulsing nodes
    sizePercent = sizePercent * pulseMultiplier;
    
    // Calculate final size
    const baseSize = 10 * (sizePercent / 100) * 0.8;
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
      ctx.globalAlpha = (opacityPercent / 100) * (isHighlighted ? 1.0 : 0.9);
      
      // Calculate star size and position for center alignment - reduced by 20%
      const starSize = size * 4.0 * 0.8;
      const starX = node.position.x - starSize / 2;
      const starY = node.position.y - starSize / 2;
      
      // Draw the star glow first (larger than the star itself) - reduced by 20%
      const glowSize = starSize * 1.8 * 0.8;
      const glowX = node.position.x - glowSize / 2;
      const glowY = node.position.y - glowSize / 2;
      
      // Draw the glow with a radial gradient
      const glowGradient = ctx.createRadialGradient(
        node.position.x, node.position.y, 0,
        node.position.x, node.position.y, glowSize / 2
      );
      glowGradient.addColorStop(0, hexToRgba(isHighlighted ? domainLightColor : domainColor, 0.9));
      glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, glowSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      // Draw the star image directly without a rectangular overlay
      ctx.globalAlpha = isHighlighted ? 1.0 : 0.9;
      
      // First, draw the star with a color tint
      // Create a temporary canvas for coloring the star
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        // Size the temp canvas to match the star
        tempCanvas.width = starSize;
        tempCanvas.height = starSize;
        
        // Ensure smoothing is disabled for pixel-perfect rendering
        tempCtx.imageSmoothingEnabled = false;
        
        // Draw the star onto the temp canvas
        tempCtx.drawImage(starImg, 0, 0, starSize, starSize);
        
        // Apply color tint using source-in to preserve transparency
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = isHighlighted ? domainLightColor : domainColor;
        tempCtx.fillRect(0, 0, starSize, starSize);
        
        // Draw the colored star onto the main canvas with normal blending
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tempCanvas, starX, starY);
      } else {
        // Fallback if temp canvas creation fails
        ctx.drawImage(starImg, starX, starY, starSize, starSize);
      }
      
      // Add mastery indicator ring on top of the star
      if (node.mastery > 0) {
        ctx.restore(); // Restore to get back to normal blending
        ctx.save(); // Save again for new isolated context
        
        ctx.beginPath();
        const ringRadius = starSize / 1.5;
        // Fixed arc calculation to correctly represent mastery level with proper bounds check
        const masteryPercentage = Math.max(0, Math.min(100, node.mastery)) / 100;
        ctx.arc(
          node.position.x,
          node.position.y,
          ringRadius,
          -Math.PI / 2,
          (Math.PI * 2) * masteryPercentage - Math.PI / 2
        );
        // Make the mastery ring more visible
        ctx.strokeStyle = isHighlighted ? '#FFFFFF' : domainLightColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Show mastery percentage text for better visualization
        if (size > 15) { // Only show text for larger nodes
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `${Math.round(size/2)}px Arial`;
          ctx.fillText(`${Math.round(node.mastery)}%`, node.position.x, node.position.y + ringRadius + 15);
        }
      }
      
      // Restore context
      ctx.restore();
    } else {
      // Fallback if image isn't loaded yet
      console.error('Star image not loaded, using fallback circle. Image status:', 
        starImg ? `complete: ${starImg.complete}, height: ${starImg.naturalHeight}` : 'null');
      
      // Add glow around the fallback circle first
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, size * 3.0, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(
        node.position.x, node.position.y, 0,
        node.position.x, node.position.y, size * 3.0
      );
      glow.addColorStop(0, hexToRgba(domainColor, 0.8));
      glow.addColorStop(0.6, hexToRgba(domainColor, 0.3));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fill();
      
      // Draw a more prominent fallback star shape
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, size * 2.0, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? domainLightColor : domainColor;
      ctx.globalAlpha = (opacityPercent / 100) * 1.2; // Slightly increase visibility
      ctx.fill();
      ctx.globalAlpha = 1.0;
      
      // Add inner highlight for better visibility in fallback
      ctx.beginPath();
      ctx.arc(node.position.x - size * 0.3, node.position.y - size * 0.3, size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
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
