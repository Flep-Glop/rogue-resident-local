'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useActivityStore } from '@/app/store/activityStore';
import { LocationId, ActivityOption, ActivityDifficulty, KnowledgeDomain, MentorId, DomainColors } from '@/app/types';
import { TimeManager } from '@/app/core/time/TimeManager';
import ActivityEngagement from '../ui/ActivityEngagement';

// Helper to render difficulty stars
const DifficultyStars = ({ difficulty }: { difficulty: ActivityDifficulty }) => {
  switch (difficulty) {
    case ActivityDifficulty.EASY:
      return <span className="text-yellow-400">★☆☆</span>;
    case ActivityDifficulty.MEDIUM:
      return <span className="text-yellow-400">★★☆</span>;
    case ActivityDifficulty.HARD:
      return <span className="text-yellow-400">★★★</span>;
    default:
      return <span className="text-gray-400">☆☆☆</span>;
  }
};

// Helper to get mentor's short name
const getMentorShortName = (mentorId: MentorId | undefined): string => {
  if (!mentorId) return '';
  
  switch (mentorId) {
    case MentorId.GARCIA: return 'Dr. Garcia';
    case MentorId.KAPOOR: return 'Dr. Kapoor';
    case MentorId.JESSE: return 'Jesse';
    case MentorId.QUINN: return 'Dr. Quinn';
    default: return '';
  }
};

// Helper to render domain indicators
const DomainIndicator = ({ domain }: { domain: KnowledgeDomain }) => {
  const color = DomainColors[domain] || '#888888';
  return (
    <div 
      className="h-3 w-3 rounded-full" 
      style={{ backgroundColor: color }}
      title={domain.replace('_', ' ')}
    />
  );
};

// Define hospital departments/zones
const DEPARTMENTS = {
  TREATMENT: { name: 'Treatment Wing', color: 'rgba(79, 70, 229, 0.2)' },
  PHYSICS: { name: 'Physics Department', color: 'rgba(45, 212, 191, 0.2)' },
  ADMIN: { name: 'Administration', color: 'rgba(244, 114, 182, 0.2)' },
  PATIENT: { name: 'Patient Services', color: 'rgba(251, 146, 60, 0.2)' },
  RESEARCH: { name: 'Research Area', color: 'rgba(139, 92, 246, 0.2)' },
};

// Define location positions for our enhanced map
const LOCATION_POSITIONS = {
  // Treatment Wing (Top Left)
  [LocationId.TREATMENT_ROOM_1]: { 
    top: '18%', 
    left: '15%', 
    label: 'Treatment Room 1',
    department: DEPARTMENTS.TREATMENT,
    size: 'md'
  },
  [LocationId.TREATMENT_ROOM_2]: { 
    top: '18%', 
    left: '30%', 
    label: 'Treatment Room 2',
    department: DEPARTMENTS.TREATMENT,
    size: 'md'
  },
  [LocationId.TREATMENT_ROOM_3]: { 
    top: '18%', 
    left: '45%', 
    label: 'Treatment Room 3',
    department: DEPARTMENTS.TREATMENT,
    size: 'md'
  },
  
  // Physics Department (Middle Left)
  [LocationId.PLANNING_ROOM]: { 
    top: '42%', 
    left: '15%', 
    label: 'Planning Room',
    department: DEPARTMENTS.PHYSICS,
    size: 'lg'
  },
  [LocationId.PHYSICS_LAB]: { 
    top: '42%', 
    left: '30%', 
    label: 'Physics Lab',
    department: DEPARTMENTS.PHYSICS,
    size: 'lg'
  },
  [LocationId.PHYSICS_OFFICE]: { 
    top: '42%', 
    left: '45%', 
    label: 'Physics Office',
    department: DEPARTMENTS.PHYSICS,
    size: 'md'
  },
  
  // Administration (Bottom Left)
  [LocationId.CONFERENCE_ROOM]: { 
    top: '74%', 
    left: '15%', 
    label: 'Conference Room',
    department: DEPARTMENTS.ADMIN,
    size: 'lg'
  },
  [LocationId.WORKSTATION]: { 
    top: '74%', 
    left: '30%', 
    label: 'Workstation',
    department: DEPARTMENTS.ADMIN,
    size: 'md'
  },
  
  // Patient Services (Right Side)
  [LocationId.WARD]: { 
    top: '18%', 
    left: '80%', 
    label: 'Ward',
    department: DEPARTMENTS.PATIENT,
    size: 'xl'
  },
  [LocationId.CLINIC]: { 
    top: '18%', 
    left: '65%', 
    label: 'Clinic',
    department: DEPARTMENTS.PATIENT,
    size: 'md'
  },
  [LocationId.CAFETERIA]: { 
    top: '42%', 
    left: '65%', 
    label: 'Cafeteria',
    department: DEPARTMENTS.PATIENT,
    size: 'lg'
  },
  
  // Research Area (Bottom Right)
  [LocationId.RESEARCH_LAB]: { 
    top: '74%', 
    left: '65%', 
    label: 'Research Lab',
    department: DEPARTMENTS.RESEARCH,
    size: 'md'
  },
  [LocationId.LIBRARY]: { 
    top: '74%', 
    left: '80%', 
    label: 'Library',
    department: DEPARTMENTS.RESEARCH,
    size: 'lg'
  },
};

