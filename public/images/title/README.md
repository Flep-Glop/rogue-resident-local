# Title Screen Sprites

Place your title screen sprite files in this directory with the following names:

## Required Sprites:

1. **title-screen-background.png** (640x360)
   - The base background layer
   - Static background, no scrolling

2. **title-screen-cloud-1.png** (640x360)
   - First cloud layer (furthest back)
   - Static layer positioned over background

3. **title-screen-cloud-2.png** (640x360)
   - Second cloud layer
   - Static layer positioned over cloud-1

4. **title-screen-cloud-3.png** (640x360)
   - Third cloud layer
   - Static layer positioned over cloud-2

5. **title-screen-purple-abyss.png** (640x360)
   - Purple abyss layer (closest to front)
   - Static layer positioned over cloud-3

6. **title-screen-title.png** (640x360)
   - The main title overlay layer (same size as background for compositing)
   - Fades in over the background and cloud layers
   - Will be scaled uniformly with all other layers

7. **play-button.png** (178x18 sprite sheet)
   - Row of 2 sprites: [normal state][hover state]
   - Each frame is 89x18 pixels
   - First frame (0-88px): normal button state
   - Second frame (89-177px): hover/pressed state
   - Will be positioned in the center-lower area

8. **test-button.png** (178x18 sprite sheet)
   - Row of 2 sprites: [normal state][hover state] 
   - Each frame is 89x18 pixels
   - First frame (0-88px): normal button state
   - Second frame (89-177px): hover/pressed state
   - Will be positioned below the play button

9. **whats-new-button.png** (178x18 sprite sheet)
   - Row of 2 sprites: [normal state][hover state]
   - Each frame is 89x18 pixels
   - First frame (0-88px): normal button state
   - Second frame (89-177px): hover/pressed state
   - Will be positioned in the top-right corner

## Notes:

- All button sprites are 178x18 sprite sheets with 2 frames each
- Frame switching happens automatically on hover/interaction
- Buttons also scale slightly (10% larger on hover, 5% smaller on click)
- All background layers are static (no scrolling animation)
- Purple abyss layer is static (visible from start, no animation)
- Uses 640x360 coordinate system with uniform scaling to fit viewport
- Title sprite is 640x360 (same as background) for proper compositing
- Z-ordering: background → cloud-1 → cloud-2 → cloud-3 → purple-abyss → title → UI elements
- All sprites should be in PNG format for transparency support

## Fallback Behavior:

If sprites aren't found, the title screen will display:
- Solid color background
- Text-based title
- Simple rectangular buttons
- All functionality will still work normally 