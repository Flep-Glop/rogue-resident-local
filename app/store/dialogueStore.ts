import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Dialogue, DialogueNode, Mentor, DialogueOption } from '../data/dialogueData';
import { GameEventType } from '../types';
import { centralEventBus } from '../core/events/CentralEventBus';

// Use the safeDispatch from centralEventBus
const safeDispatch = centralEventBus.safeDispatch.bind(centralEventBus);

interface DialogueState {
  // Mentors
  mentors: Record<string, Mentor>;
  
  // Dialogues
  dialogues: Record<string, Dialogue>;
  
  // Active dialogue
  activeDialogueId: string | null;
  currentNodeId: string | null;
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
}

export const useDialogueStore = create<DialogueState>()(
  immer((set, get) => ({
    // State
    mentors: {},
    dialogues: {},
    activeDialogueId: null,
    currentNodeId: null,
    dialogueHistory: [],
    
    // Mentor Actions
    addMentor: (mentor: Mentor) => set(state => {
      if (state.mentors[mentor.id]) {
        console.warn(`Mentor with ID ${mentor.id} already exists`);
        return;
      }
      
      state.mentors[mentor.id] = mentor;
    }),
    
    updateMentorRelationship: (mentorId: string, change: number) => set(state => {
      const mentor = state.mentors[mentorId];
      if (!mentor) {
        console.warn(`Mentor with ID ${mentorId} not found`);
        return;
      }
      
      const currentValue = mentor.relationship;
      const newValue = Math.max(0, Math.min(100, currentValue + change));
      
      if (newValue === currentValue) return;
      
      mentor.relationship = newValue;
      
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
    }),
    
    getMentor: (mentorId: string) => {
      return get().mentors[mentorId];
    },
    
    // Dialogue Actions
    addDialogue: (dialogue: Dialogue) => set(state => {
      if (state.dialogues[dialogue.id]) {
        console.warn(`Dialogue with ID ${dialogue.id} already exists`);
        return;
      }
      
      state.dialogues[dialogue.id] = dialogue;
    }),
    
    getDialogue: (dialogueId: string) => {
      return get().dialogues[dialogueId];
    },
    
    startDialogue: (dialogueId: string) => set(state => {
      const dialogue = state.dialogues[dialogueId];
      if (!dialogue) {
        console.warn(`Dialogue with ID ${dialogueId} not found`);
        return;
      }
      
      state.activeDialogueId = dialogueId;
      state.currentNodeId = dialogue.startNodeId;
      state.dialogueHistory = [{ nodeId: dialogue.startNodeId, selectedOptionId: null }];
      
      // Dispatch dialogue started event
      safeDispatch(
        GameEventType.DIALOGUE_STARTED,
        { dialogueId },
        'dialogueStore.startDialogue'
      );
    }),
    
    selectOption: (optionId: string) => set(state => {
      if (!state.activeDialogueId || !state.currentNodeId) {
        console.warn('No active dialogue');
        return;
      }
      
      const dialogue = state.dialogues[state.activeDialogueId];
      const currentNode = dialogue.nodes[state.currentNodeId];
      
      // Find the selected option
      const selectedOption = currentNode.options.find(option => option.id === optionId);
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
      
      // Update dialogue history
      state.dialogueHistory.push({
        nodeId: state.currentNodeId,
        selectedOptionId: optionId
      });
      
      // If it's an end node, end the dialogue
      if (selectedOption.isEndNode) {
        safeDispatch(
          GameEventType.DIALOGUE_ENDED,
          {
            dialogueId: state.activeDialogueId,
            completed: true
          },
          'dialogueStore.selectOption'
        );
        
        state.activeDialogueId = null;
        state.currentNodeId = null;
        return;
      }
      
      // Otherwise, move to the next node
      if (selectedOption.nextNodeId) {
        state.currentNodeId = selectedOption.nextNodeId;
      }
    }),
    
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
      return currentNode.options.filter(option => {
        // If option has a required star, check if it's active
        // For now, just return all options
        return true;
      });
    },
    
    endDialogue: () => set(state => {
      if (!state.activeDialogueId) return;
      
      safeDispatch(
        GameEventType.DIALOGUE_ENDED,
        {
          dialogueId: state.activeDialogueId,
          completed: false
        },
        'dialogueStore.endDialogue'
      );
      
      state.activeDialogueId = null;
      state.currentNodeId = null;
    })
  }))
); 