'use client';

import { useDialogueStore } from '@/app/store/dialogueStore';
import Image from 'next/image';

interface MentorRelationshipCardProps {
  mentorId: string;
  showDetails?: boolean;
}

export default function MentorRelationshipCard({
  mentorId,
  showDetails = false
}: MentorRelationshipCardProps) {
  const getMentor = useDialogueStore(state => state.getMentor);
  const mentor = getMentor(mentorId);
  
  if (!mentor) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 animate-pulse">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-slate-700"></div>
          <div className="ml-3">
            <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate relationship level (0-5)
  const relationshipLevel = Math.floor(mentor.relationship / 20);
  
  // Get level description
  const getLevelDescription = (level: number) => {
    switch (level) {
      case 0: return 'Acquaintance';
      case 1: return 'Familiar';
      case 2: return 'Friendly';
      case 3: return 'Trusted';
      case 4: return 'Respected';
      case 5: return 'Mentor';
      default: return 'Unknown';
    }
  };
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center">
        {/* Mentor portrait */}
        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden mr-3">
          {mentor.portrait && (
            <Image
              src={mentor.portrait} 
              alt={mentor.name} 
              className="w-full h-full object-cover"
              width={40}
              height={40}
            />
          )}
        </div>
        
        {/* Mentor info */}
        <div>
          <h3 className="font-bold text-white">{mentor.name}</h3>
          <p className="text-xs text-slate-400">{mentor.title}</p>
          
          {/* Relationship level */}
          <div className="mt-1 flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full mx-0.5 ${
                  i < relationshipLevel 
                    ? 'bg-blue-500' 
                    : 'bg-slate-600'
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-slate-300">
              {getLevelDescription(relationshipLevel)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-2">
            {mentor.specialty}
          </p>
          
          {/* Domains */}
          <div className="flex flex-wrap gap-1">
            {mentor.domains.map(domain => (
              <span 
                key={domain} 
                className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300"
              >
                {domain.replace('_', ' ')}
              </span>
            ))}
          </div>
          
          {/* Relationship meter */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Relationship</span>
              <span>{mentor.relationship}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${mentor.relationship}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 