import React, { useState } from 'react';
import { KnowledgeStar, DomainColors } from '@/app/types';

interface StarProps {
  star: KnowledgeStar;
  onClick: () => void;
  isNewlyDiscovered?: boolean;
}

export const Star: React.FC<StarProps> = ({ star, onClick, isNewlyDiscovered = false }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Determine star size based on mastery
  const size = star.unlocked 
    ? Math.max(24, 24 + (star.mastery / 100 * 16)) 
    : 20;
  
  // Determine star appearance based on state
  const getStarColor = () => {
    if (!star.discovered) return '#555';
    if (!star.unlocked) return '#888';
    
    const baseColor = DomainColors[star.domain];
    const alpha = star.active ? 'ff' : '88';
    return `${baseColor}${alpha}`;
  };
  
  const getBorderColor = () => {
    if (!star.unlocked) return isNewlyDiscovered ? '#ffcc00' : '#aaa';
    return star.active ? '#fff' : '#aaa';
  };
  
  const starColor = getStarColor();
  const borderColor = getBorderColor();
  
  // Enhanced glow for newly discovered stars
  const getGlowEffect = () => {
    if (isNewlyDiscovered) {
      return `0 0 20px #ffcc00, 0 0 10px ${DomainColors[star.domain]}`;
    }
    if (star.active && star.unlocked) {
      return `0 0 15px ${starColor}`;
    }
    return 'none';
  };
  
  const glowEffect = getGlowEffect();
  
  // Animation class for newly discovered stars
  const animationClass = isNewlyDiscovered 
    ? 'animate-pulse' 
    : '';
  
  // Handle hover to show details
  const handleMouseEnter = () => setShowDetails(true);
  const handleMouseLeave = () => setShowDetails(false);
  
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ 
        left: star.position.x,
        top: star.position.y,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Star visualization */}
      <div
        className={`rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${animationClass}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: starColor,
          border: isNewlyDiscovered ? `3px solid ${borderColor}` : `2px solid ${borderColor}`,
          boxShadow: glowEffect,
        }}
        onClick={onClick}
      >
        {star.unlocked && (
          <div 
            className="text-xs font-bold"
            style={{
              color: star.active ? '#fff' : '#eee',
            }}
          >
            {Math.round(star.mastery)}%
          </div>
        )}
      </div>
      
      {/* New discovery indicator */}
      {isNewlyDiscovered && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="inline-block px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full animate-bounce">
            New!
          </div>
        </div>
      )}
      
      {/* Star name label */}
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs whitespace-nowrap"
        style={{
          color: isNewlyDiscovered ? '#ffcc00' : (star.unlocked ? '#fff' : '#aaa'),
          fontWeight: (star.unlocked || isNewlyDiscovered) ? 'bold' : 'normal',
        }}
      >
        {star.name}
      </div>
      
      {/* Tooltip with details */}
      {showDetails && (
        <div 
          className="absolute z-10 w-64 p-3 rounded-md shadow-lg"
          style={{
            backgroundColor: '#111',
            border: `1px solid ${DomainColors[star.domain]}`,
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '24px',
          }}
        >
          <h3 className="font-bold text-white mb-1">
            {star.name}
            {isNewlyDiscovered && (
              <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">New!</span>
            )}
          </h3>
          <p className="text-sm text-gray-300 mb-2">{star.description}</p>
          
          {star.discovered && !star.unlocked && (
            <div className="text-xs text-yellow-400 font-bold mt-2">
              Cost to unlock: {star.spCost} SP
            </div>
          )}
          
          {star.unlocked && (
            <>
              <div className="flex justify-between mt-2 text-xs">
                <span>Mastery:</span>
                <span className="font-bold">{Math.round(star.mastery)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${star.mastery}%`,
                    backgroundColor: DomainColors[star.domain] 
                  }}
                />
              </div>
              <div className="text-xs mt-2">
                Status: <span className={star.active ? "text-green-400" : "text-gray-400"}>
                  {star.active ? "Active" : "Inactive"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 