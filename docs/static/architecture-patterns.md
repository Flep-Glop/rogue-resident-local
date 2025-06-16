# Enhanced Architectural Patterns from ConstellationView

After analyzing the ConstellationView component, I've identified several powerful architectural patterns that should be applied more broadly to your time-based system. This document expands on the architecture guide with these insights to ensure consistent application of your best practices.

## 1. Hybrid Rendering Architecture

The ConstellationView masterfully combines React for component lifecycle and D3 for visualization in a pattern that could benefit your entire application:

```typescript
// React handles component lifecycle and state
useEffect(() => {
  if (!svgRef.current || simulationNodes.length === 0) return;
  
  // Clear previous visualization
  d3.select(svgRef.current).selectAll('*').remove();
  
  // D3 handles visualization logic
  const svg = d3.select(svgRef.current);
  // D3 specific code...
  
  // Cleanup when component unmounts
  return () => {
    simulation.stop();
  };
}, [simulationNodes, simulationLinks, dimensions, selectedNodeId]);
```

**Recommendation for Time-Based System:**
- Use React for component tree and state management
- Use D3 for time visualizations (day progression, activity durations)
- Implement a similar pattern for schedule visualization:

```typescript
function ScheduleTimeline() {
  const timelineRef = useRef<SVGSVGElement>(null);
  const { currentHour, scheduledActivities } = useTimeState();
  
  useEffect(() => {
    if (!timelineRef.current) return;
    
    // Clear previous timeline
    d3.select(timelineRef.current).selectAll('*').remove();
    
    // Create timeline visualization
    const svg = d3.select(timelineRef.current);
    const timeline = svg.append('g').attr('class', 'timeline');
    
    // Create time blocks for each hour
    timeline.selectAll('.time-block')
      .data(Array.from({ length: 9 }, (_, i) => i + 8)) // 8am to 5pm
      .enter()
      .append('rect')
      .attr('class', 'time-block')
      .attr('x', d => (d - 8) * 60)
      .attr('y', 0)
      .attr('width', 60)
      .attr('height', 40)
      .attr('fill', d => d === currentHour ? '#3b82f6' : '#1e293b')
      .attr('stroke', '#475569')
      .attr('rx', 4);
    
    // Add scheduled activities
    // Additional D3 code...
  }, [currentHour, scheduledActivities]);
  
  return <svg ref={timelineRef} width="100%" height="60px"></svg>;
}
```

## 2. Multi-Layered State Management

ConstellationView demonstrates a sophisticated approach to state management with three distinct layers:

```typescript
// 1. External store state (from Zustand)
const { 
  nodes, 
  connections, 
  discoverConcept, 
  updateMastery 
} = useKnowledgeStore();

// 2. Local component state (specific to this component)
const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

// 3. Derived/transformed state (for visualization)
const simulationNodes = React.useMemo(() => 
  nodes.map(node => ({
    id: node.id,
    name: node.name,
    x: node.position?.x || (Math.random() - 0.5) * 500,
    y: node.position?.y || (Math.random() - 0.5) * 500,
    radius: node.discovered ? 
      Math.max(10, 5 + (node.mastery / 10)) : 3,
    domain: node.domain,
    discovered: node.discovered,
    unlocked: node.unlocked || false,
    active: activeNodes.includes(node.id) || !!node.active,
    mastery: node.mastery,
    // Additional properties...
  })),
[nodes, activeNodes]); // Dependencies
```

**Recommendation for Time-Based System:**
- Implement this three-tiered approach across your application:
  1. **Core State**: In domain-specific stores (timeStore, activityStore)
  2. **UI State**: Component-specific state (selectedActivity, hoverState)
  3. **Derived State**: Transformed data optimized for rendering

```typescript
// Example for TimelineComponent
function TimelineComponent() {
  // 1. Core state from stores
  const { currentHour, currentMinute, activities } = useTimeStore();
  const { activeAbilities } = useProgressionStore();
  
  // 2. UI state specific to this component
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [isHoveringActivity, setIsHoveringActivity] = useState(false);
  
  // 3. Derived state for visualization
  const timeBlocks = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => {
      const hour = i + 8; // 8am to 5pm
      const hourActivities = activities.filter(a => 
        a.startHour === hour || 
        (a.startHour < hour && a.startHour + (a.duration / 60) > hour)
      );
      
      return {
        hour,
        isPast: hour < currentHour,
        isCurrent: hour === currentHour,
        isFuture: hour > currentHour,
        activities: hourActivities,
        hasConflict: hourActivities.length > 1,
        isSelectable: hour >= currentHour,
        // Additional computed properties...
      };
    });
  }, [activities, currentHour]);
  
  // Component render logic...
}
```

