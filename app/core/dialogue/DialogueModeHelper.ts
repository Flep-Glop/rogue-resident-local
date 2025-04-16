import { DialogueMode } from '../../components/dialogue/DialogueContainer';
import { DialogueStage, DialogueOption } from '../../hooks/useDialogueFlow';

/**
 * Helper functions for working with DialogueMode
 */

/**
 * Gets the DialogueMode for a stage based on its content
 * @param stage The DialogueStage to analyze
 * @param defaultMode The default mode to return if no specific mode is detected
 */
export function getDialogueModeForStage(stage: DialogueStage, defaultMode: DialogueMode = DialogueMode.NARRATIVE): DialogueMode {
  // If there's a dialogueMode property on the stage, use it
  if ('dialogueMode' in stage) {
    return (stage as any).dialogueMode;
  }
  
  // Otherwise, infer mode from content
  if (stage.isConclusion) {
    return DialogueMode.REACTION;
  }
  
  if (stage.extension) {
    return DialogueMode.CHALLENGE_INTRO;
  }
  
  if (stage.options && stage.options.length > 0) {
    // If options are present and have an isCriticalPath property, it's a question
    if (stage.options.some(opt => 'isCriticalPath' in opt)) {
      return DialogueMode.QUESTION;
    }
  }
  
  // Default to narrative
  return defaultMode;
}

/**
 * Check if a dialogue stage contains a specific type of extension
 * @param stage The DialogueStage to check
 * @param extensionType The extension type to check for
 */
export function hasExtensionOfType(stage: DialogueStage, extensionType: string): boolean {
  if (!stage.extension) return false;
  return stage.extension.type === extensionType;
}

/**
 * Gets title from stage, if available
 * @param stage The DialogueStage to get title from
 */
export function getStageTitle(stage: DialogueStage): string | undefined {
  return (stage as any).title;
}

/**
 * Types for dialogue with mode support
 * Use these when working with DialogueMode without modifying original interfaces
 */
export type StageWithMode = DialogueStage & {
  dialogueMode?: DialogueMode;
  title?: string;
};

export type ExtensionWithMode = {
  type: string;
  contentId: string;
  interactionRequired?: boolean;
  fallbackText?: string;
  additionalProps?: Record<string, any>;
  conversationText?: string;
  dialogueMode?: DialogueMode;
}; 