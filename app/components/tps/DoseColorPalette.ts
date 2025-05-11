// Dose color palette from color dose.hex
export const DOSE_COLORS = [
  '#000000', // 0
  '#000000', // 1
  '#47372f', // 2
  '#142d61', // 3
  '#532163', // 4
  '#0c5473', // 5
  '#595752', // 6
  '#a0170c', // 7
  '#d93413', // 8
  '#e16119', // 9
  '#887a6a', // 10
  '#2c8561', // 11
  '#f09e23', // 12
  '#8a9f6e', // 13
  '#753381', // 14
  '#166190', // 15
  '#359bac', // 16
  '#71c4a5', // 17
  '#d1cdb7'  // 18
];

/**
 * Gets color from dose value (0-1)
 * @param doseValue normalized dose value between 0 and 1
 * @returns hex color string from the palette
 */
export function getDoseColor(doseValue: number): string {
  if (doseValue <= 0) return DOSE_COLORS[0];
  
  // Map the dose value (0-1) to a color index
  const index = Math.min(
    DOSE_COLORS.length - 1, 
    Math.floor(doseValue * DOSE_COLORS.length)
  );
  
  return DOSE_COLORS[index];
}

/**
 * Gets a specific color for a given isodose level (percentage).
 * This mapping is based on the visual reference for isodose line display.
 * @param level The isodose level (e.g., 1.0 for 100%, 0.9 for 90%).
 * @returns Hex color string from the palette for that specific level.
 */
export function getIsodoseLevelColor(level: number): string {
  const roundedLevel = parseFloat(level.toFixed(1));
  switch (roundedLevel) {
    case 1.0: return DOSE_COLORS[7];  // '#a0170c' (Dark Red) - Updated for 100%
    case 0.9: return DOSE_COLORS[9];  // '#e16119' (Orange)
    case 0.8: return DOSE_COLORS[12]; // '#f09e23' (Yellow/Orange)
    case 0.7: return DOSE_COLORS[13]; // '#8a9f6e' (Olive Green)
    case 0.6: return DOSE_COLORS[11]; // '#2c8561' (Green)
    case 0.5: return DOSE_COLORS[17]; // '#71c4a5' (Light Green/Aqua)
    case 0.4: return DOSE_COLORS[16]; // '#359bac' (Cyan/Blue)
    case 0.3: return DOSE_COLORS[15]; // '#166190' (Blue)
    case 0.2: return DOSE_COLORS[5];  // '#0c5473' (Blue/Teal)
    case 0.1: return DOSE_COLORS[4];  // '#532163' (Dark Purple)
    default: return DOSE_COLORS[0];   // Default to black for other values or values < 0.1
  }
}

/**
 * Returns a CSS gradient string for the dose legend (for dose wash mode).
 * This will now create a stepped gradient based on the isodose level colors.
 */
export function getDoseGradient(): string {
  const levels = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
  const colorStops = levels.map((level, index) => {
    const color = getIsodoseLevelColor(level);
    const percentage = index * 10; // 0%, 10%, 20% ... for start of segment
    const nextPercentage = (index + 1) * 10; // 10%, 20%, 30% ... for end of segment
    return `${color} ${percentage}%, ${color} ${nextPercentage}%`;
  });
  // The last color needs to go to 100%
  const lastColor = getIsodoseLevelColor(levels[levels.length -1]);
  // Adjust if the last color stop doesn't cover up to 100%
  // The current logic maps 10 levels to 10% segments each, perfectly covering 0-100%.

  return `linear-gradient(to right, ${colorStops.join(', ')})`;
} 