## 3. Rich Visual Feedback System

ConstellationView implements an exceptional feedback system, with well-designed visual cues for nearly every interaction:

```typescript
// Visual feedback for state changes
nodeElements
  .transition()
  .duration(300)
  .style('filter', d => {
    // Strong glow for selected node
    if (d.id === selectedNodeId) {
      return 'url(#glow) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))';
    }
    
    // Normal glow for connected nodes
    const isConnected = simulationLinks.some(link => 
      (link.source === selectedNodeId && link.target === d.id) || 
      (link.target === selectedNodeId && link.source === d.id)
    );
    
    if (isConnected) return 'url(#glow)';
    
    // Grey out unconnected nodes
    return 'url(#glow) saturate(50%)';
  });

// Particle effects for important interactions
const createUnlockCompletionEffect = (node: Node) => {
  if (!svgRef.current) return;
  
  // Create particles bursting from the node
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dx = Math.cos(angle) * 40;
    const dy = Math.sin(angle) * 40;
    
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    
    particle.setAttribute('cx', String(node.x));
    particle.setAttribute('cy', String(node.y));
    particle.setAttribute('r', '3');
    particle.setAttribute('fill', '#FFEB3B');
    particle.setAttribute('class', 'unlock-particle');
    particle.setAttribute('style', `--dx: ${dx}px; --dy: ${dy}px;`);
    
    svgRef.current.appendChild(particle);
    
    // Remove after animation completes
    setTimeout(() => {
      particle.remove();
    }, 1000);
  }
};
```

**Recommendation for Time-Based System:**
- Create a centralized feedback system for the time-based gameplay
- Implement consistent visual effects for time progression and activity completion
- Use subtle animations to reinforce the passage of time and day transitions

```typescript
// Create a FeedbackManager component that manages visual effects
function FeedbackManager() {
  // Listen for various events
  useEventSubscription(GameEventType.ACTIVITY_COMPLETED, (event) => {
    const { activityId, outcomes } = event.payload;
    
    // Create activity completion effect at activity location
    const activityElement = document.querySelector(`[data-activity-id="${activityId}"]`);
    if (activityElement) {
      createCompletionEffect(activityElement.getBoundingClientRect(), outcomes);
    }
  });
  
  useEventSubscription(GameEventType.TIME_ADVANCED, (event) => {
    const { hour, minute, previousHour } = event.payload;
    
    // Create time progression effect
    if (hour !== previousHour) {
      createHourTransitionEffect(hour);
    }
  });
  
  return null; // This component doesn't render anything visible
}

// Example implementation for activity completion effect
function createCompletionEffect(rect, outcomes) {
  // Create container for the effect
  const container = document.createElement('div');
  container.className = 'completion-effect absolute z-50';
  container.style.left = `${rect.left + rect.width/2}px`;
  container.style.top = `${rect.top + rect.height/2}px`;
  document.body.appendChild(container);
  
  // Create different feedback based on outcome type
  if (outcomes.insightGained) {
    addFloatingNumber(container, `+${outcomes.insightGained}`, 'insight');
  }
  
  if (outcomes.momentumEffect === 'increment') {
    addFloatingText(container, '⚡ Momentum', 'momentum');
  }
  
  // Remove container after animations complete
  setTimeout(() => container.remove(), 2000);
}
```

## 4. Progressive Loading and Error States

ConstellationView handles various edge cases gracefully, ensuring a fluid user experience:

```typescript
// Core initialization with loading states
useEffect(() => {
  isComponentMountedRef.current = true;
  
  // Log initialization progress
  console.log(`[ConstellationView] Initialized with ${nodes.length} total nodes`);
  
  // Cleanup function ensures we don't update unmounted component
  return () => {
    isComponentMountedRef.current = false;
    // Cleanup event subscriptions...
  };
}, []);

// Defensive programming with clear error messages
const unlockNode = (nodeId: string) => {
  // Get the node to find its SP cost
  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    console.warn(`[ConstellationView] Cannot unlock node: ${nodeId} not found`);
    showToast("Error: Concept not found", "error");
    return;
  }
  
  // Validation steps with user feedback...
  
  // Proper error handling for operations
  const success = knowledgeStore.unlockConcept(nodeId);
  
  if (success) {
    // Success handling...
  } else {
    // Clear error message
    console.log("Failed to unlock concept");
    showToast("Failed to unlock concept", "error");
  }
};
```

