'use client';

import React from 'react';
import { useDialogueTierConnector } from '../components/DialogueTierConnector';

/**
 * DialogueTierExample - Shows how to integrate the resource tier system 
 * with dialogue options without breaking existing systems
 */
export default function DialogueTierExample() {
  // Use the dialogue tier connector hook
  const { processOptionOutcome } = useDialogueTierConnector();
  
  // Example dialogue options with quality scores (0-100)
  const dialogueOptions = [
    { id: 'option1', text: 'Critical insight (excellent choice)', score: 95 },
    { id: 'option2', text: 'Major insight (good choice)', score: 80 },
    { id: 'option3', text: 'Standard insight (decent choice)', score: 60 },
    { id: 'option4', text: 'Minor insight (weak choice)', score: 30 },
    { id: 'option5', text: 'Failure (poor choice)', score: 10 },
  ];
  
  // Handler for option selection
  const handleOptionSelect = (optionId: string, score: number) => {
    // Process the option using the tier system
    const tier = processOptionOutcome(score);
    
    console.log(`Selected option: ${optionId}`);
    console.log(`Applied resource tier: ${tier}`);
    
    // Your existing dialogue handling code would continue here...
  };
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Dialogue Option Example</h2>
      <p className="mb-4">Select an option to see how it affects resources:</p>
      
      <div className="space-y-2">
        {dialogueOptions.map(option => (
          <button
            key={option.id}
            onClick={() => handleOptionSelect(option.id, option.score)}
            className="w-full text-left p-2 hover:bg-gray-100 rounded transition"
          >
            {option.text}
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Note: This example shows how to integrate resource tiers with existing dialogue.</p>
        <p>Check the console for details on what's happening behind the scenes.</p>
      </div>
    </div>
  );
}

/**
 * How to integrate with your existing dialogue system:
 * 
 * 1. Import the useDialogueTierConnector hook
 * 2. Use processOptionOutcome() in your option handler
 * 3. No changes needed to existing resource store usage
 * 
 * Example integration in a real dialogue component:
 * 
 * ```tsx
 * function ExistingDialogueComponent() {
 *   // Your existing resource store usage
 *   const { insight, momentum } = useResourceStore();
 *   
 *   // Add the tier connector
 *   const { processOptionOutcome } = useDialogueTierConnector();
 *   
 *   // In your existing option handler
 *   function onOptionSelected(option) {
 *     // Compute a score based on the option quality (0-100)
 *     const score = determineOptionScore(option);
 *     
 *     // Process the outcome - this handles insight and momentum
 *     processOptionOutcome(score);
 *     
 *     // Continue with your existing handler...
 *   }
 *   
 *   // Rest of your component...
 * }
 * ```
 */ 