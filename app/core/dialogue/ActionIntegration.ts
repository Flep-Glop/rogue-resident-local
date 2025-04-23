// app/core/dialogue/ActionIntegration.ts
import { StrategicActionType, useResourceStore, MAX_MOMENTUM_LEVEL } from "../../store/resourceStore";
import { useDialogueStateMachine, DialogueState, DialogueOption } from "./DialogueStateMachine";

/**
 * Strategic action handler context
 */
export interface ActionContext {
  characterId: string;
  stageId: string;
  actionType: StrategicActionType;
  currentOptions: DialogueOption[];
}

/**
 * Handler function type for strategic actions
 */
export type ActionHandlerFn = (context: ActionContext) => 
  Promise<{ stateUpdate?: Partial<DialogueState>, newOptions?: DialogueOption[] }>;

/**
 * Option enhancement type
 */
type OptionEnhancementFn = (options: DialogueOption[], actionType: StrategicActionType) => DialogueOption[];

/**
 * Registry of action handlers for different action types
 */
const actionHandlers: Record<StrategicActionType, ActionHandlerFn> = {
  /**
   * Reframe - Shift the conversation to more approachable topics
   */
  reframe: async (context: ActionContext) => {
    const { currentOptions, characterId } = context;
    
    // Filter options to favor "humble" and "precision" approaches
    // We're assuming these tags exist in the dialogue options
    const reframedOptions = currentOptions.filter(option => {
      if ('approach' in option) {
        const approach = (option as any).approach;
        return approach === 'humble' || approach === 'precision';
      }
      return false;
    });
    
    // If we don't have enough options, add some fallbacks based on character
    if (reframedOptions.length < 2) {
      let fallbackOptions: DialogueOption[] = [];
      
      switch (characterId) {
        case 'kapoor':
          fallbackOptions = [
            {
              id: "reframe-kapoor-basic",
              text: "Could we revisit the fundamental principles involved?",
              responseText: "Yes, that's a sensible approach. Let's examine the core concepts.",
              relationshipChange: 1,
              insightGain: 5,
              approach: 'humble'
            },
            {
              id: "reframe-kapoor-protocol",
              text: "How is this documented in our protocol manuals?",
              responseText: "Turning to established protocols is always prudent. The documentation states...",
              relationshipChange: 1,
              insightGain: 5,
              approach: 'precision'
            }
          ];
          break;
          
        case 'jesse':
          fallbackOptions = [
            {
              id: "reframe-jesse-practical",
              text: "How would this work in an everyday clinical scenario?",
              responseText: "Great question! In the real world, we'd handle it like this...",
              relationshipChange: 1,
              insightGain: 5,
              approach: 'humble'
            },
            {
              id: "reframe-jesse-experience",
              text: "Have you encountered similar situations before?",
              responseText: "Oh yeah, plenty of times. Let me tell you about one case...",
              relationshipChange: 1,
              insightGain: 5,
              approach: 'humble'
            }
          ];
          break;
          
        case 'quinn':
          fallbackOptions = [
            {
              id: "reframe-quinn-concept",
              text: "Could you explain this with a conceptual model?",
              responseText: "I love conceptual thinking! Let's visualize it this way...",
              relationshipChange: 1,
              insightGain: 5,
              approach: 'precision'
            },
            {
              id: "reframe-quinn-innovative",
              text: "Is there an alternative approach to this problem?",
              responseText: "There's always another angle! Consider this perspective...",
              relationshipChange: 1,
              insightGain: 5,
              approach: 'humble'
            }
          ];
          break;
          
        default:
          fallbackOptions = [
            {
              id: "reframe-basic",
              text: "Could we revisit the fundamental concepts first?",
              responseText: "Yes, let's go back to basics.",
              relationshipChange: 1,
              insightGain: 5,
              approach: 'humble'
            },
            {
              id: "reframe-practical",
              text: "How is this applied in everyday clinical practice?",
              responseText: "That's a good practical perspective.",
              relationshipChange: 1,
              insightGain: 5,
              approach: 'humble'
            }
          ];
      }
      
      return { 
        stateUpdate: {
          text: "I need to refocus this conversation on more familiar ground."
        },
        newOptions: fallbackOptions
      };
    }
    
    return { newOptions: reframedOptions };
  },
  
  /**
   * Extrapolate - Form connections between knowledge concepts
   */
  extrapolate: async (context: ActionContext) => {
    const { characterId } = context;
    
    // Customize connections based on character
    let connectionOptions: DialogueOption[] = [];
    
    switch (characterId) {
      case 'kapoor':
        connectionOptions = [
          {
            id: "extrapolate-kapoor-qa",
            text: "This calibration process relates to our quality assurance framework.",
            responseText: "Excellent connection. Our QA systems do indeed share the same foundational principles.",
            relationshipChange: 2,
            insightGain: 15,
            knowledgeGain: {
              conceptId: "qa-principles",
              domainId: "quality-assurance",
              amount: 10
            },
            approach: 'precision'
          },
          {
            id: "extrapolate-kapoor-regulatory",
            text: "I see parallels with regulatory compliance requirements.",
            responseText: "An astute observation. The regulatory framework influences many of our procedures.",
            relationshipChange: 2,
            insightGain: 15,
            knowledgeGain: {
              conceptId: "regulatory-compliance",
              domainId: "administration",
              amount: 10
            },
            approach: 'precision'
          }
        ];
        break;
        
      case 'jesse':
        connectionOptions = [
          {
            id: "extrapolate-jesse-maintenance",
            text: "This reminds me of the preventive maintenance schedule.",
            responseText: "You're catching on! The same principles of proactive error detection apply to both.",
            relationshipChange: 2,
            insightGain: 15,
            knowledgeGain: {
              conceptId: "preventive-maintenance",
              domainId: "equipment",
              amount: 10
            },
            approach: 'precision'
          },
          {
            id: "extrapolate-jesse-troubleshooting",
            text: "The diagnostic process here is similar to system troubleshooting.",
            responseText: "Exactly right! Both require systematic elimination of variables.",
            relationshipChange: 2,
            insightGain: 15,
            knowledgeGain: {
              conceptId: "diagnostics",
              domainId: "equipment",
              amount: 10
            },
            approach: 'precision'
          }
        ];
        break;
        
      case 'quinn':
        connectionOptions = [
          {
            id: "extrapolate-quinn-research",
            text: "This principle appears in experimental design as well.",
            responseText: "Brilliant observation! The scientific method transcends specific applications.",
            relationshipChange: 2,
            insightGain: 15,
            knowledgeGain: {
              conceptId: "experimental-design",
              domainId: "research",
              amount: 10
            },
            approach: 'precision'
          },
          {
            id: "extrapolate-quinn-innovation",
            text: "This could have applications in emerging treatment modalities.",
            responseText: "You're thinking ahead! That's exactly the kind of cross-domain insight we need.",
            relationshipChange: 2,
            insightGain: 15,
            knowledgeGain: {
              conceptId: "treatment-innovation",
              domainId: "emerging-tech",
              amount: 10
            },
            approach: 'confidence'
          }
        ];
        break;
        
      default:
        connectionOptions = [
          {
            id: "extrapolate-connection-1",
            text: "This relates to quality assurance principles we discussed earlier.",
            responseText: "Excellent connection. The same principles apply across domains.",
            relationshipChange: 2,
            insightGain: 15,
            knowledgeGain: {
              conceptId: "qa-principles",
              domainId: "quality-assurance",
              amount: 10
            },
            approach: 'precision'
          },
          {
            id: "extrapolate-connection-2",
            text: "The inverse square law applies here, just like in radiation safety.",
            responseText: "Very astute observation. Physical principles transcend specific applications.",
            relationshipChange: 2,
            insightGain: 15,
            knowledgeGain: {
              conceptId: "inverse-square-law",
              domainId: "radiation-physics",
              amount: 10
            },
            approach: 'precision'
          }
        ];
    }
    
    return {
      stateUpdate: {
        text: "I see a connection between this concept and others we've discussed..."
      },
      newOptions: connectionOptions
    };
  },
  
  /**
   * Boast - Challenge yourself with harder questions for higher rewards
   */
  boast: async (context: ActionContext) => {
    const { characterId, stageId } = context;
    
    try {
      // First check if we have a stageId in the context
      if (!stageId) {
        console.error(`[ActionIntegration] Cannot apply boast - no stageId provided in context`);
        return {
          stateUpdate: {
            text: "I'll demonstrate my expertise on this topic."
          },
          newOptions: [] // Empty array will keep current options
        };
      }
      
      console.log(`[ActionIntegration] Handling boast action for stage ID: ${stageId}`);
      
      // We need a direct approach that doesn't require accessing the internal state
      // of the DialogueStateMachine, which might be encapsulated
      
      // Check if the boast stage exists in known dialogues
      // First try kapoor dialogue since that's our main one for the vertical slice
      const kapoorDialogue = require('../../data/dialogues/calibrations/kapoor-calibration').default;
      
      // Log the stageId we're looking for
      console.log(`[ActionIntegration] Looking for boast stage for stageId: ${stageId}`);
      
      // First look for the current stage
      const currentStage = kapoorDialogue.find((stage: any) => stage.id === stageId);
      
      if (currentStage && currentStage.boastStageId) {
        const boastStageId = currentStage.boastStageId;
        console.log(`[ActionIntegration] Found boast stage ID: ${boastStageId} for stage: ${stageId}`);
        
        return {
          stateUpdate: {
            currentStageId: boastStageId
          }
        };
      }
      
      // If no boast stage ID is defined, create a hardcoded challenging option based on character
      console.log(`[ActionIntegration] No boastStageId defined for stage: ${stageId}, using fallback options`);
      
      let challengeOptions: DialogueOption[] = [];
      
      switch (characterId) {
        case 'kapoor':
          challengeOptions = [
            {
              id: "boast-kapoor-advanced",
              text: "This relates to the electron spectral changes at depth, which affect the depth-dose curve through fluence perturbations.",
              responseText: "Impressive grasp of advanced dosimetry. The fluence perturbations do indeed affect the depth-dose relationship in complex ways.",
              relationshipChange: 3,
              insightGain: 30, // Higher rewards
              approach: 'precision',
              isCriticalPath: true,
              knowledgeGain: {
                conceptId: "electron_equilibrium_understood",
                domainId: "radiation-physics",
                amount: 25
              }
            },
            {
              id: "boast-kapoor-wrong",
              text: "The buildup effect is primarily a result of back-scattered radiation from deeper tissues.",
              responseText: "That's incorrect. Buildup is predominantly related to forward-scattered secondary electrons. This is a fundamental concept that should be well understood.",
              relationshipChange: -2,
              insightGain: 0,
              momentumEffect: 'reset',
              approach: 'confidence'
            }
          ];
          break;
          
        default:
          challengeOptions = [
            {
              id: "boast-generic-advanced",
              text: "I believe I can demonstrate a more advanced understanding of this topic.",
              responseText: "Your confidence is admirable, but technical accuracy is crucial in medical physics.",
              relationshipChange: 1,
              insightGain: 20,
              approach: 'confidence'
            },
            {
              id: "boast-generic-wrong",
              text: "I'd like to propose an alternative explanation based on emerging research.",
              responseText: "Interesting approach, though I'd caution against relying on unverified concepts.",
              relationshipChange: -1,
              insightGain: 5,
              approach: 'creative'
            }
          ];
      }
      
      return { 
        stateUpdate: {
          text: "Prove your expertise with a more advanced response."
        },
        newOptions: challengeOptions
      };
    } catch (error) {
      console.error(`[ActionIntegration] Error in boast handler:`, error);
      return {
        stateUpdate: {
          text: "I'll demonstrate my expertise on this topic."
        },
        newOptions: [] // Empty array will keep current options
      };
    }
  },
  
  /**
   * Synthesis - Discover new knowledge domains
   */
  synthesis: async (context: ActionContext) => {
    const { characterId } = context;
    
    // Customize synthesis options based on character
    let synthesisOptions: DialogueOption[] = [];
    
    switch (characterId) {
      case 'kapoor':
        synthesisOptions = [
          {
            id: "synthesis-kapoor-protocols",
            text: "Let's explore clinical protocol optimization.",
            responseText: "An excellent area to investigate. Protocol refinement is critical to clinical efficacy.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "protocol-optimization",
              domainId: "clinical-practice",
              amount: 20
            }
          },
          {
            id: "synthesis-kapoor-accreditation",
            text: "I'd like to understand the accreditation requirements better.",
            responseText: "A prudent topic. Accreditation standards provide an important framework for our practice.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "accreditation-standards",
              domainId: "administration",
              amount: 20
            }
          },
          {
            id: "synthesis-kapoor-dosimetry",
            text: "Advanced dosimetry techniques seem relevant here.",
            responseText: "Indeed they are. Precision in dosimetry directly impacts treatment outcomes.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "advanced-dosimetry",
              domainId: "dosimetry",
              amount: 20
            }
          }
        ];
        break;
        
      case 'jesse':
        synthesisOptions = [
          {
            id: "synthesis-jesse-calibration",
            text: "What about alternative calibration methodologies?",
            responseText: "Great question! There are several approaches we could explore.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "calibration-methods",
              domainId: "equipment",
              amount: 20
            }
          },
          {
            id: "synthesis-jesse-troubleshooting",
            text: "Can we discuss advanced troubleshooting techniques?",
            responseText: "Now you're talking my language! Let me show you some tricks I've learned.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "advanced-troubleshooting",
              domainId: "equipment",
              amount: 20
            }
          },
          {
            id: "synthesis-jesse-maintenance",
            text: "I'm interested in predictive maintenance strategies.",
            responseText: "That's cutting-edge thinking! Predicting failures before they happen is the gold standard.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "predictive-maintenance",
              domainId: "equipment",
              amount: 20
            }
          }
        ];
        break;
        
      case 'quinn':
        synthesisOptions = [
          {
            id: "synthesis-quinn-research",
            text: "What emerging research directions seem most promising?",
            responseText: "Oh, fantastic question! There are several fascinating frontiers right now.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "research-frontiers",
              domainId: "research",
              amount: 20
            }
          },
          {
            id: "synthesis-quinn-computation",
            text: "How are computational methods changing the field?",
            responseText: "That's where the real revolution is happening! Computational approaches are transforming everything.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "computational-methods",
              domainId: "emerging-tech",
              amount: 20
            }
          },
          {
            id: "synthesis-quinn-ionix",
            text: "Tell me more about your work with the Ionix chamber.",
            responseText: "I was hoping you'd ask about that! The Ionix research is my true passion.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "ionix-technology",
              domainId: "emerging-tech",
              amount: 20
            }
          }
        ];
        break;
        
      default:
        synthesisOptions = [
          {
            id: "synthesis-domain-1",
            text: "Let's explore advanced dosimetry techniques.",
            responseText: "That's a fascinating area to explore. Let me share what I know.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "advanced-dosimetry",
              domainId: "dosimetry",
              amount: 20
            }
          },
          {
            id: "synthesis-domain-2",
            text: "I'd like to understand adaptive planning better.",
            responseText: "Adaptive planning is indeed a cutting-edge domain. Let's discuss it.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "adaptive-planning",
              domainId: "treatment-planning",
              amount: 20
            }
          },
          {
            id: "synthesis-domain-3",
            text: "How are AI systems changing medical physics?",
            responseText: "That's a forward-looking question. AI is transforming our field in several ways.",
            relationshipChange: 1,
            insightGain: 25,
            knowledgeGain: {
              conceptId: "ai-applications",
              domainId: "emerging-tech",
              amount: 20
            }
          }
        ];
    }
    
    return {
      stateUpdate: {
        text: "I'd like to explore a new aspect of this field we haven't covered yet."
      },
      newOptions: synthesisOptions
    };
  }
};