**Recommendation for Time-Based System:**
- Implement similar defensive programming throughout the time-based system
- Add clear loading states for time transitions and activity changes
- Create user-friendly error recovery paths with contextual messages:

```typescript
// Example time advancement with proper error handling
function advanceTimeWithActivity(activityId: string) {
  const timeStore = useTimeStore.getState();
  const activityStore = useActivityStore.getState();
  
  // Validation steps
  const activity = activityStore.activities.find(a => a.id === activityId);
  if (!activity) {
    console.warn(`[TimeSystem] Cannot advance time: Activity ${activityId} not found`);
    // Provide user feedback
    showActivityError("The selected activity is no longer available");
    return false;
  }
  
  // Check if activity can be started at current time
  const { currentHour, currentMinute } = timeStore;
  if (activity.startHour < currentHour || 
     (activity.startHour === currentHour && activity.startMinute < currentMinute)) {
    console.warn(`[TimeSystem] Cannot start activity: Time ${activity.startHour}:${activity.startMinute} has already passed`);
    // Provide user guidance
    showActivityError("This activity is no longer available - the scheduled time has passed");
    return false;
  }
  
  try {
    // Begin activity and advance time
    activityStore.startActivity(activityId);
    timeStore.advanceTimeTo(activity.startHour, activity.startMinute);
    
    // Successfully started
    return true;
  } catch (error) {
    console.error('[TimeSystem] Error starting activity:', error);
    // Provide recovery option
    showActivityError("Unable to start activity. Please try another option.", {
      action: "View Available",
      handler: () => activityStore.showAvailableActivities()
    });
    return false;
  }
}
```

## 5. Custom Component Architecture for D3 Integration

ConstellationView brilliantly separates D3 setup from React rendering, creating a maintainable integration:

```typescript
// D3 setup controlled by React lifecycle
useEffect(() => {
  if (!svgRef.current) return;
  
  // D3 visualization setup...
  const svg = d3.select(svgRef.current);
  
  // Create links, nodes, forces...
  const simulation = d3.forceSimulation()
    // Force configuration...
    
  // Setup rendering on simulation tick
  simulation.nodes(simulationNodes).on('tick', () => {
    // Update positions during simulation...
    nodeElements.attr('x', d => d.x - d.radius);
    linkElements.attr('x1', d => d.source.x);
    // Additional updates...
  });
  
  // Cleanup
  return () => {
    simulation.stop();
  };
}, [simulationNodes, simulationLinks]); // Dependencies control when D3 rebuilds

// React component renders container only
return (
  <div ref={containerRef} className="constellation-view">
    <svg ref={svgRef} width="100%" height="100%"></svg>
    {/* React controls UI overlays */}
    {selectedNode && (
      <div className="absolute right-4 top-16 bg-gray-900 p-3">
        <h4>{selectedNode.name}</h4>
        {/* Additional React-rendered UI */}
      </div>
    )}
  </div>
);
```

**Recommendation for Time-Based System:**
- Apply the same pattern to other complex visualizations in your system
- Create a similar approach for the day progression timeline:

```typescript
// DayTimelineComponent.tsx
export function DayTimeline() {
  const timelineRef = useRef<SVGSVGElement>(null);
  const { currentHour, currentMinute, dayActivities } = useTimeState();
  
  // D3 visualization setup
  useEffect(() => {
    if (!timelineRef.current) return;
    
    const svg = d3.select(timelineRef.current);
    svg.selectAll('*').remove();
    
    // Calculate time in minutes (8am = 0 minutes)
    const currentTimeMinutes = (currentHour - 8) * 60 + currentMinute;
    const totalDayMinutes = 9 * 60; // 9 hours (8am to 5pm)
    
    // Create timeline axis
    const timeScale = d3.scaleLinear()
      .domain([0, totalDayMinutes])
      .range([0, svg.attr('width')]);
    
    // Create time intervals
    svg.selectAll('.hour-marker')
      .data(d3.range(0, totalDayMinutes + 1, 60))
      .enter()
      .append('line')
      .attr('class', 'hour-marker')
      .attr('x1', d => timeScale(d))
      .attr('y1', 0)
      .attr('x2', d => timeScale(d))
      .attr('y2', 20)
      .attr('stroke', '#475569')
      .attr('stroke-width', 1);
    
    // Add hour labels
    svg.selectAll('.hour-label')
      .data(d3.range(0, 10))
      .enter()
      .append('text')
      .attr('class', 'hour-label')
      .attr('x', d => timeScale(d * 60))
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8')
      .text(d => `${d + 8}:00`);
    
    // Add current time indicator
    svg.append('rect')
      .attr('class', 'current-time-indicator')
      .attr('x', timeScale(currentTimeMinutes) - 1)
      .attr('y', 0)
      .attr('width', 2)
      .attr('height', 20)
      .attr('fill', '#f97316');
    
    // Add activity blocks
    svg.selectAll('.activity-block')
      .data(dayActivities)
      .enter()
      .append('rect')
      .attr('class', 'activity-block')
      .attr('x', d => timeScale((d.startHour - 8) * 60 + d.startMinute))
      .attr('y', 40)
      .attr('width', d => timeScale(d.duration) - timeScale(0))
      .attr('height', 30)
      .attr('rx', 4)
      .attr('fill', d => getActivityColor(d))
      .attr('stroke', '#64748b')
      .attr('stroke-width', 1)
      .on('click', (event, d) => {
        // Handle activity selection
      });
    
    // Add activity labels
    svg.selectAll('.activity-label')
      .data(dayActivities)
      .enter()
      .append('text')
      .attr('class', 'activity-label')
      .attr('x', d => timeScale((d.startHour - 8) * 60 + d.startMinute) + 5)
      .attr('y', 60)
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .text(d => truncateText(d.title, 20));
    
  }, [currentHour, currentMinute, dayActivities]);
  
  // React component renders SVG container
  return (
    <div className="day-timeline">
      <svg 
        ref={timelineRef} 
        width="100%" 
        height="80" 
        className="bg-gray-800 rounded-lg"
      ></svg>
    </div>
  );
}
```

## 6. Ref-Based DOM Manipulation for Animations

ConstellationView uses direct DOM manipulation for animations outside React's update cycle:

```typescript
// Custom animations through direct DOM manipulation
const createUnlockEffect = (node: Node) => {
  if (!svgRef.current) return;
  
  // Create SVG element for animation
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', String(node.x));
  circle.setAttribute('cy', String(node.y));
  circle.setAttribute('r', '10');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', '#FFC107');
  circle.setAttribute('stroke-width', '2');
  circle.setAttribute('class', 'unlock-pulse');
  
  svgRef.current.appendChild(circle);
  
  // Remove after animation completes
  setTimeout(() => {
    circle.remove();
  }, 1000);
};

// CSS animations triggered by DOM manipulation
<style jsx>{`
  @keyframes pulse {
    0% {
      r: 10;
      opacity: 1;
      stroke-width: 2;
    }
    100% {
      r: 40;
      opacity: 0;
      stroke-width: 0.5;
    }
  }
  
  :global(.unlock-pulse) {
    animation: pulse 1s ease-out forwards;
  }
`}</style>
```

**Recommendation for Time-Based System:**
- Use this approach for time-based animations that need to be highly performant
- Implement a similar system for activity transitions and time progression:

```typescript
// ActivityTransitionManager.ts
export function useActivityTransitionEffects() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Subscribe to activity transition events
  useEventSubscription(GameEventType.ACTIVITY_STARTED, (event) => {
    if (!containerRef.current) return;
    
    const { activityId, location } = event.payload;
    
    // Create transition effect between locations
    createLocationTransitionEffect(containerRef.current, location);
  });
  
  useEventSubscription(GameEventType.DAY_COMPLETED, () => {
    if (!containerRef.current) return;
    
    // Create day-to-night transition effect
    createDayNightTransition(containerRef.current);
  });
  
  return containerRef;
}

// Implementation of transition effect
function createLocationTransitionEffect(container: HTMLDivElement, newLocation: string) {
  // Create full-screen overlay for transition
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-50 pointer-events-none';
  document.body.appendChild(overlay);
  
  // Add location text
  const locationText = document.createElement('div');
  locationText.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-4xl font-bold opacity-0 location-text';
  locationText.textContent = formatLocationName(newLocation);
  overlay.appendChild(locationText);
  
  // Create particles for transition
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'absolute rounded-full bg-blue-500 opacity-80 location-particle';
    particle.style.width = `${Math.random() * 10 + 5}px`;
    particle.style.height = particle.style.width;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
    particle.style.setProperty('--dy', `${(Math.random() - 0.5) * 100}px`);
    overlay.appendChild(particle);
  }
  
  // Remove overlay after animation completes
  setTimeout(() => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 1000);
  }, 2000);
}

// Add corresponding CSS
const transitionStyles = `
  @keyframes locationTextFade {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.3); }
  }
  
  .location-text {
    animation: locationTextFade 2s ease-in-out forwards;
  }
  
  @keyframes particleFloat {
    0% { transform: translate(0, 0); opacity: 0.8; }
    100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
  }
  
  .location-particle {
    animation: particleFloat 2s ease-out forwards;
  }
  
  .fade-out {
    opacity: 0;
    transition: opacity 1s ease-out;
  }
