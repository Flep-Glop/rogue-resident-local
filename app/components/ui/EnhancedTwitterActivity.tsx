'use client';

import React, { useState, useEffect } from 'react';
import { ActivityOption } from '@/app/types';
import PatientCaseTransition from './PatientCaseTransition';
import TwitterStyleActivity from './TwitterStyleActivity';
import { colors, spacing, typography } from '@/app/styles/pixelTheme';

interface EnhancedTwitterActivityProps {
  currentActivity: ActivityOption;
  onComplete: () => void;
}

export default function EnhancedTwitterActivity({ currentActivity, onComplete }: EnhancedTwitterActivityProps) {
  // Simply use the updated TwitterStyleActivity that has animation built-in
  return (
    <TwitterStyleActivity
      currentActivity={currentActivity}
      onComplete={onComplete}
    />
  );
} 