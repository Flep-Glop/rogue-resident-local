import { create } from 'zustand';
import { Dialogue, DialogueNode, Mentor } from '../data/dialogueData';
import { DialogueOption } from '@/app/types';
import { GameEventType, MentorId } from '@/app/types';
import { centralEventBus } from '../core/events/CentralEventBus';

// Add proper type for safeDispatch
const safeDispatch = (eventType: GameEventType, payload: any, source: string) => {
  try {
    centralEventBus.dispatch(eventType, payload, source);
  } catch (error) {
    console.error(`Failed to dispatch ${eventType}:`, error);
  }
};

interface DialogueState {
  // Mentors
  mentors: Record<string, Mentor>;
  
  // Dialogues
  dialogues: Record<string, Dialogue>;
  
  // Active dialogue
  activeDialogueId: string | null;
  currentNodeId: string | null;
  postActivityNodeId: string | null; // Node to continue to after activity completion
  dialogueHistory: Array<{
    nodeId: string;
    selectedOptionId: string | null;
  }>;
  
  // Actions
  addMentor: (mentor: Mentor) => void;
  updateMentorRelationship: (mentorId: string, change: number) => void;
  getMentor: (mentorId: string) => Mentor | undefined;
  
  addDialogue: (dialogue: Dialogue) => void;
  getDialogue: (dialogueId: string) => Dialogue | undefined;
  
  startDialogue: (dialogueId: string) => void;
  selectOption: (optionId: string) => void;
  getCurrentNode: () => DialogueNode | undefined;
  getActiveDialogue: () => Dialogue | undefined;
  getAvailableOptions: () => DialogueOption[];
  endDialogue: () => void;
  setPostActivityNode: (nodeId: string) => void;
  continueToPostActivityNode: () => void;
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  // State
  mentors: {},
  dialogues: {},
  activeDialogueId: null,
  currentNodeId: null,
  postActivityNodeId: null,
  dialogueHistory: [],
  
  // Mentor Actions
  addMentor: (mentor: Mentor) => {
    const state = get();
    if (state.mentors[mentor.id]) {
      console.warn(`Mentor with ID ${mentor.id} already exists`);
      return;
    }
    
    set({
      mentors: {
        ...state.mentors,
        [mentor.id]: mentor
      }
    });
  },
  
  updateMentorRelationship: (mentorId: string, change: number) => {
    const state = get();
    const mentor = state.mentors[mentorId];
    if (!mentor) {
      console.warn(`Mentor with ID ${mentorId} not found`);
      return;
    }
    
    const currentValue = mentor.relationship;
    const newValue = Math.max(0, Math.min(100, currentValue + change));
    
    if (newValue === currentValue) return;
    
    set({
      mentors: {
        ...state.mentors,
        [mentorId]: {
          ...mentor,
          relationship: newValue
        }
      }
    });
    
    // Dispatch relationship changed event
    safeDispatch(
      GameEventType.MENTOR_RELATIONSHIP_CHANGED,
      {
        mentorId,
        previousValue: currentValue,
        newValue,
        change
      },
      'dialogueStore.updateMentorRelationship'
    );
  },
  
  getMentor: (mentorId: string) => {
    return get().mentors[mentorId];
  },
  
  // Dialogue Actions
  addDialogue: (dialogue: Dialogue) => {
    const state = get();
    if (state.dialogues[dialogue.id]) {
      console.warn(`Dialogue with ID ${dialogue.id} already exists`);
      return;
    }
    
    set({
      dialogues: {
        ...state.dialogues,
        [dialogue.id]: dialogue
      }
    });
  },
  
  getDialogue: (dialogueId: string) => {
    return get().dialogues[dialogueId];
  },
  
  startDialogue: (dialogueId: string) => {
    const state = get();
    const dialogue = state.dialogues[dialogueId];
    if (!dialogue) {
      console.warn(`Dialogue with ID ${dialogueId} not found`);
      return;
    }
    
    set({
      activeDialogueId: dialogueId,
      currentNodeId: dialogue.startNodeId,
      dialogueHistory: [{ nodeId: dialogue.startNodeId, selectedOptionId: null }]
    });
    
    // Dispatch dialogue started event
    safeDispatch(
      GameEventType.DIALOGUE_STARTED,
      { dialogueId },
      'dialogueStore.startDialogue'
    );
  },
  