`;
```

## 7. Intelligent Data Transformation and Caching

ConstellationView transforms core data models into specialized rendering models:

```typescript
// Transform domain models to visualization models
useEffect(() => {
  // Get pattern information for node classification
  const patterns = detectPatterns(nodes, connections, new Set()).allComplete;
  
  // Transform to specialized visualization data
  const d3Nodes: Node[] = nodes.map(node => {
    // Calculate visualization properties from domain data
    const nodePatterns = patterns
      .filter(p => p.starIds.includes(node.id))
      .map(p => p.id);
    
    // Calculate visual positioning based on patterns
    let x, y;
    if (nodePatterns.length > 0) {
      const pattern = patterns.find(p => p.id === nodePatterns[0]);
      const patternIndex = patterns.findIndex(p => p.id === nodePatterns[0]);
      // Complex positioning logic...
    } else {
      x = node.position?.x || (Math.random() - 0.5) * 500;
      y = node.position?.y || (Math.random() - 0.5) * 500;
    }
    
    // Return specialized visualization model
    return {
      id: node.id,
      name: node.name,
      x, y,
      radius: node.discovered ? Math.max(10, 5 + (node.mastery / 10)) : 3,
      domain: node.domain,
      discovered: node.discovered,
      unlocked: node.unlocked || false,
      active: activeNodes.includes(node.id) || !!node.active,
      // Additional properties...
    };
  });
  
  setSimulationNodes(d3Nodes);
  // Similar transformation for links...
}, [nodes, connections, interactive, activeNodes]);
```

**Recommendation for Time-Based System:**
- Implement similar data transformations for activity visualization
- Create specialized models optimized for specific UI requirements:

```typescript
// ActivityScheduleStore.ts
interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  mentor: string | null;
  domain: KnowledgeDomain;
  difficulty: number; // 1-3
  startHour: number;
  startMinute: number;
  duration: number; // in minutes
  knowledgeGains: { conceptId: string, amount: number }[];
  prerequisites: string[]; // Required concept IDs
  // Other properties...
}

// Transform activities to specialized time block model
export function useTimeBlockActivities() {
  const { activities } = useActivityStore();
  const { currentHour, currentMinute } = useTimeStore();
  const { unlockedConcepts, activeConcepts } = useKnowledgeStore();
  
  return useMemo(() => {
    // Create hour blocks from 8am to 5pm
    const hourBlocks = Array.from({ length: 10 }, (_, i) => {
      const blockHour = i + 8;
      
      // Find activities in this hour
      const blockActivities = activities.filter(activity => {
        const activityEndHour = activity.startHour + Math.floor(activity.duration / 60);
        const activityEndMinute = activity.startMinute + (activity.duration % 60);
        
        // Activity starts in this hour
        if (activity.startHour === blockHour) return true;
        
        // Activity spans into this hour
        if (activity.startHour < blockHour && 
           (activityEndHour > blockHour || 
            (activityEndHour === blockHour && activityEndMinute > 0))) {
          return true;
        }
        
        return false;
      });
      
      // Calculate time status
      const isPast = blockHour < currentHour || 
                    (blockHour === currentHour && currentMinute >= 45);
      const isCurrent = blockHour === currentHour;
      const isFuture = blockHour > currentHour || 
                      (blockHour === currentHour && currentMinute < 15);
      
      // Transform activities with additional UI properties
      const transformedActivities = blockActivities.map(activity => {
        // Check if player meets prerequisites
        const hasPrerequisites = activity.prerequisites.every(
          conceptId => unlockedConcepts.includes(conceptId)
        );
        
        // Calculate boost from active concepts
        const domainBoost = activeConcepts.filter(
          concept => concept.domain === activity.domain
        ).length;
        
        // Calculate if this is an optimal activity based on active concepts
        const isOptimal = domainBoost >= 3;
        
        return {
          ...activity,
          canStart: hasPrerequisites && (blockHour >= currentHour),
          domainBoost,
          isOptimal,
          visualStartPercent: activity.startHour === blockHour ? 
            (activity.startMinute / 60) * 100 : 0,
          visualWidthPercent: Math.min(
            100, 
            (activity.duration / 60) * 100 - (activity.startHour === blockHour ? 
              (activity.startMinute / 60) * 100 : 0)
          ),
          // Additional UI properties...
        };
      });
      
      return {
        hour: blockHour,
        label: `${blockHour}:00`,
        isPast,
        isCurrent,
        isFuture,
        isLunchHour: blockHour === 12,
        activities: transformedActivities,
        // Additional time block properties...
      };
    });
    
    return hourBlocks;
  }, [activities, currentHour, currentMinute, unlockedConcepts, activeConcepts]);
}
```