/**
 * Registry of option enhancement functions for different action types
 */
const optionEnhancers: Record<StrategicActionType, OptionEnhancementFn> = {
  reframe: (options: DialogueOption[]): DialogueOption[] => {
    return options.map(option => ({
      ...option,
      text: option.text + " [Reframed]"
    }));
  },
  
  extrapolate: (options, _) => {
    // No special enhancement needed for extrapolate
    return options;
  },
  
  boast: (options: DialogueOption[]): DialogueOption[] => {
    // The boast handler will be triggered separately, this just adds the visual indicator
    return options.map(option => ({
      ...option,
      text: option.text + " [Challenge Mode]",
      // Add visual styling indicators for the UI
      boastMode: true
    }));
  },
  
  synthesis: (options, _) => {
    // No special enhancement needed for synthesis
    return options;
  }
};

/**
 * Apply a strategic action to the current dialogue
 * 
 * This function is called when a player activates a strategic action during dialogue.
 * It retrieves the current dialogue state, calls the appropriate action handler,
 * and then updates the dialogue state with the result.
 * 
 * @param actionType Type of strategic action to apply
 * @param characterId ID of the character in the dialogue
 * @param stageId ID of the current dialogue stage
 * @returns Promise<boolean> indicating success/failure
 */
export async function applyStrategicAction(
  actionType: StrategicActionType,
  characterId: string,
  stageId: string
): Promise<boolean> {
  try {
    // First, validate that we have the required parameters
    if (!actionType) {
      console.error('Cannot apply action - no action type specified');
      return false;
    }
    
    if (!characterId) {
      console.error('Cannot apply action - no character ID specified');
      return false;
    }
    
    if (!stageId) {
      console.error('Cannot apply action - no stage ID specified');
      return false;
    }
    
    // Log the action application attempt
    console.log(`[ActionIntegration] Applying ${actionType} action for character ${characterId} at stage ${stageId}`);
    
    // Create sanitized context
    const context: ActionContext = {
      characterId,
      stageId,
      actionType,
      currentOptions: [] // Will be populated below if possible
    };
    
    // Try to get the current dialogue state
    try {
      // Get the current dialogue state
      const dialogueState = useDialogueStateMachine.getState();
      
      if (!dialogueState) {
        console.error('Cannot apply action - no dialogue state available');
        return false;
      }
      
      // Get the current options if available
      try {
        const currentOptions = dialogueState.getCurrentOptions() || [];
        context.currentOptions = currentOptions;
        console.log(`[ActionIntegration] Retrieved ${currentOptions.length} current options`);
      } catch (optionsError) {
        console.warn('Could not get current options:', optionsError);
        // Continue without options - the handler will use defaults
      }
    } catch (stateError) {
      console.error('Error accessing dialogue state:', stateError);
      // Continue with empty context
    }
    
    // Get the handler for this action type
    const handler = actionHandlers[actionType];
    if (!handler) {
      console.error(`No handler available for action type ${actionType}`);
      return false;
    }
    
    // Call the handler
    const result = await handler(context);
    
    // Update the dialogue state with the result
    let updateSuccessful = false;
    
    try {
      if (result.stateUpdate) {
        const dialogueState = useDialogueStateMachine.getState();
        
        // Use update method if it exists
        if (typeof dialogueState.update === 'function') {
          dialogueState.update(result.stateUpdate);
          updateSuccessful = true;
        } 
        // If there's no update method, try direct property updates
        else {
          Object.keys(result.stateUpdate).forEach(key => {
            try {
              if (key === 'currentStageId' && result.stateUpdate.currentStageId) {
                // Most common update - navigate to a new stage
                console.log(`[ActionIntegration] Navigating to stage: ${result.stateUpdate.currentStageId}`);
                dialogueState.setCurrentStageId(result.stateUpdate.currentStageId);
                updateSuccessful = true;
              } else {
                // Try generic property update
                (dialogueState as any)[key] = (result.stateUpdate as any)[key];
                updateSuccessful = true;
              }
            } catch (updateError) {
              console.error(`Failed to update ${key}:`, updateError);
            }
          });
        }
      }
      
      if (result.newOptions) {
        const dialogueState = useDialogueStateMachine.getState();
        
        // Use setOptions method if it exists
        if (typeof dialogueState.setOptions === 'function') {
          dialogueState.setOptions(result.newOptions);
          updateSuccessful = true;
        } 
        // Otherwise try to find another way to update options
        else {
          console.warn('No direct setOptions method available - options update may not work');
        }
      }
    } catch (updateError) {
      console.error('Failed to update dialogue state:', updateError);
      return false;
    }
    
    // Log action application
    console.log(`Applied ${actionType} action to dialogue`);
    
    return updateSuccessful;
  } catch (error) {
    console.error(`Error applying action ${actionType}:`, error);
    return false;
  }
}

