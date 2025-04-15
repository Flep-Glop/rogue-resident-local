// app/components/extensions/types/AnatomicalIdentification.tsx
'use client';

/**
 * Anatomical Identification Extension
 * 
 * Allows users to identify anatomical structures on medical images.
 * Implements Chamber Pattern for performance optimization.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';

interface AnatomicalStructure {
  id: string;
  name: string;
  labelPosition: { x: number; y: number };
  regions: Array<{ x: number; y: number; radius: number }>;
  isCritical: boolean;
  description?: string;
}

interface AnatomicalIdentificationContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  structures: AnatomicalStructure[];
  conceptId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain: string;
  hint?: string;
}

interface AnatomicalIdentificationProps {
  content: AnatomicalIdentificationContent;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Anatomical Identification Component
 * 
 * Provides an interactive interface for identifying anatomical structures on medical images
 */
const AnatomicalIdentification: React.FC<AnatomicalIdentificationProps> = ({
  content,
  characterId,
  stageId,
  additionalProps,
  onComplete
}) => {
  // Mount tracking ref
  const isMountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Component state
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [identifiedStructures, setIdentifiedStructures] = useState<string[]>([]);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Animation state
  const [animating, setAnimating] = useState(false);
  
  // Load and initialize image
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const img = new Image();
    img.src = content.imageUrl;
    
    img.onload = () => {
      if (!isMountedRef.current) return;
      
      imageRef.current = img;
      setLoading(false);
      
      // Initialize canvas with image
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Set initial canvas dimensions
          canvasRef.current.width = content.imageWidth;
          canvasRef.current.height = content.imageHeight;
          
          // Draw initial image
          drawCanvas();
        }
      }
    };
    
    img.onerror = () => {
      if (!isMountedRef.current) return;
      
      setLoading(false);
      setFeedbackMessage('Error loading image');
    };
    
    return () => {
      // Clean up image reference
      imageRef.current = null;
    };
  }, [content.imageUrl, content.imageWidth, content.imageHeight]);
  
  // Function to draw on canvas - implemented with the Chamber Pattern
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !isMountedRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply scaling and translation for zoom/pan
    ctx.save();
    ctx.translate(panPosition.x, panPosition.y);
    ctx.scale(zoomLevel, zoomLevel);
    
    // Draw the image
    ctx.drawImage(imageRef.current, 0, 0, content.imageWidth, content.imageHeight);
    
    // Draw identified structures
    identifiedStructures.forEach(structId => {
      const structure = content.structures.find(s => s.id === structId);
      if (!structure) return;
      
      // Draw each region of the structure
      structure.regions.forEach(region => {
        ctx.beginPath();
        ctx.arc(region.x, region.y, region.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue, semi-transparent
        ctx.fill();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      
      // Draw label
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.strokeText(structure.name, structure.labelPosition.x, structure.labelPosition.y);
      ctx.fillText(structure.name, structure.labelPosition.x, structure.labelPosition.y);
    });
    
    // Draw current click position if applicable
    if (clickPosition) {
      ctx.beginPath();
      ctx.arc(clickPosition.x, clickPosition.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // If in completed state, highlight all structures
    if (submitted) {
      content.structures.forEach(structure => {
        const wasIdentified = identifiedStructures.includes(structure.id);
        
        // Set colors based on whether structure was identified
        const fillColor = wasIdentified 
          ? 'rgba(16, 185, 129, 0.3)' // Green for correct
          : 'rgba(239, 68, 68, 0.3)'; // Red for missed
          
        const strokeColor = wasIdentified
          ? 'rgba(16, 185, 129, 0.8)'
          : 'rgba(239, 68, 68, 0.8)';
        
        // Draw each region
        structure.regions.forEach(region => {
          ctx.beginPath();
          ctx.arc(region.x, region.y, region.radius, 0, Math.PI * 2);
          ctx.fillStyle = fillColor;
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        
        // Draw label
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.strokeText(structure.name, structure.labelPosition.x, structure.labelPosition.y);
        ctx.fillText(structure.name, structure.labelPosition.x, structure.labelPosition.y);
      });
    }
    
    // If showing hint, outline key structures
    if (showHint && !submitted) {
      // Get first unidentified critical structure
      const unidentifiedCritical = content.structures.find(
        s => s.isCritical && !identifiedStructures.includes(s.id)
      );
      
      if (unidentifiedCritical) {
        // Hint visualization - pulsing outline for critical structure
        unidentifiedCritical.regions.forEach(region => {
          ctx.beginPath();
          ctx.arc(region.x, region.y, region.radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'; // Amber, pulsing
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }
    }
    
    // Restore context
    ctx.restore();
    
  }, [
    content.structures, 
    content.imageWidth, 
    content.imageHeight, 
    identifiedStructures, 
    clickPosition, 
    zoomLevel, 
    panPosition, 
    submitted, 
    showHint
  ]);
  
  // Re-draw canvas when dependencies change
  useEffect(() => {
    if (canvasRef.current && imageRef.current) {
      drawCanvas();
    }
  }, [
    drawCanvas, 
    identifiedStructures, 
    clickPosition, 
    zoomLevel, 
    panPosition, 
    submitted, 
    showHint
  ]);
  
  // Handle canvas click for structure identification
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || submitted || !isMountedRef.current) return;
    
    // If dragging, don't register as a click
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position in canvas coordinates
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Adjust for pan and zoom
    const adjustedX = (canvasX - panPosition.x) / zoomLevel;
    const adjustedY = (canvasY - panPosition.y) / zoomLevel;
    
    // Update click position
    setClickPosition({ x: adjustedX, y: adjustedY });
    
    // Check if click is within any structure region
    let matchFound = false;
    
    for (const structure of content.structures) {
      // Skip if already identified
      if (identifiedStructures.includes(structure.id)) continue;
      
      // Check each region of the structure
      for (const region of structure.regions) {
        const distance = Math.sqrt(
          Math.pow(region.x - adjustedX, 2) + 
          Math.pow(region.y - adjustedY, 2)
        );
        
        // If click is within region, mark as identified
        if (distance <= region.radius) {
          setIdentifiedStructures(prev => [...prev, structure.id]);
          setSelectedStructureId(structure.id);
          setFeedbackMessage(`Identified: ${structure.name}`);
          matchFound = true;
          break;
        }
      }
      
      if (matchFound) break;
    }
    
    if (!matchFound) {
      setFeedbackMessage('No structure identified at this location');
    }
    
  }, [
    content.structures, 
    identifiedStructures, 
    isDragging, 
    zoomLevel, 
    panPosition, 
    submitted
  ]);
  
  // Handle canvas mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || submitted) return;
    
    // Only use left mouse button
    if (e.button !== 0) return;
    
    // Start dragging
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Update cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  }, [submitted]);
  
  // Handle canvas mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDragging) return;
    
    // Calculate drag distance
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Update pan position
    setPanPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    // Update drag start
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);
  
  // Handle canvas mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (!canvasRef.current) return;
    
    // End dragging
    setIsDragging(false);
    
    // Reset cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair';
    }
  }, []);
  
  // Handle canvas mouse leave
  const handleMouseLeave = useCallback(() => {
    if (!canvasRef.current) return;
    
    // End dragging
    setIsDragging(false);
    
    // Reset cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair';
    }
  }, []);
  
  // Handle zoom in button
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  }, []);
  
  // Handle zoom out button
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  }, []);
  
  // Handle reset view button
  const handleResetView = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);
  
  // Handle toggle hint button
  const handleToggleHint = useCallback(() => {
    setShowHint(prev => !prev);
    
    if (!showHint) {
      setFeedbackMessage(content.hint || "Look for structures outlined in yellow");
      
      // Log hint usage
      safeDispatch(
        GameEventType.EXTENSION_HINT_USED,
        {
          type: 'anatomical-identification',
          contentId: content.id,
          characterId,
          stageId
        },
        'AnatomicalIdentification'
      );
    } else {
      setFeedbackMessage(null);
    }
  }, [
    showHint, 
    content.hint, 
    content.id,
    characterId,
    stageId
  ]);
  
  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    try {
      setSubmitted(true);
      
      // Calculate results
      const totalStructures = content.structures.length;
      const criticalStructures = content.structures.filter(s => s.isCritical).length;
      
      const identifiedCount = identifiedStructures.length;
      const identifiedCriticalCount = content.structures
        .filter(s => s.isCritical && identifiedStructures.includes(s.id))
        .length;
      
      // Calculate accuracy scores
      const overallScore = totalStructures > 0 ? identifiedCount / totalStructures : 0;
      const criticalScore = criticalStructures > 0 ? identifiedCriticalCount / criticalStructures : 1;
      
      // Weight critical structures more heavily
      const accuracyScore = criticalStructures > 0 
        ? (overallScore * 0.4) + (criticalScore * 0.6)
        : overallScore;
      
      // Determine success (must identify all critical structures and 70% overall)
      const isSuccess = criticalScore === 1 && overallScore >= 0.7;
      
      // Calculate insight reward based on difficulty and accuracy
      const difficultyMultiplier = 
        content.difficulty === 'easy' ? 1 :
        content.difficulty === 'medium' ? 1.5 :
        2; // hard
      
      const hintPenalty = showHint ? 0.7 : 1;
      const baseInsight = isSuccess ? 15 : Math.floor(15 * 0.4);
      const adjustedInsight = Math.floor(baseInsight * accuracyScore * difficultyMultiplier * hintPenalty);
      
      // Determine momentum effect based on success/failure
      const momentumEffect = isSuccess ? 'increment' : criticalScore < 1 ? 'reset' : 'maintain';
      
      // Prepare knowledge gained if successful
      const knowledgeGained = isSuccess ? {
        conceptId: content.conceptId,
        amount: Math.ceil(10 * accuracyScore * difficultyMultiplier * hintPenalty)
      } : undefined;
      
      // Set feedback message
      if (isSuccess) {
        setFeedbackMessage(`Great! You identified ${identifiedCount} out of ${totalStructures} structures, including all critical ones.`);
      } else if (criticalScore < 1) {
        setFeedbackMessage(`You missed some critical structures. The marked structures are essential for proper treatment planning.`);
      } else {
        setFeedbackMessage(`You identified ${identifiedCount} out of ${totalStructures} structures. Try to be more thorough next time.`);
      }
      
      // Redraw canvas to show all structures
      drawCanvas();
      
      // Animation and dispatch events before completing
      setAnimating(true);
      
      // Dispatch completion event
      safeDispatch(
        GameEventType.EXTENSION_INTERACTION,
        {
          type: 'anatomical-identification',
          contentId: content.id,
          success: isSuccess,
          accuracy: accuracyScore,
          difficulty: content.difficulty,
          identifiedCount,
          totalStructures,
          characterId,
          stageId
        },
        'AnatomicalIdentification'
      );
      
      // Complete with short delay to allow animation
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        onComplete({
          success: isSuccess,
          accuracy: accuracyScore,
          insightGained: adjustedInsight,
          momentumEffect,
          knowledgeGained,
          details: {
            identifiedCount,
            totalStructures,
            criticalScore,
            overallScore,
            difficulty: content.difficulty,
            hintUsed: showHint
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting identification:', error);
      
      // Fallback completion
      onComplete({
        success: false,
        accuracy: 0,
        insightGained: 0,
        momentumEffect: 'maintain'
      });
    }
  }, [
    content.conceptId, 
    content.difficulty, 
    content.id, 
    content.structures, 
    drawCanvas, 
    identifiedStructures, 
    onComplete, 
    showHint, 
    submitted,
    characterId,
    stageId
  ]);
  
  // Structure list for selection
  const structureList = useMemo(() => {
    return content.structures.map(structure => ({
      ...structure,
      isIdentified: identifiedStructures.includes(structure.id),
      isSelected: selectedStructureId === structure.id
    }));
  }, [content.structures, identifiedStructures, selectedStructureId]);
  
  // Set up canvas cursor on mount
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair';
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-48 bg-black/50 rounded-md p-4">
        <div className="loading-spinner" />
        <p className="ml-3 text-gray-300">Loading medical image...</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="anatomical-identification bg-black/80 border border-blue-900/50 rounded-md p-4"
    >
      {/* Title and description */}
      <div className="mb-4">
        <h3 className="text-blue-300 text-lg mb-1">{content.title}</h3>
        <p className="text-gray-300 text-sm">{content.description}</p>
      </div>
      
      {/* Main content area with image and controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Image area */}
        <div className="flex-1 bg-black/70 border border-blue-900/30 rounded p-2">
          {/* Canvas tools */}
          <div className="flex justify-between mb-2">
            <div className="flex space-x-1">
              <button 
                onClick={handleZoomIn}
                className="px-2 py-1 bg-blue-900/50 rounded text-sm text-white"
                disabled={submitted}
              >
                +
              </button>
              <button 
                onClick={handleZoomOut}
                className="px-2 py-1 bg-blue-900/50 rounded text-sm text-white"
                disabled={submitted}
              >
                −
              </button>
              <button 
                onClick={handleResetView}
                className="px-2 py-1 bg-blue-900/50 rounded text-sm text-white"
                disabled={submitted}
              >
                Reset
              </button>
            </div>
            
            <div>
              <button
                onClick={handleToggleHint}
                className={`px-2 py-1 rounded text-sm text-white ${showHint ? 'bg-yellow-600' : 'bg-blue-900/50'}`}
                disabled={submitted}
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            </div>
          </div>
          
          {/* Canvas for interactive image */}
          <div className="relative bg-black/80 rounded overflow-hidden" style={{ height: '300px' }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', margin: '0 auto' }}
            />
            
            {/* Instructions overlay */}
            {!submitted && identifiedStructures.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                <p className="text-white text-center px-4">
                  Click on anatomical structures to identify them
                </p>
              </div>
            )}
          </div>
          
          {/* Selected structure info */}
          {selectedStructureId && (
            <div className="mt-2 p-2 bg-blue-900/20 rounded">
              <h4 className="text-blue-200 text-sm font-bold">
                {content.structures.find(s => s.id === selectedStructureId)?.name}
              </h4>
              <p className="text-gray-300 text-xs">
                {content.structures.find(s => s.id === selectedStructureId)?.description || 
                  "Identified successfully."}
              </p>
            </div>
          )}
        </div>
        
        {/* Structure list */}
        <div className="w-full md:w-48 bg-black/70 border border-blue-900/30 rounded p-2">
          <h4 className="text-blue-200 text-sm mb-2">Structures to Identify:</h4>
          <div className="max-h-64 overflow-y-auto">
            <ul className="space-y-1">
              {structureList.map(structure => (
                <li 
                  key={structure.id}
                  className={`px-2 py-1 rounded text-sm border border-transparent cursor-pointer
                    ${structure.isIdentified ? 'text-white bg-blue-900/50' : 'text-gray-400'}
                    ${structure.isSelected ? 'border-blue-400' : ''}
                    ${structure.isCritical && !structure.isIdentified && submitted ? 'bg-red-900/30 border-red-500/50' : ''}
                  `}
                  onClick={() => {
                    if (structure.isIdentified) {
                      setSelectedStructureId(structure.id);
                    }
                  }}
                >
                  {structure.name}
                  {structure.isCritical && !submitted && (
                    <span className="text-yellow-400 ml-1">*</span>
                  )}
                  {structure.isIdentified && (
                    <span className="text-green-400 ml-1">✓</span>
                  )}
                </li>
              ))}
            </ul>
            
            {!submitted && (
              <div className="mt-2 pt-2 border-t border-blue-900/30 text-xs text-gray-400">
                <p>* Indicates critical structures</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="feedback-message mt-3 p-2 bg-blue-900/30 rounded text-sm text-white"
          >
            {feedbackMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Action buttons */}
      <div className="flex justify-between mt-4">
        <div>
          <span className="text-sm text-blue-300">
            Identified: {identifiedStructures.length}/{content.structures.length}
          </span>
        </div>
        <button
          className={`px-4 py-2 rounded text-white ${submitted ? 'bg-green-700' : 'bg-blue-700'}`}
          onClick={submitted ? () => onComplete({
            success: true,
            accuracy: 1,
            insightGained: 0,
            momentumEffect: 'maintain'
          }) : handleSubmit}
          disabled={animating}
        >
          {submitted ? 'Continue' : 'Submit Identification'}
        </button>
      </div>
    </div>
  );
};

export default AnatomicalIdentification;