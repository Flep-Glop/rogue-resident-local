/**
 * Dialogue Registry
 * 
 * This file serves as a central registry for mapping node IDs and dialogue IDs
 * to their corresponding dialogue content. This makes it easier to:
 * 
 * 1. Test different dialogues without modifying component code
 * 2. Have a single source of truth for dialogue mappings
 * 3. Simplify the process of assigning dialogues to nodes
 */

import { DialogueStage } from '@/app/hooks/useDialogueFlow';

// Import all dialogue content
import kapoorCalibrationDialogue from './dialogues/calibrations/kapoor-calibration';
import exampleExtensionsDialogue from './dialogues/extensions/example-extensions-dialogue';
import dialogueModeExample from './dialogues/examples/dialogue-mode-example';
// Import other dialogues here as needed

// Type definitions
type DialogueId = string;
type NodeId = string;

// Registry interface
interface DialogueRegistryItem {
  dialogueId: DialogueId;
  content: DialogueStage[];
  description: string; 
  characterId?: string;
  tags?: string[];
}

// Node to dialogue mapping
interface NodeDialogueMapping {
  nodeId: NodeId;
  dialogueId: DialogueId;
  description?: string;
}

// Main dialogue registry
const dialogueRegistry: Record<DialogueId, DialogueRegistryItem> = {
  'kapoor-calibration': {
    dialogueId: 'kapoor-calibration',
    content: kapoorCalibrationDialogue,
    description: 'Kapoor\'s initial calibration dialogue',
    characterId: 'kapoor',
    tags: ['calibration', 'intro']
  },
  'example-extensions': {
    dialogueId: 'example-extensions',
    content: exampleExtensionsDialogue,
    description: 'Example dialogue for testing all extension types',
    characterId: 'kapoor',
    tags: ['extensions', 'test']
  },
  'advanced-calculation': {
    dialogueId: 'advanced-calculation',
    // Create a filtered version that starts with the advanced calculation
    content: exampleExtensionsDialogue.filter(stage => 
      stage.id === 'advanced-calculation' || 
      stage.id === 'advanced-calculation-interface' ||
      stage.id === 'advanced-calculation-followup'
    ),
    description: 'Advanced calculation dialogue focusing on monitor unit calculation',
    characterId: 'kapoor',
    tags: ['calculation', 'advanced']
  },
  'basic-calculation': {
    dialogueId: 'basic-calculation',
    // Create a filtered version that uses basic calculation interface instead
    content: exampleExtensionsDialogue.filter(stage => 
      stage.id === 'calculation-intro' || 
      stage.id === 'calculation-interface' ||
      stage.id === 'calculation-followup'
    ),
    description: 'Basic calculation dialogue focusing on simple monitor unit calculation',
    characterId: 'kapoor',
    tags: ['calculation', 'basic']
  },
  // Add a new dialogue for direct calculation challenge without intro
  'direct-calculation-challenge': {
    dialogueId: 'direct-calculation-challenge',
    // Only include the calculation interface stage, skipping the intro
    content: exampleExtensionsDialogue.filter(stage => 
      stage.id === 'calculation-interface' ||
      stage.id === 'calculation-followup'
    ),
    description: 'Direct calculation challenge that skips dialogue and starts with the challenge ceremony',
    characterId: 'kapoor',
    tags: ['calculation', 'basic', 'direct']
  },
  'dialogue-mode-example': {
    dialogueId: 'dialogue-mode-example',
    content: dialogueModeExample,
    description: 'Example dialogue demonstrating different dialogue modes',
    characterId: 'kapoor',
    tags: ['example', 'mode']
  },
  // Add equipment identification dialogue
  'equipment-identification-linac': {
    dialogueId: 'equipment-identification-linac',
    content: [
      {
        id: 'equipment-identification-intro',
        type: 'standard',
        text: "Today, we need to identify the key components of a linear accelerator. This is essential knowledge for any medical physicist.",
        options: [
          {
            id: 'ready-to-identify',
            text: "I'm ready to identify the components.",
            nextStageId: 'equipment-identification-challenge'
          }
        ]
      },
      {
        id: 'equipment-identification-challenge',
        type: 'standard',
        text: '',
        extension: {
          type: 'equipment-identification',
          contentId: 'linac_components_basic',
          conversationText: "Let's identify the key components of a linear accelerator. Understanding the equipment is fundamental to ensuring proper treatment delivery."
        },
        nextStageId: 'equipment-identification-followup'
      },
      {
        id: 'equipment-identification-followup',
        type: 'standard',
        text: "Excellent work. This knowledge is critical for quality assurance and troubleshooting. The linear accelerator is truly the workhorse of radiation oncology.",
        options: [
          {
            id: 'whats-next',
            text: "What should we focus on next?",
            nextStageId: 'equipment-identification-followup'
          }
        ]
      }
    ],
    description: 'Equipment identification dialogue for linear accelerator components',
    characterId: 'kapoor',
    tags: ['equipment', 'identification', 'linac']
  }
  // Add more dialogue entries here
};

