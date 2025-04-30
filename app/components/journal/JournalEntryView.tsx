import React from 'react';
import { JournalEntry, ConceptJournalEntry, MentorJournalEntry } from '@/app/store/journalStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { DomainColors, MentorId } from '@/app/types';

interface JournalEntryViewProps {
  entry: JournalEntry;
}

export const JournalEntryView: React.FC<JournalEntryViewProps> = ({ entry }) => {
  const stars = useKnowledgeStore(state => state.stars);
  
  // Check if entry is concept or mentor type
  const isConceptEntry = (entry: JournalEntry): entry is ConceptJournalEntry => {
    return 'conceptId' in entry;
  };
  
  const isMentorEntry = (entry: JournalEntry): entry is MentorJournalEntry => {
    return 'mentorId' in entry;
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get mentor name based on ID
  const getMentorName = (mentorId: MentorId) => {
    const mentorNames: Record<MentorId, string> = {
      garcia: 'Dr. Garcia',
      kapoor: 'Dr. Kapoor',
      jesse: 'Jesse',
      quinn: 'Dr. Quinn'
    };
    
    return mentorNames[mentorId] || mentorId;
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Entry metadata */}
      <div className="mb-6">
        {isConceptEntry(entry) && (
          <div className="flex items-center mb-2">
            <span 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: DomainColors[entry.domain] }}
            />
            <span className="text-sm font-medium">{entry.domain.replace('_', ' ')}</span>
          </div>
        )}
        
        {isConceptEntry(entry) && stars[entry.conceptId] && (
          <div className="mb-3">
            <h3 className="text-lg font-medium">Associated Concept</h3>
            <div className="bg-gray-800 p-3 rounded mt-1">
              <div className="font-semibold">{stars[entry.conceptId].name}</div>
              <div className="text-sm text-gray-300 mt-1">{stars[entry.conceptId].description}</div>
              <div className="flex items-center mt-2">
                <div className="text-xs text-gray-400">Mastery:</div>
                <div className="h-2 w-24 bg-gray-700 rounded-full ml-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${stars[entry.conceptId].mastery}%`,
                      backgroundColor: DomainColors[entry.domain]
                    }}
                  />
                </div>
                <div className="text-xs ml-2">{Math.round(stars[entry.conceptId].mastery)}%</div>
              </div>
            </div>
          </div>
        )}
        
        {isMentorEntry(entry) && (
          <div className="mb-3">
            <h3 className="text-lg font-medium">Mentor</h3>
            <div className="bg-gray-800 p-3 rounded mt-1">
              <div className="font-semibold">{getMentorName(entry.mentorId)}</div>
            </div>
          </div>
        )}
        
        <div className="text-sm text-gray-400">
          Created: {formatDate(entry.createdAt)}
          {entry.updatedAt.getTime() !== entry.createdAt.getTime() && (
            <>
              <br />
              Updated: {formatDate(entry.updatedAt)}
            </>
          )}
        </div>
      </div>
      
      {/* Entry content */}
      <div className="prose prose-invert max-w-none">
        {entry.content.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}; 