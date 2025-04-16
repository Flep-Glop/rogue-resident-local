/**
 * Example dialogue that demonstrates different dialogue modes
 * Each stage uses a different mode to showcase visual styling differences
 */

import { DialogueMode } from '../../../components/dialogue/DialogueContainer';
import { DialogueStage } from '../../../hooks/useDialogueFlow';

// Create typed dialogue stages
// Use type assertion to add custom properties
const dialogueModeExample = [
  {
    id: 'intro',
    text: "Welcome to the radiation oncology department. Today, we'll be reviewing different types of interactions and communications that happen during our daily workflows.",
    contextNote: "Dr. Kapoor greets you in the control room, gesturing to the displays around you.",
    title: 'Narrative Introduction',
    dialogueMode: DialogueMode.NARRATIVE,
    options: [
      {
        id: 'intro_opt1',
        text: "I'm ready to learn about the different communication modes.",
        nextStageId: 'instruction_mode'
      }
    ]
  },
  {
    id: 'instruction_mode',
    text: "When giving procedural instructions, we use clear, step-by-step guidance. For example: 1) Verify patient identity, 2) Check treatment plan parameters, 3) Confirm positioning matches reference images.",
    contextNote: "Dr. Kapoor demonstrates the process while explaining each step methodically.",
    title: 'Procedural Instructions',
    dialogueMode: DialogueMode.INSTRUCTION,
    options: [
      {
        id: 'instruction_opt1',
        text: "What about when we need to discuss critical information?",
        nextStageId: 'critical_mode'
      }
    ]
  },
  {
    id: 'critical_mode',
    text: "For critical safety information, we use an unmistakable format. ALERT: Never proceed with treatment if the patient position deviates by more than 3mm from the reference scan. Always verify MU values match the prescription exactly.",
    contextNote: "Dr. Kapoor's tone becomes notably serious and focused.",
    title: 'Critical Information',
    dialogueMode: DialogueMode.CRITICAL,
    options: [
      {
        id: 'critical_opt1',
        text: "How do we present challenges or test knowledge?",
        nextStageId: 'question_mode'
      }
    ]
  },
  {
    id: 'question_mode',
    text: "When testing understanding, we present clear questions with distinct options. For instance: What is the primary concern when the MLC positions show discrepancies during QA?",
    contextNote: "Dr. Kapoor looks at you expectantly, waiting for your response.",
    title: 'Knowledge Check',
    dialogueMode: DialogueMode.QUESTION,
    options: [
      {
        id: 'question_opt1',
        text: "Potential dose delivery errors to the target volume",
        isCriticalPath: true,
        nextStageId: 'reaction_mode_positive',
        insightGain: 15
      },
      {
        id: 'question_opt2',
        text: "Machine malfunction and downtime",
        nextStageId: 'reaction_mode_negative'
      },
      {
        id: 'question_opt3',
        text: "Extra time needed for recalibration",
        nextStageId: 'reaction_mode_negative'
      }
    ]
  },
  {
    id: 'reaction_mode_positive',
    text: "Excellent observation! MLC position discrepancies directly impact dose delivery accuracy. When the leaves aren't positioned correctly, the radiation field shape is compromised, potentially underdosing the tumor or overdosing healthy tissue.",
    contextNote: "Dr. Kapoor nods approvingly, clearly pleased with your understanding.",
    title: 'Positive Feedback',
    dialogueMode: DialogueMode.REACTION,
    options: [
      {
        id: 'reaction_pos_opt1',
        text: "Can you introduce me to a practical challenge?",
        nextStageId: 'challenge_mode'
      }
    ]
  },
  {
    id: 'reaction_mode_negative',
    text: "That's a concern, but not the primary one. While important, the most critical issue with MLC position discrepancies is potential dose delivery errors. This directly impacts treatment efficacy and patient safety.",
    contextNote: "Dr. Kapoor shakes his head slightly but maintains a patient expression.",
    title: 'Corrective Feedback',
    dialogueMode: DialogueMode.REACTION,
    options: [
      {
        id: 'reaction_neg_opt1',
        text: "I understand now. Can we look at a practical challenge?",
        nextStageId: 'challenge_mode'
      }
    ]
  },
  {
    id: 'challenge_mode',
    text: "Now let's apply this knowledge to a practical situation. I'll present you with a QA report showing MLC position data. Your task will be to identify whether the positions are within tolerance and what action should be taken.",
    contextNote: "Dr. Kapoor pulls up a detailed QA report on the screen.",
    title: 'Practical Challenge',
    dialogueMode: DialogueMode.CHALLENGE_INTRO,
    extension: {
      type: 'equipment-identification',
      contentId: 'mlc-position-qa',
      dialogueMode: DialogueMode.CHALLENGE_INTRO
    },
    options: [
      {
        id: 'challenge_opt1',
        text: "I've completed the challenge.",
        nextStageId: 'conclusion'
      }
    ]
  },
  {
    id: 'conclusion',
    text: "Excellent work today. You've seen how we use different communication styles for various situations in radiation oncology. Clear communication patterns help ensure patient safety and treatment efficacy.",
    contextNote: "Dr. Kapoor seems satisfied with your progress, closing the displays.",
    isConclusion: true,
    title: 'Session Conclusion',
    dialogueMode: DialogueMode.NARRATIVE,
    options: [
      {
        id: 'conclusion_opt1',
        text: "Thank you for the instruction, Dr. Kapoor.",
        nextStageId: 'end'
      }
    ]
  }
] as unknown as DialogueStage[];

export default dialogueModeExample; 