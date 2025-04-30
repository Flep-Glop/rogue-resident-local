// app/data/concepts/medicalPhysicsConcepts.ts
/**
 * Medical Physics Concepts Data
 * 
 * This file contains definitions for all concept nodes in the knowledge system,
 * implementing the comprehensive constellation layout from project documentation.
 */

import { ConceptNode, KnowledgeDomain } from '@/app/store/knowledgeStore';

/**
 * Helper function to ensure all concepts have proper spCost based on orbit
 * This is applied to all concepts to ensure consistent SP costs
 */
function updateConceptsWithOrbits(concepts: ConceptNode[]): ConceptNode[] {
  // Define standard SP costs by orbit level
  const orbitCosts = {
    0: 10, // Core concepts - cheapest
    1: 15, // Intermediate concepts
    2: 20, // Advanced concepts
    3: 25  // Specialized concepts - most expensive
  };

  // Ensure all concepts have spCost, unlocked, and active properties
  return concepts.map(concept => {
    // Make deep copy to avoid mutations
    const updatedConcept = { ...concept };
    
    // Set spCost based on orbit if not already set
    if (!updatedConcept.spCost || isNaN(updatedConcept.spCost)) {
      const orbit = updatedConcept.orbit || 0;
      updatedConcept.spCost = orbitCosts[orbit as keyof typeof orbitCosts] || 15;
    }
    
    // Ensure these properties exist
    if (updatedConcept.unlocked === undefined) {
      updatedConcept.unlocked = false;
    }
    
    if (updatedConcept.active === undefined) {
      updatedConcept.active = false;
    }
    
    return updatedConcept;
  });
}

// Domain constants - matching domains from the knowledge store
export const KNOWLEDGE_DOMAINS = {
  TREATMENT_PLANNING: 'treatment-planning' as KnowledgeDomain,
  RADIATION_THERAPY: 'radiation-therapy' as KnowledgeDomain,
  LINAC_ANATOMY: 'linac-anatomy' as KnowledgeDomain,
  DOSIMETRY: 'dosimetry' as KnowledgeDomain
};

// Calculate position using orbital-quadrant layout
/**
 * Calculate node position using hybrid orbital-quadrant layout
 * - Core concepts are close to center
 * - Higher orbits move outward
 * - Each domain occupies a quadrant or sector
 * - Related concepts within a domain are clustered together
 */
function calculatePosition(
  orbit: number, // 0=core, 1=intermediate, 2=advanced, 3=specialized
  domainKey: string,
  offsetWithinDomain: number = 0
) {
  // Base canvas is 1000x1000 with center at 500,500
  const CENTER_X = 500;
  const CENTER_Y = 500;
  
  // Orbit radiuses
  const ORBIT_RADII = [50, 150, 250, 350]; // Core, Intermediate, Advanced, Specialized
  
  // Domain angles in radians
  const DOMAIN_ANGLES: Record<string, number> = {
    TREATMENT_PLANNING: Math.PI * 0.25, // Northeast
    RADIATION_THERAPY: Math.PI * 0.75, // Southeast
    LINAC_ANATOMY: Math.PI * 1.25, // Southwest
    DOSIMETRY: Math.PI * 1.75, // Northwest
  };
  
  // Get base angle for domain
  const baseAngle = DOMAIN_ANGLES[domainKey] || 0;
  
  // Add offset for positioning within domain sector (within +/- 0.2 radians)
  const offsetAngle = baseAngle + (offsetWithinDomain * 0.1);
  
  // Calculate position using polar coordinates
  const radius = ORBIT_RADII[orbit];
  const x = CENTER_X + Math.cos(offsetAngle) * radius;
  const y = CENTER_Y + Math.sin(offsetAngle) * radius;
  
  return { x, y };
}