// Node to dialogue mappings
const nodeToDialogueMap: NodeDialogueMapping[] = [
  {
    nodeId: 'start',
    dialogueId: 'kapoor-calibration',
    description: 'Starting node with Kapoor calibration'
  },
  {
    nodeId: 'kapoor-1',
    dialogueId: 'kapoor-calibration',
    description: 'First Kapoor node'
  },
  {
    nodeId: 'path1',
    dialogueId: 'example-extensions',
    description: 'Path 1 node for testing extensions'
  },
  {
    nodeId: 'path-a1',
    dialogueId: 'direct-calculation-challenge',
    description: 'Path A1 node with direct calculation challenge'
  },
  {
    nodeId: 'dialogue-mode-demo',
    dialogueId: 'dialogue-mode-example',
    description: 'Demo node for dialogue mode example'
  },
  // Add encounter_1 node mapping
  {
    nodeId: 'enc-1',
    dialogueId: 'equipment-identification-linac',
    description: 'Encounter 1 - Linear Accelerator Equipment Identification'
  }
  // Add more node mappings here
];

/**
 * Get dialogue content by dialogue ID
 */
export function getDialogueById(dialogueId: DialogueId): DialogueStage[] | null {
  const entry = dialogueRegistry[dialogueId];
  return entry ? entry.content : null;
}

/**
 * Get dialogue content by node ID
 */
export function getDialogueByNodeId(nodeId: NodeId): DialogueStage[] | null {
  const mapping = nodeToDialogueMap.find(m => m.nodeId === nodeId);
  if (!mapping) return null;
  
  return getDialogueById(mapping.dialogueId);
}

/**
 * Get dialogue ID by node ID
 */
export function getDialogueIdByNodeId(nodeId: NodeId): DialogueId | null {
  const mapping = nodeToDialogueMap.find(m => m.nodeId === nodeId);
  return mapping ? mapping.dialogueId : null;
}

/**
 * Add a new dialogue to the registry
 */
export function registerDialogue(
  dialogueId: DialogueId, 
  content: DialogueStage[],
  description: string,
  characterId?: string,
  tags?: string[]
): void {
  dialogueRegistry[dialogueId] = {
    dialogueId,
    content,
    description,
    characterId,
    tags
  };
}

/**
 * Add a new node-to-dialogue mapping
 */
export function registerNodeDialogueMapping(
  nodeId: NodeId,
  dialogueId: DialogueId,
  description?: string
): void {
  // Remove any existing mapping for this node
  const existingIndex = nodeToDialogueMap.findIndex(m => m.nodeId === nodeId);
  if (existingIndex !== -1) {
    nodeToDialogueMap.splice(existingIndex, 1);
  }
  
  // Add the new mapping
  nodeToDialogueMap.push({
    nodeId,
    dialogueId,
    description
  });
}

// Export the registry and mapping for direct access if needed
export { dialogueRegistry, nodeToDialogueMap }; 