## 8. Standardized Toast Notifications

ConstellationView implements a clean toast notification system for user feedback:

```typescript
// Helper function to show toast notifications
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (!containerRef.current) return;
  
  const toast = document.createElement('div');
  toast.className = `fixed z-50 rounded-lg shadow-lg px-4 py-2 bottom-5 left-1/2 transform -translate-x-1/2 text-sm font-medium animate-fade-in-up ${
    type === 'success' ? 'bg-green-800 text-white' :
    type === 'error' ? 'bg-red-800 text-white' :
    type === 'warning' ? 'bg-yellow-700 text-white' :
    'bg-indigo-800 text-white'
  }`;
  toast.innerText = message;
  
  containerRef.current.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
};
```

**Recommendation for Time-Based System:**
- Create a global toast notification system that can be used throughout the application
- Standardize toast types and appearances for a consistent UX:

```typescript
// Create a global toast manager with React context
import React, { createContext, useContext, useRef, useState } from 'react';

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    options: Required<ToastOptions>;
  }>>([]);
  
  const showToast = (message: string, options: ToastOptions = {}) => {
    const id = Date.now().toString();
    const defaultOptions: Required<ToastOptions> = {
      type: 'info',
      duration: 3000,
      position: 'bottom',
      action: undefined,
      ...options
    };
    
    setToasts(prev => [...prev, { id, message, options: defaultOptions }]);
    
    // Remove toast after duration
    if (defaultOptions.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, defaultOptions.duration + 500); // Add time for exit animation
    }
  };
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast rendering */}
      <div className="fixed z-50 pointer-events-none w-full">
        <div className={`toast-container-top absolute top-4 left-0 right-0 flex flex-col items-center gap-2`}>
          {toasts
            .filter(toast => toast.options.position === 'top')
            .map(toast => (
              <div 
                key={toast.id}
                className={`pointer-events-auto px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-down ${
                  toast.options.type === 'success' ? 'bg-green-800' :
                  toast.options.type === 'error' ? 'bg-red-800' :
                  toast.options.type === 'warning' ? 'bg-yellow-700' :
                  'bg-indigo-800'
                }`}
              >
                <div className="flex items-center">
                  <span>{toast.message}</span>
                  {toast.options.action && (
                    <button 
                      className="ml-3 px-2 py-1 bg-white bg-opacity-20 rounded text-xs"
                      onClick={toast.options.action.onClick}
                    >
                      {toast.options.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
        
        <div className={`toast-container-bottom absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2`}>
          {toasts
            .filter(toast => toast.options.position === 'bottom')
            .map(toast => (
              <div 
                key={toast.id}
                className={`pointer-events-auto px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up ${
                  toast.options.type === 'success' ? 'bg-green-800' :
                  toast.options.type === 'error' ? 'bg-red-800' :
                  toast.options.type === 'warning' ? 'bg-yellow-700' :
                  'bg-indigo-800'
                }`}
              >
                <div className="flex items-center">
                  <span>{toast.message}</span>
                  {toast.options.action && (
                    <button 
                      className="ml-3 px-2 py-1 bg-white bg-opacity-20 rounded text-xs"
                      onClick={toast.options.action.onClick}
                    >
                      {toast.options.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

// Hook for using toasts
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Usage in components
function ActivityComponent() {
  const { showToast } = useToast();
  
  const handleActivityComplete = (result) => {
    if (result.success) {
      showToast(`Activity completed! Gained ${result.insightGained} Insight`, {
        type: 'success',
        position: 'top'
      });
    } else {
      showToast('Activity failed to complete', { 
        type: 'error',
        action: {
          label: 'Try Again',
          onClick: () => retryActivity()
        }
      });
    }
  };
  
  // Component code...
}
```

