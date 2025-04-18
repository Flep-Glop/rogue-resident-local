/**
 * DialogueNodeSelector
 * 
 * A simple development tool that adds a floating button to select test nodes,
 * with a specific focus on testing extensions.
 */

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function DialogueNodeSelector() {
  const { setCurrentNode } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Simple test nodes for extension testing
  const testNodes = [
    { id: 'path1', name: 'Extensions Test', description: 'Test all extension types with example dialogue' },
    { id: 'enc-1', name: 'Equipment Identification', description: 'Linear Accelerator Equipment Identification Challenge' }
  ];
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-500"
      >
        Test Extensions
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 bg-gray-900 text-white rounded-lg shadow-xl p-4">
          <h3 className="text-lg font-bold mb-2">Select Test Node</h3>
          
          <div className="space-y-2">
            {testNodes.map(node => (
              <button
                key={node.id}
                onClick={() => {
                  setCurrentNode(node.id);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded"
                title={node.description}
              >
                {node.name}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full bg-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
} 