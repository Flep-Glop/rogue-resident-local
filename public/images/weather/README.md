# Weather System Assets

## Asset Requirements for Weather Particle System

### Rain System
- **`rain-drop.png`**: 4×12px spritesheet, 3 frames horizontal
  - Frame 1: Small droplet
  - Frame 2: Stretched droplet (falling)
  - Frame 3: Tiny splash
- **`rain-heavy.png`**: 6×16px spritesheet, 4 frames horizontal
  - Heavier rain variant for storms

### Snow System
- **`snowflake-small.png`**: 8×8px spritesheet, 4 frames horizontal
  - Rotating small snowflake animation
- **`snowflake-large.png`**: 12×12px spritesheet, 4 frames horizontal
  - Larger snowflake for variety

### Atmospheric Effects
- **`mist-wisp.png`**: 24×16px spritesheet, 2 frames horizontal
  - Soft translucent fog wisps
- **`fog-patch.png`**: 32×20px spritesheet, 3 frames horizontal
  - Denser fog patches

## Art Style Guidelines
- Match existing ambient sprites - pixel art style
- Use same color palette as environment
- Keep effects subtle and atmospheric
- All sprites should be translucent/semi-transparent

## Testing Commands (Dev Console)
Once assets are added, use F2 console and these commands:
- `setWeather("clear")` - Clear skies (neutral lighting)
- `setWeather("rain")` - Light rain (cool, slightly darker atmosphere)
- `setWeather("storm")` - Heavy storm (both heavy + light rain, dark and dramatic atmosphere)
- `setWeather("snow")` - Snowfall (bright, cool blue-white atmosphere)
- `setWeather("fog")` - Misty atmosphere (desaturated and muted)

## Weather Color Effects
Each weather type applies atmospheric color filters similar to time-of-day lighting:

### Rain
- **Atmosphere**: Cool and slightly darker
- **Color Matrix**: Reduced red/green, enhanced blue, 8% darker overall
- **Feel**: Overcast day, cooler temperature

### Storm  
- **Atmosphere**: Dark and dramatic
- **Color Matrix**: Strongly reduced red/green, enhanced blue, 20% darker overall
- **Particles**: Shows BOTH heavy rain AND light rain for realistic storm effect
- **Feel**: Threatening storm clouds, low visibility

### Snow
- **Atmosphere**: Bright and cool blue-white
- **Color Matrix**: Enhanced all channels with blue emphasis, 5% brighter overall
- **Feel**: Clean winter air, crisp and bright

### Fog
- **Atmosphere**: Desaturated and muted
- **Color Matrix**: All channels reduced to 80%, 10% darker overall
- **Feel**: Limited visibility, muted colors

## Implementation Status
✅ Weather particle system implemented
✅ Event-driven weather controls
✅ World coordinate positioning
✅ Special movement patterns (snow floating, mist drifting)
✅ **Weather color atmosphere effects**
✅ **Storm weather with combined particle types**
⏳ **WAITING FOR ASSETS** - Ready to test once pixel art is added! 