// Medical physics concepts for the game
export const medicalPhysicsConcepts: ConceptNode[] = [
  // =================================================================================
  // CORE CONCEPTS (ORBIT 0) - Foundations of each domain
  // =================================================================================
  
  // Treatment Planning Core
  {
    id: 'treatment-planning',
    name: 'Treatment Planning',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'The process of determining the appropriate radiation dose, beam geometry, and delivery method to treat a tumor while minimizing dose to healthy tissues.',
    mastery: 0,
    connections: [
      'prescription', 'target-volumes', 'organs-at-risk',
      'treatment-delivery', 'radiation-therapy', 'dosimetry'
    ],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(0, 'TREATMENT_PLANNING'),
    orbit: 0,
    spCost: 10 // Core concept SP cost
  },

  // Radiation Therapy Core
  {
    id: 'radiation-therapy',
    name: 'Radiation Therapy',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'The medical use of ionizing radiation as part of cancer treatment to control or kill malignant cells.',
    mastery: 0,
    connections: [
      'treatment-planning', 'linac-anatomy', 'dosimetry',
      'delivery-techniques', 'patient-positioning'
    ],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(0, 'RADIATION_THERAPY'),
    orbit: 0,
    spCost: 10 // Core concept SP cost
  },

  // Linac Anatomy Core
  {
    id: 'linac-anatomy',
    name: 'Linac Anatomy',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'The core components and functionality of linear accelerators used in radiation therapy.',
    mastery: 0,
    connections: [
      'radiation-therapy', 'dosimetry',
      'beam-generation', 'beam-modification', 'imaging-systems'
    ],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(0, 'LINAC_ANATOMY'),
    orbit: 0,
    spCost: 10 // Core concept SP cost
  },

  // Dosimetry Core
  {
    id: 'dosimetry',
    name: 'Dosimetry',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Measurement and calculation of radiation dose received by the human body.',
    mastery: 0,
    connections: [
      'treatment-planning', 'radiation-therapy', 'linac-anatomy',
      'output-calibration', 'relative-dosimetry', 'patient-qa'
    ],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(0, 'DOSIMETRY'),
    orbit: 0,
    spCost: 10 // Core concept SP cost
  },

  // =================================================================================
  // TREATMENT PLANNING DOMAIN (CLINICAL PRACTICE)
  // =================================================================================
  
  // === ORBIT 1: INTERMEDIATE CONCEPTS ===
  
  // Target Volumes
  {
    id: 'target-volumes',
    name: 'Target Volumes',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Defined volumes for radiation planning including GTV, CTV, and PTV.',
    mastery: 0,
    connections: ['treatment-planning', 'organs-at-risk', 'prescription', 'contour-analysis'],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(1, 'TREATMENT_PLANNING', -1),
    orbit: 1,
    spCost: 15 // Orbit 1 concept SP cost
  },
  
  // Prescription
  {
    id: 'prescription',
    name: 'Prescription',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'The radiation oncologist\'s specification of the radiation dose to be delivered.',
    mastery: 0,
    connections: ['treatment-planning', 'target-volumes', 'fractionation', 'clinical-dose'],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(1, 'TREATMENT_PLANNING', 0),
    orbit: 1,
    spCost: 15 // Orbit 1 concept SP cost
  },
  
  // Plan Evaluation
  {
    id: 'plan-evaluation',
    name: 'Plan Evaluation',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Methods to assess the quality of a treatment plan.',
    mastery: 0,
    connections: ['treatment-planning', 'dvh-analysis', 'plan-qa'],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(1, 'TREATMENT_PLANNING', 1),
    orbit: 1,
    spCost: 15 // Orbit 1 concept SP cost
  },
  
  // === ORBIT 2: ADVANCED CONCEPTS ===
  
  // Contour Analysis
  {
    id: 'contour-analysis',
    name: 'Contour Analysis',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Assessment and refinement of structure outlining.',
    mastery: 0,
    connections: ['target-volumes', 'auto-segmentation'],
    discovered: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', -2),
    orbit: 2
  },
  
  // Organs at Risk (OARs)
  {
    id: 'organs-at-risk',
    name: 'Organs at Risk',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Normal tissues whose radiation sensitivity may influence treatment planning.',
    mastery: 0,
    connections: ['treatment-planning', 'target-volumes', 'dose-constraints', 'oar-prioritization'],
    discovered: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', -1),
    orbit: 2
  },
  
  // Dose Constraints
  {
    id: 'dose-constraints',
    name: 'Dose Constraints',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Limits on the dose received by organs at risk.',
    mastery: 0,
    connections: ['organs-at-risk', 'biological-modeling', 'dvh-analysis'],
    discovered: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', 0),
    orbit: 2
  },
  
  // Fractionation
  {
    id: 'fractionation',
    name: 'Fractionation',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'The practice of dividing the total radiation dose into multiple smaller doses.',
    mastery: 0,
    connections: ['prescription', 'adaptive-planning'],
    discovered: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', 1),
    orbit: 2
  },
  
  // DVH Analysis
  {
    id: 'dvh-analysis',
    name: 'DVH Analysis',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Analysis of dose-volume histograms to evaluate treatment plans.',
    mastery: 0,
    connections: ['plan-evaluation', 'multi-criteria-optimization', 'dose-constraints'],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', 2),
    orbit: 2,
    spCost: 25 // Orbit 2 concept SP cost
  },
  
  // Plan QA
  {
    id: 'plan-qa',
    name: 'Plan QA',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Quality assurance procedures for treatment plans.',
    mastery: 0,
    connections: ['plan-evaluation', 'robust-planning', 'patient-qa'],
    discovered: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', 3),
    orbit: 2
  },
  
  // === ORBIT 3: SPECIALIZED CONCEPTS ===
  
  // Auto-Segmentation
  {
    id: 'auto-segmentation',
    name: 'Auto-Segmentation',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Automated contouring using algorithms.',
    mastery: 0,
    connections: ['contour-analysis'],
    discovered: false,
    unlocked: false,
    active: false,
    position: calculatePosition(3, 'TREATMENT_PLANNING', -2),
    orbit: 3,
    spCost: 40 // Orbit 3 concept SP cost
  },
  
  // OAR Prioritization
  {
    id: 'oar-prioritization',
    name: 'OAR Prioritization',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Strategic ranking of organ sparing priority.',
    mastery: 0,
    connections: ['organs-at-risk'],
    discovered: false,
    position: calculatePosition(3, 'TREATMENT_PLANNING', -1),
    orbit: 3
  },
  
  // Biological Modeling
  {
    id: 'biological-modeling',
    name: 'Biological Modeling',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Incorporating biological response into planning.',
    mastery: 0,
    connections: ['dose-constraints'],
    discovered: false,
    position: calculatePosition(3, 'TREATMENT_PLANNING', 0),
    orbit: 3
  },
  
  // Adaptive Planning
  {
    id: 'adaptive-planning',
    name: 'Adaptive Planning',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Modification of plans during treatment course.',
    mastery: 0,
    connections: ['fractionation'],
    discovered: false,
    position: calculatePosition(3, 'TREATMENT_PLANNING', 1),
    orbit: 3
  },
  
  // Multi-Criteria Optimization
  {
    id: 'multi-criteria-optimization',
    name: 'Multi-Criteria Optimization',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Balancing competing objectives in treatment planning.',
    mastery: 0,
    connections: ['dvh-analysis'],
    discovered: false,
    position: calculatePosition(3, 'TREATMENT_PLANNING', 2),
    orbit: 3
  },
  
  // Robust Planning
  {
    id: 'robust-planning',
    name: 'Robust Planning',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Planning that accounts for uncertainties.',
    mastery: 0,
    connections: ['plan-qa'],
    discovered: false,
    position: calculatePosition(3, 'TREATMENT_PLANNING', 3),
    orbit: 3
  },
  
  // =================================================================================
  // RADIATION THERAPY DOMAIN (RADIATION PHYSICS)
  // =================================================================================
  
  // === ORBIT 1: INTERMEDIATE CONCEPTS ===
  
  // Delivery Techniques
  {
    id: 'delivery-techniques',
    name: 'Delivery Techniques',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Methods for delivering radiation treatments.',
    mastery: 0,
    connections: ['radiation-therapy', 'imrt', 'vmat'],
    discovered: false,
    position: calculatePosition(1, 'RADIATION_THERAPY', -1),
    orbit: 1
  },
  
  // Patient Positioning
  {
    id: 'patient-positioning',
    name: 'Patient Positioning',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Proper setup of patients for treatment.',
    mastery: 0,
    connections: ['radiation-therapy', 'imaging-guidance'],
    discovered: false,
    position: calculatePosition(1, 'RADIATION_THERAPY', 0),
    orbit: 1
  },
  
  // Treatment Protocols
  {
    id: 'treatment-protocols',
    name: 'Treatment Protocols',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Standard procedures for treatment delivery.',
    mastery: 0,
    connections: ['radiation-therapy', 'site-specific-protocols'],
    discovered: false,
    position: calculatePosition(1, 'RADIATION_THERAPY', 1),
    orbit: 1
  },
  
  // === ORBIT 2: ADVANCED CONCEPTS ===
  
  // IMRT Delivery
  {
    id: 'imrt',
    name: 'IMRT Delivery',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Intensity-modulated radiation therapy delivery techniques.',
    mastery: 0,
    connections: ['delivery-techniques', 'single-fraction', 'mlc'],
    discovered: false,
    position: calculatePosition(2, 'RADIATION_THERAPY', -1.5),
    orbit: 2
  },
  
  // VMAT Delivery
  {
    id: 'vmat',
    name: 'VMAT Delivery',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Volumetric modulated arc therapy techniques.',
    mastery: 0,
    connections: ['delivery-techniques', 'motion-management'],
    discovered: false,
    position: calculatePosition(2, 'RADIATION_THERAPY', -0.5),
    orbit: 2
  },
  
  // Imaging Guidance
  {
    id: 'imaging-guidance',
    name: 'Imaging Guidance',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Using imaging for precise positioning.',
    mastery: 0,
    connections: ['patient-positioning', 'six-dof-setup'],
    discovered: false,
    position: calculatePosition(2, 'RADIATION_THERAPY', 0.5),
    orbit: 2
  },
  
  // Site-Specific Protocols
  {
    id: 'site-specific-protocols',
    name: 'Site-Specific Protocols',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Protocols tailored to treatment sites.',
    mastery: 0,
    connections: ['treatment-protocols', 'flash-rt'],
    discovered: false,
    position: calculatePosition(2, 'RADIATION_THERAPY', 1.5),
    orbit: 2
  },
  
  // === ORBIT 3: SPECIALIZED CONCEPTS ===
  
  // Single Fraction RT
  {
    id: 'single-fraction',
    name: 'Single Fraction RT',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'High-dose treatments delivered in one session.',
    mastery: 0,
    connections: ['imrt'],
    discovered: false,
    position: calculatePosition(3, 'RADIATION_THERAPY', -1.5),
    orbit: 3
  },
  
  // Motion Management
  {
    id: 'motion-management',
    name: 'Motion Management',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Techniques to address patient motion.',
    mastery: 0,
    connections: ['vmat'],
    discovered: false,
    position: calculatePosition(3, 'RADIATION_THERAPY', -0.5),
    orbit: 3
  },
  
  // 6DOF Setup
  {
    id: 'six-dof-setup',
    name: '6DOF Setup',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Six-degree of freedom patient setup.',
    mastery: 0,
    connections: ['imaging-guidance'],
    discovered: false,
    position: calculatePosition(3, 'RADIATION_THERAPY', 0.5),
    orbit: 3
  },
  
  // FLASH RT
  {
    id: 'flash-rt',
    name: 'FLASH RT',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Ultra-high dose rate treatment.',
    mastery: 0,
    connections: ['site-specific-protocols'],
    discovered: false,
    position: calculatePosition(3, 'RADIATION_THERAPY', 1.5),
    orbit: 3
  },
  
  // =================================================================================
  // LINAC ANATOMY DOMAIN (TECHNICAL)
  // =================================================================================
  
  // === ORBIT 1: INTERMEDIATE CONCEPTS ===
  
  // Beam Generation
  {
    id: 'beam-generation',
    name: 'Beam Generation',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'How radiation beams are produced.',
    mastery: 0,
    connections: ['linac-anatomy', 'target-foil'],
    discovered: false,
    position: calculatePosition(1, 'LINAC_ANATOMY', -1),
    orbit: 1
  },
  
  // Beam Modification
  {
    id: 'beam-modification',
    name: 'Beam Modification',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'How radiation beams are shaped and modified.',
    mastery: 0,
    connections: ['linac-anatomy', 'mlc'],
    discovered: false,
    position: calculatePosition(1, 'LINAC_ANATOMY', 0),
    orbit: 1
  },
  
  // Imaging Systems
  {
    id: 'imaging-systems',
    name: 'Imaging Systems',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Imaging components integrated into linacs.',
    mastery: 0,
    connections: ['linac-anatomy', 'kv-imaging'],
    discovered: false,
    position: calculatePosition(1, 'LINAC_ANATOMY', 1),
    orbit: 1
  },
  
  // === ORBIT 2: ADVANCED CONCEPTS ===
  
  // Target & Foil
  {
    id: 'target-foil',
    name: 'Target & Foil',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Electron to photon conversion systems.',
    mastery: 0,
    connections: ['beam-generation', 'electron-scatter'],
    discovered: false,
    position: calculatePosition(2, 'LINAC_ANATOMY', -1),
    orbit: 2
  },
  
  // Multi-Leaf Collimator
  {
    id: 'mlc',
    name: 'Multi-Leaf Collimator',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Beam-shaping device with movable leaves.',
    mastery: 0,
    connections: ['beam-modification', 'leaf-design', 'imrt'],
    discovered: false,
    position: calculatePosition(2, 'LINAC_ANATOMY', 0),
    orbit: 2
  },
  
  // kV Imaging
  {
    id: 'kv-imaging',
    name: 'kV Imaging',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Kilovoltage imaging systems.',
    mastery: 0,
    connections: ['imaging-systems', 'cone-beam-ct'],
    discovered: false,
    position: calculatePosition(2, 'LINAC_ANATOMY', 1),
    orbit: 2
  },
  
  // === ORBIT 3: SPECIALIZED CONCEPTS ===
  
  // Electron Scatter
  {
    id: 'electron-scatter',
    name: 'Electron Scatter',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Physics of electron beam scattering.',
    mastery: 0,
    connections: ['target-foil'],
    discovered: false,
    position: calculatePosition(3, 'LINAC_ANATOMY', -1),
    orbit: 3
  },
  
  // Leaf Design
  {
    id: 'leaf-design',
    name: 'Leaf Design',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'MLC leaf design considerations.',
    mastery: 0,
    connections: ['mlc'],
    discovered: false,
    position: calculatePosition(3, 'LINAC_ANATOMY', 0),
    orbit: 3
  },
  
  // Cone Beam CT
  {
    id: 'cone-beam-ct',
    name: 'Cone Beam CT',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: '3D imaging using cone beam geometry.',
    mastery: 0,
    connections: ['kv-imaging'],
    discovered: false,
    position: calculatePosition(3, 'LINAC_ANATOMY', 1),
    orbit: 3
  },
  
  // =================================================================================
  // DOSIMETRY DOMAIN (QUALITY ASSURANCE)
  // =================================================================================
  
  // === ORBIT 1: INTERMEDIATE CONCEPTS ===
  
  // Output Calibration
  {
    id: 'output-calibration',
    name: 'Output Calibration',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Calibration of radiation output from treatment machines.',
    mastery: 0,
    connections: ['dosimetry', 'ionization-chambers', 'calibration-factors'],
    discovered: false,
    position: calculatePosition(1, 'DOSIMETRY', -1),
    orbit: 1
  },
  
  // Relative Dosimetry
  {
    id: 'relative-dosimetry',
    name: 'Relative Dosimetry',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Measurement of relative dose distributions.',
    mastery: 0,
    connections: ['dosimetry', 'small-field-dosimetry'],
    discovered: false,
    position: calculatePosition(1, 'DOSIMETRY', 0),
    orbit: 1
  },
  
  // Patient-Specific QA
  {
    id: 'patient-qa',
    name: 'Patient-Specific QA',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Quality assurance for individual patient treatments.',
    mastery: 0,
    connections: ['dosimetry', 'gamma-analysis', 'plan-qa'],
    discovered: false,
    position: calculatePosition(1, 'DOSIMETRY', 1),
    orbit: 1
  },
  
  // === ORBIT 2: ADVANCED CONCEPTS ===
  
  // Ionization Chambers
  {
    id: 'ionization-chambers',
    name: 'Ionization Chambers',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Gas-filled radiation detectors.',
    mastery: 0,
    connections: ['output-calibration', 'pulse-dependence'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', -1),
    orbit: 2
  },
  
  // Small Field Dosimetry
  {
    id: 'small-field-dosimetry',
    name: 'Small Field Dosimetry',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Measuring dose in small radiation fields.',
    mastery: 0,
    connections: ['relative-dosimetry', 'detector-effects'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 0),
    orbit: 2
  },
  
  // Gamma Analysis
  {
    id: 'gamma-analysis',
    name: 'Gamma Analysis',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Statistical comparison of dose distributions.',
    mastery: 0,
    connections: ['patient-qa', 'dose-reconstruction'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 1),
    orbit: 2
  },
  
  // Calibration Factors
  {
    id: 'calibration-factors',
    name: 'Calibration Factors',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Factors applied to convert measured ionization to absorbed dose.',
    mastery: 0,
    connections: ['output-calibration', 'ptp-correction'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 2),
    orbit: 2
  },
  
  // Temperature & Pressure Correction
  {
    id: 'ptp-correction',
    name: 'Temperature & Pressure Correction',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Correction for atmospheric conditions in ionization measurements.',
    mastery: 0,
    connections: ['calibration-factors'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 3),
    orbit: 2
  },
  
  // === ORBIT 3: SPECIALIZED CONCEPTS ===
  
  // Pulse Dependence
  {
    id: 'pulse-dependence',
    name: 'Pulse Dependence',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Effect of pulse structure on measurements.',
    mastery: 0,
    connections: ['ionization-chambers'],
    discovered: false,
    position: calculatePosition(3, 'DOSIMETRY', -1),
    orbit: 3
  },
  
  // Detector Effects
  {
    id: 'detector-effects',
    name: 'Detector Effects',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Impacts of detector design on measurements.',
    mastery: 0,
    connections: ['small-field-dosimetry'],
    discovered: false,
    position: calculatePosition(3, 'DOSIMETRY', 0),
    orbit: 3
  },
  
  // Dose Reconstruction
  {
    id: 'dose-reconstruction',
    name: 'Dose Reconstruction',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Reconstructing 3D dose from measurements.',
    mastery: 0,
    connections: ['gamma-analysis'],
    discovered: false,
    position: calculatePosition(3, 'DOSIMETRY', 1),
    orbit: 3
  },
  
  // =================================================================================
  // RADIATION PROTECTION DOMAIN
  // =================================================================================
  
  // === ORBIT 1: INTERMEDIATE CONCEPTS ===
  
  // Radiation Safety
  {
    id: 'radiation-safety',
    name: 'Radiation Safety',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Principles and practices for minimizing radiation exposure.',
    mastery: 0,
    connections: ['alara-principle', 'inverse-square-law'],
    discovered: false,
    position: calculatePosition(1, 'DOSIMETRY', 0),
    orbit: 1
  },
  
  // === ORBIT 2: ADVANCED CONCEPTS ===
  
  // ALARA Principle
  {
    id: 'alara-principle',
    name: 'ALARA Principle',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'The principle that radiation exposure should be kept "As Low As Reasonably Achievable".',
    mastery: 0,
    connections: ['radiation-safety', 'dose-limits', 'personal-dosimetry'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', -1),
    orbit: 2
  },
  
  // Dose Limits
  {
    id: 'dose-limits',
    name: 'Dose Limits',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Regulatory restrictions on radiation dose for workers and the public.',
    mastery: 0,
    connections: ['alara-principle'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 0),
    orbit: 2
  },
  
  // Shielding
  {
    id: 'shielding',
    name: 'Shielding',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Materials used to reduce radiation exposure.',
    mastery: 0,
    connections: ['attenuation', 'half-value-layer', 'alara-principle'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 1),
    orbit: 2
  },
  
  // === ORBIT 3: SPECIALIZED CONCEPTS ===
  
  // Personal Dosimetry
  {
    id: 'personal-dosimetry',
    name: 'Personal Dosimetry',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Monitoring of radiation dose received by individuals.',
    mastery: 0,
    connections: ['alara-principle'],
    discovered: false,
    position: calculatePosition(3, 'DOSIMETRY', 0),
    orbit: 3
  },
  
  // =================================================================================
  // RADIATION PHYSICS (THEORETICAL DOMAIN)
  // =================================================================================
  
  // === ORBIT 1: INTERMEDIATE CONCEPTS ===
  
  // Radiation Interactions
  {
    id: 'radiation-interactions',
    name: 'Radiation Interactions',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Fundamental interactions between radiation and matter.',
    mastery: 0,
    connections: ['attenuation', 'linear-energy-transfer'],
    discovered: false,
    position: calculatePosition(1, 'DOSIMETRY', 0),
    orbit: 1
  },
  
  // === ORBIT 2: ADVANCED CONCEPTS ===
  
  // Inverse Square Law
  {
    id: 'inverse-square-law',
    name: 'Inverse Square Law',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'The principle that radiation intensity is inversely proportional to the square of the distance from the source.',
    mastery: 0,
    connections: ['radiation-safety'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', -1),
    orbit: 2
  },
  
  // Attenuation
  {
    id: 'attenuation',
    name: 'Attenuation',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'The reduction in intensity of a radiation beam as it passes through matter.',
    mastery: 0,
    connections: ['half-value-layer', 'shielding', 'radiation-interactions'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 0),
    orbit: 2
  },
  
  // Linear Energy Transfer
  {
    id: 'linear-energy-transfer',
    name: 'Linear Energy Transfer',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'The amount of energy that an ionizing particle transfers to the material traversed per unit distance.',
    mastery: 0,
    connections: ['radiation-interactions', 'radiation-dosimetry'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 1),
    orbit: 2
  },
  
  // === ORBIT 3: SPECIALIZED CONCEPTS ===
  
  // Half-Value Layer
  {
    id: 'half-value-layer',
    name: 'Half-Value Layer',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'The thickness of a specified material that reduces the intensity of radiation to one-half its original value.',
    mastery: 0,
    connections: ['attenuation', 'shielding'],
    discovered: false,
    position: calculatePosition(3, 'DOSIMETRY', 0),
    orbit: 3
  },
  
  // =================================================================================
  // OTHER IMPORTANT CONCEPTS
  // =================================================================================
  
  // Clinical Dose Significance 
  {
    id: 'clinical-dose',
    name: 'Clinical Dose Significance',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'The impact of dose variations on clinical outcomes and patient treatment.',
    mastery: 0,
    connections: ['prescription', 'output-calibration'],
    discovered: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', -3),
    orbit: 2
  },
  
  // Treatment Delivery
  {
    id: 'treatment-delivery',
    name: 'Treatment Delivery',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'The process of delivering prescribed radiation dose to the patient.',
    mastery: 0,
    connections: ['treatment-planning', 'radiation-therapy'],
    discovered: false,
    position: calculatePosition(1, 'RADIATION_THERAPY', -2),
    orbit: 1
  },
  
  // Radiation Dosimetry
  {
    id: 'radiation-dosimetry',
    name: 'Radiation Dosimetry',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'The measurement of absorbed dose delivered by ionizing radiation.',
    mastery: 0, // Set to 0 initially
    connections: ['linear-energy-transfer', 'dosimetry'],
    discovered: false, // Set to undiscovered by default
    position: calculatePosition(1, 'DOSIMETRY', -1),
    orbit: 1
  },
  
  // =================================================================================
  // BOSS-RELATED CONCEPTS
  // =================================================================================
  
  // Ionix Anomaly
  {
    id: 'ionix-anomaly',
    name: 'Ionix Anomaly',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Unusual quantum behavior observed in experimental ion chambers.',
    mastery: 0,
    connections: ['quantum-effects'],
    discovered: false,
    position: { x: 500, y: 400 }, // Special position for boss-related concept
    orbit: 2
  },
  
  // Quantum Effects
  {
    id: 'quantum-effects',
    name: 'Quantum Effects',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Quantum mechanical phenomena affecting radiation interactions and detection.',
    mastery: 0,
    connections: ['ionix-anomaly'],
    discovered: false,
    position: { x: 450, y: 450 }, // Special position for boss-related concept
    orbit: 2
  },
  
  // Update domains for concepts using removed domains
  // Change all RADIATION_PROTECTION domain concepts to DOSIMETRY
  {
    id: 'radiation-protection-principles',
    name: 'Radiation Protection Principles',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Fundamental principles for safely working with ionizing radiation.',
    mastery: 0,
    connections: ['radiation-therapy', 'alara-principle', 'radiation-monitoring'],
    discovered: false,
    position: calculatePosition(1, 'DOSIMETRY', 0),
    orbit: 1
  },
  
  // ALARA Principle
  {
    id: 'alara-principle',
    name: 'ALARA Principle',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'As Low As Reasonably Achievable - A principle for minimizing radiation exposure.',
    mastery: 0,
    connections: ['radiation-protection-principles', 'shielding', 'dose-limits'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', -1),
    orbit: 2
  },
  
  // Radiation Monitoring
  {
    id: 'radiation-monitoring',
    name: 'Radiation Monitoring',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Methods and devices for monitoring radiation levels and exposure.',
    mastery: 0,
    connections: ['radiation-protection-principles', 'dosimetry', 'dose-limits'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 0),
    orbit: 2
  },
  
  // Dose Limits
  {
    id: 'dose-limits',
    name: 'Dose Limits',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Regulatory limits on radiation exposure for workers and the public.',
    mastery: 0,
    connections: ['alara-principle', 'radiation-monitoring', 'radiation-regulations'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 1),
    orbit: 2
  },
  
  // Radiation Regulations
  {
    id: 'radiation-regulations',
    name: 'Radiation Regulations',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Legal framework governing the use of radiation in medicine.',
    mastery: 0,
    connections: ['dose-limits', 'radiation-protection-principles'],
    discovered: false,
    position: calculatePosition(3, 'DOSIMETRY', 0),
    orbit: 3
  },
  
  // Quantum Mechanics - THEORETICAL domain changed to LINAC_ANATOMY
  {
    id: 'quantum-mechanics',
    name: 'Quantum Mechanics',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Fundamental theory describing behavior of matter and light at atomic scales.',
    mastery: 0,
    connections: ['radiation-physics', 'particle-theory'],
    discovered: false,
    position: calculatePosition(1, 'DOSIMETRY', 0),
    orbit: 1
  },
  
  // Particle Theory
  {
    id: 'particle-theory',
    name: 'Particle Theory',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Theoretical framework for understanding the behavior of subatomic particles.',
    mastery: 0,
    connections: ['quantum-mechanics', 'radiation-physics', 'wave-particle-duality'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', -1),
    orbit: 2
  },
  
  // Wave-Particle Duality
  {
    id: 'wave-particle-duality',
    name: 'Wave-Particle Duality',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Concept that every particle exhibits both wave and particle properties.',
    mastery: 0,
    connections: ['particle-theory', 'quantum-mechanics'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 0),
    orbit: 2
  },
  
  // Radiation Models
  {
    id: 'radiation-models',
    name: 'Radiation Models',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Theoretical models describing radiation interaction with matter.',
    mastery: 0,
    connections: ['quantum-mechanics', 'radiation-physics', 'biological-modeling'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 1),
    orbit: 2
  },
  
  // Advanced Quantum Effects
  {
    id: 'advanced-quantum-effects',
    name: 'Advanced Quantum Effects',
    domain: KNOWLEDGE_DOMAINS.LINAC_ANATOMY,
    description: 'Complex quantum phenomena relevant to radiation physics.',
    mastery: 0,
    connections: ['quantum-mechanics', 'wave-particle-duality'],
    discovered: false,
    position: calculatePosition(3, 'DOSIMETRY', 0),
    orbit: 3
  }
];

// Additional concepts for calibration task dialogue
// These are referenced in app/data/dialogues/calibrations/kapoor-calibration.ts
// Adding here to prevent "Cannot update mastery: Concept X not found" errors

export const additionalConcepts: ConceptNode[] = [
  {
    id: 'electron_equilibrium_understood',
    name: 'Electron Equilibrium',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Understanding of electron equilibrium principles in radiation dosimetry.',
    mastery: 0,
    connections: ['output-calibration', 'radiation-interactions'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 1),
    orbit: 2
  },
  {
    id: 'ptp_correction_understood',
    name: 'Pressure Temperature Corrections',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Understanding of pressure and temperature corrections for ionization chamber measurements.',
    mastery: 0,
    connections: ['output-calibration', 'absolute-dosimetry'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 2),
    orbit: 2
  },
  {
    id: 'output_calibration_tolerance',
    name: 'Output Calibration Tolerance',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Acceptable limits for output calibration measurements in radiotherapy.',
    mastery: 0,
    connections: ['output-calibration', 'quality-assurance-protocols'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 3),
    orbit: 2
  },
  {
    id: 'clinical_dose_significance',
    name: 'Clinical Dose Significance',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Understanding the clinical significance of dose variations in patient treatment.',
    mastery: 0,
    connections: ['dose-constraints', 'clinical-dose'],
    discovered: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', 3),
    orbit: 2
  },
  {
    id: 'beam_quality_factors',
    name: 'Beam Quality Factors',
    domain: KNOWLEDGE_DOMAINS.RADIATION_THERAPY,
    description: 'Parameters that characterize radiation beam quality for dosimetry purposes.',
    mastery: 0,
    connections: ['quality-assurance-protocols', 'beam-modification'],
    discovered: false,
    position: calculatePosition(2, 'RADIATION_THERAPY', 2),
    orbit: 2
  },
  {
    id: 'research_collaboration',
    name: 'Research Collaboration',
    domain: KNOWLEDGE_DOMAINS.TREATMENT_PLANNING,
    description: 'Collaborative efforts in research to advance medical physics and radiation therapy.',
    mastery: 0,
    connections: ['professional-development', 'evidence-based-practice'],
    discovered: false,
    position: calculatePosition(2, 'TREATMENT_PLANNING', 0),
    orbit: 2
  },
  {
    id: 'calibration_frequency',
    name: 'Calibration Frequency',
    domain: KNOWLEDGE_DOMAINS.DOSIMETRY,
    description: 'Recommended schedule for performing routine calibration of radiotherapy equipment.',
    mastery: 0,
    connections: ['output-calibration', 'quality-assurance-protocols'],
    discovered: false,
    position: calculatePosition(2, 'DOSIMETRY', 4),
    orbit: 2
  }
];

// Combine all concepts
export const allConcepts = [...medicalPhysicsConcepts, ...additionalConcepts];

// Apply orbit-based SP costs to all concepts
const updatedConcepts = updateConceptsWithOrbits(allConcepts);

// Export the updated concepts as default
export default updatedConcepts;