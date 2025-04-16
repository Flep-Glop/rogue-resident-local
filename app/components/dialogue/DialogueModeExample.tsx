'use client';

import React, { useState } from 'react';
import DialogueContainer, { DialogueMode } from './DialogueContainer';

/**
 * Example component that demonstrates each DialogueMode
 * Use this to see how different modes look and behave
 */
const DialogueModeExample: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<DialogueMode>(DialogueMode.NARRATIVE);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl text-white font-pixel mb-8">DialogueMode Examples</h1>
      
      {/* Mode selector */}
      <div className="mb-8 flex flex-wrap gap-3">
        {Object.values(DialogueMode).map((mode) => (
          <button
            key={mode}
            onClick={() => setCurrentMode(mode)}
            className={`px-3 py-2 rounded text-sm font-pixel transition-all
              ${currentMode === mode 
                ? 'bg-blue-600 text-white shadow-lg scale-105' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Examples of each mode */}
      <div className="grid gap-8">
        <DialogueContainer
          mode={currentMode}
          title={`${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode`}
          className="max-w-3xl"
        >
          <p className="text-white">
            {currentMode === DialogueMode.NARRATIVE && 
              "The Linear Accelerator, often called the LINAC, directs high-energy x-rays or electrons to the region of the patient's tumor. These treatments can be designed in such a way that they destroy the cancer cells while sparing the surrounding normal tissue."}
            
            {currentMode === DialogueMode.CHALLENGE_INTRO && 
              "Let's explore how treatment beams are shaped using the multi-leaf collimator (MLC). Your task will be to identify the optimal MLC positions to achieve the desired dose distribution while minimizing exposure to organs at risk."}
            
            {currentMode === DialogueMode.QUESTION && 
              "Which of the following is NOT a primary advantage of using intensity-modulated radiation therapy (IMRT) over conventional 3D conformal radiation therapy?"}
            
            {currentMode === DialogueMode.INSTRUCTION && 
              "Follow these steps to calibrate the ionization chamber:\n1. Set the chamber in the water phantom\n2. Align to isocenter using room lasers\n3. Apply temperature and pressure corrections\n4. Take three consecutive readings to verify stability"}
            
            {currentMode === DialogueMode.REACTION && 
              "Excellent work! By correctly identifying the inverse square law relationship, you've demonstrated a solid understanding of the fundamental principles of radiation physics."}
            
            {currentMode === DialogueMode.CRITICAL && 
              "IMPORTANT: Never proceed with treatment if the patient position deviates by more than 3mm from the reference scan. Always verify MU values match the prescription exactly before beam delivery."}
          </p>
          
          {currentMode === DialogueMode.QUESTION && (
            <div className="mt-4 space-y-3">
              <button className="w-full text-left p-3 bg-black/60 text-gray-300 hover:bg-[#162642]/80 hover:text-white border-l-4 border-transparent hover:border-blue-500/50 transition-all duration-200 flex items-start group">
                <span className="mr-2 opacity-60 group-hover:opacity-100 group-hover:text-blue-400 transition-all duration-300">{'>'}</span>
                <span className="flex-1">Better dose conformity to the target volume</span>
              </button>
              <button className="w-full text-left p-3 bg-black/60 text-gray-300 hover:bg-[#162642]/80 hover:text-white border-l-4 border-transparent hover:border-blue-500/50 transition-all duration-200 flex items-start group">
                <span className="mr-2 opacity-60 group-hover:opacity-100 group-hover:text-blue-400 transition-all duration-300">{'>'}</span>
                <span className="flex-1">Reduced treatment delivery time</span>
              </button>
              <button className="w-full text-left p-3 bg-black/60 text-gray-300 hover:bg-[#162642]/80 hover:text-white border-l-4 border-transparent hover:border-blue-500/50 transition-all duration-200 flex items-start group">
                <span className="mr-2 opacity-60 group-hover:opacity-100 group-hover:text-blue-400 transition-all duration-300">{'>'}</span>
                <span className="flex-1">Lower radiation dose to surrounding healthy tissues</span>
              </button>
            </div>
          )}
        </DialogueContainer>
      </div>
      
      {/* Color key */}
      <div className="mt-12 p-4 bg-black/50 rounded max-w-3xl">
        <h3 className="text-lg text-white font-pixel mb-4">DialogueMode Color Key</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-blue-300">NARRATIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-amber-300">CHALLENGE_INTRO</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-purple-300">QUESTION</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-green-300">INSTRUCTION</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-pink-500 rounded"></div>
            <span className="text-pink-300">REACTION</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-red-300">CRITICAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogueModeExample; 