  selectOption: (optionId: string) => {
    const state = get();
    if (!state.activeDialogueId || !state.currentNodeId) {
      console.warn('No active dialogue');
      return;
    }
    
    const dialogue = state.dialogues[state.activeDialogueId];
    const currentNode = dialogue.nodes[state.currentNodeId];
    
    // Find the selected option
    const selectedOption = currentNode.options.find((option: DialogueOption) => option.id === optionId);
    if (!selectedOption) {
      console.warn(`Option with ID ${optionId} not found in current node`);
      return;
    }
    
    // Process option effects
    if (selectedOption.insightChange) {
      safeDispatch(
        GameEventType.INSIGHT_GAINED,
        {
          change: selectedOption.insightChange,
          source: `dialogue_option:${optionId}`
        },
        'dialogueStore.selectOption'
      );
    }
    
    if (selectedOption.momentumChange) {
      safeDispatch(
        GameEventType.MOMENTUM_CHANGED,
        {
          change: selectedOption.momentumChange,
          source: `dialogue_option:${optionId}`
        },
        'dialogueStore.selectOption'
      );
    }
    
    if (selectedOption.relationshipChange && currentNode.mentorId) {
      get().updateMentorRelationship(
        currentNode.mentorId,
        selectedOption.relationshipChange
      );
    }
    
    if (selectedOption.discoversConceptId) {
      safeDispatch(
        GameEventType.KNOWLEDGE_DISCOVERED,
        {
          conceptId: selectedOption.discoversConceptId,
          source: `dialogue_option:${optionId}`
        },
        'dialogueStore.selectOption'
      );
    }
    
    // Handle tutorial step completion
    if (selectedOption.tutorialStepCompletion) {
      console.log(`🎯 [TUTORIAL TRIGGER] Dialogue option selected with tutorial step completion: "${selectedOption.tutorialStepCompletion}"`);
      console.log(`📝 [TUTORIAL TRIGGER] Option: "${selectedOption.text}" → step: ${selectedOption.tutorialStepCompletion}`);
      
      // Import tutorial store dynamically to avoid circular dependencies
      import('../store/tutorialStore').then(({ useTutorialStore }) => {
        const tutorialStore = useTutorialStore.getState();
        console.log(`🔄 [TUTORIAL TRIGGER] Calling tutorialStore.completeStep(${selectedOption.tutorialStepCompletion})`);
        tutorialStore.completeStep(selectedOption.tutorialStepCompletion!);
      });
    }
    
    // Handle ability receiving  
    if (selectedOption.receivesAbility) {
      console.log(`🎁 [TUTORIAL TRIGGER] Dialogue option grants ability: "${selectedOption.receivesAbility}"`);
      // TODO: Implement ability system integration
      console.log(`Received ability: ${selectedOption.receivesAbility}`);
    }
    
    // Update dialogue history
    const newHistory = [
      ...state.dialogueHistory,
      {
        nodeId: state.currentNodeId,
        selectedOptionId: optionId
      }
    ];
    
    // If it's an end node, end the dialogue
    if ((selectedOption as any).isEndNode) {
      safeDispatch(
        GameEventType.DIALOGUE_ENDED,
        {
          dialogueId: state.activeDialogueId,
          completed: true
        },
        'dialogueStore.selectOption'
      );
      
      set({
        activeDialogueId: null,
        currentNodeId: null,
        dialogueHistory: newHistory
      });
      return;
    }
    
    // Check if this option triggers an activity
    if ((selectedOption as any).triggersActivity) {
      console.log(`🎮 [DIALOGUE] Option triggers activity, storing next node for later: ${selectedOption.nextNodeId}`);
      // Store the next node but don't advance yet - let the activity complete first
      if (selectedOption.nextNodeId) {
        get().setPostActivityNode(selectedOption.nextNodeId);
      }
      
      // Update history but don't change current node
      set({ dialogueHistory: newHistory });
    } else {
      // Otherwise, move to the next node normally
      if (selectedOption.nextNodeId) {
        set({
          currentNodeId: selectedOption.nextNodeId,
          dialogueHistory: newHistory
        });
      }
    }
  },
  
