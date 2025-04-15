'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useJournalStore } from '@/app/store/journalStore';
import { PixelText } from '@/app/components/PixelThemeProvider';
import { safeDispatch } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/core/events/EventTypes';
import { usePrimitiveStoreValue, useStableCallback, asJournalValue } from '@/app/core/utils/storeHooks';
import { JournalPageProps, JournalStoreState } from '@/app/core/utils/journalTypes';

/**
 * Journal References Page
 * 
 * Displays technical information and reference materials
 * the player has collected throughout the game.
 * Implements Chamber Pattern for performance optimization
 * and DOM-based event handling.
 */
export default function JournalReferencesPage({ onElementClick }: JournalPageProps) {
  // DOM refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isAnimatingRef = useRef(false);
  
  // Extract primitive values from store with consistent defaults
  const hasKapoorReferenceSheetsValue = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalStoreState) => state.hasKapoorReferenceSheets,
    false
  );
  
  const hasKapoorAnnotatedNotesValue = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalStoreState) => state.hasKapoorAnnotatedNotes,
    false
  );
  
  const currentUpgradeValue = usePrimitiveStoreValue(
    useJournalStore,
    (state: JournalStoreState) => state.currentUpgrade,
    'base'
  );
  
  // Use helper to safely type the values
  const hasKapoorReferenceSheets = asJournalValue<boolean>(hasKapoorReferenceSheetsValue);
  const hasKapoorAnnotatedNotes = asJournalValue<boolean>(hasKapoorAnnotatedNotesValue);
  const currentUpgrade = asJournalValue<string>(currentUpgradeValue);
  
  // Track expanded sections for accordion behavior
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic-calibration']);
  
  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      Object.values(animationTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);
  
  // Toggle section expansion with stable callback
  const handleToggleSection = useStableCallback((sectionId: string) => {
    // Prevent rapid toggling
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    
    // Dispatch UI event
    safeDispatch(
      GameEventType.UI_BUTTON_CLICKED,
      {
        componentId: 'journalReferences',
        action: 'toggleSection',
        metadata: { 
          sectionId,
          isExpanded: expandedSections.includes(sectionId)
        }
      },
      'journalReferencesPage'
    );
    
    // Update state
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
    
    // DOM-based animation
    if (containerRef.current) {
      const sectionElement = containerRef.current.querySelector(`[data-section-id="${sectionId}"]`);
      
      if (sectionElement instanceof HTMLElement) {
        sectionElement.classList.add('section-animating');
        
        // Remove animation class after transition
        animationTimersRef.current.sectionAnimation = setTimeout(() => {
          if (sectionElement) {
            sectionElement.classList.remove('section-animating');
            isAnimatingRef.current = false;
          }
        }, 300);
      } else {
        isAnimatingRef.current = false;
      }
    } else {
      isAnimatingRef.current = false;
    }
  });
  
  // Handle reference click with event dispatch
  const handleReferenceClick = useStableCallback((referenceId: string, referenceType: string) => {
    safeDispatch(
      GameEventType.UI_NODE_CLICKED,
      {
        nodeId: referenceId,
        metadata: { 
          type: referenceType,
          source: 'journal_references'
        }
      },
      'journalReferencesPage'
    );
    
    // Apply animation to reference content
    if (containerRef.current) {
      const contentElement = containerRef.current.querySelector(`[data-reference-content="${referenceId}"]`);
      
      if (contentElement instanceof HTMLElement) {
        contentElement.classList.add('reference-highlight');
        
        // Remove highlight after animation
        animationTimersRef.current.referenceHighlight = setTimeout(() => {
          if (contentElement) {
            contentElement.classList.remove('reference-highlight');
          }
        }, 800);
      }
    }
  });
  
  // Stop propagation helper
  const stopPropagation = useStableCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  });
  
  return (
    <div 
      ref={containerRef}
      onClick={onElementClick} 
      className="page-container relative"
    >
      <PixelText className="text-2xl mb-4">Technical References</PixelText>
      
      <div className="space-y-6">
        {/* Basic calibration reference - everyone has this */}
        <div 
          data-section-id="basic-calibration"
          className={`p-4 bg-surface-dark pixel-borders-thin relative z-10 ${expandedSections.includes('basic-calibration') ? '' : 'cursor-pointer hover:bg-surface-dark/80'}`}
          onClick={() => handleToggleSection('basic-calibration')}
        >
          <div className="flex justify-between items-center mb-2">
            <PixelText className="text-lg text-clinical-light">Basic Calibration Protocol</PixelText>
            <span>{expandedSections.includes('basic-calibration') ? '▼' : '►'}</span>
          </div>
          
          {expandedSections.includes('basic-calibration') && (
            <div 
              data-reference-content="basic-calibration"
              className="p-3 bg-surface" 
              onClick={stopPropagation}
            >
              <PixelText className="text-sm">
                Standard output calibration procedure:
                <br /><br />
                1. Setup farmer chamber at reference depth (10cm)
                <br />
                2. Apply 100 MU at 10x10cm field size, 6MV
                <br />
                3. Record measurements and apply PTP correction
                <br />
                4. Compare to baseline (tolerance: ±2%)
                <br /><br />
                Additional requirements:
                <br />
                - SSD setup: 100cm
                <br />
                - Water phantom or solid water phantom
                <br />
                - Calibrated electrometer 
                <br />
                - Temperature and pressure measurement
                <br /><br />
                All measurements must be documented in the QA logbook with date, time, and physicist initials.
              </PixelText>
            </div>
          )}
        </div>
        
        {/* Kapoor's reference sheets - conditionally shown */}
        {hasKapoorReferenceSheets && (
          <div 
            data-section-id="kapoor-reference"
            className={`p-4 bg-surface-dark pixel-borders-thin relative z-10 ${expandedSections.includes('kapoor-reference') ? '' : 'cursor-pointer hover:bg-surface-dark/80'}`}
            onClick={() => handleToggleSection('kapoor-reference')}
            style={{ borderLeft: '4px solid var(--clinical-color)' }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <PixelText className="text-lg text-clinical-light">Kapoor's Technical Reference</PixelText>
                <span 
                  className="ml-2 px-2 py-0.5 bg-clinical text-white text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReferenceClick('kapoor-reference', 'special');
                  }}
                >
                  SPECIAL
                </span>
              </div>
              <span>{expandedSections.includes('kapoor-reference') ? '▼' : '►'}</span>
            </div>
            
            {expandedSections.includes('kapoor-reference') && (
              <>
                <div 
                  data-reference-content="kapoor-reference"
                  className="p-3 bg-surface" 
                  onClick={stopPropagation}
                >
                  <PixelText className="text-sm">
                    Advanced calibration coefficients and correction factors:
                    <br /><br />
                    - Temperature correction factor: (273.15 + T) / 295.15
                    <br />
                    - Pressure correction factor: 101.325 / P
                    <br />
                    - Combined PTP = [(273.15 + T) / 295.15] × [101.325 / P]
                    <br /><br />
                    Machine-specific calibration factors:
                    <br />
                    - LINAC 1 (6MV): 0.9823 cGy/nC
                    <br />
                    - LINAC 1 (10MV): 0.9756 cGy/nC
                    <br />
                    - LINAC 1 (15MV): 0.9698 cGy/nC
                    <br />
                    - LINAC 2 (6MV): 0.9847 cGy/nC
                    <br />
                    - LINAC 2 (10MV): 0.9725 cGy/nC
                    <br /><br />
                    Expanded tolerance specifications:
                    <br />
                    - Daily output: ±2%
                    <br />
                    - Monthly crosscalibration: ±1%
                    <br />
                    - Annual calibration: ±0.5%
                    <br />
                    - Field size dependence: ±2% for fields 5x5cm to 40x40cm
                    <br />
                    - Beam symmetry: ±1%
                    <br />
                    - Beam flatness: ±2%
                  </PixelText>
                </div>
                <div className="text-right text-xs text-text-secondary mt-1">
                  Provides +15% efficiency in calibration challenges
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Kapoor's annotated notes - conditionally shown */}
        {hasKapoorAnnotatedNotes && (
          <div 
            data-section-id="kapoor-notes"
            className={`p-4 bg-surface-dark pixel-borders-thin relative z-10 ${expandedSections.includes('kapoor-notes') ? '' : 'cursor-pointer hover:bg-surface-dark/80'}`}
            onClick={() => handleToggleSection('kapoor-notes')}
            style={{ borderLeft: '4px solid var(--educational-color)' }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <PixelText className="text-lg text-educational-light">Kapoor's Annotated Notes</PixelText>
                <span 
                  className="ml-2 px-2 py-0.5 bg-educational text-white text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReferenceClick('kapoor-notes', 'rare');
                  }}
                >
                  RARE
                </span>
              </div>
              <span>{expandedSections.includes('kapoor-notes') ? '▼' : '►'}</span>
            </div>
            
            {expandedSections.includes('kapoor-notes') && (
              <>
                <div 
                  data-reference-content="kapoor-notes"
                  className="p-3 bg-surface" 
                  onClick={stopPropagation}
                >
                  <div className="border-l-4 border-educational pl-2 italic">
                    <PixelText className="text-sm text-educational-light">
                      "Pay particular attention to barometric pressure trends in this facility. The building's HVAC system creates a cyclic pressure variation of approximately ±0.3 kPa throughout the day, significant enough to affect measurements if not properly accounted for."
                    </PixelText>
                  </div>
                  
                  <div className="border-l-4 border-clinical pl-2 mt-4">
                    <PixelText className="text-sm">
                      During my first year as physics resident, I failed to account for this pressure variation during morning QA. Dr. Chen caught the mistake before it affected treatment. Always check the building's pressure log before calibration.
                    </PixelText>
                  </div>
                  
                  <div className="mt-4">
                    <PixelText className="text-sm">
                      <span className="text-educational-light font-bold">Historical Context:</span> The original commissioning data for LINAC 2 showed inconsistencies that were traced to a faulty barometer. The machine was recommissioned with proper equipment, but subtle variations remained that needed careful documentation.
                    </PixelText>
                  </div>
                  
                  <div className="border-l-4 border-educational pl-2 mt-4 italic">
                    <PixelText className="text-sm text-educational-light">
                      "When working with Dr. Chen, I learned that technical precision is not about achieving perfection, but about understanding and documenting the limitations of our measurements. True rigor includes acknowledging uncertainty."
                    </PixelText>
                  </div>
                </div>
                <div className="text-right text-xs text-text-secondary mt-1">
                  Unlocks additional dialogue options with Kapoor
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Hospital map - interactive element */}
        <div 
          data-section-id="hospital-map"
          className={`p-4 bg-surface-dark pixel-borders-thin relative z-10 ${expandedSections.includes('hospital-map') ? '' : 'cursor-pointer hover:bg-surface-dark/80'}`}
          onClick={() => handleToggleSection('hospital-map')}
        >
          <div className="flex justify-between items-center mb-2">
            <PixelText className="text-lg">Hospital Map</PixelText>
            <span>{expandedSections.includes('hospital-map') ? '▼' : '►'}</span>
          </div>
          
          {expandedSections.includes('hospital-map') && (
            <div 
              data-reference-content="hospital-map"
              className="p-3 bg-surface flex items-center justify-center" 
              onClick={stopPropagation}
            >
              {/* Simple hospital map visualization */}
              <div className="w-full h-64 relative bg-surface-dark">
                <div 
                  className="absolute top-1/4 left-1/4 w-8 h-8 bg-clinical rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => handleReferenceClick('linac-1', 'location')}
                >
                  <span className="text-xs text-white">L1</span>
                </div>
                
                <div 
                  className="absolute bottom-1/4 left-1/3 w-8 h-8 bg-clinical rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => handleReferenceClick('linac-2', 'location')}
                >
                  <span className="text-xs text-white">L2</span>
                </div>
                
                <div 
                  className="absolute top-1/3 right-1/4 w-8 h-8 bg-educational rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => handleReferenceClick('research-lab', 'location')}
                >
                  <span className="text-xs text-white">Lab</span>
                </div>
                
                <div 
                  className="absolute center bottom-1/3 right-1/3 w-8 h-8 bg-qa rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => handleReferenceClick('qa-room', 'location')}
                >
                  <span className="text-xs text-white">QA</span>
                </div>
                
                <div 
                  className="absolute bottom-1/4 right-1/4 w-8 h-8 bg-storage-dark rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => handleReferenceClick('storage', 'location')}
                >
                  <span className="text-xs text-white">S</span>
                </div>
                
                {/* Path lines */}
                <div className="absolute top-1/4 left-1/4 w-20 h-1 bg-border transform rotate-45 origin-left"></div>
                <div className="absolute top-1/3 right-1/4 w-16 h-1 bg-border transform -rotate-45 origin-left translate-y-4 translate-x-2"></div>
                
                <div className="absolute bottom-1/4 left-1/3 w-24 h-1 bg-border transform -rotate-15 origin-left translate-y-4 translate-x-8"></div>
                
                {/* Legend */}
                <div className="absolute top-2 left-2 bg-surface-dark/90 p-2 text-xs">
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 bg-clinical mr-1"></div>
                    <span>LINAC Rooms</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 bg-educational mr-1"></div>
                    <span>Research Lab</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 bg-qa mr-1"></div>
                    <span>QA Room</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-storage-dark mr-1"></div>
                    <span>Storage</span>
                  </div>
                </div>
                
                {/* You are here indicator */}
                <div className="absolute bottom-10 right-10 p-1 bg-danger text-white text-xs animate-pulse">
                  You are here
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Medical Physics Glossary - basic reference for all players */}
        <div 
          data-section-id="glossary"
          className={`p-4 bg-surface-dark pixel-borders-thin relative z-10 ${expandedSections.includes('glossary') ? '' : 'cursor-pointer hover:bg-surface-dark/80'}`}
          onClick={() => handleToggleSection('glossary')}
        >
          <div className="flex justify-between items-center mb-2">
            <PixelText className="text-lg">Medical Physics Glossary</PixelText>
            <span>{expandedSections.includes('glossary') ? '▼' : '►'}</span>
          </div>
          
          {expandedSections.includes('glossary') && (
            <div 
              data-reference-content="glossary"
              className="p-3 bg-surface max-h-[400px] overflow-y-auto" 
              onClick={stopPropagation}
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <PixelText className="text-clinical-light font-medium">Absorbed Dose</PixelText>
                  <PixelText className="text-sm">The amount of energy deposited by ionizing radiation per unit mass of material. Measured in Gray (Gy).</PixelText>
                </div>
                
                <div>
                  <PixelText className="text-clinical-light font-medium">Linear Energy Transfer (LET)</PixelText>
                  <PixelText className="text-sm">The amount of energy that an ionizing particle transfers to the material traversed per unit distance. Measured in keV/μm.</PixelText>
                </div>
                
                <div>
                  <PixelText className="text-clinical-light font-medium">Inverse Square Law</PixelText>
                  <PixelText className="text-sm">The principle that the intensity of radiation is inversely proportional to the square of the distance from the source.</PixelText>
                </div>
                
                <div>
                  <PixelText className="text-clinical-light font-medium">PTP Correction</PixelText>
                  <PixelText className="text-sm">Temperature and pressure correction factor applied to ionization chamber measurements to account for air density differences from calibration conditions.</PixelText>
                </div>
                
                <div>
                  <PixelText className="text-clinical-light font-medium">Electron Equilibrium</PixelText>
                  <PixelText className="text-sm">The condition where the number of electrons entering a volume equals the number leaving it, important for accurate dosimetry measurements.</PixelText>
                </div>
                
                {/* More glossary entries would be included here */}
                <div className="text-center text-text-secondary text-sm py-2 border-t border-border">
                  Additional terms will be added as you encounter them in your residency.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* CSS animations */}
      <style jsx>{`
        .section-animating {
          transition: all 0.3s ease-in-out;
        }
        .reference-highlight {
          animation: highlight 0.8s ease-in-out;
        }
        @keyframes highlight {
          0%, 100% { background-color: var(--surface); }
          50% { background-color: rgba(var(--clinical-rgb), 0.15); }
        }
      `}</style>
    </div>
  );
}