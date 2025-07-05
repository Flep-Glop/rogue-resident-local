# Pond Ripple System

## Asset Requirements for Pond Ripple System

### Basic Ripple System
- **`ripple-small.png`**: 16×16px spritesheet, 4 frames horizontal
  - Frame 1: Tiny center dot (2px)
  - Frame 2: Small circle (6px) 
  - Frame 3: Medium circle (10px)
  - Frame 4: Large circle (14px), very faint
- **`ripple-medium.png`**: 24×24px spritesheet, 4 frames horizontal
  - Frame 1: Small circle (4px)
  - Frame 2: Medium circle (10px)
  - Frame 3: Large circle (16px) 
  - Frame 4: Very large circle (22px), very faint

### Weather-Specific Ripples
- **`ripple-rain.png`**: 12×12px spritesheet, 3 frames horizontal
  - Quick, small rain impact ripples
  - Frame 1: Impact dot (2px)
  - Frame 2: Small splash (6px)
  - Frame 3: Dispersing (10px)
- **`ripple-storm.png`**: 32×32px spritesheet, 5 frames horizontal
  - Large, chaotic storm ripples
  - Frame 1: Impact (6px)
  - Frame 2: Expanding (12px)
  - Frame 3: Large wave (20px)
  - Frame 4: Very large (28px)
  - Frame 5: Fading (30px), very faint

### Surface Effects
- **`water-sparkle.png`**: 8×8px spritesheet, 3 frames horizontal
  - Tiny light reflections on water surface
  - Frame 1: Bright dot
  - Frame 2: Dimmer 
  - Frame 3: Fade out

## Weather-Reactive Behavior
The pond ripple system adapts to weather conditions:

### Clear Weather
- **Frequency**: Every 3-8 seconds
- **Types**: Ambient ripples + occasional sparkles (30% chance)
- **Feel**: Peaceful, gentle water movement

### Rain Weather  
- **Frequency**: Every 0.5-2 seconds
- **Types**: Rain impact ripples + some ambient (40% chance)
- **Feel**: Active water surface with rain impacts

### Storm Weather
- **Frequency**: Every 0.2-1 seconds (very frequent)
- **Types**: Large storm ripples + rain ripples (60% chance for rain)
- **Feel**: Turbulent, chaotic water surface

### Snow Weather
- **Frequency**: Every 8-15 seconds (slow)
- **Types**: Occasional ambient ripples (70% chance)
- **Feel**: Partially frozen, limited movement

### Fog Weather
- **Frequency**: Every 5-12 seconds
- **Types**: Subtle ambient ripples (50% chance)
- **Feel**: Quiet, mysterious water surface

## Testing Commands (Dev Console)
Use F2 console for testing:
- `spawnRipple()` - Spawn ambient ripple
- `spawnRipple("rain")` - Spawn rain ripple
- `spawnRipple("storm")` - Spawn storm ripple
- `spawnRipple("sparkle")` - Spawn water sparkle
- `clearRipples()` - Clear all active ripples

## Technical Implementation
- **World Coordinates**: Ripples positioned using established coordinate system
- **Self-Cleanup**: Automatic fade-out and memory management
- **Weather Integration**: Spawning frequency adapts to current weather
- **Performance**: Limited active ripples with automatic cleanup
- **Animation**: Non-looping sprites with fade-out effects

## Implementation Status
✅ **Pond ripple system implemented**
✅ **Weather-reactive spawning**
✅ **World coordinate positioning** 
✅ **Self-cleanup and memory management**
✅ **Dev console testing commands**
✅ **Ready for testing with assets**! 