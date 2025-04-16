// app/components/extensions/types/TreatmentPlanOptimization.tsx
'use client';

/**
 * Treatment Plan Optimization Extension
 * 
 * Allows users to optimize treatment plans by balancing target coverage with healthy tissue sparing.
 * Provides an interactive interface for adjusting dose constraints and evaluating plan quality.
 * Implements Chamber Pattern for performance optimization.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelText, PixelButton } from '../../PixelThemeProvider';
import { usePrimitiveStoreValue, useStableCallback } from '../../../core/utils/storeHooks';
import { ExtensionResult } from '../VisualExtender';
import { safeDispatch } from '../../../core/events/CentralEventBus';
import { GameEventType } from '../../../core/events/EventTypes';

// Define interfaces for optimization objects
interface DoseConstraint {
  id: string;
  organName: string;
  organType: 'target' | 'oar'; // Target or Organ at Risk
  priority: 1 | 2 | 3; // 1=highest priority, 3=lowest
  description: string;
  metric: 'v' | 'd' | 'mean' | 'max'; // Volume, Dose, Mean dose, Max dose
  parameter: number; // Value for metric (e.g., V20, D95)
  limit: number; // Constraint value
  unit: 'Gy' | '%'; // Gray or percent
  current: number; // Current plan value
  slider?: {
    min: number;
    max: number;
    step: number;
  };
  isAdjustable: boolean; // Can the user adjust this constraint?
  isCritical: boolean; // Is this constraint critical for clinical acceptance?
}

interface OptimizationSolution {
  id: string;
  name: string;
  description: string;
  values: Record<string, number>; // Map of constraint id to value
  clinical: string; // Clinical assessment of plan
  isIdeal: boolean; // Is this the best solution?
}

interface TreatmentPlanContent {
  id: string;
  title: string;
  description: string;
  constraints: DoseConstraint[];
  targets: string[]; // IDs of target constraints
  oars: string[]; // IDs of OAR constraints
  solutions: OptimizationSolution[];
  conceptId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain: string;
  hint?: string;
  clinicalGoal: string;
  imageUrl: string;
}

interface TreatmentPlanOptimizationProps {
  content: TreatmentPlanContent;
  characterId: string;
  stageId: string;
  additionalProps?: Record<string, any>;
  onComplete: (result: ExtensionResult) => void;
}

/**
 * Treatment Plan Optimization Component
 * 
 * Provides an interactive interface for evaluating and optimizing treatment plans
 * by balancing target coverage with normal tissue sparing
 */
