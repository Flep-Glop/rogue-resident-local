# Cursor Icons

This file explains what cursor images are needed for the constellation connection system.

## Required Cursor Images

1. `connection-cursor.png` - A cursor that looks like a connector or linking tool
   - Size: 32x32px
   - Should have a white star with a trailing line
   - Hot spot at the star center

2. `can-connect-cursor.png` - A cursor that indicates a valid connection target
   - Size: 32x32px
   - Should have a star with a "+" symbol
   - Hot spot at the star center

## Temporary Approach

Until these images are created, the system will fall back to standard cursors:
- `crosshair` for connection-cursor
- `pointer` for can-connect-cursor

## Recommended Image Format

- 32x32 pixel PNG files
- Transparent background
- Clear, high-contrast design visible against the dark constellation background 