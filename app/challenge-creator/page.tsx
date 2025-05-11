import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to avoid hydration issues with the component
const ChallengeCreator = dynamic(
  () => import('../challenge-creator'),
  { ssr: false }
);

export default function ChallengeCreatorPage() {
  return <ChallengeCreator />;
} 