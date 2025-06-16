# Sprite Sheet System Guide

This guide explains how to use the sprite sheet system for character portraits and other UI elements in the Rogue Resident project. Using sprite sheets improves performance by reducing the number of image files the browser needs to load.

## File Structure

-   **Sprite Sheets:** Image files containing multiple sprites arranged in a grid. Located in `public/images/`:
    -   `characters-portrait.png`: Detailed character portraits (headshots).
    -   `characters-simple.png`: Simplified character portraits (used in UI lists, etc.).
    -   `characters-hands.png`: Hand gestures or icons.
-   **Sprite Map Utility:** TypeScript file defining sprite coordinates and providing functions to access them. Located at `app/utils/spriteMap.ts`.
-   **Sprite Component:** Reusable React component for displaying individual sprites from a sheet. Located at `app/components/ui/SpriteImage.tsx`.

## Configuration (`app/utils/spriteMap.ts`)

This file contains the core configuration for the sprite system.

1.  **`SpriteCoordinates` Type:** Defines the structure for storing a sprite's position and size within a sheet (`{ x, y, width, height }`).
2.  **Dimensions:** Constants define the pixel dimensions of individual sprites within each sheet:
    -   `DETAILED_PORTRAIT_WIDTH`, `DETAILED_PORTRAIT_HEIGHT`
    -   `SIMPLE_PORTRAIT_WIDTH`, `SIMPLE_PORTRAIT_HEIGHT`
    -   `HAND_GESTURE_WIDTH`, `HAND_GESTURE_HEIGHT`
    *Modify these values if you change the size of sprites in your image editor.*
3.  **`CHARACTER_ORDER` Array:** Defines the horizontal order of characters in the portrait sheets. The index of a character ID in this array determines its X-coordinate.
    *Ensure this order matches the layout in `characters-portrait.png` and `characters-simple.png`.*
4.  **Coordinate Functions:**
    -   `getPortraitCoordinates(characterId: CharacterId, type: PortraitType): SpriteCoordinates`: Returns the coordinates for a specific character's portrait (`'detailed'` or `'simple'`).
    -   `getHandGestureCoordinates(index: number): SpriteCoordinates`: Returns the coordinates for a hand gesture based on its 0-based index (reading left-to-right, top-to-bottom).
5.  **`SPRITE_SHEETS` Object:** Maps sprite types to their corresponding image file paths in the `public` directory.
    *Update these paths if you rename or move the sprite sheet image files.*

## Usage (`SpriteImage` Component)

To display a sprite in your UI, use the `SpriteImage` component.

**Imports:**

```typescript
import SpriteImage from '@/app/components/ui/SpriteImage';
import { 
  getPortraitCoordinates, 
  getHandGestureCoordinates, 
  SPRITE_SHEETS, 
  CharacterId // Or specific CharacterId if needed
} from '@/app/utils/spriteMap';
```

**Example: Displaying a Detailed Portrait**

```typescript
const mentorId: CharacterId = 'kapoor'; // Get the character ID dynamically
const coords = getPortraitCoordinates(mentorId, 'detailed');

<SpriteImage
  src={SPRITE_SHEETS.detailedPortraits} // Specify the correct sheet
  coordinates={coords}                 // Pass the calculated coordinates
  alt={`${mentorId} detailed portrait`}  // Alt text for accessibility
  scale={1.5}                          // Optional: Scale the sprite up or down
  pixelated={true}                     // Optional: Defaults to true for crisp pixels
  className="my-custom-styles"         // Optional: Add custom CSS classes
/>
```

**Example: Displaying a Hand Gesture**

```typescript
const gestureIndex = 0; // First gesture in the sheet
const coords = getHandGestureCoordinates(gestureIndex);

<SpriteImage
  src={SPRITE_SHEETS.handGestures}
  coordinates={coords}
  alt={`Hand gesture ${gestureIndex}`}
  scale={2} 
/>
```

## Adding New Sprites

### New Character Portrait

1.  **Edit Image:** Add the new character's detailed and simple portraits to the *end* of the respective `characters-portrait.png` and `characters-simple.png` files, maintaining the grid layout and dimensions.
2.  **Update `spriteMap.ts`:**
    -   Add the new character's ID (e.g., `'new_mentor'`) to the `CharacterId` type union.
    -   Append the new character's ID to the `CHARACTER_ORDER` array.

### New Hand Gesture

1.  **Edit Image:** Add the new gesture to the `characters-hands.png` sheet, maintaining the grid layout and dimensions. Note its 0-based index.
2.  **Usage:** Use `getHandGestureCoordinates(newIndex)` with the correct index when rendering the `SpriteImage` component. You might want to create constants for gesture indices for better readability.

---
*Remember to keep the dimensions and order consistent between your image files and the `spriteMap.ts` configuration.* 