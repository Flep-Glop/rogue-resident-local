# Title Screen Sprites

All sprites use 640x360 coordinate system. Animated sprites are horizontal strip sprite sheets.

## Layer Order (back to front):

| Z | Layer | File | Frames | Animation |
|---|-------|------|--------|-----------|
| 1 | Background | `title-screen-background.png` | 1 (640×360) | Static |
| 2 | Cloud 1 | `title-screen-cloud-1.png` | 8 (5120×360) | Ping-pong, 600ms/frame (slowest - back) |
| 3 | Cloud 2 | `title-screen-cloud-2.png` | 8 (5120×360) | Ping-pong, 450ms/frame (medium - middle) |
| 4 | Cloud 3 | `title-screen-cloud-3.png` | 8 (5120×360) | Ping-pong, 300ms/frame (fastest - front) |
| 5 | Abyss | `title-screen-abyss.png` | 1 (640×360) | Static |
| 6 | Shooting Star 1 | `title-screen-shooting-stars-1.png` | 7 (4480×360) | Triggered, staggered |
| 7 | Shooting Star 2 | `title-screen-shooting-stars-2.png` | 7 (4480×360) | Triggered, staggered |
| 8 | Shooting Star 3 | `title-screen-shooting-stars-3.png` | 7 (4480×360) | Triggered, staggered |
| 9 | Shooting Star 4 | `title-screen-shooting-stars-4.png` | 7 (4480×360) | Triggered, staggered |
| 10 | Title | `title-screen-title.png` | 1 (640×360) | Static (fades in during intro) |
| 11 | Shine | `title-screen-shine.png` | 7 (4480×360) | Triggered occasionally |

## Button Sprites

| File | Size | Frames | Notes |
|------|------|--------|-------|
| `play-button.png` | 261×18 | 3 (87×18 each) | Normal, highlighted, pressed |
| `dev-mode-button.png` | 261×18 | 3 (87×18 each) | Normal, highlighted, pressed |
| `whats-new-button.png` | 261×18 | 3 (87×18 each) | Normal, highlighted, pressed |

## Animation Timing

- **Clouds**: Ping-pong animation (0→7→0) with parallax speeds:
  - Cloud 1 (back): 600ms/frame
  - Cloud 2 (middle): 450ms/frame  
  - Cloud 3 (front): 300ms/frame
- **Shooting Stars**: 100ms per frame, 8-15s random cooldown between triggers
- **Shine**: 120ms per frame, 12-20s random cooldown between triggers

## Intro Sequence

1. 0-1200ms: Background layers fade in from black
2. 1000-1800ms: Title fades in
3. 1800-2400ms: Buttons fade in
4. At 2400ms: Intro complete, **shine animation triggers immediately**
5. After intro: Shooting stars begin triggering, shine continues sporadically

## Notes

- All sprites use pixel-perfect rendering (nearest neighbor scaling)
- Sprite sheets are horizontal strips, frames read left-to-right
- Uses uniform scaling to fit viewport while maintaining 640×360 aspect ratio
- Shooting stars have staggered initial countdowns (3s, 7s, 12s, 18s) for natural feel
