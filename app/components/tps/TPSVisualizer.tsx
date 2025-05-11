'use client';

import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { CTImageData } from './TPSModel';
import { getDoseColor, getDoseGradient, getIsodoseLevelColor } from './DoseColorPalette';

const FOV_RADIUS_PIXELS = 200; // 100cm = 200 pixels at 5mm scale
const FOV_DIAMETER_PIXELS = FOV_RADIUS_PIXELS * 2;

interface TPSVisualizerProps {
  ctData: CTImageData | null;
  doseGrid: number[][];
  beams: any[];
  isCalculating: boolean;
  showIsocenter: boolean;
  showBeams: boolean;
  displayMode: 'doseWash' | 'isodoseLines';
}

const VisualizerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
`;

const CanvasContainer = styled.div`
  position: relative;
  border: 4px solid #4b5563;
  border-radius: 4px;
  margin: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.4);
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
`;

const ZoomedContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Canvas = styled.canvas`
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  max-width: 100%;
  max-height: 100%;
`;

const DoseOverlayCanvas = styled.canvas`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  max-width: 100%;
  max-height: 100%;
`;

const BeamOverlayCanvas = styled.canvas`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  max-width: 100%;
  max-height: 100%;
`;

const LoadingIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(17, 24, 39, 0.8);
  color: #60a5fa;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-family: var(--font-press-start-2p);
  font-size: 0.8rem;
  border: 2px solid #60a5fa;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(96, 165, 250, 0); }
    100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); }
  }
`;

const DoseLegend = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0.5rem;
  width: 100%;
  max-width: 650px; /* Match the max width of the scan */
`;

const DoseLegendTitle = styled.div`
  font-family: var(--font-vt323);
  font-size: 1rem;
  color: #e5e7eb;
  margin-bottom: 0.5rem;
`;

const DoseLegendGradient = styled.div`
  width: 100%;
  height: 20px;
  background: ${getDoseGradient()};
  border: 2px solid #4b5563;
  border-radius: 2px;
  margin-bottom: 0.25rem;
`;

const DoseLegendLabels = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-family: var(--font-vt323);
  font-size: 0.8rem;
  color: #9ca3af;
`;

