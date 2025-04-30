// app/data/dialogues/calibrations/kapoor-calibration.ts
/**
 * Kapoor Calibration Dialogue
 * 
 * First meeting with Dr. Kapoor that introduces the player to basic 
 * medical physics concepts and core gameplay mechanics.
 */

import { DialogueStage } from '../../../hooks/useDialogueFlow';

const kapoorCalibrationDialogue: DialogueStage[] = [
  // Introduction
  {
    id: 'intro',
    text: "Good morning. I'm Dr. Kapoor, senior medical physicist. Today we're calibrating this machine to ensure patient safety. As a new resident, watching proper procedures is essential.",
    contextNote: "Dr. Kapoor adjusts equipment with methodical precision, barely glancing up as you enter the treatment room.",
    equipment: {
      itemId: "linac",
      alt: "Linear Accelerator",
      description: "An impressive radiation therapy machine used for cancer treatment."
    },
    isMandatory: true,
    tangentStageId: 'intro-tangent',
    options: [
      { 
        id: "humble-intro",
        text: "I'm looking forward to learning from you, Dr. Kapoor.", 
        nextStageId: 'basics',
        approach: 'humble',
        insightGain: 5,
        relationshipChange: 1,
        responseText: "A positive attitude toward learning is the foundation of good practice. Being a medical physicist requires constant education."
      },
      { 
        id: "confident-intro",
        text: "I've observed calibrations before during my internship.", 
        nextStageId: 'basics',
        approach: 'confidence',
        insightGain: 0,
        relationshipChange: -1,
        responseText: "Each hospital has its own protocols. I would advise against assuming familiarity too quickly. Observation and careful attention to detail are critical here."
      }
    ]
  },
  
  // Tangent option (world-building)
  {
    id: 'intro-tangent',
    text: "Actually, before we begin, I'm curious - what drew you to medical physics? It's not a field many people know about.",
    contextNote: "Dr. Kapoor sets down a tool and turns to face you directly, showing rare personal interest.",
    equipment: {
      itemId: "linac",
      alt: "Linear Accelerator",
      description: "An impressive radiation therapy machine used for cancer treatment."
    },
    options: [
      { 
        id: "tangent-helping-patients",
        text: "I wanted a career that combines physics with helping cancer patients.", 
        nextStageId: 'basics',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        responseText: "A noble motivation. Our work ensures patients receive precise treatments safely. Though we rarely see patients directly, our impact on their care is significant. Let's get you started with the basics."
      },
      { 
        id: "tangent-technical",
        text: "I'm fascinated by the technology - these machines are engineering marvels.", 
        nextStageId: 'basics',
        approach: 'creative',
        insightGain: 15,
        relationshipChange: 1,
        responseText: "Indeed they are. Linear accelerators represent remarkable technology, accelerating electrons to produce therapeutic radiation. Of course, they require regular calibration to maintain accuracy. Let's proceed."
      }
    ]
  },
  
  // Basic concepts introduction
  {
    id: 'basics',
    text: "Let's cover basics. This is a measurement chamber used to verify radiation output. Why do you think we place it inside this plastic material?",
    contextNote: "Dr. Kapoor points to a small cylindrical device positioned in a clear plastic block.",
    equipment: {
      itemId: 'farmer-chamber',
      alt: "Measurement Chamber",
      description: "A small cylindrical device used to measure radiation."
    },
    isMandatory: true,
    tangentStageId: 'basics-tangent',
    boastStageId: 'basics-boast',
    options: [
      { 
        id: "correct-buildup",
        text: "To simulate how radiation behaves in human tissue?", 
        nextStageId: 'correction-factors',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'electron_equilibrium_understood',
          domainId: 'radiation-physics',
          amount: 15
        },
        discoverConcepts: ['output-calibration', 'dosimetry'],
        isCriticalPath: true,
        responseText: "Correct. We need to simulate human tissue to properly measure treatment doses. This plastic has similar properties to human tissue when interacting with radiation. You've just discovered key concepts in our knowledge system."
      },
      { 
        id: "engaged-learner",
        text: "I'm not entirely sure. Could you explain the purpose?",
        nextStageId: 'correction-factors',
        approach: 'humble',
        insightGain: 10,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'electron_equilibrium_understood',
          domainId: 'radiation-physics',
          amount: 10
        },
        responseText: "A fair question. The plastic mimics human tissue, allowing us to measure what patients would receive. Radiation behaves differently inside the body compared to air, so we need this material to get accurate readings."
      },
      { 
        id: "partial-buildup",
        text: "To protect the measurement device from damage?", 
        nextStageId: 'correction-factors',
        approach: 'confidence',
        insightGain: 5,
        relationshipChange: 0,
        knowledgeGain: { 
          conceptId: 'electron_equilibrium_understood',
          domainId: 'radiation-physics',
          amount: 5
        },
        responseText: "Not quite. While it does provide physical protection, its primary purpose is to simulate human tissue. We need to measure radiation as it would behave inside a patient's body, not in air."
      }
    ]
  },
  
  // Boast challenge option
  {
    id: 'basics-boast',
    text: "Since you seem confident, can you explain more specifically how radiation interacts differently with the chamber in air versus in this plastic material?",
    contextNote: "Dr. Kapoor raises an eyebrow, watching to see if your confidence is matched with knowledge.",
    equipment: {
      itemId: 'farmer-chamber',
      alt: "Measurement Chamber",
      description: "A small cylindrical device used to measure radiation."
    },
    options: [
      { 
        id: "boast-advanced-correct",
        text: "In plastic, more secondary electrons are produced, providing a measurement closer to what happens in human tissue. In air alone, we'd get inaccurate readings.", 
        nextStageId: 'correction-factors',
        approach: 'precision',
        insightGain: 30,
        relationshipChange: 2,
        knowledgeGain: { 
          conceptId: 'electron_equilibrium_understood',
          domainId: 'radiation-physics',
          amount: 25
        },
        discoverConcepts: ['output-calibration', 'dosimetry', 'chamber-perturbation'],
        isCriticalPath: true,
        responseText: "Very impressive! The interaction between radiation and matter does indeed produce secondary electrons that contribute to the dose. Your understanding of this fundamental concept will serve you well in this field."
      },
      { 
        id: "boast-partial-correct",
        text: "Radiation penetrates differently through plastic than air, giving us more clinically relevant measurements.", 
        nextStageId: 'correction-factors',
        approach: 'precision',
        insightGain: 20,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'electron_equilibrium_understood',
          domainId: 'radiation-physics',
          amount: 15
        },
        responseText: "That's generally correct. The radiation's behavior in plastic better mimics what happens in human tissue, though the specific electron interactions are what make the biggest difference in our measurements."
      },
      { 
        id: "boast-incorrect",
        text: "The plastic filters out harmful radiation components that could damage the sensitive equipment.", 
        nextStageId: 'correction-factors',
        approach: 'confidence',
        insightGain: 0,
        relationshipChange: -1,
        momentumEffect: 'reset',
        knowledgeGain: { 
          conceptId: 'electron_equilibrium_understood',
          domainId: 'radiation-physics',
          amount: 0
        },
        responseText: "Incorrect. The plastic isn't meant to filter radiation. Its purpose is to simulate human tissue by creating similar radiation interactions. The equipment is designed to withstand radiation exposure."
      }
    ]
  },
  
  // Tangent option (educational)
  {
    id: 'basics-tangent',
    text: "Actually, it's fascinating how radiation interacts with different materials. Did you know the same principles apply when radiation enters the human body during treatment?",
    contextNote: "Dr. Kapoor's eyes light up with academic interest, clearly passionate about the physics involved.",
    equipment: {
      itemId: 'farmer-chamber',
      alt: "Measurement Chamber",
      description: "A small cylindrical device used to measure radiation."
    },
    options: [
      { 
        id: "tangent-patient-question",
        text: "How do doctors determine the right amount of radiation for each patient?", 
        nextStageId: 'correction-factors',
        approach: 'precision',
        insightGain: 20,
        relationshipChange: 2,
        knowledgeGain: { 
          conceptId: 'kerma_dose_relationship',
          domainId: 'radiation-physics',
          amount: 15
        },
        responseText: "Excellent question. Radiation oncologists prescribe doses based on cancer type and location, then medical physicists like us create treatment plans using sophisticated software. Our calibration work ensures the machine delivers exactly what's prescribed. Let's continue with our procedure."
      },
      { 
        id: "tangent-safety-question",
        text: "How do we ensure patients are safe during these treatments?", 
        nextStageId: 'correction-factors',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'energy_transfer_mechanisms',
          domainId: 'radiation-physics',
          amount: 10
        },
        responseText: "Safety is our highest priority. We conduct daily, monthly, and annual checks of all equipment. Every treatment plan undergoes peer review, and therapists verify patient positioning before each session. The calibration we're doing today is part of that safety system."
      }
    ]
  },
  
  // Environmental factors
  {
    id: 'correction-factors',
    text: "Now, when taking measurements, we need to account for room conditions. Look at that barometer - what do you think might affect our readings today?",
    contextNote: "Dr. Kapoor points to a weather instrument showing pressure significantly lower than yesterday.",
    equipment: {
      itemId: 'electrometer',
      alt: "Measurement Display",
      description: "A digital display showing radiation measurements."
    },
    tangentStageId: 'correction-factors-tangent',
    boastStageId: 'correction-factors-boast',
    options: [
      { 
        id: "correct-ptp",
        text: "The drop in air pressure could affect the readings.", 
        nextStageId: 'measurement-tolerance',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'ptp_correction_understood',
          domainId: 'radiation-physics',
          amount: 15
        },
        triggersBackstory: true,
        isCriticalPath: true,
        responseText: "Exactly right. Air pressure affects our measurements, so we apply a correction factor. Today's significant pressure drop would cause errors if we didn't account for it. This is why we always check atmospheric conditions."
      },
      { 
        id: "incorrect-kq",
        text: "Maybe the radiation beam energy has changed?", 
        nextStageId: 'measurement-tolerance',
        approach: 'precision',
        insightGain: 5,
        relationshipChange: 0,
        knowledgeGain: { 
          conceptId: 'ptp_correction_understood',
          domainId: 'radiation-physics',
          amount: 5
        },
        responseText: "The beam energy is stable and calibrated separately. What's significant today is the barometric pressure change. Air density affects our ionization measurements, so we must apply a correction factor."
      },
      { 
        id: "incorrect-polarity",
        text: "The electronic equipment might be affected by humidity.", 
        nextStageId: 'measurement-tolerance',
        approach: 'confidence',
        insightGain: 0,
        relationshipChange: -1,
        responseText: "While humidity can affect electronics, our immediate concern is the significant air pressure change. This directly impacts the density of air in our measurement chamber, requiring mathematical correction."
      }
    ]
  },
  
  // Boast challenge option
  {
    id: 'correction-factors-boast',
    text: "For someone confident in their knowledge - can you explain more specifically why air pressure affects our radiation measurements?",
    contextNote: "Dr. Kapoor's expression is evaluative, testing your deeper understanding.",
    equipment: {
      itemId: 'electrometer',
      alt: "Measurement Display",
      description: "A digital display showing radiation measurements."
    },
    options: [
      { 
        id: "boast-correction-expert",
        text: "The chamber measures ionization in air. Lower pressure means fewer air molecules to ionize, so we'd get artificially low readings without correction.", 
        nextStageId: 'measurement-tolerance',
        approach: 'precision',
        insightGain: 30,
        relationshipChange: 2,
        knowledgeGain: { 
          conceptId: 'dosimetry_correction_factors',
          domainId: 'dosimetry',
          amount: 25
        },
        discoverConcepts: ['correction-factors', 'absolute-dosimetry'],
        isCriticalPath: true,
        responseText: "Excellent explanation! The ionization chamber's response depends on air density, which changes with pressure and temperature. Your understanding of this fundamental principle demonstrates good potential."
      },
      { 
        id: "boast-correction-partial",
        text: "Air pressure changes how the radiation interacts with the chamber, so we need to apply a mathematical correction.", 
        nextStageId: 'measurement-tolerance',
        approach: 'precision',
        insightGain: 20,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'dosimetry_correction_factors',
          domainId: 'dosimetry',
          amount: 15
        },
        responseText: "That's generally correct, though the specific mechanism is that lower pressure means fewer air molecules in the chamber to be ionized. We apply a mathematical formula that accounts for deviations from standard pressure."
      },
      { 
        id: "boast-correction-incorrect",
        text: "Air pressure affects the radiation beam's energy as it travels through the air to the chamber.", 
        nextStageId: 'measurement-tolerance',
        approach: 'confidence',
        insightGain: 0,
        relationshipChange: -1,
        momentumEffect: 'reset',
        knowledgeGain: { 
          conceptId: 'dosimetry_correction_factors',
          domainId: 'dosimetry',
          amount: 0
        },
        responseText: "That's incorrect. Air pressure doesn't significantly affect the beam energy. Rather, it changes the density of air within the measurement chamber itself, affecting how many molecules are available to be ionized by the radiation."
      }
    ]
  },
  
  // Tangent option (personal story)
  {
    id: 'correction-factors-tangent',
    text: "You know, this reminds me of something from my early career. Would you like to hear a brief story about why I'm so careful about these corrections?",
    contextNote: "Dr. Kapoor's typically stern expression softens slightly with recollection.",
    equipment: {
      itemId: 'electrometer',
      alt: "Measurement Display",
      description: "A digital display showing radiation measurements."
    },
    options: [
      { 
        id: "tangent-yes-story",
        text: "I'd be interested to hear about your experience, Dr. Kapoor.", 
        nextStageId: 'backstory-ptp',
        approach: 'precision',
        insightGain: 20,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'dosimetry_protocols',
          domainId: 'radiation-physics',
          amount: 15
        },
        responseText: "Very well. It's a valuable lesson about attention to detail in our field."
      },
      { 
        id: "tangent-focus-task",
        text: "Perhaps we should focus on completing the calibration first?", 
        nextStageId: 'measurement-tolerance',
        approach: 'humble',
        insightGain: 15,
        relationshipChange: -1,
        knowledgeGain: { 
          conceptId: 'dosimetry_protocols',
          domainId: 'radiation-physics',
          amount: 10
        },
        responseText: "An efficient approach, though sometimes historical context provides valuable insight. Let's proceed with the measurements."
      }
    ]
  },
  
  // Backstory (personal connection)
  {
    id: 'backstory-ptp',
    type: 'backstory',
    text: "Early in my career, I failed to apply the pressure correction after a weather front moved through. The output was off by 3% - potentially significant for patient treatments. Since then, I've developed a verification protocol that's been adopted by several hospitals. In this profession, small details matter greatly.",
    nextStageId: 'measurement-tolerance'
  },
  
  // Quality standards
  {
    id: 'measurement-tolerance',
    text: "Our measurements show the machine is delivering 101.2% of the expected radiation dose. What should we do about this?",
    contextNote: "Dr. Kapoor shows you the results with three consistent readings all showing similar values.",
    equipment: {
      itemId: 'measurement-log',
      alt: "Measurement Results",
      description: "Digital display showing 101.2% output readings."
    },
    tangentStageId: 'tolerance-tangent',
    options: [
      { 
        id: "correct-tolerance",
        text: "Document the finding, but no immediate action is needed since it's within acceptable limits.", 
        nextStageId: 'clinical-significance',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'output_calibration_tolerance',
          domainId: 'radiation-physics',
          amount: 15
        },
        isCriticalPath: true,
        responseText: "Correct. We allow variations up to 2% without adjustment. Documenting the trend is important, but this reading is within our safety standards."
      },
      { 
        id: "overly-cautious",
        text: "We should recalibrate the machine to get it closer to exactly 100%.", 
        nextStageId: 'clinical-significance',
        approach: 'confidence',
        insightGain: 0,
        relationshipChange: -1,
        responseText: "That would be unnecessary and might introduce more variability. Our protocols allow up to 2% variation. Attempting perfect calibration too frequently can create inconsistency over time."
      },
      { 
        id: "incorrect-follow-up",
        text: "Should we try measuring again with different equipment to confirm?", 
        nextStageId: 'clinical-significance',
        approach: 'question',
        insightGain: 5,
        relationshipChange: 0,
        responseText: "While verification is generally good practice, it's not required for a reading well within our 2% tolerance. The consistency of our three measurements already provides confidence in the result."
      }
    ]
  },
  
  // Tangent option (discussion)
  {
    id: 'tolerance-tangent',
    text: "Actually, this raises an interesting question: should our tolerances be based on machine capabilities or on what affects patient outcomes?",
    contextNote: "Dr. Kapoor seems genuinely interested in your opinion on this professional topic.",
    equipment: {
      itemId: 'measurement-log',
      alt: "Measurement Results",
      description: "Digital display showing 101.2% output readings."
    },
    options: [
      { 
        id: "tangent-clinical-focus",
        text: "Patient outcomes should drive our standards - we should focus on what difference patients would actually notice.", 
        nextStageId: 'clinical-significance',
        approach: 'confidence',
        insightGain: 20,
        relationshipChange: 2,
        knowledgeGain: { 
          conceptId: 'clinical_significance_thresholds',
          domainId: 'radiation-physics',
          amount: 15
        },
        responseText: "An excellent perspective. Historically, many of our tolerances were based simply on what machines could achieve rather than clinical outcomes. As technology improves, we should reconsider what standards actually matter for patients."
      },
      { 
        id: "tangent-balanced-approach",
        text: "We need a balance - standards should be achievable while ensuring patient safety.", 
        nextStageId: 'clinical-significance',
        approach: 'humble',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'clinical_significance_thresholds',
          domainId: 'radiation-physics',
          amount: 10
        },
        responseText: "A practical viewpoint. Finding that balance is exactly what our professional protocols attempt to do. We must consider both technical limitations and clinical needs when setting standards."
      }
    ]
  },
  
  // Clinical relevance
  {
    id: 'clinical-significance',
    text: "One last question: If a doctor asked you whether this 1.2% variation matters for their patients, what would you tell them?",
    contextNote: "Dr. Kapoor watches your response carefully, assessing your understanding of the clinical context.",
    options: [
      { 
        id: "correct-clinical",
        text: "It's not clinically significant. Radiation therapy has inherent uncertainties much larger than 1.2%.", 
        nextStageId: 'calibration-frequency',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'clinical_dose_significance',
          domainId: 'radiation-physics',
          amount: 15
        },
        isCriticalPath: true,
        responseText: "Excellent answer. Studies show that variations under 5% generally have no detectable impact on treatment outcomes. This small deviation is well within safety margins."
      },
      { 
        id: "partially-correct",
        text: "It's within tolerance, but we'll continue monitoring it closely.", 
        nextStageId: 'calibration-frequency',
        approach: 'humble',
        insightGain: 5,
        relationshipChange: 0,
        knowledgeGain: { 
          conceptId: 'clinical_dose_significance',
          domainId: 'radiation-physics',
          amount: 5
        },
        responseText: "While your caution is noted, you could be more definitive with doctors. This 1.2% deviation has no clinical significance whatsoever. We monitor all machines equally according to schedule, not based on minor variations within tolerance."
      },
      { 
        id: "incorrect-clinical",
        text: "Any deviation could potentially affect sensitive patients, so they should know about it.", 
        nextStageId: 'calibration-frequency',
        approach: 'confidence',
        insightGain: 0,
        relationshipChange: -1,
        responseText: "That would unnecessarily alarm our clinical colleagues and potentially patients. Our quality assurance program accounts for these acceptable variations. A 1.2% deviation is clinically meaningless."
      }
    ]
  },
  
  // Maintenance schedule
  {
    id: 'calibration-frequency',
    text: "How often do you think we should perform these detailed calibration checks?",
    contextNote: "Dr. Kapoor seems to be testing your practical understanding of clinical operations.",
    options: [
      { 
        id: "quarterly-calibration",
        text: "Quarterly detailed checks with brief daily and monthly verifications seems balanced.", 
        nextStageId: 'pre-journal-presentation',
        approach: 'precision',
        insightGain: 15,
        relationshipChange: 1,
        knowledgeGain: { 
          conceptId: 'calibration_frequency',
          domainId: 'quality-assurance',
          amount: 15
        },
        responseText: "That's precisely our protocol. Quarterly checks are frequent enough to catch issues early, while daily and monthly quick-checks provide ongoing verification without overwhelming staff with constant detailed work."
      },
      { 
        id: "annual-calibration",
        text: "Annual detailed calibrations with weekly quick-checks should be sufficient.", 
        nextStageId: 'pre-journal-presentation',
        approach: 'confidence',
        insightGain: 5,
        relationshipChange: -1,
        knowledgeGain: { 
          conceptId: 'calibration_frequency',
          domainId: 'quality-assurance',
          amount: 5
        },
        responseText: "That would be insufficient. While annual calibration against primary standards is standard, we need quarterly cross-calibrations with monthly verifications to ensure ongoing accuracy. Patient safety demands more frequent checks."
      },
      { 
        id: "monthly-calibration",
        text: "Monthly detailed calibrations would maximize accuracy, though I understand that's labor-intensive.", 
        nextStageId: 'pre-journal-presentation',
        approach: 'humble',
        insightGain: 10,
        relationshipChange: 0,
        knowledgeGain: { 
          conceptId: 'calibration_frequency',
          domainId: 'quality-assurance',
          amount: 10
        },
        responseText: "Your attention to accuracy is commendable, but we must balance ideal with practical. Our quarterly detailed calibration schedule with monthly quick-checks provides optimal safety without overwhelming staff resources."
      }
    ]
  },
  
  // Journal introduction (key game mechanic)
  {
    id: 'pre-journal-presentation',
    text: "You show good potential. In this field, organizing your knowledge is essential. I have something that might help you during your residency.",
    contextNote: "Dr. Kapoor reaches into a drawer and retrieves a leather-bound book.",
    nextStageId: 'journal-presentation'
  },
  
  // Standard conclusion
  {
    id: 'conclusion',
    type: 'conclusion',
    text: "Today's session was adequate. Remember that in medical physics, attention to detail directly impacts patient care. Continue developing both your technical knowledge and clinical awareness.",
    isConclusion: true,
    nextStageId: 'pre-journal-presentation'
  },
  
  // Excellence conclusion
  {
    id: 'conclusion-excellence',
    type: 'conclusion',
    text: "I'm impressed with your understanding. You demonstrate a promising balance of technical knowledge and clinical awareness - essential qualities for success in medical physics. I look forward to your future development.",
    isConclusion: true,
    nextStageId: 'pre-journal-presentation'
  },
  
  // Needs improvement conclusion
  {
    id: 'conclusion-needs-improvement',
    type: 'conclusion',
    text: "Your understanding requires significant improvement. These concepts are fundamental to patient safety. I recommend reviewing basic principles before our next session. Medical physics demands precision and thorough understanding.",
    isConclusion: true,
    nextStageId: 'pre-journal-presentation'
  },
  
  // Journal presentation (critical progression point)
  {
    id: 'journal-presentation',
    type: 'critical-moment',
    text: "Every medical physicist needs to track their learning and observations. This journal will help you record insights, track your progress, and organize your growing knowledge throughout your residency.",
    contextNote: "Dr. Kapoor hands you a leather-bound journal with the hospital's emblem embossed on the cover.",
    equipment: {
      itemId: 'journal',
      alt: "Journal",
      description: "A high-quality leather journal with the hospital's medical physics department emblem."
    },
    isCriticalPath: true,
    isConclusion: true
  }
];

export default kapoorCalibrationDialogue;