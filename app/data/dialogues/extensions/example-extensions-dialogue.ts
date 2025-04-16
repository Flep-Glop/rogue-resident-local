/**
 * Example Extensions Dialogue
 * 
 * This dialogue demonstrates the integration of visual extensions into
 * the conversation format, showcasing different extension types.
 * 
 * This serves as a reference implementation following the Visual Extensions Developer Guide.
 */

import { DialogueStage } from '../../../hooks/useDialogueFlow';
import { ExtensionData } from '../../../components/extensions/VisualExtender';

// Define a custom type that extends DialogueStage with extension property
interface ExtendedDialogueStage extends DialogueStage {
  extension?: ExtensionData;
}

// Create the dialogue content with the extended type
const exampleExtensionsDialogue: ExtendedDialogueStage[] = [
  // Advanced Calculation Stage for path-a1
  {
    id: 'advanced-calculation',
    text: "Today, we'll work through a real clinical scenario to calculate monitor units for a head and neck treatment. I've provided all the data from a real patient case with the values you'll need.",
    contextNote: "Dr. Kapoor brings up a well-organized treatment planning worksheet with clearly marked parameters.",
    equipment: {
      itemId: "workstation",
      alt: "Advanced Planning Workstation",
      description: "Treatment planning workstation showing a head and neck case with clear dose prescription data."
    },
    options: [
      { 
        id: "ready-for-calculation",
        text: "I'm ready to calculate the monitor units.", 
        nextStageId: 'advanced-calculation-interface',
        isCriticalPath: true
      }
    ]
  },
  
  // Add a new stage for the calculation interface that comes after
  {
    id: 'advanced-calculation-interface',
    text: "Patient requires [yellow:2.0 Gy] per fraction to the primary tumor. The calibration factor is [cyan:0.01 Gy/MU], with a TPR of [green:0.85] and scatter factor of [purple:0.95].",
    contextNote: "Dr. Kapoor points to the key data needed for your calculation.",
    extension: {
      type: 'calculation',
      contentId: 'monitor_units_calculation',
      interactionRequired: true,
      conversationText: "Patient requires [yellow:2.0 Gy] per fraction to the primary tumor. The calibration factor is [cyan:0.01 Gy/MU], with a TPR of [green:0.85] and scatter factor of [purple:0.95].",
      additionalProps: {
        prefilledValues: {
          dose: 2.0,
          calibration: 0.01,
          tpr: 0.85,
          scatter: 0.95
        }
      }
    },
    options: [
      { 
        id: "advanced-calculation-complete",
        text: "I've completed the calculation and understand how these factors affect treatment delivery.", 
        nextStageId: 'advanced-calculation-followup',
        isCriticalPath: true
      }
    ]
  },
  
  // Followup to advanced calculation
  {
    id: 'advanced-calculation-followup',
    text: "Good. 248 monitor units is the correct value. I see you can handle basic arithmetic, which is more than I can say for some of my colleagues. This demonstrates how TPR and scatter factors significantly affect the final MU value compared to a basic calculation.",
    contextNote: "Dr. Kapoor makes a small notation in his ever-present evaluation notebook.",
    options: [
      { 
        id: "discuss-clinical-impact",
        text: "How would changes in TPR affect the clinical outcome?", 
        nextStageId: 'intro',
        approach: 'precision',
        insightGain: 10,
        relationshipChange: 2,
        responseText: "An excellent question. If the TPR were underestimated by just 5%, we would deliver approximately 12 more monitor units than necessary, potentially increasing dose to organs at risk. For structures like the parotid glands, this could increase the risk of xerostomia. This is why I insist on weekly QA measurements and accurate beam data. It's not bureaucracy - it's patient safety."
      },
      { 
        id: "ask-about-verification",
        text: "How does this compare to modern TPS algorithms?", 
        nextStageId: 'intro',
        approach: 'humble',
        insightGain: 8,
        relationshipChange: 1,
        responseText: "Treatment planning systems use more sophisticated algorithms that account for heterogeneity, beam hardening, and inverse optimization. However, they build upon these fundamental principles. In fact, many institutions still use these calculations as secondary checks against TPS-generated plans. I still perform these calculations by hand occasionally, just to ensure I haven't lost touch with the fundamentals. You should do the same."
      }
    ]
  },
  
  // Introduction stage
  {
    id: 'intro',
    text: "Let's move on. I've prepared several practical exercises to test different aspects of your knowledge. Try not to disappoint me more than absolutely necessary.",
    contextNote: "Dr. Kapoor arranges several folders on the workbench, each labeled with meticulous precision.",
    equipment: {
      itemId: "workstation",
      alt: "Physics Workstation",
      description: "Medical physics workstation with multiple monitors displaying QA software."
    },
    options: [
      { 
        id: "ready-to-learn",
        text: "I'm looking forward to the hands-on practice.", 
        nextStageId: 'calculation-intro',
        approach: 'humble',
        insightGain: 5,
        relationshipChange: 1,
        responseText: "An excellent attitude. Theoretical knowledge is important, but practical application is where true understanding develops. At least someone here appreciates the value of clinical experience."
      },
      { 
        id: "confident-intro",
        text: "I've been reviewing the concepts. I think I'm prepared.", 
        nextStageId: 'calculation-intro',
        approach: 'confidence',
        insightGain: 3,
        relationshipChange: 0,
        responseText: "Self-study is valuable, but confidence without competence is dangerous in our field. Let's see if your preparation translates to performance."
      }
    ]
  },
  
  // ===== CALCULATION INTERFACE EXAMPLE =====
  {
    id: 'calculation-intro',
    text: "Let's start with a basic calculation scenario. For a recent patient treatment, we need to calculate the required monitor units based on these parameters. This should be trivial for someone with your background.",
    contextNote: "Kapoor hands you a worksheet with treatment parameters, tapping impatiently on the relevant values.",
    options: [
      { 
        id: "ready-for-basic-calculation",
        text: "I'll calculate the monitor units now.", 
        nextStageId: 'calculation-interface',
        isCriticalPath: true
      }
    ]
  },
  
  // Add a new stage for the basic calculation interface
  {
    id: 'calculation-interface',
    text: "Calculate the monitor units required to deliver the prescribed dose to a patient. This is one of the most fundamental calculations in radiation therapy planning.",
    contextNote: "Dr. Kapoor watches as you begin your calculation.",
    extension: {
      type: 'calculation',
      contentId: 'monitor_units_basic',
      interactionRequired: true,
      conversationText: "Calculate the monitor units required to deliver the prescribed dose to a patient. This is one of the most fundamental calculations in radiation therapy planning.",
      additionalProps: {
        prefilledValues: {
          dose: 2.0,
          output_factor: 0.01
        }
      }
    },
    options: [
      { 
        id: "calculation-complete",
        text: "I've completed the calculation.", 
        nextStageId: 'calculation-followup',
        isCriticalPath: true
      }
    ]
  },
  
  // Followup to calculation
  {
    id: 'calculation-followup',
    text: "Good. This type of calculation forms the foundation of treatment planning. The relationship between prescribed dose and monitor units is fundamental to accurate dose delivery. At least you've mastered the basics.",
    contextNote: "Kapoor makes a small notation in his evaluation book with a raised eyebrow.",
    options: [
      { 
        id: "ask-about-manual-calc",
        text: "In practice, would we calculate these values manually or use planning software?", 
        nextStageId: 'anatomical-intro',
        approach: 'precision',
        insightGain: 5,
        relationshipChange: 1,
        responseText: "An insightful question. While modern planning systems perform these calculations automatically, understanding the underlying principles is essential for quality assurance and error detection. I still do manual calculations as independent verification for complex cases. Trust, but verify - that's been my philosophy for thirty years."
      },
      { 
        id: "move-to-next",
        text: "I see. What's our next exercise?", 
        nextStageId: 'anatomical-intro',
        approach: 'humble',
        insightGain: 0,
        relationshipChange: 0,
        responseText: "Let's move on to anatomy identification. Even with the fanciest AI contouring tools, someone with actual knowledge needs to verify the structures."
      }
    ]
  },
  
  // ===== ANATOMICAL IDENTIFICATION EXAMPLE =====
  {
    id: 'anatomical-intro',
    text: "For our next exercise, we'll focus on anatomical identification. When reviewing this head and neck case, identify the critical structures that would influence our treatment planning. Look carefully - I've seen even experienced dosimetrists miss key structures.",
    contextNote: "Kapoor loads a set of CT images showing a head and neck case, fingers drumming impatiently on the desk.",
    extension: {
      type: 'anatomical-identification',
      contentId: 'head_neck_oars',
      interactionRequired: true
    },
    options: [
      { 
        id: "anatomy-complete",
        text: "I've identified the structures.", 
        nextStageId: 'anatomical-followup',
        isCriticalPath: true
      }
    ]
  },
  
  // Followup to anatomical identification
  {
    id: 'anatomical-followup',
    text: "Correct identification of organs at risk is essential for constraint-based planning. Missing critical structures could lead to serious complications for the patient. I once had to counsel a resident who missed contouring the cochlea, resulting in hearing loss. Not a conversation I'd care to repeat.",
    contextNote: "Kapoor points to specific structures on the screen, his movements precise and deliberate.",
    options: [
      { 
        id: "ask-about-constraints",
        text: "How do we determine the appropriate dose constraints for each structure?", 
        nextStageId: 'equipment-intro',
        approach: 'precision',
        insightGain: 5,
        relationshipChange: 1,
        responseText: "Excellent question. Dose constraints are based on extensive clinical data on tissue tolerance. For example, the parotid glands typically have a mean dose constraint of 26 Gy to preserve function. We follow QUANTEC guidelines as a starting point, but I've developed our own institutional constraints based on our outcomes data. Evidence-based practice is the only acceptable approach."
      },
      { 
        id: "move-to-equipment",
        text: "I understand. What's our next task?", 
        nextStageId: 'equipment-intro',
        approach: 'humble',
        insightGain: 0,
        relationshipChange: 0,
        responseText: "Let's move on to equipment identification. You can't troubleshoot what you can't identify."
      }
    ]
  },
  
  // ===== EQUIPMENT IDENTIFICATION EXAMPLE =====
  {
    id: 'equipment-intro',
    text: "For our next exercise, I'd like you to identify the key components of a linear accelerator. Understanding the equipment is fundamental to quality assurance and troubleshooting. I've seen physicists with twenty years of experience who couldn't tell you where the ion chambers are located. Embarrassing.",
    contextNote: "Kapoor brings up a detailed technical diagram of a linear accelerator, adjusting his glasses as he scrutinizes the screen.",
    extension: {
      type: 'equipment-identification',
      contentId: 'linac_components',
      interactionRequired: true
    },
    options: [
      { 
        id: "equipment-complete",
        text: "I've identified the components.", 
        nextStageId: 'equipment-followup',
        isCriticalPath: true
      }
    ]
  },
  
  // Followup to equipment identification
  {
    id: 'equipment-followup',
    text: "Good. A thorough understanding of accelerator components is essential for proper QA and for communicating effectively with service engineers when issues arise. I've lost count of how many service calls could have been avoided if the physicist on duty understood the basic components.",
    contextNote: "Kapoor nods slightly, the closest thing to approval you've seen today.",
    options: [
      { 
        id: "ask-about-qa",
        text: "How often should each component be tested?", 
        nextStageId: 'measurement-intro',
        approach: 'precision',
        insightGain: 5,
        relationshipChange: 1,
        responseText: "That varies by component. TG-142 provides comprehensive guidelines, but I find them to be the bare minimum. Dosimetric output is checked daily, beam steering monthly, and electron gun performance annually. I've developed a more rigorous schedule based on our machine's performance history. The frequency is determined by the stability of the component and its impact on treatment delivery. In this department, we exceed the guidelines, not merely meet them."
      },
      { 
        id: "move-to-measurement",
        text: "I see. What's our next exercise?", 
        nextStageId: 'measurement-intro',
        approach: 'humble',
        insightGain: 0,
        relationshipChange: 0,
        responseText: "Let's move on to measurement interpretation. Numbers without context are just digits."
      }
    ]
  },
  
  // ===== MEASUREMENT READING EXAMPLE =====
  {
    id: 'measurement-intro',
    text: "Now, let's practice reading measurements. During this morning's QA, we collected these electrometer readings. I'd like you to interpret them and determine if they're within acceptable limits. A machine within tolerance doesn't mean the physicist can take the day off.",
    contextNote: "Kapoor shows you the measurement devices and recorded values, his posture impeccably straight as always.",
    extension: {
      type: 'measurement-reading',
      contentId: 'electrometer_reading',
      interactionRequired: true
    },
    options: [
      { 
        id: "measurement-complete",
        text: "I've analyzed the measurements.", 
        nextStageId: 'measurement-followup',
        isCriticalPath: true
      }
    ]
  },
  
  // Followup to measurement reading
  {
    id: 'measurement-followup',
    text: "Good. Accurate interpretation of measurement data is one of the most frequent tasks you'll perform. Small errors in reading or calculation can compound into significant clinical deviations. I once caught a 2% error that would have affected every patient treated that day. Vigilance is non-negotiable.",
    contextNote: "Kapoor makes another note in his evaluation book, his handwriting perfectly uniform.",
    options: [
      { 
        id: "ask-about-uncertainties",
        text: "How do we account for measurement uncertainties in our protocols?", 
        nextStageId: 'error-intro',
        approach: 'precision',
        insightGain: 5,
        relationshipChange: 1,
        responseText: "An important consideration. We track Type A and Type B uncertainties following TG-51 and apply a combined uncertainty budget. Our tolerances incorporate these uncertainties. For example, our ±2% output tolerance includes both measurement uncertainty and actual output fluctuation. We use a coverage factor of k=2 for all clinical measurements, giving us approximately 95% confidence. Uncertainty analysis isn't just academic - it's essential for clinical decision-making."
      },
      { 
        id: "move-to-error",
        text: "That makes sense. What's next?", 
        nextStageId: 'error-intro',
        approach: 'humble',
        insightGain: 0,
        relationshipChange: 0,
        responseText: "Let's move on to error identification. Mistakes in this field aren't just problematic - they're potentially catastrophic."
      }
    ]
  },
  
  // ===== ERROR IDENTIFICATION EXAMPLE =====
  {
    id: 'error-intro',
    text: "For our final exercise, I'd like you to identify potential errors in this treatment setup. Error identification is crucial for patient safety. One missed error can undo months of careful planning. I expect meticulous attention to detail here.",
    contextNote: "Kapoor displays images of a patient setup with several deliberate errors, his expression utterly serious.",
    extension: {
      type: 'error-identification',
      contentId: 'treatment_setup_errors',
      interactionRequired: true
    },
    options: [
      { 
        id: "error-complete",
        text: "I've identified the errors.", 
        nextStageId: 'conclusion',
        isCriticalPath: true
      }
    ]
  },
  
  // Conclusion
  {
    id: 'conclusion',
    text: "You've completed all the exercises. These practical skills—calculations, anatomical identification, equipment knowledge, measurement interpretation, and error detection—form the foundation of clinical medical physics practice. Continue refining these skills through regular practice. Your performance was... adequate. There's room for improvement, but I've seen worse.",
    contextNote: "Kapoor collects the exercise materials with methodical precision, placing them in color-coded folders.",
    isConclusion: true,
    options: [
      { 
        id: "thank-mentor",
        text: "Thank you for the comprehensive exercises. This practical application really helps solidify the concepts.", 
        nextStageId: 'end',
        approach: 'humble',
        insightGain: 5,
        relationshipChange: 1,
        responseText: "You're welcome. The integration of theory and practice is essential in our field. I'm... not entirely disappointed with your progress. We'll continue with more advanced applications in our next session. Be prepared - I don't repeat myself, and I expect you to review your notes before we meet again."
      },
      { 
        id: "confident-conclusion",
        text: "I found some exercises challenging, but I think I performed well overall.", 
        nextStageId: 'end',
        approach: 'confidence',
        insightGain: 3,
        relationshipChange: 0,
        responseText: "Self-assessment is valuable only when accurate. Identifying where you need improvement is as important as recognizing your strengths. Your confidence exceeds your competence in several areas. We'll focus on those gaps in our future sessions. Come prepared next time."
      }
    ]
  },
  
  // End stage
  {
    id: 'end',
    text: "That concludes our session for today. Review your notes and prepare for our next meeting. I don't tolerate unpreparedness - it wastes my time, and my time is valuable.",
    contextNote: "Kapoor returns to his workstation, already focused on the next task, his posture never relaxing.",
    isConclusion: true,
    options: []
  }
];

// Export with type assertion to match expected DialogueStage[] type
export default exampleExtensionsDialogue as DialogueStage[];