export const TPSVisualizer: React.FC<TPSVisualizerProps> = ({ 
  ctData, 
  doseGrid, 
  beams, 
  isCalculating,
  showIsocenter = false,
  showBeams = false,
  displayMode = 'doseWash'
}) => {
  const ctCanvasRef = useRef<HTMLCanvasElement>(null);
  const doseCanvasRef = useRef<HTMLCanvasElement>(null);
  const beamCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomFactor, setZoomFactor] = useState(4.0); // Increased from 3.5 to 4.0 for maximum zoom
  
  // Update zoom factor when showBeams changes
  useEffect(() => {
    // When showBeams is true, zoom out to show the entire FOV
    // When showBeams is false, zoom in to focus on the phantom
    setZoomFactor(showBeams ? 1.0 : 4.0);
  }, [showBeams]);

  // Render CT data
  useEffect(() => {
    if (!ctCanvasRef.current || !ctData) return;

    const canvas = ctCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;
    canvas.width = FOV_DIAMETER_PIXELS;
    canvas.height = FOV_DIAMETER_PIXELS;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the larger canvas

    // Create image data for CT
    const ctImageData = ctx.createImageData(ctData.width, ctData.height);

    // Fill image data with CT values
    for (let y = 0; y < ctData.height; y++) {
      for (let x = 0; x < ctData.width; x++) {
        const value = ctData.data[y][x];
        const index = (y * ctData.width + x) * 4;
        
        // Make air (value 5) completely black, scale other tissue values
        if (value <= 5) {
          // Pure black for air
          ctImageData.data[index] = 0;
          ctImageData.data[index + 1] = 0;
          ctImageData.data[index + 2] = 0;
          ctImageData.data[index + 3] = 255; // Fully opaque
        } else {
          // Scale tissue values for better visualization
          const scaledValue = Math.min(255, Math.floor((value - 5) * 1.2) + 30);
          ctImageData.data[index] = scaledValue;
          ctImageData.data[index + 1] = scaledValue;
          ctImageData.data[index + 2] = scaledValue;
          ctImageData.data[index + 3] = 255; // Fully opaque
        }
      }
    }
    
    const ctOffsetX = (FOV_DIAMETER_PIXELS - ctData.width) / 2;
    const ctOffsetY = (FOV_DIAMETER_PIXELS - ctData.height) / 2;
    ctx.putImageData(ctImageData, ctOffsetX, ctOffsetY);

  }, [ctData]);

  // Render dose grid
  useEffect(() => {
    if (!doseCanvasRef.current || !ctData || doseGrid.length === 0) {
        if (doseCanvasRef.current) { // Clear canvas if no dose data
            const canvas = doseCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = FOV_DIAMETER_PIXELS; // Still set size for consistency
                canvas.height = FOV_DIAMETER_PIXELS;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        return;
    }

    const canvas = doseCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;
    canvas.width = FOV_DIAMETER_PIXELS;
    canvas.height = FOV_DIAMETER_PIXELS;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isodoseLevels = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
    
    // Create ImageData for the size of the actual doseGrid (assumed to be same as ctData)
    const doseGridWidth = doseGrid[0]?.length || ctData.width;
    const doseGridHeight = doseGrid.length || ctData.height;
    const doseImageData = ctx.createImageData(doseGridWidth, doseGridHeight);


    if (displayMode === 'doseWash') {
      for (let y = 0; y < doseGridHeight; y++) {
        for (let x = 0; x < doseGridWidth; x++) {
          if (y < doseGrid.length && x < (doseGrid[y]?.length || 0)) {
            const doseValue = doseGrid[y][x];
            const index = (y * doseGridWidth + x) * 4;
            let color = getIsodoseLevelColor(0); 
            let foundColor = false;

            for (const level of isodoseLevels) { 
              if (doseValue >= level) {
                color = getIsodoseLevelColor(level);
                foundColor = true;
                break;
              }
            }
            if (!foundColor && doseValue > 0.05 && doseValue < 0.1) {
                 color = getIsodoseLevelColor(0.1);
                 foundColor = true;
            }

            if (foundColor && doseValue > 0.02) { 
              const r = parseInt(color.slice(1, 3), 16);
              const g = parseInt(color.slice(3, 5), 16);
              const b = parseInt(color.slice(5, 7), 16);
              doseImageData.data[index] = r;
              doseImageData.data[index + 1] = g;
              doseImageData.data[index + 2] = b;
              doseImageData.data[index + 3] = 200; 
            } else {
              doseImageData.data[index + 3] = 0; 
            }
          }
        }
      }
    } else { // 'isodoseLines' mode
      const tolerance = 0.025; 
      for (let y = 0; y < doseGridHeight; y++) {
        for (let x = 0; x < doseGridWidth; x++) {
          if (y < doseGrid.length && x < (doseGrid[y]?.length || 0)) {
            const doseValue = doseGrid[y][x];
            const index = (y * doseGridWidth + x) * 4;
            let painted = false;
            for (const level of isodoseLevels) {
              if (Math.abs(doseValue - level) < tolerance) {
                const color = getIsodoseLevelColor(level); 
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                doseImageData.data[index] = r;
                doseImageData.data[index + 1] = g;
                doseImageData.data[index + 2] = b;
                doseImageData.data[index + 3] = 255;
                painted = true;
                break;
              }
            }
            if (!painted) {
              doseImageData.data[index + 3] = 0;
            }
          }
        }
      }
    }
    const doseOffsetX = (FOV_DIAMETER_PIXELS - doseGridWidth) / 2;
    const doseOffsetY = (FOV_DIAMETER_PIXELS - doseGridHeight) / 2;
    ctx.putImageData(doseImageData, doseOffsetX, doseOffsetY);
      
    if (displayMode === 'isodoseLines') {
        // Legend for Isodose Lines - Adjust position if necessary due to FOV change
        // For now, keep original logic, but it's drawing on the large canvas.
        const legendTopY = 3 + doseOffsetY; // Offset legend by where the dose grid starts
        const legendLeftX = 3 + doseOffsetX;
        const legendSpacing = 7;       
        const legendColorBlockWidth = 8; 
        const legendColorBlockHeight = 5; 
        const legendTextOffsetX = 3;   
        const legendFontSize = 5;      

        ctx.font = `${legendFontSize}px "Press Start 2P", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle'; 

        for (let i = 0; i < isodoseLevels.length; i++) {
            const level = isodoseLevels[i];
            const color = getIsodoseLevelColor(level);
            const yPos = legendTopY + legendColorBlockHeight / 2 + i * legendSpacing;

            ctx.fillStyle = color;
            ctx.fillRect(legendLeftX, yPos - legendColorBlockHeight / 2, legendColorBlockWidth, legendColorBlockHeight);

            ctx.fillStyle = 'white';
            const percentageText = (level * 100).toFixed(1) + '%';
            ctx.fillText(percentageText, legendLeftX + legendColorBlockWidth + legendTextOffsetX, yPos);
        }
    }
  }, [ctData, doseGrid, displayMode]);

  // Render beam paths
  useEffect(() => {
    if (!beamCanvasRef.current || !ctData) return; // ctData needed for initial centering logic if FOV wasn't fixed

    const canvas = beamCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;
    canvas.width = FOV_DIAMETER_PIXELS;
    canvas.height = FOV_DIAMETER_PIXELS;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Isocenter is now the center of the FOV
    const globalIsocenterX = FOV_DIAMETER_PIXELS / 2;
    const globalIsocenterY = FOV_DIAMETER_PIXELS / 2;

    if (showBeams) {
      beams.forEach((beam, index) => {
        // Convert to the standard IEC gantry angle convention
        // Input angle: 0 = top, 90 = right, 180 = bottom, 270 = left
        // Math angle: 0 = right, 90 = down, 180 = left, 270 = up
        const angle = (beam.angle + 90) * Math.PI / 180; 
        const perpAngle = angle + Math.PI / 2; 

        const visualSourceWidth = 1; 
        const minPhysicalWidthForCalc = visualSourceWidth + 1;
        const physicalWidthAtIso = Math.max(minPhysicalWidthForCalc, beam.width || 10); 

        const visualSourceToIsoDistance = FOV_RADIUS_PIXELS; // Source at 100cm
        const d_SI = Math.max(1, visualSourceToIsoDistance); 

        const sourceX_center = globalIsocenterX - Math.cos(angle) * d_SI;
        const sourceY_center = globalIsocenterY - Math.sin(angle) * d_SI;

        const divergenceRate = (physicalWidthAtIso - visualSourceWidth) / d_SI;

        // Extend beam across the FOV radius beyond isocenter
        const visualIsoToEndDistance = FOV_RADIUS_PIXELS * 1.1; // Extend slightly beyond FOV edge
        const endX_center = globalIsocenterX + Math.cos(angle) * visualIsoToEndDistance;
        const endY_center = globalIsocenterY + Math.sin(angle) * visualIsoToEndDistance;

        const totalLengthFromVisualSource = d_SI + visualIsoToEndDistance;
        const visualEndWidth = visualSourceWidth + totalLengthFromVisualSource * divergenceRate;

        const startX1 = sourceX_center + Math.cos(perpAngle) * (visualSourceWidth / 2);
        const startY1 = sourceY_center + Math.sin(perpAngle) * (visualSourceWidth / 2);
        const startX2 = sourceX_center - Math.cos(perpAngle) * (visualSourceWidth / 2);
        const startY2 = sourceY_center - Math.sin(perpAngle) * (visualSourceWidth / 2);

        const endX1 = endX_center + Math.cos(perpAngle) * (visualEndWidth / 2);
        const endY1 = endY_center + Math.sin(perpAngle) * (visualEndWidth / 2);
        const endX2 = endX_center - Math.cos(perpAngle) * (visualEndWidth / 2);
        const endY2 = endY_center - Math.sin(perpAngle) * (visualEndWidth / 2);
        
        ctx.beginPath();
        ctx.moveTo(startX1, startY1);
        ctx.lineTo(endX1, endY1);
        ctx.lineTo(endX2, endY2);
        ctx.lineTo(startX2, startY2);
        ctx.closePath();
        
        let beamColor;
        switch(index % 4) {
          case 0: beamColor = 'rgba(12, 84, 115, 0.4)'; break;
          case 1: beamColor = 'rgba(44, 133, 97, 0.4)'; break;
          case 2: beamColor = 'rgba(240, 158, 35, 0.4)'; break;
          case 3: beamColor = 'rgba(117, 51, 129, 0.4)'; break;
        }
        ctx.fillStyle = beamColor;
        ctx.fill();
        
        const labelDistance = 90; 
        const labelX = globalIsocenterX + Math.cos(angle) * labelDistance;
        const labelY = globalIsocenterY + Math.sin(angle) * labelDistance;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#f09e23'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`B${index + 1}`, labelX, labelY);
      });
    }

    if (showIsocenter) {
      ctx.beginPath();
      ctx.arc(globalIsocenterX, globalIsocenterY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(globalIsocenterX, globalIsocenterY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#a0170c'; 
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(globalIsocenterX - 10, globalIsocenterY);
      ctx.lineTo(globalIsocenterX + 10, globalIsocenterY);
      ctx.moveTo(globalIsocenterX, globalIsocenterY - 10);
      ctx.lineTo(globalIsocenterX, globalIsocenterY + 10);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw source rotation circle - 200 pixel radius around isocenter
    // Always display this regardless of isocenter visibility
    ctx.beginPath();
    ctx.arc(globalIsocenterX, globalIsocenterY, FOV_RADIUS_PIXELS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)'; // Light grey color for the source path
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]); // Dashed line for the circle
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash pattern
  }, [ctData, beams, showIsocenter, showBeams]);

  const getDisplayDimensions = () => {
    // FOV is square, so aspect ratio is 1
    const aspectRatio = 1.0; 
    
    // Slightly reduced to ensure no overflow
    const maxWidth = 580;
    const maxHeight = 580;
        
    // Ensure it's truly square based on the smaller of the two constraints
    const sideLength = Math.min(maxWidth, maxHeight);

    return {
      width: sideLength,
      height: sideLength
    };
  };

  const displayDimensions = getDisplayDimensions();
  
  // Calculate scaled dimensions based on zoom factor
  const getZoomedDisplayStyles = () => {
    // Calculate the expanded size of the canvas to account for zoom
    const zoomedSize = displayDimensions.width * zoomFactor;
    
    // Calculate offsets to center the zoomed content
    const offsetX = (zoomedSize - displayDimensions.width) / 2;
    const offsetY = (zoomedSize - displayDimensions.height) / 2;
    
    return {
      width: displayDimensions.width,
      height: displayDimensions.height,
      transform: `scale(${zoomFactor})`,
      transformOrigin: 'center center',
      transition: 'transform 0.3s ease-in-out'
    };
  };

  const zoomedStyles = getZoomedDisplayStyles();

  return (
    <VisualizerContainer>
      <CanvasContainer style={{ 
        width: displayDimensions.width, 
        height: displayDimensions.height, 
        overflow: 'hidden' 
      }}>
        <ZoomedContent 
          style={{ 
            transform: `scale(${zoomFactor})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          <Canvas 
            ref={ctCanvasRef} 
            width={FOV_DIAMETER_PIXELS} 
            height={FOV_DIAMETER_PIXELS}
            style={{ 
              width: displayDimensions.width, 
              height: displayDimensions.height
            }}
          />
          <DoseOverlayCanvas 
            ref={doseCanvasRef}
            width={FOV_DIAMETER_PIXELS} 
            height={FOV_DIAMETER_PIXELS}
            style={{ 
              width: displayDimensions.width, 
              height: displayDimensions.height
            }}
          />
          <BeamOverlayCanvas 
            ref={beamCanvasRef}
            width={FOV_DIAMETER_PIXELS} 
            height={FOV_DIAMETER_PIXELS}
            style={{ 
              width: displayDimensions.width, 
              height: displayDimensions.height
            }}
          />
        </ZoomedContent>
        {isCalculating && (
          <LoadingIndicator>
            Calculating...
          </LoadingIndicator>
        )}
      </CanvasContainer>
    </VisualizerContainer>
  );
};
