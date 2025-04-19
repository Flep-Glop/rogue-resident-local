// app/components/knowledge/ConstellationVisualizationControl.ts
'use client';

/**
 * Centralized control system for constellation visualization
 * Provides pub/sub mechanism for debug controls to communicate with the visualization
 */

// Define event types for constellation visualization
export type ConstellationVisualizationEvent = 
  | 'discoveryToggle'
  | 'masterySet'
  | 'connectionsToggle'
  | 'shootingStarsToggle'
  | 'resetVisualization'
  | 'stateChanged'; // Added a generic state change event

// Debug visualization options interface
export interface ConstellationDebugOptions {
  showAllDiscovered?: boolean;
  masteryLevel?: number;
  showAllConnections?: boolean;
  showShootingStars?: boolean;
  connectionCursorEnabled?: boolean;
}

// Event listener type
type EventListener = (options: ConstellationDebugOptions) => void;

/**
 * Control bus for constellation visualization
 * Allows debug panel to communicate with the visualization
 */
class ConstellationVisualizationControlBus {
  private listeners: Map<ConstellationVisualizationEvent, Set<EventListener>> = new Map();
  private activeOptions: ConstellationDebugOptions = {
    showAllDiscovered: false,
    masteryLevel: 0,
    showAllConnections: false,
    showShootingStars: false,
    connectionCursorEnabled: false
  };
  
  constructor() {
    this.resetOptions();
  }
  
  /**
   * Subscribe to constellation visualization events
   */
  subscribe(event: ConstellationVisualizationEvent, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const listeners = this.listeners.get(event)!;
    listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      if (this.listeners.has(event)) {
        const listeners = this.listeners.get(event)!;
        listeners.delete(listener);
      }
    };
  }
  
  /**
   * Subscribe to all visualization events
   */
  subscribeToAll(listener: EventListener): () => void {
    const events: ConstellationVisualizationEvent[] = [
      'discoveryToggle', 
      'masterySet', 
      'connectionsToggle', 
      'shootingStarsToggle',
      'resetVisualization',
      'stateChanged'
    ];
    
    const unsubscribers = events.map(event => this.subscribe(event, listener));
    
    // Immediately notify the listener of the current state
    setTimeout(() => {
      try {
        listener(this.getOptions());
      } catch (error) {
        console.error('Error in initial visualization listener notification:', error);
      }
    }, 0);
    
    // Return combined unsubscriber
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * Toggle discovery of all nodes
   */
  toggleDiscovery(show: boolean): void {
    this.activeOptions.showAllDiscovered = show;
    this.notifyListeners('discoveryToggle');
    this.notifyListeners('stateChanged'); // Also notify of generic state change
  }
  
  /**
   * Set mastery level for all nodes
   */
  setMasteryLevel(level: number): void {
    this.activeOptions.masteryLevel = level;
    this.notifyListeners('masterySet');
    this.notifyListeners('stateChanged'); // Also notify of generic state change
  }
  
  /**
   * Toggle showing all connections
   */
  toggleConnections(show: boolean): void {
    this.activeOptions.showAllConnections = show;
    this.notifyListeners('connectionsToggle');
    this.notifyListeners('stateChanged'); // Also notify of generic state change
  }
  
  /**
   * Toggle showing shooting stars
   */
  toggleShootingStars(show: boolean): void {
    this.activeOptions.showShootingStars = show;
    this.notifyListeners('shootingStarsToggle');
    this.notifyListeners('stateChanged'); // Also notify of generic state change
  }
  
  /**
   * Reset all visualization options
   */
  resetOptions(): void {
    this.activeOptions = {
      showAllDiscovered: false,
      masteryLevel: 0,
      showAllConnections: false,
      showShootingStars: false,
      connectionCursorEnabled: false
    };
    this.notifyListeners('resetVisualization');
    this.notifyListeners('stateChanged'); // Also notify of generic state change
  }
  
  /**
   * Get current visualization options
   */
  getOptions(): ConstellationDebugOptions {
    return { ...this.activeOptions };
  }
  
  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: ConstellationVisualizationEvent): void {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event)!;
      const options = this.getOptions(); // Get a fresh copy of options for each listener
      
      listeners.forEach(listener => {
        try {
          listener(options);
        } catch (error) {
          console.error(`Error in constellation visualization listener for ${event}:`, error);
        }
      });
    }
  }

  // Set connection cursor mode
  setConnectionCursorMode(enabled: boolean): void {
    this.activeOptions.connectionCursorEnabled = enabled;
    this.notifyListeners('stateChanged');
  }

  // Toggle connection cursor mode
  toggleConnectionCursorMode(): void {
    this.activeOptions.connectionCursorEnabled = !this.activeOptions.connectionCursorEnabled;
    this.notifyListeners('stateChanged');
  }
}

// Create singleton instance
export const constellationVisualizationControl = new ConstellationVisualizationControlBus();

// Export default for easier imports
export default constellationVisualizationControl;