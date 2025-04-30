'use client';

import { useState, useEffect } from 'react';
import { useDialogueStore } from '@/app/store/dialogueStore';
import DialogueContainer from './DialogueContainer';
import DialogueActivity from './DialogueActivity';
import { Dialogue } from '@/app/data/dialogueData';

interface DialogueViewProps {
  filter?: {
    domain?: string;
    mentorId?: string;
    maxDifficulty?: number;
  };
}

export default function DialogueView({ filter }: DialogueViewProps) {
  const [availableDialogues, setAvailableDialogues] = useState<Dialogue[]>([]);
  const [selectedDialogue, setSelectedDialogue] = useState<string | null>(null);
  
  const { dialogues, activeDialogueId } = useDialogueStore();
  
  // Filter dialogues based on props
  useEffect(() => {
    const filtered = Object.values(dialogues).filter(dialogue => {
      // Filter by domain if specified
      if (filter?.domain && dialogue.domain !== filter.domain) {
        return false;
      }
      
      // Filter by mentor if specified (using first node's mentorId)
      if (filter?.mentorId) {
        const startNode = dialogue.nodes[dialogue.startNodeId];
        if (startNode && startNode.mentorId !== filter.mentorId) {
          return false;
        }
      }
      
      // Filter by difficulty if specified
      if (filter?.maxDifficulty && dialogue.difficulty > filter.maxDifficulty) {
        return false;
      }
      
      return true;
    });
    
    setAvailableDialogues(filtered);
  }, [dialogues, filter]);
  
  // If there's an active dialogue, show it
  if (activeDialogueId) {
    return (
      <div className="animate-fadeIn">
        <DialogueContainer dialogueId={activeDialogueId} />
      </div>
    );
  }
  
  // If a dialogue is selected, start it as an activity
  if (selectedDialogue) {
    return (
      <DialogueActivity 
        dialogueId={selectedDialogue} 
        onComplete={() => setSelectedDialogue(null)}
      />
    );
  }
  
  // Show available dialogues to start
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-white mb-4">Available Conversations</h2>
      
      {availableDialogues.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {availableDialogues.map(dialogue => (
            <button
              key={dialogue.id}
              onClick={() => setSelectedDialogue(dialogue.id)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-4 text-left transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{dialogue.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{dialogue.description}</p>
                </div>
                <div className="flex items-center">
                  {/* Difficulty indicator */}
                  <div className="text-amber-400">
                    {Array.from({ length: dialogue.difficulty }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                    {Array.from({ length: 3 - dialogue.difficulty }).map((_, i) => (
                      <span key={i} className="text-slate-600">★</span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Domain tag */}
              {dialogue.domain && (
                <div className="mt-3">
                  <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                    {dialogue.domain.replace('_', ' ')}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
          <p className="text-slate-400">No available conversations match your criteria.</p>
        </div>
      )}
    </div>
  );
} 