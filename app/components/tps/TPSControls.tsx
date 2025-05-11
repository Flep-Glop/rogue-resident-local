'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface BeamData {
  angle: number;
  width: number;
  energy: number;
  // Potentially add an ID if needed for more complex state management, though index might suffice
}

interface TPSControlsProps {
  beams: BeamData[];
  onAddBeam: (beam: BeamData) => void;
  onRemoveBeam: (index: number) => void;
  onUpdateBeam: (index: number, updatedBeam: BeamData) => void; // New prop
  isCalculating: boolean;
  showIsocenter: boolean;
  showBeams: boolean;
  displayMode: 'doseWash' | 'isodoseLines';
  onToggleIsocenter: () => void;
  onToggleBeams: () => void;
  onToggleDisplayMode: () => void;
}

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  background-color: #1f2937;
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SectionTitle = styled.h2`
  font-family: var(--font-press-start-2p);
  font-size: 0.8rem;
  color: #60a5fa;
  margin-top: 0;
  margin-bottom: 0.5rem;
  text-shadow: 1px 1px 0px #1f2937;
  border-bottom: 2px solid #4b5563;
  padding-bottom: 0.25rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-family: var(--font-vt323);
  font-size: 1rem;
  color: #e5e7eb;
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  background-color: #374151;
  border: 2px solid #4b5563;
  border-radius: 0.25rem;
  color: #e5e7eb;
  font-family: var(--font-vt323);
  font-size: 1rem;
  padding: 0.5rem;
  width: 100%;
  margin-bottom: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: #60a5fa;
  }
`;

const RangeContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const RangeInput = styled.input`
  -webkit-appearance: none;
  background-color: #374151;
  border-radius: 0.25rem;
  height: 8px;
  flex: 1;
  margin-right: 0.5rem;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background-color: #60a5fa;
    border-radius: 2px;
    cursor: pointer;
  }
  
  &:focus {
    outline: none;
  }
`;

const RangeValue = styled.div`
  font-family: var(--font-vt323);
  font-size: 1rem;
  color: #e5e7eb;
  min-width: 40px;
  text-align: center;
`;

const Button = styled.button`
  font-family: var(--font-press-start-2p);
  font-size: 0.7rem;
  color: #e5e7eb;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
  
  &:hover:not(:disabled) {
    background-color: #2563eb;
  }
  
  &:disabled {
    background-color: #4b5563;
    cursor: not-allowed;
  }
`;

const ToggleButton = styled(Button)<{ $active: boolean }>`
  background-color: ${({ $active }) => $active ? '#3b82f6' : '#4b5563'};
  margin-right: 0.5rem;
  flex: 1;
  
  &:hover:not(:disabled) {
    background-color: ${({ $active }) => $active ? '#2563eb' : '#6b7280'};
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  margin: 1rem 0;
`;

const BeamList = styled.div`
  margin-top: 1rem;
`;

const BeamItemContainer = styled.div`
  background-color: #374151;
  border-radius: 0.25rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border: 1px solid #4b5563;
`;

const BeamItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const BeamInfo = styled.div`
  font-family: var(--font-vt323);
  font-size: 1rem;
  color: #e5e7eb;
`;

const RemoveButton = styled.button`
  background-color: #ef4444;
  border: none;
  border-radius: 0.25rem;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  
  &:hover {
    background-color: #dc2626;
  }
`;

const AngleVisualizer = styled.div`
  width: 100px;
  height: 100px;
  border: 2px solid #4b5563;
  border-radius: 50%;
  margin: 1rem auto 1.5rem auto;
  position: relative;
`;

