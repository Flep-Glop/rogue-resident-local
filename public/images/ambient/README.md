# Ambient Creature Sprite Sheets

This directory contains sprite sheets for animated ambient creatures in the hospital scene.

## Required Sprite Sheets

### birds.png
- **Size**: 16x16 pixels per frame
- **Frames**: 4 frames (horizontal layout = 64x16 total)
- **Animation**: Flying cycle (wing up, middle, down, middle)
- **Usage**: Flying birds across the sky

### people-walking.png  
- **Size**: 16x24 pixels per frame
- **Frames**: 6 frames (horizontal layout = 96x24 total)
- **Animation**: Walking cycle
- **Usage**: People walking on hospital paths

### deer.png
- **Size**: 24x24 pixels per frame  
- **Frames**: 4 frames (horizontal layout = 96x24 total)
- **Animation**: Standing, walking, grazing
- **Usage**: Deer in forested areas

### small-animals.png
- **Size**: 12x12 pixels per frame
- **Frames**: 3 frames (horizontal layout = 36x12 total)  
- **Animation**: Small animal movement (rabbits, squirrels)
- **Usage**: Small creatures in grass areas

## Animation System Features

- **Automatic sprite animation**: Uses CSS `steps()` animation
- **Path movement**: Creatures move along defined paths
- **Staggered timing**: Different delays prevent all creatures moving in sync
- **Scalable**: Each creature can be scaled independently
- **Multiple flight patterns**: Birds have 3 different flight paths
- **Behind scene elements**: Creatures appear behind interactive hospital elements

## Adding New Creatures

Edit `AMBIENT_CREATURES` array in `HospitalBackdrop.tsx`:

```typescript
{
  id: 'unique-id',
  type: 'bird' | 'person' | 'deer' | 'small-animal',
  spriteSheet: '/images/ambient/sprite-file.png',
  spriteWidth: 16,
  spriteHeight: 16, 
  frameCount: 4,
  animationDuration: '0.8s',
  pathDuration: '25s',
  startX: 10,
  startY: 20,
  endX: 90,
  endY: 30,
  delay: '5s',
  scale: 1.5,
  flightPath: 'birdFlight1' // Only for birds
}
```

## Coordinate System

- **X/Y coordinates**: Percentage based (0-100)
- **startX/startY**: Starting position
- **endX/endY**: Ending position  
- **Paths**: Creatures move linearly from start to end, then loop

## Performance Notes

- All animations use CSS transforms (GPU accelerated)
- Sprites are positioned with `z-index: 0` (behind everything)
- `pointer-events: none` ensures no interference with interactions 