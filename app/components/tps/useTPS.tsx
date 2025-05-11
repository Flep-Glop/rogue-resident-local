'use client';

import { useState, useEffect, useCallback } from 'react';
import { SimpleTPS, CTImageData, Beam } from './TPSModel';

export interface TPSBeam extends Omit<Beam, 'angle'> {
  angle: number; // Angle in degrees for UI
}

export interface TPSState {
  ctData: CTImageData | null;
  doseGrid: number[][];
  beams: TPSBeam[];
  isCalculating: boolean;
  showIsocenter: boolean;
  showBeams: boolean;
  selectedBeamIndex: number | null;
  displayMode: 'doseWash' | 'isodoseLines';
}

export function useTPS() {
  const [tpsInstance, setTPSInstance] = useState<SimpleTPS | null>(null);
  const [state, setState] = useState<TPSState>({
    ctData: null,
    doseGrid: [],
    beams: [],
    isCalculating: false,
    showIsocenter: false,
    showBeams: false,
    selectedBeamIndex: null,
    displayMode: 'doseWash'
  });

  // Initialize the TPS with a phantom
  useEffect(() => {
    if (!state.ctData) {
      // Create a phantom image
      const phantomData = SimpleTPS.createSimplePhantom(100, 100);
      
      // Create TPS instance
      const tps = new SimpleTPS(phantomData);
      
      setTPSInstance(tps);
      setState(prev => ({
        ...prev,
        ctData: phantomData
      }));
    }
  }, [state.ctData]);

  // Calculate dose when beams change
  const calculateDose = useCallback(() => {
    if (!tpsInstance) return;
    
    setState(prev => ({
      ...prev,
      isCalculating: true
    }));
    
    // Simple timeout to simulate calculation time
    setTimeout(() => {
      // Calculate dose distribution
      tpsInstance.calculateDose();
      
      // Get normalized dose for visualization
      const doseGrid = tpsInstance.getDoseDistribution();
      
      setState(prev => ({
        ...prev,
        doseGrid,
        isCalculating: false
      }));
    }, 500);
  }, [tpsInstance]);

  // Add a beam
  const addBeam = useCallback((beam: TPSBeam) => {
    if (!tpsInstance) return;
    
    setState(prev => ({
      ...prev,
      beams: [...prev.beams, beam],
      isCalculating: true
    }));
    
    // Add beam to TPS instance
    tpsInstance.addBeam(beam.angle, 50, 50, beam.width, beam.energy);
    
    // Calculate dose after adding beam
    calculateDose();
  }, [tpsInstance, calculateDose]);

  // Update an existing beam
  const updateBeam = useCallback((index: number, beam: TPSBeam) => {
    if (!tpsInstance || index < 0 || index >= state.beams.length) return;
    
    setState(prev => {
      const updatedBeams = [...prev.beams];
      updatedBeams[index] = beam;
      
      return {
        ...prev,
        beams: updatedBeams,
        isCalculating: true
      };
    });
    
    // Update beam in TPS instance
    tpsInstance.updateBeam(index, beam.angle, 50, 50, beam.width, beam.energy);
    
    // Calculate dose after updating beam
    calculateDose();
  }, [tpsInstance, calculateDose, state.beams]);

  // Remove a beam
  const removeBeam = useCallback((index: number) => {
    if (!tpsInstance) return;
    
    setState(prev => {
      const updatedBeams = [...prev.beams];
      updatedBeams.splice(index, 1);
      
      return {
        ...prev,
        beams: updatedBeams,
        isCalculating: true,
        // If deleting the selected beam, clear selection
        selectedBeamIndex: prev.selectedBeamIndex === index ? null : 
                          (prev.selectedBeamIndex && prev.selectedBeamIndex > index) ? 
                          prev.selectedBeamIndex - 1 : prev.selectedBeamIndex
      };
    });
    
    // Remove beam from TPS instance
    tpsInstance.removeBeam(index);
    
    // Calculate dose after removing beam
    calculateDose();
  }, [tpsInstance, calculateDose]);

  // Clear all beams
  const clearBeams = useCallback(() => {
    if (!tpsInstance) return;
    
    setState(prev => ({
      ...prev,
      beams: [],
      isCalculating: true,
      selectedBeamIndex: null
    }));
    
    // Clear beams in TPS instance
    tpsInstance.clearBeams();
    
    // Update dose grid
    setState(prev => ({
      ...prev,
      doseGrid: [],
      isCalculating: false
    }));
  }, [tpsInstance]);

  // Select a beam for editing
  const selectBeam = useCallback((index: number | null) => {
    setState(prev => ({
      ...prev,
      selectedBeamIndex: index
    }));
  }, []);

  // Toggle isocenter visibility
  const toggleIsocenter = useCallback(() => {
    setState(prev => ({
      ...prev,
      showIsocenter: !prev.showIsocenter
    }));
  }, []);

  // Toggle beam visibility
  const toggleBeams = useCallback(() => {
    setState(prev => ({
      ...prev,
      showBeams: !prev.showBeams
    }));
  }, []);

  // Toggle display mode
  const toggleDisplayMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      displayMode: prev.displayMode === 'doseWash' ? 'isodoseLines' : 'doseWash'
    }));
  }, []);

  return {
    ...state,
    addBeam,
    updateBeam,
    removeBeam,
    clearBeams,
    selectBeam,
    toggleIsocenter,
    toggleBeams,
    toggleDisplayMode
  };
} 