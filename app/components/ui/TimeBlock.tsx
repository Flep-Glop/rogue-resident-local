'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useActivityStore } from '@/app/store/activityStore';
import { TimeManager } from '@/app/core/time/TimeManager';
import { ActivityDifficulty, GameEventType } from '@/app/types';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import ActivityEngagement from './ActivityEngagement';

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

// The main TimeBlock component
export default function TimeBlock() {
  const { currentTime, resources, advanceTime } = useGameStore();
  const { 
    availableActivities, 
    currentActivity, 
    generateAvailableActivities, 
    selectActivity,
    completeActivity
  } = useActivityStore();
  
  // Generate available activities when time changes
  useEffect(() => {
    if (!currentActivity) {
      generateAvailableActivities();
      
      // Dispatch event for time block start
      centralEventBus.dispatch(
        GameEventType.TIME_BLOCK_STARTED,
        { hour: currentTime.hour, minute: currentTime.minute },
        'TimeBlock.useEffect'
      );
    }
  }, [currentTime, currentActivity, generateAvailableActivities, currentTime.hour, currentTime.minute]);
  
  // Format the current time
  const formattedTime = TimeManager.formatTime(currentTime);
  
  // Handle activity selection
  const handleSelectActivity = (activityId: string) => {
    selectActivity(activityId);
    
    // Get the selected activity
    const activity = availableActivities.find(a => a.id === activityId);
    
    // Dispatch activity selected event
    if (activity) {
      centralEventBus.dispatch(
        GameEventType.ACTIVITY_SELECTED,
        { 
          activityId: activity.id,
          title: activity.title,
          location: activity.location,
          duration: activity.duration,
          mentor: activity.mentor,
          domains: activity.domains
        },
        'TimeBlock.handleSelectActivity'
      );
    }
  };
  
  // If there's a current activity, show the engagement component
  if (currentActivity) {
    return <ActivityEngagement />;
  }
  
  return (
    <div className="bg-slate-800 text-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
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
      
      <h3 className="text-xl font-semibold mb-3">Available Activities:</h3>
      <div className="space-y-3">
        {availableActivities.map((activity) => (
          <button
            key={activity.id}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg w-full text-left transition duration-200"
            onClick={() => handleSelectActivity(activity.id)}
          >
            <div className="flex justify-between">
              <h4 className="font-medium">{activity.title}</h4>
              <span className="text-slate-300">{activity.duration} min</span>
            </div>
            <p className="text-slate-400 text-sm">{activity.location}</p>
            <div className="flex justify-between mt-2">
              <div>
                {activity.mentor && <span className="text-slate-300 text-sm">with {activity.mentor}</span>}
              </div>
              <DifficultyStars difficulty={activity.difficulty} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 