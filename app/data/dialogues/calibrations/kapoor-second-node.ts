/**
 * Kapoor Second Node Dialogue
 * 
 * Follow-up session with Dr. Kapoor that builds upon concepts introduced in the first node
 * and introduces more advanced medical physics topics.
 */

import { DialogueStage } from '../../../hooks/useDialogueFlow';

const kapoorSecondNodeDialogue: DialogueStage[] = [
  // Core Dialogue Stages 
  {
    id: 'intro',
    text: "Good to see you again. Today we'll be reviewing quality assurance procedures for IMRT treatment planning. Let's see if you've been studying since our last meeting.",
    contextNote: "Kapoor pulls up a complex dose distribution map on the treatment planning system.",
    equipment: {
      itemId: "treatment-planning",
      alt: "Treatment Planning System",
      description: "Eclipse TPS with a head and neck IMRT plan displayed."
    },
    isMandatory: true,
    options: [
      { 
        id: "prepared-intro",
        text: "I've been reviewing AAPM TG-119 on IMRT commissioning.", 
        nextStageId: 'qa-protocols',
        approach: 'precision',
        insightGain: 10,
        relationshipChange: 1,
        responseText: "Excellent. That's precisely the protocol we'll be discussing. Your initiative is noted."
      },
      { 
        id: "humble-intro",
        text: "I'm looking forward to building on what we covered in our last session.", 
        nextStageId: 'qa-protocols',
        approach: 'humble',
        insightGain: 5,
        relationshipChange: 0,
        responseText: "Good. Continuous learning is essential in our field. Let's see how well you can apply what you've learned."
      }
    ]
  },
  
  // Stage 1: QA Protocols Discussion
  {
    id: 'qa-protocols',
    text: "For this head and neck IMRT plan, what verification measurements would you recommend before treatment delivery?",
    contextNote: "The screen shows a complex plan with multiple targets and critical structures.",
    equipment: {
      itemId: 'dose-distribution',
      alt: "Dose Distribution",
      description: "Colorwashed isodose distribution showing multiple target volumes and adjacent critical structures."
    },
    options: [
      { 
        id: "comprehensive-qa",
        text: "Ion chamber point dose measurements at high-dose, low-gradient regions plus 2D array measurements with gamma analysis using 3%/3mm criteria.", 
        nextStageId: 'gamma-criteria',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'imrt_qa_protocols',
          domainId: 'quality-assurance',
          amount: 15
        },
        isCriticalPath: true,
        responseText: "A thorough approach. The combination of point dose and planar measurements provides complementary verification that addresses both absolute dose accuracy and relative distribution."
      },
      { 
        id: "minimal-qa",
        text: "A single film measurement at isocenter depth should be sufficient.", 
        nextStageId: 'gamma-criteria',
        approach: 'confidence',
        insightGain: 0,
        relationshipChange: -1,
        knowledgeGain: { 
          conceptId: 'imrt_qa_protocols',
          domainId: 'quality-assurance',
          amount: 3
        },
        responseText: "That would be significantly inadequate. Film alone doesn't provide absolute dose verification, and a single plane measurement misses volumetric complexities. IMRT QA requires multiple verification methods."
      }
    ]
  },
  
  // Additional stages would continue with more complex topics...
  // Example of a more advanced stage:
  {
    id: 'gamma-criteria',
    text: "When analyzing the gamma results for IMRT QA, what passing rate and criteria would you consider acceptable for this complex head and neck case?",
    contextNote: "Kapoor pulls up the department's QA protocol documentation.",
    options: [
      { 
        id: "strict-criteria",
        text: "At least 95% passing rate with 3%/3mm criteria, with closer inspection of any failing points near critical structures.", 
        nextStageId: 'conclusion',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'gamma_criteria',
          domainId: 'quality-assurance',
          amount: 15
        },
        isCriticalPath: true,
        responseText: "Well reasoned. The quantitative threshold is appropriate, but your qualitative assessment of failing points demonstrates clinical awareness. That's the type of judgment that distinguishes excellent medical physicists."
      },
      { 
        id: "relaxed-criteria",
        text: "A 90% passing rate with 5%/5mm criteria should be adequate for most cases.", 
        nextStageId: 'conclusion',
        approach: 'confidence',
        insightGain: 5,
        relationshipChange: -1,
        knowledgeGain: { 
          conceptId: 'gamma_criteria',
          domainId: 'quality-assurance',
          amount: 5
        },
        responseText: "Those criteria are too relaxed for a complex head and neck case with critical structures like the spinal cord and parotids in close proximity to high dose regions. We require 3%/3mm with 95% passing for such cases."
      }
    ]
  },
  
  // Conclusion Stage
  {
    id: 'conclusion',
    type: 'conclusion',
    text: "Your understanding of IMRT QA procedures is developing well. Remember that quality assurance is about more than following protocols—it requires clinical judgment and understanding the implications of any discrepancies. Continue to build these skills throughout your residency.",
    isConclusion: true
  }
];

export default kapoorSecondNodeDialogue; 