## 9. Microtransaction Approach to Updates

ConstellationView uses a series of small, controlled state updates rather than large batch changes:

```typescript
// Small, focused state updates
const toggleNodeActive = (nodeId: string, isActive: boolean) => {
  // 1. Update the domain model
  const knowledgeStore = useKnowledgeStore.getState();
  knowledgeStore.setConceptActivation(nodeId, isActive);
  
  // 2. Update local visualization state for immediate feedback
  const updatedNodes = simulationNodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, active: isActive };
    }
    return node;
  });
  setSimulationNodes(updatedNodes);
  
  // 3. Update dependent states after main update
  updateConnectionStates(nodeId, isActive);
  
  // 4. Dispatch event for cross-component notification
  safeDispatch(
    GameEventType.CONCEPT_ACTIVATION_CHANGED,
    { conceptId: nodeId, isActive },
    'constellation'
  );
};
```

**Recommendation for Time-Based System:**
- Use the same approach for time and activity state changes
- Break updates into small, focused transactions with clear error boundaries:

```typescript
// Example of completing an activity with microtransactions
function completeActivity(activityId: string, performance: 'poor' | 'average' | 'excellent') {
  const activityStore = useActivityStore.getState();
  const timeStore = useTimeStore.getState();
  const resourceStore = useResourceStore.getState();
  const knowledgeStore = useKnowledgeStore.getState();
  
  try {
    // 1. Find the activity
    const activity = activityStore.getActivityById(activityId);
    if (!activity) {
      console.error(`Activity ${activityId} not found`);
      return false;
    }
    
    // 2. Update activity status - separate transaction
    const updatedActivity = activityStore.markActivityCompleted(activityId);
    
    // 3. Calculate and apply resource gains based on performance
    let insightGain = 0;
    let momentumEffect: 'maintain' | 'increment' | 'reset' = 'maintain';
    let timeSaved = 0;
    
    switch (performance) {
      case 'excellent':
        insightGain = 25;
        momentumEffect = 'increment';
        timeSaved = 60; // 1 hour
        break;
      case 'average':
        insightGain = 15;
        momentumEffect = 'maintain';
        timeSaved = 0;
        break;
      case 'poor':
        insightGain = 5;
        momentumEffect = 'reset';
        timeSaved = -60; // penalty: takes extra hour
        break;
    }
    
    // Apply resource changes as separate transactions
    if (insightGain > 0) {
      resourceStore.updateInsight(insightGain, `activity_${activityId}`);
    }
    
    if (momentumEffect === 'increment') {
      resourceStore.incrementMomentum();
    } else if (momentumEffect === 'reset') {
      resourceStore.resetMomentum();
    }
    
    // 4. Advance time based on activity duration and performance
    const effectiveDuration = activity.duration - timeSaved;
    timeStore.advanceTime(Math.max(60, effectiveDuration)); // Min 1 hour
    
    // 5. Apply knowledge gains - separate transaction for each concept
    if (activity.knowledgeGains && activity.knowledgeGains.length > 0) {
      // Process each knowledge gain individually 
      activity.knowledgeGains.forEach(gain => {
        try {
          // Discover concept if not already discovered
          if (!knowledgeStore.isConceptDiscovered(gain.conceptId)) {
            knowledgeStore.discoverConcept(gain.conceptId);
          }
          
          // Update mastery as a separate operation
          knowledgeStore.updateMastery(gain.conceptId, gain.amount);
        } catch (conceptError) {
          console.error(`Error processing concept ${gain.conceptId}:`, conceptError);
          // Continue with other concepts even if one fails
        }
      });
    }
    
    // 6. Check for connections between used concepts
    if (activity.knowledgeGains && activity.knowledgeGains.length > 1) {
      const conceptIds = activity.knowledgeGains.map(g => g.conceptId);
      // Process each possible pair
      for (let i = 0; i < conceptIds.length; i++) {
        for (let j = i + 1; j < conceptIds.length; j++) {
          try {
            enhanceConnectionMastery(conceptIds[i], conceptIds[j], 5);
          } catch (connectionError) {
            console.error(`Error enhancing connection:`, connectionError);
            // Continue with other connections
          }
        }
      }
    }
    
    // 7. Notify completion
    safeDispatch(
      GameEventType.ACTIVITY_COMPLETED,
      {
        activityId,
        performance,
        insightGained: insightGain,
        timeSaved,
        knowledgeGains: activity.knowledgeGains
      },
      'timeSystem'
    );
    
    return true;
  } catch (error) {
    // Handle top-level error
    console.error('Error completing activity:', error);
    
    // Attempt recovery if possible
    safeDispatch(
      GameEventType.ACTIVITY_ERROR,
      {
        activityId,
        error: 'Failed to complete activity properly'
      },
      'timeSystem'
    );
    
    return false;
  }
}
```