  getCurrentNode: () => {
    const { activeDialogueId, currentNodeId } = get();
    if (!activeDialogueId || !currentNodeId) return undefined;
    
    const dialogue = get().dialogues[activeDialogueId];
    if (!dialogue) return undefined;
    
    return dialogue.nodes[currentNodeId];
  },
  
  getActiveDialogue: () => {
    const { activeDialogueId } = get();
    if (!activeDialogueId) return undefined;
    
    return get().dialogues[activeDialogueId];
  },
  
  getAvailableOptions: () => {
    const currentNode = get().getCurrentNode();
    if (!currentNode) return [];
    
    // Filter options based on prerequisites (like requiring stars)
    return currentNode.options.filter((option: DialogueOption) => {
      // If option has a required star, check if it's active
      // For now, just return all options
      return true;
    });
  },
  
  endDialogue: () => {
    const state = get();
    if (!state.activeDialogueId) return;
    
    safeDispatch(
      GameEventType.DIALOGUE_ENDED,
      {
        dialogueId: state.activeDialogueId,
        completed: false
      },
      'dialogueStore.endDialogue'
    );
    
    set({
      activeDialogueId: null,
      currentNodeId: null,
      postActivityNodeId: null
    });
  },

  setPostActivityNode: (nodeId: string) => {
    console.log(`📍 [DIALOGUE] Setting post-activity node: ${nodeId}`);
    
    // Verify the node exists in the current dialogue
    const state = get();
    if (state.activeDialogueId) {
      const currentDialogue = state.dialogues[state.activeDialogueId];
      if (currentDialogue) {
        const node = currentDialogue.nodes[nodeId];
        if (node) {
          console.log(`📍 [DIALOGUE] Post-activity node verified:`, {
            nodeId: nodeId,
            mentorId: node.mentorId,
            hasOptions: node.options?.length > 0,
            optionsCount: node.options?.length || 0
          });
        } else {
          console.error(`📍 [DIALOGUE] ERROR: Post-activity node "${nodeId}" not found in dialogue "${state.activeDialogueId}"`);
        }
      } else {
        console.error(`📍 [DIALOGUE] ERROR: Active dialogue "${state.activeDialogueId}" not found in store`);
      }
    } else {
      console.error(`📍 [DIALOGUE] ERROR: No active dialogue when setting post-activity node`);
    }
    
    set({ postActivityNodeId: nodeId });
  },

  continueToPostActivityNode: () => {
    const state = get();
    if (!state.postActivityNodeId) {
      console.warn('No post-activity node set');
      return;
    }
    
    console.log(`📍 [DIALOGUE] Continuing to post-activity node: ${state.postActivityNodeId}`);
    console.log(`📍 [DIALOGUE] Current dialogue state before navigation:`, {
      activeDialogueId: state.activeDialogueId,
      currentNodeId: state.currentNodeId,
      postActivityNodeId: state.postActivityNodeId
    });
    
    set({
      currentNodeId: state.postActivityNodeId,
      postActivityNodeId: null
    });
    
    // Verify the transition worked
    const newState = get();
    const currentDialogue = newState.dialogues[newState.activeDialogueId!];
    const newCurrentNode = currentDialogue?.nodes[newState.currentNodeId!];
    
    console.log(`📍 [DIALOGUE] Post-activity navigation complete:`, {
      activeDialogueId: newState.activeDialogueId,
      currentNodeId: newState.currentNodeId,
      nodeExists: !!newCurrentNode,
      nodeMentorId: newCurrentNode?.mentorId,
      nodeText: newCurrentNode?.text?.slice(0, 50) + '...',
      optionsCount: newCurrentNode?.options?.length || 0
    });
  }
})); 