// Define corridors to connect locations
const CORRIDORS = [
  // Main horizontal pathways
  { x1: '15%', y1: '18%', x2: '45%', y2: '18%', width: '2px' }, // Treatment rooms connection
  { x1: '65%', y1: '18%', x2: '80%', y2: '18%', width: '2px' }, // Patient area connection (Clinic to Ward)
  
  { x1: '15%', y1: '42%', x2: '45%', y2: '42%', width: '2px' }, // Physics area horizontal
  { x1: '45%', y1: '42%', x2: '65%', y2: '42%', width: '2px' }, // Connect Physics to Cafeteria
  
  { x1: '15%', y1: '74%', x2: '30%', y2: '74%', width: '2px' }, // Admin area (Conference to Workstation)
  { x1: '65%', y1: '74%', x2: '80%', y2: '74%', width: '2px' }, // Research area (Research Lab to Library)
  
  // Central horizontal connectors
  { x1: '45%', y1: '30%', x2: '65%', y2: '30%', width: '2px' }, // Connect to Clinic
  
  // Vertical pathways
  { x1: '15%', y1: '18%', x2: '15%', y2: '74%', width: '2px' }, // Left vertical
  { x1: '30%', y1: '18%', x2: '30%', y2: '74%', width: '2px' }, // Second vertical
  { x1: '45%', y1: '18%', x2: '45%', y2: '42%', width: '2px' }, // Third vertical (partial)
  { x1: '65%', y1: '18%', x2: '65%', y2: '74%', width: '2px' }, // Right vertical
  { x1: '80%', y1: '18%', x2: '80%', y2: '74%', width: '2px' }, // Far right vertical
];

