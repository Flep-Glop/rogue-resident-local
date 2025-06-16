'use client';

import React from 'react';
import GameContainer from '@/app/components/scenes/GameContainer';

// DayPhase now exclusively uses HospitalBackdrop system - all legacy components removed

export const DayPhase: React.FC = () => {
  // DayPhase now exclusively uses the HospitalBackdrop system via GameContainer
  // All legacy grid view and activity selection logic has been removed
  
  return <GameContainer />;

};