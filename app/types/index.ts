export * from '../types'; 

export type GameScene = 
  | 'hospital'           // Main hospital exploration
  | 'home'               // Player's home (ground floor)
  | 'observatory'        // Player's observatory (upstairs)
  | 'constellation'      // Knowledge constellation view
  | 'lunch-room'         // Hospital social hub with chat bubbles
  | 'transition';        // Day-night transition 