export const DayPhase: React.FC = () => {
  const { currentTime, resources } = useGameStore();
  const { 
    availableActivities, 
    currentActivity, 
    generateAvailableActivities, 
    selectActivity 
  } = useActivityStore();
  
  // Generate available activities when time changes
  useEffect(() => {
    if (!currentActivity) {
      generateAvailableActivities();
    }
  }, [currentTime, currentActivity, generateAvailableActivities]);
  
  // Format the current time
  const formattedTime = TimeManager.formatTime(currentTime);
  
  // Create a map of location to available activities
  const activitiesByLocation: Record<LocationId, ActivityOption[]> = Object.values(LocationId).reduce((acc, location) => {
    acc[location] = [];
    return acc;
  }, {} as Record<LocationId, ActivityOption[]>);
  
  // Populate activities by location
  availableActivities.forEach(activity => {
    if (activitiesByLocation[activity.location]) {
      activitiesByLocation[activity.location].push(activity);
    }
  });
  
  // State to track player position for animation
  const [playerPosition, setPlayerPosition] = React.useState<{ top: string, left: string } | null>(null);
  
  // Handle location selection - if multiple activities are available, show them
  const handleLocationClick = (locationId: LocationId) => {
    const locationActivities = activitiesByLocation[locationId];
    if (locationActivities && locationActivities.length > 0) {
      // Set player position for animation
      const pos = LOCATION_POSITIONS[locationId];
      setPlayerPosition({ top: pos.top, left: pos.left });
      
      // If only one activity is available, start it immediately
      if (locationActivities.length === 1) {
        setTimeout(() => {
          selectActivity(locationActivities[0].id);
        }, 500); // Short delay for animation
      } else {
        // If multiple activities are available, set selected location to show options
        setSelectedLocation(locationId);
      }
    }
  };
  
  // State to track selected location for showing multiple activities
  const [selectedLocation, setSelectedLocation] = React.useState<LocationId | null>(null);
  
  // Function to select a specific activity from the dropdown
  const handleActivitySelect = (activityId: string) => {
    selectActivity(activityId);
    setSelectedLocation(null);
  };
  
  // Function to close the activity selection modal
  const handleCloseModal = () => {
    setSelectedLocation(null);
  };
  
  // Create a display info object for locations
  const getLocationDisplayInfo = (locationId: LocationId) => {
    const activities = activitiesByLocation[locationId] || [];
    if (activities.length === 0) return null;
    
    // Use first activity as primary info source
    const primaryActivity = activities[0];
    
    return {
      mentor: primaryActivity.mentor,
      difficulty: primaryActivity.difficulty,
      domains: primaryActivity.domains,
      activityCount: activities.length
    };
  };
  
  // Get size class based on location size
  const getSizeClass = (size: string) => {
    switch(size) {
      case 'sm': return 'w-20 h-16';
      case 'md': return 'w-28 h-20';
      case 'lg': return 'w-32 h-24';
      case 'xl': return 'w-40 h-28';
      default: return 'w-28 h-20';
    }
  };
  
  // If there's a current activity, show the engagement component
  if (currentActivity) {
    return <ActivityEngagement />;
  }
  
  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
      {/* Top header for time and resources */}
      <div className="bg-slate-800 text-white p-4 rounded-lg shadow-lg mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{formattedTime}</h2>
            <p className="text-slate-300">Spring - Day 1</p>
          </div>
          <div className="flex space-x-4">
            <div className="flex flex-col items-center">
              <span className="text-yellow-400">⚡</span>
              <span>{resources.momentum} / 3</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-blue-400">◆</span>
              <span>{resources.insight}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-purple-400">★</span>
              <span>{resources.starPoints}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hospital map with locations */}
      <div className="relative bg-slate-800 rounded-lg shadow-lg p-4 flex-grow" style={{ height: '640px' }}>
        <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
          <span className="mr-2 text-indigo-400">🏥</span>
          Hospital Map
        </h3>
        
        {/* Map legend */}
        <div className="absolute top-4 right-4 bg-slate-900 p-2 rounded-lg text-xs z-20 border border-slate-700">
          <div className="flex items-center mb-1">
            <span className="text-yellow-400 mr-2">★</span>
            <span className="text-slate-300">Easy</span>
          </div>
          <div className="flex items-center mb-1">
            <span className="text-yellow-400 mr-2">★★</span>
            <span className="text-slate-300">Medium</span>
          </div>
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">★★★</span>
            <span className="text-slate-300">Hard</span>
          </div>
        </div>
        
        {/* Map background */}
        <div className="absolute inset-4 border-2 border-slate-700 rounded-lg bg-slate-900"></div>
        
        {/* Department zones */}
        {Object.values(DEPARTMENTS).map((dept, index) => {
          // Find all locations in this department
          const deptLocations = Object.entries(LOCATION_POSITIONS).filter(
            ([_, pos]) => pos.department === dept
          );
          
          if (deptLocations.length === 0) return null;
          
          // Calculate the bounding box for this department
          const positions = deptLocations.map(([_, pos]) => ({
            top: parseInt(pos.top),
            left: parseInt(pos.left),
          }));
          
          // Add some padding and ensure departments don't overlap
          let minTop = Math.min(...positions.map(p => p.top)) - 8;
          let maxTop = Math.max(...positions.map(p => p.top)) + 8;
          let minLeft = Math.min(...positions.map(p => p.left)) - 8;
          let maxLeft = Math.max(...positions.map(p => p.left)) + 8;
          
          // Ensure proper sizing for each department
          switch (dept) {
            case DEPARTMENTS.TREATMENT:
              minTop = 8;
              maxTop = 28;
              minLeft = 5;
              maxLeft = 53;
              break;
            case DEPARTMENTS.PHYSICS:
              minTop = 32;
              maxTop = 54;
              minLeft = 5;
              maxLeft = 53;
              break;
            case DEPARTMENTS.ADMIN:
              minTop = 58;
              maxTop = 90;
              minLeft = 5;
              maxLeft = 42;
              break;
            case DEPARTMENTS.PATIENT:
              minTop = 8;
              maxTop = 54;
              minLeft = 57;
              maxLeft = 92;
              break;
            case DEPARTMENTS.RESEARCH:
              minTop = 58;
              maxTop = 90;
              minLeft = 57;
              maxLeft = 92;
              break;
          }
          
          return (
            <div 
              key={`dept-${index}`}
              className="absolute rounded-3xl opacity-70"
              style={{
                top: `${minTop}%`,
                left: `${minLeft}%`,
                width: `${maxLeft - minLeft}%`,
                height: `${maxTop - minTop}%`,
                backgroundColor: dept.color,
                border: '2px solid rgba(255,255,255,0.1)',
                zIndex: 1
              }}
            >
              <div className="absolute -top-4 left-4 text-xs font-semibold px-2 py-1 bg-slate-800 text-white rounded-full">
                {dept.name}
              </div>
            </div>
          );
        })}
        
        {/* Corridors */}
        {CORRIDORS.map((corridor, index) => (
          <div 
            key={`corridor-${index}`}
            className="absolute"
            style={{
              left: corridor.x1,
              top: corridor.y1,
              width: corridor.x1 === corridor.x2 ? corridor.width : `calc(${corridor.x2} - ${corridor.x1})`,
              height: corridor.y1 === corridor.y2 ? corridor.width : `calc(${corridor.y2} - ${corridor.y1})`,
              zIndex: 3,
              backgroundColor: 'rgba(129, 140, 248, 0.3)',
              boxShadow: '0 0 4px rgba(129, 140, 248, 0.3)',
              borderRadius: '1px'
            }}
          />
        ))}
        
        {/* Player position indicator */}
        {playerPosition && (
          <div 
            className="absolute w-8 h-8 rounded-full bg-indigo-500 border-2 border-white z-30 transition-all duration-500 ease-in-out animate-pulse shadow-lg shadow-indigo-500/50 flex items-center justify-center"
            style={{
              top: playerPosition.top,
              left: playerPosition.left,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-white text-xs font-bold">YOU</span>
          </div>
        )}
        
        {/* Location buttons */}
        {Object.entries(LOCATION_POSITIONS).map(([locationId, position]) => {
          const location = locationId as LocationId;
          const hasAvailableActivities = activitiesByLocation[location]?.length > 0;
          const displayInfo = getLocationDisplayInfo(location);
          const sizeClass = getSizeClass(position.size);
          
          return (
            <button
              key={locationId}
              className={`absolute rounded-lg p-2 transition-all duration-200 ${sizeClass} flex flex-col items-center justify-between text-center ${
                hasAvailableActivities 
                  ? 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 text-white shadow-lg cursor-pointer z-15' 
                  : 'bg-slate-800 text-slate-600 opacity-95 cursor-default z-5'
              }`}
              style={{
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, -50%)',
                borderWidth: hasAvailableActivities ? '2px' : '1px',
                borderColor: hasAvailableActivities ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                boxShadow: hasAvailableActivities ? '0 0 15px rgba(79, 70, 229, 0.5)' : 'none',
                zIndex: hasAvailableActivities ? 20 : 5
              }}
              onClick={hasAvailableActivities ? () => handleLocationClick(location) : undefined}
            >
              <div className="w-full">
                <p className="text-sm font-medium truncate">{position.label}</p>
              </div>
              
              {displayInfo && (
                <>
                  <div className="mt-1">
                    <DifficultyStars difficulty={displayInfo.difficulty} />
                  </div>
                  
                  {displayInfo.mentor && (
                    <div className="text-xs text-indigo-200 mt-1 truncate w-full">
                      {getMentorShortName(displayInfo.mentor)}
                    </div>
                  )}
                  
                  {displayInfo.domains.length > 0 && (
                    <div className="flex space-x-1 mt-1 justify-center">
                      {displayInfo.domains.map((domain, idx) => (
                        <DomainIndicator key={`${location}-${domain}-${idx}`} domain={domain} />
                      ))}
                    </div>
                  )}
                  
                  {displayInfo.activityCount > 1 && (
                    <div className="text-xs text-indigo-200 mt-1">
                      +{displayInfo.activityCount - 1} more
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
        
        {/* Activity selection modal */}
        {selectedLocation && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-indigo-500 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-indigo-400 mr-2">📍</span>
                {LOCATION_POSITIONS[selectedLocation].label}
              </h3>
              
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {activitiesByLocation[selectedLocation].map(activity => (
                  <button
                    key={activity.id}
                    className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg w-full text-left transition duration-200 border border-slate-600 hover:border-indigo-400"
                    onClick={() => handleActivitySelect(activity.id)}
                  >
                    <div className="flex justify-between text-white">
                      <h4 className="font-medium">{activity.title}</h4>
                      <span className="text-slate-300 bg-slate-800 px-2 rounded-full text-xs flex items-center">
                        {activity.duration} min
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{activity.description}</p>
                    <div className="flex justify-between mt-2">
                      <div>
                        {activity.mentor && (
                          <span className="text-slate-300 text-sm flex items-center">
                            <span className="text-indigo-400 mr-1">👤</span>
                            {getMentorShortName(activity.mentor)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {activity.domains.length > 0 && (
                          <div className="flex space-x-1">
                            {activity.domains.map((domain, idx) => (
                              <DomainIndicator key={`modal-${activity.id}-${domain}-${idx}`} domain={domain} />
                            ))}
                          </div>
                        )}
                        <DifficultyStars difficulty={activity.difficulty} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 border border-slate-600 hover:border-indigo-400 transition-all"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 