const AngleLine = styled.div<{ angle: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 2px;
  background-color: #60a5fa;
  transform-origin: left center;
  transform: ${({ angle }) => `rotate(${angle - 90}deg)`};
  
  &:after {
    content: '';
    position: absolute;
    right: 0;
    top: -3px;
    width: 0;
    height: 0;
    border-left: 8px solid #60a5fa;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
  }
`;

const BeamEditControls = styled.div`
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #4b5563;
`;

const NumberInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem; // Space between buttons and input
`;

const StepButton = styled.button`
  background-color: #4b5563;
  color: #e5e7eb;
  border: none;
  border-radius: 0.25rem;
  font-family: var(--font-press-start-2p);
  font-size: 0.8rem; // Smaller font for +/- buttons
  width: 30px; // Fixed width for buttons
  height: 30px; // Fixed height for buttons
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: #6b7280;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EnergyButton = styled.button<{ $active: boolean }>`
  background-color: ${({ $active }) => $active ? '#3b82f6' : '#4b5563'};
  color: #e5e7eb;
  border: none;
  border-radius: 0.25rem;
  font-family: var(--font-vt323);
  font-size: 1rem;
  padding: 0.5rem 0.75rem;
  margin-right: 0.5rem;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: ${({ $active }) => $active ? '#2563eb' : '#6b7280'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ValueUnitDisplay = styled.span`
  font-family: var(--font-vt323);
  font-size: 1rem;
  color: #9ca3af; 
  margin-left: 0.5rem;
  min-width: 30px; // To align units
  text-align: left;
`;

const Select = styled.select`
  background-color: #374151;
  border: 2px solid #4b5563;
  border-radius: 0.25rem;
  color: #e5e7eb;
  font-family: var(--font-vt323);
  font-size: 1rem;
  padding: 0.5rem;
  width: 100%;
  margin-bottom: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: #60a5fa;
  }
`;

const DisplayModeButton = styled(Button)<{ $active: boolean }>`
  background-color: ${({ $active }) => $active ? '#3b82f6' : '#4b5563'};
  margin-right: 0.5rem;
  flex: 1;
  position: relative;
  padding: 0.75rem 1rem;
  border: ${({ $active }) => $active ? '2px solid #60a5fa' : '2px solid transparent'};
  box-shadow: ${({ $active }) => $active ? '0 0 8px rgba(96, 165, 250, 0.5)' : 'none'};
  
  &:hover:not(:disabled) {
    background-color: ${({ $active }) => $active ? '#2563eb' : '#6b7280'};
  }
  
  &:after {
    content: ${({ $active }) => $active ? '""' : 'none'};
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #60a5fa;
  }
`;

interface DraftValues {
  [key: string]: string; // e.g., "0-angle": "123"
}

// Add new tab-related styled components
const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TabButtonsContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #4b5563;
  margin-bottom: 0.5rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  font-family: var(--font-vt323);
  font-size: 0.9rem;
  color: ${({ $active }) => $active ? '#e5e7eb' : '#9ca3af'};
  background-color: ${({ $active }) => $active ? '#374151' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${({ $active }) => $active ? '#3b82f6' : 'transparent'};
  padding: 0.4rem 0.6rem;
  margin-right: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #e5e7eb;
    background-color: ${({ $active }) => $active ? '#374151' : '#2d3748'};
  }
`;

const TabContent = styled.div<{ $visible: boolean }>`
  display: ${({ $visible }) => $visible ? 'block' : 'none'};
`;

export const TPSControls: React.FC<TPSControlsProps> = ({ 
  beams, 
  onAddBeam, 
  onRemoveBeam,
  onUpdateBeam,
  isCalculating,
  showIsocenter,
  showBeams,
  displayMode,
  onToggleIsocenter,
  onToggleBeams,
  onToggleDisplayMode
}) => {
  const [visualizedAngle, setVisualizedAngle] = useState(0);
  const [draftValues, setDraftValues] = useState<DraftValues>({});
  const beamEnergies = [6, 10, 18]; // Available beam energies in MV
  const [activeBeamTab, setActiveBeamTab] = useState(0); // Track active beam tab

  useEffect(() => {
    if (beams.length > 0) {
      const lastBeamAngle = beams[beams.length - 1].angle;
      // Only update visualizedAngle if it's not currently being drafted for another beam
      // This logic might need refinement if multiple angle inputs are focused simultaneously (not current case)
      if (!Object.keys(draftValues).some(key => key.endsWith('-angle'))) {
        setVisualizedAngle(lastBeamAngle);
      }
    } else {
      setVisualizedAngle(0);
    }
    
    // If the active beam tab is removed, select the last available beam
    if (activeBeamTab >= beams.length && beams.length > 0) {
      setActiveBeamTab(beams.length - 1);
    } else if (beams.length === 0) {
      setActiveBeamTab(0);
    }
  }, [beams, draftValues, activeBeamTab]); // Add activeBeamTab to dependency array

  const handleAddBeam = () => {
    onAddBeam({
      angle: 0,
      width: 20,
      energy: 6
    });
    setDraftValues({});
    // Set the newly added beam as active
    setActiveBeamTab(beams.length); // This will be the index of the new beam
  };

  const commitDraftValue = (index: number, param: keyof BeamData) => {
    const draftKey = `${index}-${param}`;
    const valueToCommit = draftValues[draftKey];

    if (valueToCommit === undefined) return;

    let numericValue = parseInt(valueToCommit, 10);

    if (param === 'angle') numericValue = Math.max(0, Math.min(359, numericValue));
    if (param === 'width') numericValue = Math.max(1, Math.min(30, numericValue));
    if (param === 'energy') {
      if (!beamEnergies.includes(numericValue)) {
        numericValue = beams[index].energy;
      }
    }

    if (isNaN(numericValue)) {
       const currentBeamValue = beams[index][param].toString();
       setDraftValues(prev => ({...prev, [draftKey]: currentBeamValue }));
       return;
    }

    const updatedBeam = { 
      ...beams[index], 
      [param]: numericValue 
    };
    onUpdateBeam(index, updatedBeam);

    if (param === 'angle') {
      setVisualizedAngle(numericValue);
    }
    
    // Clear the draft value after committing
    setDraftValues(prev => {
      const newDrafts = {...prev};
      delete newDrafts[draftKey];
      return newDrafts;
    });
  };

  const handleInputChange = (index: number, param: keyof BeamData, value: string) => {
    const draftKey = `${index}-${param}`;
    setDraftValues(prev => ({ ...prev, [draftKey]: value }));
    if (param === 'angle') {
        // Tentatively update visualizer for angle as user types, if desired
        // const tempAngle = parseInt(value, 10);
        // if (!isNaN(tempAngle)) setVisualizedAngle(Math.max(0, Math.min(359, tempAngle)));
    }
  };

  const handleInputFocus = (index: number, param: keyof BeamData) => {
    const draftKey = `${index}-${param}`;
    if (draftValues[draftKey] === undefined) { // Only set draft if not already typing
      setDraftValues(prev => ({ ...prev, [draftKey]: beams[index][param].toString() }));
    }
    if (param === 'angle') {
      // Update visualizer to the committed angle of the focused beam, or its draft if exists
      const angleToVisualize = draftValues[draftKey] !== undefined ? parseInt(draftValues[draftKey],10) : beams[index].angle;
      if(!isNaN(angleToVisualize)) setVisualizedAngle(angleToVisualize)
      else setVisualizedAngle(beams[index].angle) // Fallback if draft is NaN
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, param: keyof BeamData) => {
    if (e.key === 'Enter') {
      commitDraftValue(index, param);
      (e.target as HTMLInputElement).blur(); // Optional: blur on enter
    }
  };
  
  const handleStepChange = (index: number, param: keyof BeamData, step: number) => {
    // Commit any existing draft for this input before applying step
    const draftKey = `${index}-${param}`;
    if (draftValues[draftKey] !== undefined) {
      commitDraftValue(index, param);
      // After commit, the actual beam value is updated, so we base the step on that.
      // Need a slight delay or to ensure state updates before proceeding, or directly calculate based on committed value.
      // For simplicity, we'll assume commitDraftValue updates beam state quickly enough for the next line.
      // A more robust solution might involve waiting for beam prop to update.
    }

    const currentValue = beams[index][param];
    let newValue = currentValue + step;

    if (param === 'angle') newValue = Math.max(0, Math.min(359, newValue));
    if (param === 'width') newValue = Math.max(1, Math.min(30, newValue));
    if (param === 'energy') newValue = Math.max(6, Math.min(18, newValue));
    
    const updatedBeam = { 
      ...beams[index], 
      [param]: newValue
    };
    onUpdateBeam(index, updatedBeam);
    if (param === 'angle') {
      setVisualizedAngle(newValue);
    }
    // Clear draft for this input as step provides direct commit
    setDraftValues(prev => {
        const newDrafts = {...prev};
        delete newDrafts[draftKey];
        return newDrafts;
      });
  };

  // Specific handler for energy select change, as it commits directly
  const handleEnergyChange = (index: number, energyValue: string) => {
    const energy = parseInt(energyValue, 10);
    if (beamEnergies.includes(energy)) {
      const updatedBeam = { 
        ...beams[index], 
        energy
      };
      onUpdateBeam(index, updatedBeam);
      // Clear draft for energy if any, as select is a direct commit
      const draftKey = `${index}-energy`;
      setDraftValues(prev => {
        const newDrafts = {...prev};
        delete newDrafts[draftKey];
        return newDrafts;
      });
    }
  };

  // Render a single beam edit panel
  const renderBeamEditPanel = (beam: BeamData, index: number) => {
    return (
      <BeamEditControls key={index}>
        <InputGroup>
          <Label>Angle (deg)</Label>
          <NumberInputContainer>
            <StepButton onClick={() => handleStepChange(index, 'angle', -5)}>-</StepButton>
            <Input
              type="number"
              value={draftValues[`${index}-angle`] || beam.angle}
              onChange={(e) => handleInputChange(index, 'angle', e.target.value)}
              onFocus={() => handleInputFocus(index, 'angle')}
              onBlur={() => commitDraftValue(index, 'angle')}
              onKeyDown={(e) => handleInputKeyDown(e, index, 'angle')}
            />
            <StepButton onClick={() => handleStepChange(index, 'angle', 5)}>+</StepButton>
          </NumberInputContainer>
        </InputGroup>
        
        <InputGroup>
          <Label>Width (px)</Label>
          <NumberInputContainer>
            <StepButton onClick={() => handleStepChange(index, 'width', -2)}>-</StepButton>
            <Input
              type="number"
              value={draftValues[`${index}-width`] || beam.width}
              onChange={(e) => handleInputChange(index, 'width', e.target.value)}
              onFocus={() => handleInputFocus(index, 'width')}
              onBlur={() => commitDraftValue(index, 'width')}
              onKeyDown={(e) => handleInputKeyDown(e, index, 'width')}
            />
            <StepButton onClick={() => handleStepChange(index, 'width', 2)}>+</StepButton>
          </NumberInputContainer>
        </InputGroup>
        
        <InputGroup>
          <Label>Energy (MV)</Label>
          <div>
            <EnergyButton $active={beam.energy === 6} onClick={() => handleEnergyChange(index, '6')}>6</EnergyButton>
            <EnergyButton $active={beam.energy === 10} onClick={() => handleEnergyChange(index, '10')}>10</EnergyButton>
            <EnergyButton $active={beam.energy === 18} onClick={() => handleEnergyChange(index, '18')}>18</EnergyButton>
          </div>
        </InputGroup>
        
        <RemoveButton onClick={() => onRemoveBeam(index)}>×</RemoveButton>
      </BeamEditControls>
    );
  };

  return (
    <ControlsContainer>
      <SectionTitle>Display Options</SectionTitle>
      <ToggleContainer>
        <ToggleButton 
          $active={showIsocenter} 
          onClick={onToggleIsocenter}
        >
          Isocenter
        </ToggleButton>
        <ToggleButton 
          $active={showBeams} 
          onClick={onToggleBeams}
        >
          Beams
        </ToggleButton>
      </ToggleContainer>

      <SectionTitle>Dose Visualization</SectionTitle>
      <ToggleContainer>
        <DisplayModeButton 
          $active={displayMode === 'doseWash'} 
          onClick={onToggleDisplayMode}
        >
          Dose Wash
        </DisplayModeButton>
        <DisplayModeButton 
          $active={displayMode === 'isodoseLines'} 
          onClick={onToggleDisplayMode}
        >
          Isodose Lines
        </DisplayModeButton>
      </ToggleContainer>
      
      <SectionTitle>Beam Controls</SectionTitle>
      <AngleVisualizer>
        {beams.map((beam, index) => (
          <AngleLine key={index} angle={beam.angle} />
        ))}
      </AngleVisualizer>
      
      <Button onClick={handleAddBeam} disabled={isCalculating}>
        Add Beam
      </Button>
      
      {beams.length > 0 && (
        <TabContainer>
          <TabButtonsContainer>
            {beams.map((beam, index) => (
              <TabButton 
                key={index}
                $active={activeBeamTab === index} 
                onClick={() => setActiveBeamTab(index)}
              >
                Beam {index + 1}
              </TabButton>
            ))}
          </TabButtonsContainer>
          
          {beams.map((beam, index) => (
            <TabContent key={index} $visible={activeBeamTab === index}>
              {renderBeamEditPanel(beam, index)}
            </TabContent>
          ))}
        </TabContainer>
      )}
    </ControlsContainer>
  );
}; 