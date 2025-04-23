'use client';

import dynamic from 'next/dynamic';

// Dynamic import of SoundManager with no SSR
const SoundManager = dynamic(
  () => import('../core/sound/SoundManager.tsx').then(mod => mod.default),
  { ssr: false }
);

export default function ClientSoundManager() {
  return <SoundManager />;
} 