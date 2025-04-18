// app/components/extensions/content/extensionContentRegistry.ts
/**
 * Extension Content Registry
 * 
 * Central registry for managing extension content.
 * Provides functions for retrieving, registering, and checking content availability.
 * Implements lazy-loading pattern for performance optimization.
 */

import { ExtensionType } from '../VisualExtender';

// Extension content map
interface ContentRegistry {
  [type: string]: {
    [id: string]: Promise<any> | null;
  };
}

// Define a generic module type for content imports
interface ContentModule {
  default?: Record<string, any>;
  [key: string]: any;
}

// Initial registry with empty maps for each extension type
const contentRegistry: ContentRegistry = {
  'calculation': {},
  'anatomical-identification': {},
  'equipment-identification': {},
  'measurement-reading': {},
  'dosimetric-pattern': {},
  'treatment-plan': {},
  'error-identification': {}
};

/**
 * Get content for a specific extension type and ID
 * Uses dynamic imports for code splitting and lazy loading
 * 
 * @param type The extension type
 * @param contentId The content identifier
 * @returns Promise resolving to the content data
 */
export async function getExtensionContent(
  type: ExtensionType,
  contentId: string
): Promise<any | null> {
  try {
    console.log(`[DEBUG] Loading extension content for ${type}:${contentId}`);
    
    // Check if content is already registered
    if (contentRegistry[type]?.[contentId]) {
      const content = await contentRegistry[type][contentId];
      console.log(`[DEBUG] Found registered content for ${type}:${contentId}`, { 
        imageUrl: content?.imageUrl,
        hasImage: !!content?.imageUrl
      });
      return contentRegistry[type][contentId];
    }
    
    // Try to load content dynamically based on type
    let contentPromise: Promise<any> | null = null;
    
    // Helper function to get content from a module
    const getContentFromModule = (module: ContentModule, id: string) => {
      const content = module.default?.[id] || module[id] || null;
      console.log(`[DEBUG] Content from module for ${type}:${id}`, { 
        found: !!content,
        imageUrl: content?.imageUrl,
        hasImage: !!content?.imageUrl,
        moduleKeys: Object.keys(module),
        defaultKeys: module.default ? Object.keys(module.default) : 'no default'
      });
      return content;
    };
    
    // Each extension type has its own content module
    switch (type) {
      case 'calculation':
        contentPromise = import('./calculations.js').then(module => 
          getContentFromModule(module as ContentModule, contentId)
        );
        break;
        
      case 'anatomical-identification':
        contentPromise = import('./anatomical.js').then(module => 
          getContentFromModule(module as ContentModule, contentId)
        );
        break;
        
      case 'equipment-identification':
        contentPromise = import('./equipmentIdentification.js').then(module => 
          getContentFromModule(module as ContentModule, contentId)
        );
        break;
        
      case 'measurement-reading':
        contentPromise = import('./measurements.js').then(module => 
          getContentFromModule(module as ContentModule, contentId)
        );
        break;
        
      case 'error-identification':
        contentPromise = import('./errors.js').then(module => 
          getContentFromModule(module as ContentModule, contentId)
        );
        break;
        
      // Future extension types will have their own modules
      case 'dosimetric-pattern':
      case 'treatment-plan':
        // These are planned but not yet implemented
        console.warn(`Extension type '${type}' is planned but not yet implemented`);
        return null;
        
      default:
        console.error(`Unknown extension type: ${type}`);
        return null;
    }
    
    // Register the content promise for future use
    if (contentPromise && contentRegistry[type]) {
      contentRegistry[type][contentId] = contentPromise;
    }
    
    // Return the content
    return contentPromise;
  } catch (error) {
    console.error(`Error loading extension content for ${type}:${contentId}:`, error);
    return null;
  }
}

/**
 * Register content for a specific extension type and ID
 * Useful for pre-loading or for testing
 * 
 * @param type The extension type
 * @param contentId The content identifier
 * @param content The content data or a promise resolving to the content
 */
export function registerExtensionContent(
  type: ExtensionType,
  contentId: string,
  content: any
): void {
  if (!contentRegistry[type]) {
    contentRegistry[type] = {};
  }
  
  // Convert content to promise if it's not already
  const contentPromise = content instanceof Promise ? content : Promise.resolve(content);
  contentRegistry[type][contentId] = contentPromise;
}

/**
 * Check if content exists for a specific extension type and ID
 * 
 * @param type The extension type
 * @param contentId The content identifier
 * @returns True if content exists, false otherwise
 */
export function hasExtensionContent(
  type: ExtensionType,
  contentId: string
): boolean {
  return Boolean(contentRegistry[type]?.[contentId]);
}

/**
 * Preload content for a specific extension type and set of IDs
 * Useful for pre-loading content before it's needed
 * 
 * @param type The extension type
 * @param contentIds Array of content identifiers to preload
 * @returns Promise resolving when all content is loaded
 */
export async function preloadExtensionContent(
  type: ExtensionType,
  contentIds: string[]
): Promise<void> {
  try {
    // Load all content in parallel
    await Promise.all(
      contentIds.map(id => getExtensionContent(type, id))
    );
  } catch (error) {
    console.error(`Error preloading extension content for ${type}:`, error);
  }
}

/**
 * Clear all registered content - mainly for testing
 */
export function clearExtensionRegistry(): void {
  Object.keys(contentRegistry).forEach(type => {
    contentRegistry[type] = {};
  });
}

// Export registry for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).__EXTENSION_REGISTRY__ = contentRegistry;
}

export default {
  getExtensionContent,
  registerExtensionContent,
  hasExtensionContent,
  preloadExtensionContent,
  clearExtensionRegistry
};