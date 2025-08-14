# 🔧 ROGUE RESIDENT STACK
*Current versions, compatibility notes, and known issues*

## CORE STACK

### Framework & Language
- **Next.js:** 14.x
- **React:** 18.x (React 19 causes compatibility issues)
- **TypeScript:** 5.x
- **Node.js:** 18.x or higher

### Animation & Graphics
- **PixiJS:** 8.0.x
  - Modern API only (use `graphics.circle()` not `drawCircle()`)
  - Texture source requires `.source.scaleMode = 'nearest'`
- **@pixi/react:** ❌ DO NOT USE
  - v7: Incompatible with React 19
  - v8: Has critical PNG loading bugs

### State Management
- **Zustand:** 4.x
  - Used for all game stores
  - Combined with event bus for cross-store communication
- **Custom Event Bus:** CentralEventBus.ts
  - Handles all cross-component communication

### Styling
- **Tailwind CSS:** 3.x
  - Note: Some utilities fail (z-index, custom values)
  - Use inline styles when Tailwind doesn't apply
- **Styled Components:** 5.x
  - For complex animations and dynamic styling
- **CSS Modules:** Available but rarely used

### Build & Development
- **Vite:** (If applicable)
- **Webpack:** Via Next.js
- **Development:** `npm run dev`
- **Production:** `npm run build && npm run start`

## KNOWN ISSUES

### Library Bugs
1. **@pixi/react v8 PNG Loading**
   - **Issue:** PNG sprites fail to load after 5+ attempts
   - **Solution:** Use surgical hybrid architecture instead

2. **Tailwind Z-Index**
   - **Issue:** `z-[1010]` and similar don't compile
   - **Solution:** Use inline styles: `style={{ zIndex: 1010 }}`

3. **React Fast Refresh with PixiJS**
   - **Issue:** Can cause flickering and memory leaks
   - **Solution:** Full page refresh when editing PixiJS components

### CSS Quirks
1. **Transform Conflicts**
   - **Issue:** Mixing PixiJS and CSS transforms breaks positioning
   - **Solution:** Use one system per component

2. **Overflow Clipping**
   - **Issue:** Tooltips/badges get clipped by parent containers
   - **Solution:** Add `overflow: visible` to parent

3. **Pointer Events**
   - **Issue:** High z-index invisible elements block clicks
   - **Solution:** `pointer-events: none` when hidden

### Performance Gotchas
1. **Memory Leaks in PixiJS**
   - **Issue:** Not cleaning up tickers and sprites
   - **Solution:** Comprehensive cleanup in useEffect return

2. **State Thrashing**
   - **Issue:** Too many re-renders from primitive values
   - **Solution:** Use Chamber pattern with stable selectors

## BROWSER COMPATIBILITY

### Supported
- Chrome 90+ (primary development)
- Firefox 88+
- Safari 14+
- Edge 90+

### Features Required
- WebGL 2.0
- ES6+ JavaScript
- CSS Custom Properties
- CSS Grid/Flexbox

## ASSET REQUIREMENTS

### Image Formats
- **PNG:** Primary format for all sprites
- **No SVG:** Avoided for pixel art consistency
- **No WebP:** Not used to maintain simplicity

### Optimization
- Use tinypng.com for compression
- Keep sprite sheets under 4096×4096
- Power-of-2 dimensions when possible

## DEVELOPMENT TOOLS

### VS Code Extensions
- ESLint
- Prettier
- TypeScript support
- Tailwind IntelliSense

### Chrome DevTools
- React Developer Tools
- Performance profiling
- Memory profiling for leak detection

### Debug Utilities
- F2 console with macro buttons
- Debug grid overlay (50-unit resolution)
- Visual coordinate system display

## DON'T TRY THESE (Already Failed)

### Libraries
- ❌ @pixi/react (any version)
- ❌ react-pixi-fiber
- ❌ Complex animation libraries (Framer Motion with PixiJS)

### Patterns
- ❌ Tight React-PixiJS state coupling
- ❌ Multi-phase animations across libraries
- ❌ Counter-transforming for position fixes
- ❌ Background-image for sprites in canvas

### Approaches
- ❌ Single coordinate system for everything
- ❌ CSS-only for complex particle effects
- ❌ Scaling assets down in CSS

## UPGRADE NOTES

### When Updating Dependencies
1. Test @pixi/react periodically for PNG fix
2. Check Tailwind compilation for custom utilities
3. Verify React Fast Refresh behavior
4. Run full memory leak test suite

### Migration Paths
- If @pixi/react gets fixed: Gradually expand usage
- If switching from CSS to PixiJS: Use event-driven pattern
- If refactoring old components: Check coordinate system first