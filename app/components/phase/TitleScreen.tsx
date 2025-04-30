import React, { useState } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { GamePhase, Difficulty } from '@/app/types';

export const TitleScreen: React.FC = () => {
  const [startingGame, setStartingGame] = useState(false);
  const [loadingDev, setLoadingDev] = useState(false);
  const setPhase = useGameStore(state => state.setPhase);
  const setPlayerName = useGameStore(state => state.setPlayerName);
  const setDifficulty = useGameStore(state => state.setDifficulty);

  const handleStartGame = () => {
    setStartingGame(true);
    // Short delay to show button press effect before transitioning
    setTimeout(() => {
      setPhase(GamePhase.PROLOGUE);
    }, 300);
  };

  const handleLoadDev = () => {
    setLoadingDev(true);
    // Set player name to DEVELOPER and skip to DAY phase
    setPlayerName("DEVELOPER");
    setDifficulty(Difficulty.STANDARD);
    
    // Short delay to show button press effect before transitioning
    setTimeout(() => {
      setPhase(GamePhase.DAY);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Stars background effect */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {Array.from({ length: 100 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${Math.random() * 8 + 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="z-10 max-w-3xl text-center px-4">
        <h1 className="text-6xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          ROGUE RESIDENT
        </h1>
        
        <p className="text-xl mb-12 italic text-slate-300">
          "The mind is not a vessel to be filled, but a constellation to be illuminated."
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleStartGame}
            disabled={startingGame || loadingDev}
            className={`px-8 py-3 text-xl font-medium rounded-md transition-all duration-300 ${
              startingGame 
                ? 'bg-indigo-700 scale-95' 
                : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'
            }`}
          >
            {startingGame ? 'Starting...' : 'Begin Residency'}
          </button>
          
          <button
            onClick={handleLoadDev}
            disabled={startingGame || loadingDev}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              loadingDev 
                ? 'bg-emerald-700 scale-95' 
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {loadingDev ? 'Loading...' : 'Load Dev'}
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-sm text-slate-500">
        Rogue Resident v0.1.0 - Educational Medical Physics Game
      </div>
      
      {/* Add keyframes for star animation in global CSS */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}; 