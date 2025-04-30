import React from 'react';

interface ConstellationControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ConstellationControls: React.FC<ConstellationControlsProps> = ({
  onZoomIn,
  onZoomOut
}) => {
  return (
    <div className="flex ml-4 bg-gray-800 rounded-md overflow-hidden">
      <button
        className="px-3 py-1 text-white hover:bg-gray-700 transition-colors"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <button
        className="px-3 py-1 text-white hover:bg-gray-700 transition-colors"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}; 