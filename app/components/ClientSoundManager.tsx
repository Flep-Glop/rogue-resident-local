'use client';

import dynamic from 'next/dynamic';

// Dynamically import SoundManager with no SSR
const SoundManager = dynamic(() => import('../core/sound/SoundManager'), {
  ssr: false,
});

export default function ClientSoundManager() {
  return <SoundManager />;
} 