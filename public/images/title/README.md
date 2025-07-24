# Title Screen Sprites

Place your title screen sprite files in this directory with the following names:

## Required Sprites:

1. **title-background.png** (3400x360)
   - The scrolling background image
   - Will show first 640x360 pixels initially, then scroll horizontally through the rest
   - Should loop seamlessly from end back to beginning

2. **title-sprite.png** (246x90)
   - The main "ROGUE RESIDENT" title logo
   - Will be positioned in the upper third of the screen
   - Will be scaled appropriately for different screen sizes

3. **play-button.png** (178x18 sprite sheet)
   - Row of 2 sprites: [normal state][hover state]
   - Each frame is 89x18 pixels
   - First frame (0-88px): normal button state
   - Second frame (89-177px): hover/pressed state
   - Will be positioned in the center-lower area

4. **test-button.png** (178x18 sprite sheet)
   - Row of 2 sprites: [normal state][hover state] 
   - Each frame is 89x18 pixels
   - First frame (0-88px): normal button state
   - Second frame (89-177px): hover/pressed state
   - Will be positioned below the play button

5. **whats-new-button.png** (178x18 sprite sheet)
   - Row of 2 sprites: [normal state][hover state]
   - Each frame is 89x18 pixels
   - First frame (0-88px): normal button state
   - Second frame (89-177px): hover/pressed state
   - Will be positioned in the top-right corner

## Notes:

- All button sprites are 178x18 sprite sheets with 2 frames each
- Frame switching happens automatically on hover/interaction
- Buttons also scale slightly (10% larger on hover, 5% smaller on click)
- The background will scroll slowly at 0.5 pixels per frame (30fps = 15 pixels/second)
- Title sprite will be scaled dynamically based on screen size
- All sprites should be in PNG format for transparency support

## Fallback Behavior:

If sprites aren't found, the title screen will display:
- Solid color background
- Text-based title
- Simple rectangular buttons
- All functionality will still work normally 