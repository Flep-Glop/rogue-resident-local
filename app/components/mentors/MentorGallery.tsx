'use client';

import { useState } from 'react';
import { useDialogueStore } from '@/app/store/dialogueStore';
import MentorRelationshipCard from './MentorRelationshipCard';

export default function MentorGallery() {
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const mentors = useDialogueStore(state => state.mentors);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-white mb-4">Hospital Staff</h2>
      
      {/* List of mentor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(mentors).map(mentorId => (
          <div key={mentorId} onClick={() => setSelectedMentorId(mentorId)}>
            <MentorRelationshipCard 
              mentorId={mentorId} 
              showDetails={selectedMentorId === mentorId}
            />
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {Object.keys(mentors).length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
          <p className="text-slate-400">No mentors available yet.</p>
        </div>
      )}
    </div>
  );
} 