const TreatmentPlanOptimization: React.FC<TreatmentPlanOptimizationProps> = ({
  content,
  characterId,
  stageId,
  additionalProps,
  onComplete
}) => {
  // Mount tracking ref
  const isMountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const dvhCanvasRef = useRef<HTMLCanvasElement>(null);
  const isotopeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation timers
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Component state
  const [currentConstraints, setCurrentConstraints] = useState<DoseConstraint[]>(() => 
    content.constraints.map(c => ({...c}))
  );
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [selectedConstraint, setSelectedConstraint] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [optimizationCount, setOptimizationCount] = useState(0);
  
  // Animation state
  const [animating, setAnimating] = useState(false);
  const [solutionMatched, setSolutionMatched] = useState<OptimizationSolution | null>(null);
  
  // Track plan quality metrics
  const [planQuality, setPlanQuality] = useState({
    targetCoverage: 0,
    oarSparing: 0,
    overall: 0
  });
  
  // Check if plan is clinically acceptable
  const isAcceptable = useMemo(() => {
    // Check if all critical constraints are met
    const criticalConstraints = currentConstraints.filter(c => c.isCritical);
    return criticalConstraints.every(c => {
      if (c.organType === 'target') {
        // For targets, current should be >= limit
        return c.current >= c.limit;
      } else {
        // For OARs, current should be <= limit
        return c.current <= c.limit;
      }
    });
  }, [currentConstraints]);
  
  // Calculate constraint violation
  const getConstraintViolation = useCallback((constraint: DoseConstraint): number => {
    if (constraint.organType === 'target') {
      // For targets, current should be >= limit
      return Math.max(0, constraint.limit - constraint.current);
    } else {
      // For OARs, current should be <= limit
      return Math.max(0, constraint.current - constraint.limit);
    }
  }, []);
  
  // Track time spent on optimization
  const [startTime] = useState<number>(Date.now());
  const timeSpent = useMemo(() => Math.floor((Date.now() - startTime) / 1000), [startTime]);
  
  // Draw DVH Curves
  const drawDVHCanvas = useCallback(() => {
    const canvas = dvhCanvasRef.current;
    if (!canvas || !isMountedRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background grid
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += height / 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height); // X-axis
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height); // Y-axis
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
    ctx.font = '12px Arial';
    ctx.fillText('Dose (Gy)', width / 2, height - 5);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Volume (%)', 0, 0);
    ctx.restore();
    
    // Draw curves for each structure
    const targetConstraints = currentConstraints.filter(c => c.organType === 'target');
    const oarConstraints = currentConstraints.filter(c => c.organType === 'oar');
    
    // Function to generate DVH curve points
    const generateDVHPoints = (constraint: DoseConstraint): [number, number][] => {
      const points: [number, number][] = [];
      const maxDose = constraint.organType === 'target' ? 60 : 40;
      
      if (constraint.organType === 'target') {
        // Target DVH curve (high dose to high volume)
        points.push([0, 100]); // Start at 0 Gy, 100% volume
        
        // Shoulder region
        for (let dose = 0; dose < constraint.current * 0.9; dose += 2) {
          points.push([dose, 100]);
        }
        
        // Falloff region
        const falloffStart = constraint.current * 0.9;
        const falloffEnd = constraint.current * 1.1;
        
        for (let dose = falloffStart; dose <= falloffEnd; dose += 1) {
          const volume = 100 - ((dose - falloffStart) / (falloffEnd - falloffStart)) * 100;
          points.push([dose, volume]);
        }
        
        // End at max dose, 0% volume
        points.push([maxDose, 0]);
      } else {
        // OAR DVH curve (lower doses to higher volumes)
        points.push([0, 100]); // Start at 0 Gy, 100% volume
        
        // Create a sigmoid-like curve
        for (let dose = 0; dose <= maxDose; dose += 2) {
          // For OARs, we want the curve to fall off more rapidly after the constraint value
          const midpoint = constraint.current;
          const steepness = 0.3;
          const volume = 100 / (1 + Math.exp(steepness * (dose - midpoint)));
          points.push([dose, volume]);
        }
      }
      
      return points;
    };
    
    // Draw target curves
    targetConstraints.forEach((constraint, index) => {
      const points = generateDVHPoints(constraint);
      
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Scale points to canvas
      points.forEach(([dose, volume], i) => {
        const x = (dose / 60) * width;
        const y = height - (volume / 100) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Add label for target
      const lastPoint = points[Math.floor(points.length / 2)];
      const x = (lastPoint[0] / 60) * width;
      const y = height - (lastPoint[1] / 100) * height;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
      ctx.fillText(constraint.organName, x + 5, y - 5);
      
      // Draw constraint marker
      if (constraint.metric === 'd') {
        // D95 = 95% volume gets at least this dose
        const markerX = (constraint.limit / 60) * width;
        const markerY = height - (constraint.parameter / 100) * height;
        
        ctx.fillStyle = selectedConstraint === constraint.id 
          ? 'rgba(255, 255, 100, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)';
          
        ctx.beginPath();
        ctx.arc(markerX, markerY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw constraint label
        ctx.fillStyle = selectedConstraint === constraint.id 
          ? 'rgba(255, 255, 100, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)';
          
        ctx.fillText(`D${constraint.parameter}=${constraint.limit}${constraint.unit}`, 
          markerX + 5, markerY - 5);
      }
    });
    
    // Draw OAR curves
    oarConstraints.forEach((constraint, index) => {
      const points = generateDVHPoints(constraint);
      
      // Choose color based on priority
      let color;
      switch (constraint.priority) {
        case 1: // Highest priority
          color = 'rgba(0, 150, 255, 0.8)';
          break;
        case 2: // Medium priority
          color = 'rgba(0, 200, 200, 0.8)';
          break;
        case 3: // Lowest priority
          color = 'rgba(100, 200, 150, 0.8)';
          break;
        default:
          color = 'rgba(100, 100, 255, 0.8)';
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Scale points to canvas
      points.forEach(([dose, volume], i) => {
        const x = (dose / 60) * width;
        const y = height - (volume / 100) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Add label for OAR
      const lastPoint = points[Math.floor(points.length / 3)];
      const x = (lastPoint[0] / 60) * width;
      const y = height - (lastPoint[1] / 100) * height;
      
      ctx.fillStyle = color;
      ctx.fillText(constraint.organName, x + 5, y - 5);
      
      // Draw constraint marker
      if (constraint.metric === 'v') {
        // V20 = Volume receiving 20Gy should be below limit
        const markerX = (constraint.parameter / 60) * width;
        const markerY = height - (constraint.limit / 100) * height;
        
        ctx.fillStyle = selectedConstraint === constraint.id 
          ? 'rgba(255, 255, 100, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)';
          
        ctx.beginPath();
        ctx.arc(markerX, markerY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw constraint label
        ctx.fillStyle = selectedConstraint === constraint.id 
          ? 'rgba(255, 255, 100, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)';
          
        ctx.fillText(`V${constraint.parameter}=${constraint.limit}${constraint.unit}`, 
          markerX + 5, markerY - 5);
      } else if (constraint.metric === 'max') {
        // Max dose marker
        const markerX = (constraint.limit / 60) * width;
        const markerY = height - 10; // Near bottom
        
        ctx.fillStyle = selectedConstraint === constraint.id 
          ? 'rgba(255, 255, 100, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)';
          
        ctx.beginPath();
        ctx.arc(markerX, markerY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw constraint label
        ctx.fillStyle = selectedConstraint === constraint.id 
          ? 'rgba(255, 255, 100, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)';
          
        ctx.fillText(`Max=${constraint.limit}${constraint.unit}`, 
          markerX + 5, markerY - 5);
      }
    });
    
  }, [currentConstraints, selectedConstraint]);
  
  // Draw Isodose Lines
  const drawIsotopeCanvas = useCallback(() => {
    const canvas = isotopeCanvasRef.current;
    if (!canvas || !isMountedRef.current || !content.imageUrl) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create new image from URL
    const img = new Image();
    img.src = content.imageUrl;
    
    img.onload = () => {
      if (!ctx || !isMountedRef.current) return;
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw isodose contours based on current constraints
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw target volumes
      const targetConstraint = currentConstraints.find(c => c.organType === 'target');
      if (targetConstraint) {
        // Draw prescription isodose (100%)
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)';
        ctx.lineWidth = 2;
        
        // Draw a somewhat oval shape around the center of the image
        const centerX = canvas.width * 0.5;
        const centerY = canvas.height * 0.4;
        const radiusX = canvas.width * 0.15;
        const radiusY = canvas.height * 0.15;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fill with red but make it semi-transparent
        ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
        ctx.fill();
        
        // Label
        ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
        ctx.font = '14px Arial';
        ctx.fillText('PTV', centerX - 15, centerY);
        
        // 95% isodose line
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX * 1.2, radiusY * 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Label 95%
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.font = '12px Arial';
        ctx.fillText('95%', centerX + radiusX * 1.2 + 5, centerY);
      }
      
      // Draw OAR contours
      const oarConstraints = currentConstraints.filter(c => c.organType === 'oar');
      
      oarConstraints.forEach((constraint, index) => {
        // Choose position for each OAR
        let centerX, centerY, radiusX, radiusY;
        
        switch (index % 3) {
          case 0: // Left side
            centerX = canvas.width * 0.25;
            centerY = canvas.height * 0.6;
            radiusX = canvas.width * 0.10;
            radiusY = canvas.height * 0.10;
            break;
          case 1: // Right side
            centerX = canvas.width * 0.75;
            centerY = canvas.height * 0.6;
            radiusX = canvas.width * 0.08;
            radiusY = canvas.height * 0.12;
            break;
          case 2: // Bottom
            centerX = canvas.width * 0.5;
            centerY = canvas.height * 0.8;
            radiusX = canvas.width * 0.12;
            radiusY = canvas.height * 0.08;
            break;
          default:
            centerX = canvas.width * (0.3 + index * 0.1);
            centerY = canvas.height * (0.5 + index * 0.1);
            radiusX = canvas.width * 0.08;
            radiusY = canvas.height * 0.08;
        }
        
        // Choose color based on priority
        let color;
        switch (constraint.priority) {
          case 1: // Highest priority
            color = 'rgba(0, 150, 255, 0.8)';
            break;
          case 2: // Medium priority
            color = 'rgba(0, 200, 200, 0.8)';
            break;
          case 3: // Lowest priority
            color = 'rgba(100, 200, 150, 0.8)';
            break;
          default:
            color = 'rgba(100, 100, 255, 0.8)';
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fill with semi-transparent color
        ctx.fillStyle = color.replace('0.8', '0.2');
        ctx.fill();
        
        // Label
        ctx.fillStyle = color;
        ctx.font = '14px Arial';
        ctx.fillText(constraint.organName, centerX - 15, centerY);
      });
      
      // Draw dose levels
      // 80% isodose
      ctx.strokeStyle = 'rgba(255, 180, 50, 0.8)';
      ctx.lineWidth = 1.5;
      
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.4;
      const radiusX = canvas.width * 0.25;
      const radiusY = canvas.height * 0.3;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Label 80%
      ctx.fillStyle = 'rgba(255, 180, 50, 0.8)';
      ctx.font = '12px Arial';
      ctx.fillText('80%', centerX - radiusX - 25, centerY);
      
      // 50% isodose
      ctx.strokeStyle = 'rgba(50, 255, 50, 0.7)';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX * 1.4, radiusY * 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Label 50%
      ctx.fillStyle = 'rgba(50, 255, 50, 0.8)';
      ctx.font = '12px Arial';
      ctx.fillText('50%', centerX - radiusX * 1.4 - 25, centerY);
      
      // 30% isodose
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX * 1.8, radiusY * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Label 30%
      ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
      ctx.font = '12px Arial';
      ctx.fillText('30%', centerX + radiusX * 1.8 + 5, centerY);
    };
    
    img.onerror = () => {
      if (!ctx || !isMountedRef.current) return;
      
      // Draw error message
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '16px Arial';
      ctx.fillText('Error loading image', 20, canvas.height / 2);
    };
    
  }, [content.imageUrl, currentConstraints]);
  
  // Calculate plan quality metrics
  const calculatePlanQuality = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Calculate target coverage score
    const targetConstraints = currentConstraints.filter(c => c.organType === 'target');
    let targetCoverage = 0;
    
    if (targetConstraints.length > 0) {
      // Calculate how well each target constraint is met
      const targetScores = targetConstraints.map(constraint => {
        if (constraint.current >= constraint.limit) {
          // Target constraint is met, full score
          return 1;
        } else {
          // Target constraint not met, partial score
          return constraint.current / constraint.limit;
        }
      });
      
      // Average the target scores
      targetCoverage = targetScores.reduce((sum, score) => sum + score, 0) / targetScores.length;
    }
    
    // Calculate OAR sparing score
    const oarConstraints = currentConstraints.filter(c => c.organType === 'oar');
    let oarSparing = 0;
    
    if (oarConstraints.length > 0) {
      // Calculate how well each OAR constraint is met
      const oarScores = oarConstraints.map(constraint => {
        if (constraint.current <= constraint.limit) {
          // OAR constraint is met, full score
          return 1;
        } else {
          // OAR constraint not met, partial score
          const ratio = constraint.limit / constraint.current;
          return Math.max(0, ratio); // Between 0 and 1
        }
      });
      
      // Weight by priority
      const priorityWeights = oarConstraints.map(c => 4 - c.priority); // Priority 1 = weight 3, Priority 3 = weight 1
      const totalWeight = priorityWeights.reduce((sum, w) => sum + w, 0);
      
      // Weighted average
      oarSparing = oarScores.reduce((sum, score, i) => sum + score * priorityWeights[i], 0) / totalWeight;
    }
    
    // Calculate overall score
    // Weight target coverage more heavily (60%) than OAR sparing (40%)
    const overall = targetCoverage * 0.6 + oarSparing * 0.4;
    
    // Update state
    setPlanQuality({
      targetCoverage: Math.round(targetCoverage * 100),
      oarSparing: Math.round(oarSparing * 100),
      overall: Math.round(overall * 100)
    });
    
    return overall;
  }, [currentConstraints]);
  
  // Handle constraint adjustment
  const handleConstraintChange = useCallback((constraintId: string, value: number) => {
    if (!isMountedRef.current || submitted) return;
    
    setCurrentConstraints(prev => 
      prev.map(constraint => 
        constraint.id === constraintId
          ? { ...constraint, current: value }
          : constraint
      )
    );
    
    // Set selected constraint
    setSelectedConstraint(constraintId);
    
    // Clear any previous feedback
    setFeedbackMessage(null);
  }, [submitted]);
  
  // Handle optimization simulation
  const handleOptimize = useCallback(() => {
    if (!isMountedRef.current || submitted || isSimulating) return;
    
    // Start simulation
    setIsSimulating(true);
    setFeedbackMessage('Optimizing treatment plan...');
    
    // Track optimization count
    setOptimizationCount(prev => prev + 1);
    
    // Simulate optimization by gradually changing values over time
    let progress = 0;
    const totalSteps = 10;
    const interval = 200; // ms between steps
    
    // Clone current constraints
    const startConstraints = currentConstraints.map(c => ({...c}));
    
    // Generate a randomized target state - tends to improve with more optimizations
    const generateTargetConstraints = () => {
      // Start with current constraints
      const newConstraints = [...currentConstraints];
      
      // For each constraint, adjust toward better values with some randomness
      // The more optimizations performed, the more likely to find a good solution
      newConstraints.forEach(constraint => {
        if (constraint.organType === 'target') {
          // Targets should increase (move toward or beyond limit)
          const improvementFactor = Math.min(0.8, 0.5 + (optimizationCount * 0.1));
          const maxImprovement = constraint.limit * 1.1 - constraint.current;
          const improvement = maxImprovement * improvementFactor * (0.7 + Math.random() * 0.6);
          constraint.current = Math.min(constraint.limit * 1.1, constraint.current + improvement);
        } else {
          // OARs should decrease (move toward or below limit)
          const improvementFactor = Math.min(0.8, 0.4 + (optimizationCount * 0.1));
          const maxImprovement = constraint.current - constraint.limit * 0.9;
          const improvement = maxImprovement * improvementFactor * (0.7 + Math.random() * 0.6);
          constraint.current = Math.max(constraint.limit * 0.9, constraint.current - improvement);
        }
      });
      
      // Add some interdependence - improving target coverage might worsen OAR sparing
      const targetImprovement = newConstraints
        .filter(c => c.organType === 'target')
        .reduce((sum, c) => {
          const original = startConstraints.find(sc => sc.id === c.id);
          if (!original) return sum;
          return sum + (c.current - original.current) / original.current;
        }, 0);
        
      // Apply negative effect to OARs based on target improvement
      newConstraints.forEach(constraint => {
        if (constraint.organType === 'oar') {
          const worsenFactor = 0.2 * targetImprovement * (constraint.priority === 1 ? 0.5 : 1.0);
          constraint.current = constraint.current * (1 + worsenFactor);
        }
      });
      
      return newConstraints;
    };
    
    // Generate target state for this optimization
    const targetConstraints = generateTargetConstraints();
    
    // Animation step function
    const step = () => {
      if (!isMountedRef.current) return;
      
      progress++;
      
      // Interpolate between start and target constraints
      const interpolated = startConstraints.map((startConstraint, i) => {
        const targetConstraint = targetConstraints[i];
        return {
          ...startConstraint,
          current: startConstraint.current + (targetConstraint.current - startConstraint.current) * (progress / totalSteps)
        };
      });
      
      // Update constraints
      setCurrentConstraints(interpolated);
      
      // Continue animation
      if (progress < totalSteps) {
        animationTimerRef.current = setTimeout(step, interval);
      } else {
        // Finished optimization
        setIsSimulating(false);
        
        // Recalculate plan quality
        calculatePlanQuality();
        
        // Provide feedback
        setFeedbackMessage('Optimization complete. You can now adjust constraints or submit plan.');
      }
    };
    
    // Start animation
    animationTimerRef.current = setTimeout(step, interval);
    
  }, [currentConstraints, submitted, isSimulating, optimizationCount, calculatePlanQuality]);
  
  // Toggle hint display
  const handleToggleHint = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    // Toggle hint visibility
    setShowHint(prev => !prev);
    
    // Track hint usage
    if (!hintUsed) {
      setHintUsed(true);
      
      // Log hint usage
      safeDispatch(
        GameEventType.EXTENSION_HINT_USED,
        {
          type: 'treatment-plan',
          contentId: content.id,
          characterId,
          stageId
        },
        'TreatmentPlanOptimization'
      );
    }
    
    // Show or clear hint message
    if (!showHint) {
      setFeedbackMessage(content.hint || "Try to focus on meeting critical constraints first. Target coverage is important, but not at the cost of exceeding OAR limits.");
    } else {
      setFeedbackMessage(null);
    }
  }, [content.hint, content.id, showHint, hintUsed, submitted, characterId, stageId]);
  
  // Check which solution best matches current plan
  const checkSolutionMatch = useCallback(() => {
    // Calculate distance to each solution
    const distances = content.solutions.map(solution => {
      let sumSquaredDiff = 0;
      let constraintCount = 0;
      
      // Calculate squared differences for each constraint
      for (const constraint of currentConstraints) {
        if (solution.values[constraint.id] !== undefined) {
          const diff = constraint.current - solution.values[constraint.id];
          sumSquaredDiff += diff * diff;
          constraintCount++;
        }
      }
      
      // Average squared difference (MSE)
      const mse = constraintCount > 0 ? sumSquaredDiff / constraintCount : Infinity;
      
      return {
        solution,
        mse
      };
    });
    
    // Find closest solution
    const closest = distances.reduce((prev, current) => 
      current.mse < prev.mse ? current : prev, 
      { solution: content.solutions[0], mse: Infinity }
    );
    
    // If close enough, return the solution
    if (closest.mse < 10) {
      return closest.solution;
    }
    
    return null;
  }, [content.solutions, currentConstraints]);
  
  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!isMountedRef.current || submitted) return;
    
    try {
      setSubmitted(true);
      
      // Calculate final plan quality
      const quality = calculatePlanQuality();
      setScore(Math.round(quality * 100));
      
      // Find matching solution if any
      const matchedSolution = checkSolutionMatch();
      setSolutionMatched(matchedSolution);
      
      // Check clinical acceptability
      const clinicallyAcceptable = isAcceptable;
      
      // Calculate bonus score for speed (diminishing returns after 5 optimizations)
      const efficiencyScore = optimizationCount <= 5 
        ? 1 - (optimizationCount / 10) 
        : 0.5 - Math.min(0.3, (optimizationCount - 5) / 20);
      
      // Calculate final score (0-1)
      const finalScore = (quality * 0.7) + (efficiencyScore * 0.3);
      
      // Determine success - plan must be clinically acceptable and score > 0.6
      const isSuccess = clinicallyAcceptable && finalScore > 0.6;
      
      // Calculate insight reward based on difficulty and score
      const difficultyMultiplier = 
        content.difficulty === 'easy' ? 1 :
        content.difficulty === 'medium' ? 1.5 :
        2; // hard
      
      const hintPenalty = hintUsed ? 0.7 : 1;
      const baseInsight = isSuccess ? 20 : Math.floor(20 * 0.3);
      const adjustedInsight = Math.floor(baseInsight * finalScore * difficultyMultiplier * hintPenalty);
      
      // Determine momentum effect based on success/failure
      const momentumEffect = isSuccess ? 'increment' : clinicallyAcceptable ? 'maintain' : 'reset';
      
      // Prepare knowledge gained if successful
      const knowledgeGained = isSuccess ? {
        conceptId: content.conceptId,
        amount: Math.ceil(15 * finalScore * difficultyMultiplier * hintPenalty)
      } : undefined;
      
      // Set feedback message
      if (isSuccess) {
        if (matchedSolution?.isIdeal) {
          setFeedbackMessage(`Excellent plan! ${matchedSolution.clinical}`);
        } else if (matchedSolution) {
          setFeedbackMessage(`Good plan. ${matchedSolution.clinical}`);
        } else {
          setFeedbackMessage(`Plan is clinically acceptable with a quality score of ${Math.round(finalScore * 100)}%.`);
        }
      } else if (clinicallyAcceptable) {
        setFeedbackMessage(`Plan is clinically acceptable but could be improved. Score: ${Math.round(finalScore * 100)}%.`);
      } else {
        setFeedbackMessage(`Plan does not meet clinical requirements. Critical constraint violations must be addressed.`);
      }
      
      // Redraw visuals with final plan
      drawDVHCanvas();
      drawIsotopeCanvas();
      
      // Animation and dispatch events before completing
      setAnimating(true);
      
      // Dispatch completion event
      safeDispatch(
        GameEventType.EXTENSION_INTERACTION,
        {
          type: 'treatment-plan',
          contentId: content.id,
          success: isSuccess,
          accuracy: finalScore,
          difficulty: content.difficulty,
          optimizationCount,
          timeSpent,
          characterId,
          stageId
        },
        'TreatmentPlanOptimization'
      );
      
      // Complete with short delay to allow animation
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        onComplete({
          success: isSuccess,
          accuracy: finalScore,
          insightGained: adjustedInsight,
          momentumEffect,
          knowledgeGained,
          details: {
            quality: planQuality,
            optimizationCount,
            clinicallyAcceptable,
            timeSpent,
            difficulty: content.difficulty,
            hintUsed
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting plan:', error);
      
      // Fallback completion
      onComplete({
        success: false,
        accuracy: 0,
        insightGained: 0,
        momentumEffect: 'maintain'
      });
    }
  }, [
    calculatePlanQuality,
    checkSolutionMatch,
    content.conceptId,
    content.difficulty,
    content.id,
    drawDVHCanvas,
    drawIsotopeCanvas,
    hintUsed,
    isAcceptable,
    onComplete,
    optimizationCount,
    planQuality,
    submitted,
    timeSpent,
    characterId,
    stageId
  ]);
  
  // Initialize and cleanup
  useEffect(() => {
    // Initialize canvas when mounted
    drawDVHCanvas();
    drawIsotopeCanvas();
    
    // Calculate initial plan quality
    calculatePlanQuality();
    
    // Return cleanup function
    return () => {
      isMountedRef.current = false;
      
      // Clear animation timers
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [drawDVHCanvas, drawIsotopeCanvas, calculatePlanQuality]);
  
  // Update DVH when constraints change
  useEffect(() => {
    drawDVHCanvas();
  }, [drawDVHCanvas, currentConstraints, selectedConstraint]);
  
  return (
    <div 
      ref={containerRef}
      className="treatment-plan-optimization bg-black/80 border border-blue-900/50 rounded-md p-4"
    >
      {/* Title and description */}
      <div className="mb-3">
        <h3 className="text-blue-300 text-lg mb-1">{content.title}</h3>
        <p className="text-gray-300 text-sm mb-2">{content.description}</p>
        <p className="text-blue-200 text-sm italic">{content.clinicalGoal}</p>
      </div>
      
      {/* Main content area with plan views and controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left side - DVH and visualization */}
        <div className="flex flex-col space-y-3">
          {/* DVH Graph */}
          <div className="bg-black/70 border border-blue-900/30 rounded p-2">
            <h4 className="text-blue-200 text-sm mb-1">Dose Volume Histogram</h4>
            <div className="bg-black/80 rounded overflow-hidden" style={{ height: '200px' }}>
              <canvas 
                ref={dvhCanvasRef} 
                width={400} 
                height={200} 
                className="w-full h-full"
              />
            </div>
          </div>
          
          {/* Isodose Visualization */}
          <div className="bg-black/70 border border-blue-900/30 rounded p-2">
            <h4 className="text-blue-200 text-sm mb-1">Isodose Visualization</h4>
            <div className="bg-black/80 rounded overflow-hidden" style={{ height: '200px' }}>
              <canvas 
                ref={isotopeCanvasRef} 
                width={400} 
                height={200} 
                className="w-full h-full"
              />
            </div>
          </div>
          
          {/* Plan Quality Metrics */}
          <div className="bg-black/70 border border-blue-900/30 rounded p-2">
            <h4 className="text-blue-200 text-sm mb-2">Plan Quality</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-300 mb-1">Target Coverage</div>
                <div className={`text-lg font-bold ${
                  planQuality.targetCoverage >= 95 ? 'text-green-400' :
                  planQuality.targetCoverage >= 90 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {planQuality.targetCoverage}%
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-300 mb-1">OAR Sparing</div>
                <div className={`text-lg font-bold ${
                  planQuality.oarSparing >= 95 ? 'text-green-400' :
                  planQuality.oarSparing >= 85 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {planQuality.oarSparing}%
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-300 mb-1">Overall</div>
                <div className={`text-lg font-bold ${
                  planQuality.overall >= 90 ? 'text-green-400' :
                  planQuality.overall >= 80 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {planQuality.overall}%
                </div>
              </div>
            </div>
            {!isAcceptable && !submitted && (
              <div className="text-red-400 text-xs mt-2 text-center">
                Plan does not meet critical constraints!
              </div>
            )}
            {isAcceptable && !submitted && (
              <div className="text-green-400 text-xs mt-2 text-center">
                Plan meets all critical constraints
              </div>
            )}
            {submitted && matchedSolution && (
              <div className={`${matchedSolution.isIdeal ? 'text-green-400' : 'text-yellow-400'} text-xs mt-2 text-center`}>
                {matchedSolution.name}: {matchedSolution.description}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Constraints and Controls */}
        <div className="flex flex-col space-y-3">
          {/* Target Structure Constraints */}
          <div className="bg-black/70 border border-blue-900/30 rounded p-2">
            <h4 className="text-red-300 text-sm mb-1">Target Structure Constraints</h4>
            <div className="max-h-32 overflow-y-auto">
              {currentConstraints
                .filter(c => c.organType === 'target')
                .map(constraint => (
                  <div 
                    key={constraint.id} 
                    className={`mb-2 ${selectedConstraint === constraint.id ? 'bg-blue-900/30 p-1 rounded' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-white">
                        {constraint.organName} - {constraint.description}
                      </div>
                      <div className={`text-sm font-mono ${constraint.current >= constraint.limit ? 'text-green-400' : 'text-red-400'}`}>
                        {constraint.current.toFixed(1)}/{constraint.limit}{constraint.unit}
                      </div>
                    </div>
                    
                    {/* Slider for adjustable constraints */}
                    {constraint.isAdjustable && constraint.slider && !submitted && (
                      <div className="mt-1 flex items-center">
                        <input
                          type="range"
                          min={constraint.slider.min}
                          max={constraint.slider.max}
                          step={constraint.slider.step}
                          value={constraint.current}
                          onChange={(e) => handleConstraintChange(constraint.id, parseFloat(e.target.value))}
                          className="w-full"
                          disabled={isSimulating}
                        />
                        {constraint.isCritical && <span className="text-yellow-400 ml-1 text-sm">*</span>}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
          
          {/* OAR Constraints */}
          <div className="bg-black/70 border border-blue-900/30 rounded p-2">
            <h4 className="text-blue-300 text-sm mb-1">Organs at Risk Constraints</h4>
            <div className="max-h-40 overflow-y-auto">
              {currentConstraints
                .filter(c => c.organType === 'oar')
                .map(constraint => (
                  <div 
                    key={constraint.id} 
                    className={`mb-2 ${selectedConstraint === constraint.id ? 'bg-blue-900/30 p-1 rounded' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-white flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          constraint.priority === 1 ? 'bg-blue-400' :
                          constraint.priority === 2 ? 'bg-teal-400' :
                          'bg-green-400'
                        }`}></span>
                        {constraint.organName} - {constraint.description}
                      </div>
                      <div className={`text-sm font-mono ${constraint.current <= constraint.limit ? 'text-green-400' : 'text-red-400'}`}>
                        {constraint.current.toFixed(1)}/{constraint.limit}{constraint.unit}
                      </div>
                    </div>
                    
                    {/* Slider for adjustable constraints */}
                    {constraint.isAdjustable && constraint.slider && !submitted && (
                      <div className="mt-1 flex items-center">
                        <input
                          type="range"
                          min={constraint.slider.min}
                          max={constraint.slider.max}
                          step={constraint.slider.step}
                          value={constraint.current}
                          onChange={(e) => handleConstraintChange(constraint.id, parseFloat(e.target.value))}
                          className="w-full"
                          disabled={isSimulating}
                        />
                        {constraint.isCritical && <span className="text-yellow-400 ml-1 text-sm">*</span>}
                      </div>
                    )}
                  </div>
                ))}
            </div>
            
            <div className="mt-1 text-xs text-gray-400">
              <div className="flex gap-x-4">
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1"></span>
                  High Priority
                </span>
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-teal-400 mr-1"></span>
                  Medium Priority
                </span>
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1"></span>
                  Low Priority
                </span>
              </div>
              {!submitted && <div className="mt-1"><span className="text-yellow-400">*</span> Critical constraint</div>}
            </div>
          </div>
          
          {/* Controls */}
          <div className="bg-black/70 border border-blue-900/30 rounded p-2">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-gray-300">
                Optimization Runs: {optimizationCount}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleToggleHint}
                  className={`px-2 py-1 rounded text-xs text-white ${showHint ? 'bg-yellow-600' : 'bg-blue-900/50'}`}
                  disabled={submitted}
                >
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
                
                <button
                  onClick={handleOptimize}
                  className="px-2 py-1 bg-blue-700 rounded text-xs text-white"
                  disabled={submitted || isSimulating}
                >
                  {isSimulating ? 'Optimizing...' : 'Optimize Plan'}
                </button>
              </div>
            </div>
            {showHint && (
              <div className="bg-yellow-900/30 border border-yellow-900/50 rounded p-2 mb-2 text-xs text-yellow-200">
                {content.hint || "Focus on meeting critical constraints first, then work on improving overall plan quality. Target coverage is important but not at the expense of critical OAR constraints."}
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
          {submitted && score !== null && (
            <span className="text-sm text-blue-300">
              Final Score: <span className={`font-bold ${
                score >= 90 ? 'text-green-400' :
                score >= 80 ? 'text-yellow-400' :
                'text-red-400'
              }`}>{score}%</span>
            </span>
          )}
        </div>
        <button
          className={`px-4 py-2 rounded text-white ${submitted ? 'bg-green-700' : 'bg-blue-700'}`}
          onClick={submitted ? () => onComplete({
            success: true,
            accuracy: 1,
            insightGained: 0,
            momentumEffect: 'maintain'
          }) : handleSubmit}
          disabled={animating || isSimulating}
        >
          {submitted ? 'Continue' : 'Submit Plan'}
        </button>
      </div>
    </div>
  );
};

export default TreatmentPlanOptimization;