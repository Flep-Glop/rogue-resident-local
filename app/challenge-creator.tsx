'use client';

import React from 'react';
import ChallengeSelector from './components/ui/ChallengeSelector';

export default function ChallengeCreator() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Challenge Creation System
        </h1>
        
        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10">
          Use this tool to create coherent challenges with mentor-specific questions.
          All challenges will only include questions assigned to the selected mentor,
          ensuring consistent dialogue and teaching style throughout the challenge.
        </p>
        
        <ChallengeSelector />
      </div>
    </div>
  );
} 