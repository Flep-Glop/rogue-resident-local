// app/data/concepts/medicalPhysicsConcepts.ts
/**
 * Medical Physics Concepts Data
 * 
 * This file contains definitions for all concept nodes in the knowledge system,
 * implementing the comprehensive constellation layout from project documentation.
 */

import { ConceptNode, KnowledgeDomain } from '@/app/store/knowledgeStore';

// Domain constants - matching domains from the hybrid orbital-quadrant layout
export const KNOWLEDGE_DOMAINS: Record<string, KnowledgeDomain> = {
  TREATMENT_PLANNING: 'clinical-practice',
  RADIATION_THERAPY: 'radiation-physics',
  LINAC_ANATOMY: 'technical',
  DOSIMETRY: 'quality-assurance',
  RADIATION_PROTECTION: 'radiation-protection',
  THEORETICAL: 'theoretical',
  GENERAL: 'general'
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
    RADIATION_PROTECTION: Math.PI * 0.5, // East
    THEORETICAL: Math.PI * 1.0, // South
    GENERAL: Math.PI * 1.5  // West
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
    position: calculatePosition(0, 'TREATMENT_PLANNING'),
    lastPracticed: Date.now()
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
    position: calculatePosition(0, 'RADIATION_THERAPY'),
    lastPracticed: Date.now()
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
    position: calculatePosition(0, 'LINAC_ANATOMY'),
    lastPracticed: Date.now()
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
    position: calculatePosition(0, 'DOSIMETRY'),
    lastPracticed: Date.now()
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
    position: calculatePosition(1, 'TREATMENT_PLANNING', -1),
    lastPracticed: Date.now()
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
    position: calculatePosition(1, 'TREATMENT_PLANNING', 0),
    lastPracticed: Date.now()
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
    position: calculatePosition(1, 'TREATMENT_PLANNING', 1),
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    position: calculatePosition(2, 'TREATMENT_PLANNING', 2),
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    position: calculatePosition(3, 'TREATMENT_PLANNING', -2),
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
  },
  
  // =================================================================================
  // RADIATION PROTECTION DOMAIN
  // =================================================================================
  
  // === ORBIT 1: INTERMEDIATE CONCEPTS ===
  
  // Radiation Safety
  {
    id: 'radiation-safety',
    name: 'Radiation Safety',
    domain: KNOWLEDGE_DOMAINS.RADIATION_PROTECTION,
    description: 'Principles and practices for minimizing radiation exposure.',
    mastery: 0,
    connections: ['alara-principle', 'inverse-square-law'],
    discovered: false,
    position: calculatePosition(1, 'RADIATION_PROTECTION', 0),
    lastPracticed: Date.now()
  },
  
  // === ORBIT 2: ADVANCED CONCEPTS ===
  
  // ALARA Principle
  {
    id: 'alara-principle',
    name: 'ALARA Principle',
    domain: KNOWLEDGE_DOMAINS.RADIATION_PROTECTION,
    description: 'The principle that radiation exposure should be kept "As Low As Reasonably Achievable".',
    mastery: 0,
    connections: ['radiation-safety', 'dose-limits', 'personal-dosimetry'],
    discovered: false,
    position: calculatePosition(2, 'RADIATION_PROTECTION', -1),
    lastPracticed: Date.now()
  },
  
  // Dose Limits
  {
    id: 'dose-limits',
    name: 'Dose Limits',
    domain: KNOWLEDGE_DOMAINS.RADIATION_PROTECTION,
    description: 'Regulatory restrictions on radiation dose for workers and the public.',
    mastery: 0,
    connections: ['alara-principle'],
    discovered: false,
    position: calculatePosition(2, 'RADIATION_PROTECTION', 0),
    lastPracticed: Date.now()
  },
  
  // Shielding
  {
    id: 'shielding',
    name: 'Shielding',
    domain: KNOWLEDGE_DOMAINS.RADIATION_PROTECTION,
    description: 'Materials used to reduce radiation exposure.',
    mastery: 0,
    connections: ['attenuation', 'half-value-layer', 'alara-principle'],
    discovered: false,
    position: calculatePosition(2, 'RADIATION_PROTECTION', 1),
    lastPracticed: Date.now()
  },
  
  // === ORBIT 3: SPECIALIZED CONCEPTS ===
  
  // Personal Dosimetry
  {
    id: 'personal-dosimetry',
    name: 'Personal Dosimetry',
    domain: KNOWLEDGE_DOMAINS.RADIATION_PROTECTION,
    description: 'Monitoring of radiation dose received by individuals.',
    mastery: 0,
    connections: ['alara-principle'],
    discovered: false,
    position: calculatePosition(3, 'RADIATION_PROTECTION', 0),
    lastPracticed: Date.now()
  },
  
  // =================================================================================
  // RADIATION PHYSICS (THEORETICAL DOMAIN)
  // =================================================================================
  
  // === ORBIT 1: INTERMEDIATE CONCEPTS ===
  
  // Radiation Interactions
  {
    id: 'radiation-interactions',
    name: 'Radiation Interactions',
    domain: KNOWLEDGE_DOMAINS.THEORETICAL,
    description: 'Fundamental interactions between radiation and matter.',
    mastery: 0,
    connections: ['attenuation', 'linear-energy-transfer'],
    discovered: false,
    position: calculatePosition(1, 'THEORETICAL', 0),
    lastPracticed: Date.now()
  },
  
  // === ORBIT 2: ADVANCED CONCEPTS ===
  
  // Inverse Square Law
  {
    id: 'inverse-square-law',
    name: 'Inverse Square Law',
    domain: KNOWLEDGE_DOMAINS.THEORETICAL,
    description: 'The principle that radiation intensity is inversely proportional to the square of the distance from the source.',
    mastery: 0,
    connections: ['radiation-safety'],
    discovered: false,
    position: calculatePosition(2, 'THEORETICAL', -1),
    lastPracticed: Date.now()
  },
  
  // Attenuation
  {
    id: 'attenuation',
    name: 'Attenuation',
    domain: KNOWLEDGE_DOMAINS.THEORETICAL,
    description: 'The reduction in intensity of a radiation beam as it passes through matter.',
    mastery: 0,
    connections: ['half-value-layer', 'shielding', 'radiation-interactions'],
    discovered: false,
    position: calculatePosition(2, 'THEORETICAL', 0),
    lastPracticed: Date.now()
  },
  
  // Linear Energy Transfer
  {
    id: 'linear-energy-transfer',
    name: 'Linear Energy Transfer',
    domain: KNOWLEDGE_DOMAINS.THEORETICAL,
    description: 'The amount of energy that an ionizing particle transfers to the material traversed per unit distance.',
    mastery: 0,
    connections: ['radiation-interactions', 'radiation-dosimetry'],
    discovered: false,
    position: calculatePosition(2, 'THEORETICAL', 1),
    lastPracticed: Date.now()
  },
  
  // === ORBIT 3: SPECIALIZED CONCEPTS ===
  
  // Half-Value Layer
  {
    id: 'half-value-layer',
    name: 'Half-Value Layer',
    domain: KNOWLEDGE_DOMAINS.THEORETICAL,
    description: 'The thickness of a specified material that reduces the intensity of radiation to one-half its original value.',
    mastery: 0,
    connections: ['attenuation', 'shielding'],
    discovered: false,
    position: calculatePosition(3, 'THEORETICAL', 0),
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
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
    lastPracticed: Date.now()
  },
  
  // Radiation Dosimetry
  {
    id: 'radiation-dosimetry',
    name: 'Radiation Dosimetry',
    domain: KNOWLEDGE_DOMAINS.THEORETICAL,
    description: 'The measurement of absorbed dose delivered by ionizing radiation.',
    mastery: 25, // Initially discovered concept
    connections: ['linear-energy-transfer', 'dosimetry'],
    discovered: true, // Initially discovered
    position: calculatePosition(1, 'THEORETICAL', -1),
    lastPracticed: Date.now()
  },
  
  // =================================================================================
  // BOSS-RELATED CONCEPTS
  // =================================================================================
  
  // Ionix Anomaly
  {
    id: 'ionix-anomaly',
    name: 'Ionix Anomaly',
    domain: KNOWLEDGE_DOMAINS.THEORETICAL,
    description: 'Unusual quantum behavior observed in experimental ion chambers.',
    mastery: 0,
    connections: ['quantum-effects'],
    discovered: false,
    position: { x: 500, y: 400 }, // Special position for boss-related concept
    lastPracticed: Date.now()
  },
  
  // Quantum Effects
  {
    id: 'quantum-effects',
    name: 'Quantum Effects',
    domain: KNOWLEDGE_DOMAINS.THEORETICAL,
    description: 'Quantum mechanical phenomena affecting radiation interactions and detection.',
    mastery: 0,
    connections: ['ionix-anomaly'],
    discovered: false,
    position: { x: 450, y: 450 }, // Special position for boss-related concept
    lastPracticed: Date.now()
  }
];

export default medicalPhysicsConcepts;