/**
 * Enhance dialogue options based on active actions
 * 
 * This is a pure function that takes options and returns enhanced versions
 * based on the active strategic action.
 * 
 * @param options Original dialogue options
 * @param activeAction Currently active strategic action
 * @returns Enhanced dialogue options
 */
export function enhanceDialogueOptions(
  options: DialogueOption[],
  activeAction: StrategicActionType | null
): DialogueOption[] {
  if (!activeAction) return options;
  
  // Get the enhancer for this action type
  const enhancer = optionEnhancers[activeAction];
  if (!enhancer) return options;
  
  // Apply the enhancement
  return enhancer(options, activeAction);
}

/**
 * Hook to integrate strategic actions with dialogue flow
 * 
 * This provides a clean API for components to use strategic actions
 * without worrying about the underlying implementation details.
 */
export function useStrategicDialogue(characterId: string, stageId: string) {
  // Apply an action to the current dialogue
  const applyAction = async (actionType: StrategicActionType): Promise<boolean> => {
    return applyStrategicAction(actionType, characterId, stageId);
  };
  
  // Get enhanced options based on active action
  const getEnhancedOptions = (options: DialogueOption[], activeAction: StrategicActionType | null): DialogueOption[] => {
    return enhanceDialogueOptions(options, activeAction);
  };
  
  return {
    applyAction,
    getEnhancedOptions
  };
}

export default {
  applyStrategicAction,
  enhanceDialogueOptions,
  useStrategicDialogue
};