## 10. Detailed Logging Strategy

ConstellationView implements thorough logging that aids debugging without compromising performance:

```typescript
// Consistent logging format with component prefix
console.log(`[ConstellationView] Initialized with ${nodes.length} total nodes`);
console.log(`[ConstellationView] Discovered nodes: ${discoveredNodes.length}`);

// Logging specific elements with context
if (newlyDiscovered.length > 0) {
  console.log(`[ConstellationView] Newly discovered concepts:`, 
    newlyDiscovered.map(id => {
      const node = nodes.find(n => n.id === id);
      return node ? `${node.name} (${node.domain})` : id;
    })
  );
}

// Warning with clear messages
if (!node) {
  console.warn(`[ConstellationView] Cannot unlock node: ${nodeId} not found`);
  showToast("Error: Concept not found", "error");
  return;
}
```

**Recommendation for Time-Based System:**
- Implement a similar consistent logging strategy throughout your application
- Create a centralized logging utility with standardized format:

```typescript
// logging.ts
export const createLogger = (module: string) => {
  const formatMessage = (message: string) => `[${module}] ${message}`;
  
  return {
    debug: (message: string, ...args: any[]) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formatMessage(message), ...args);
      }
    },
    log: (message: string, ...args: any[]) => {
      console.log(formatMessage(message), ...args);
    },
    info: (message: string, ...args: any[]) => {
      console.info(formatMessage(message), ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(formatMessage(message), ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(formatMessage(message), ...args);
    },
    group: (message: string) => {
      console.group(formatMessage(message));
    },
    groupEnd: () => {
      console.groupEnd();
    },
    // Additional methods as needed
    timer: (label: string) => {
      const timerId = `${module}_${label}`;
      console.time(timerId);
      return {
        end: () => console.timeEnd(timerId)
      };
    },
    // Action tracking
    trackAction: (action: string, details?: object) => {
      const timestamp = new Date().toISOString();
      console.log(formatMessage(`ACTION: ${action}`), { timestamp, ...details });
      // In production, this could send to analytics
    }
  };
};

// Usage in components
// timeSystem.ts
const logger = createLogger('TimeSystem');

function advanceTime(minutes: number, reason?: string) {
  logger.log(`Advancing time by ${minutes} minutes${reason ? ` (${reason})` : ''}`);
  
  // Track performance for optimization
  const timer = logger.timer('advanceTime');
  
  try {
    // Implementation...
    logger.trackAction('TIME_ADVANCED', { minutes, reason });
    timer.end();
    return true;
  } catch (error) {
    logger.error(`Failed to advance time: ${error.message}`, error);
    timer.end();
    return false;
  }
}
```

## Implementation Strategy

To apply these patterns to your time-based system, I recommend the following implementation approach:

1. **Create Core Data Models**: Define your primary data structures for activities, time blocks, and schedules
2. **Build Visualization Models**: Create transformations from core data to specialized UI models
3. **Implement D3 Visualization Components**: Follow the ConstellationView pattern for timeline and schedule visualization
4. **Create Feedback System**: Build the toast and visual feedback components
5. **Develop Microtransaction Logic**: Implement the activity completion and time advancement with small focused updates
6. **Add Rich Logging**: Integrate the standardized logging system
7. **Implement Progressive Loading**: Add loading states and graceful error handling

By following these patterns from your ConstellationView implementation, your time-based system will maintain the same high level of performance, user feedback, and code organization that makes the constellation system successful.