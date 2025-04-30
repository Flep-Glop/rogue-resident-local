import { KnowledgeDomain, KnowledgeStar } from '@/app/types';

// Initial position helpers
const getRandomPosition = () => ({
  x: Math.floor(Math.random() * 800) + 100,
  y: Math.floor(Math.random() * 600) + 100,
});

// Core concepts for each domain based on the GDD
export const initialConceptData: Record<string, KnowledgeStar> = {
  // TREATMENT PLANNING concepts (Blue)
  'tp_fundamentals': {
    id: 'tp_fundamentals',
    name: 'Treatment Planning Fundamentals',
    description: 'Basic principles of radiation therapy treatment planning.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 5,
  },
  'target_volumes': {
    id: 'target_volumes',
    name: 'Target Volumes',
    description: 'Understanding GTV, CTV, and PTV concepts in treatment planning.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    prerequisites: ['tp_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 10,
  },
  'dose_constraints': {
    id: 'dose_constraints',
    name: 'Dose Constraints',
    description: 'Managing dose limits for normal tissue and organs at risk.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    prerequisites: ['tp_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 10,
  },
  'IMRT_fundamentals': {
    id: 'IMRT_fundamentals',
    name: 'IMRT Fundamentals',
    description: 'Basic principles of Intensity Modulated Radiation Therapy.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['head_neck_treatment'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 8,
  },
  'head_neck_treatment': {
    id: 'head_neck_treatment',
    name: 'Head & Neck Treatment',
    description: 'Approaches to treating cancers in the head and neck region.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['IMRT_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 8,
  },
  'treatment_planning_constraints': {
    id: 'treatment_planning_constraints',
    name: 'Treatment Planning Constraints',
    description: 'Understanding and applying constraints in the treatment planning process.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['critical_organ_sparing'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 7,
  },
  'critical_organ_sparing': {
    id: 'critical_organ_sparing',
    name: 'Critical Organ Sparing',
    description: 'Techniques to protect vital organs during radiation therapy.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['treatment_planning_constraints'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 7,
  },
  'adaptive_radiotherapy': {
    id: 'adaptive_radiotherapy',
    name: 'Adaptive Radiotherapy',
    description: 'Modifying treatment plans in response to changes in patient anatomy or tumor response.',
    domain: KnowledgeDomain.TREATMENT_PLANNING,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['IMRT_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 12,
  },
  
  // RADIATION THERAPY concepts (Green)
  'rt_fundamentals': {
    id: 'rt_fundamentals',
    name: 'Radiation Therapy Fundamentals',
    description: 'Basic principles of radiation therapy delivery.',
    domain: KnowledgeDomain.RADIATION_THERAPY,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 5,
  },
  'fractionation': {
    id: 'fractionation',
    name: 'Fractionation Schemes',
    description: 'Different approaches to dividing radiation treatments over time.',
    domain: KnowledgeDomain.RADIATION_THERAPY,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    prerequisites: ['rt_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 8,
  },
  'patient_positioning': {
    id: 'patient_positioning',
    name: 'Patient Positioning',
    description: 'Techniques for accurate and reproducible patient setup.',
    domain: KnowledgeDomain.RADIATION_THERAPY,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    prerequisites: ['rt_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 8,
  },
  
  // LINAC ANATOMY concepts (Amber)
  'linac_fundamentals': {
    id: 'linac_fundamentals',
    name: 'Linac Fundamentals',
    description: 'Basic components and operation of a linear accelerator.',
    domain: KnowledgeDomain.LINAC_ANATOMY,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 5,
  },
  'beam_production': {
    id: 'beam_production',
    name: 'Beam Production',
    description: 'How electrons are accelerated and photon beams are produced.',
    domain: KnowledgeDomain.LINAC_ANATOMY,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    prerequisites: ['linac_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 10,
  },
  'mlc_systems': {
    id: 'mlc_systems',
    name: 'Multi-Leaf Collimator Systems',
    description: 'How MLCs shape radiation beams for precise treatment delivery.',
    domain: KnowledgeDomain.LINAC_ANATOMY,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    prerequisites: ['linac_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 10,
  },
  'isocenter_verification': {
    id: 'isocenter_verification',
    name: 'Isocenter Verification',
    description: 'Methods to verify the accuracy of the radiation isocenter.',
    domain: KnowledgeDomain.LINAC_ANATOMY,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['qa_protocols'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 9,
  },
  'qa_equipment': {
    id: 'qa_equipment',
    name: 'QA Equipment',
    description: 'Equipment used in the quality assurance process for linear accelerators.',
    domain: KnowledgeDomain.LINAC_ANATOMY,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['isocenter_verification'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 7,
  },
  
  // DOSIMETRY concepts (Pink)
  'dosimetry_fundamentals': {
    id: 'dosimetry_fundamentals',
    name: 'Dosimetry Fundamentals',
    description: 'Basic principles of radiation dose measurement and calculation.',
    domain: KnowledgeDomain.DOSIMETRY,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 5,
  },
  'absorbed_dose': {
    id: 'absorbed_dose',
    name: 'Absorbed Dose',
    description: 'Understanding how energy is deposited in tissue.',
    domain: KnowledgeDomain.DOSIMETRY,
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    prerequisites: ['dosimetry_fundamentals'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 8,
  },
  'qa_protocols': {
    id: 'qa_protocols',
    name: 'QA Protocols',
    description: 'Quality assurance procedures for ensuring accurate dose delivery.',
    domain: KnowledgeDomain.DOSIMETRY,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['isocenter_verification'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 10,
  },
  'SBRT_quality_assurance': {
    id: 'SBRT_quality_assurance',
    name: 'SBRT Quality Assurance',
    description: 'Special QA considerations for stereotactic body radiation therapy.',
    domain: KnowledgeDomain.DOSIMETRY,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['qa_protocols'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 11,
  },
  'small_field_dosimetry': {
    id: 'small_field_dosimetry',
    name: 'Small Field Dosimetry',
    description: 'Specialized dosimetry techniques for small radiation fields.',
    domain: KnowledgeDomain.DOSIMETRY,
    position: getRandomPosition(),
    mastery: 0,
    connections: ['qa_protocols'],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 10,
  },
  
  // General Knowledge concept
  'general_knowledge': {
    id: 'general_knowledge',
    name: 'General Knowledge',
    description: 'Broad understanding of medical physics principles.',
    domain: KnowledgeDomain.TREATMENT_PLANNING, // Default domain
    position: getRandomPosition(),
    mastery: 0,
    connections: [],
    discovered: false,
    unlocked: false,
    active: false,
    spCost: 3,
  },
};

// Initialize the knowledge store with these concepts
export const initializeKnowledgeStore = (store: any) => {
  try {
    if (!store) {
      console.error('No store provided to initializeKnowledgeStore');
      return;
    }
    
    // Most reliable approach - just get state and setState directly
    if (typeof store.getState === 'function' && typeof store.setState === 'function') {
      store.setState({
        stars: initialConceptData,
        discoveredToday: []
      });
      console.log('Knowledge store initialized with', Object.keys(initialConceptData).length, 'concepts');
      return;
    }
    
    // If it's the store state object
    if (typeof store.setState === 'function') {
      store.setState({
        stars: initialConceptData,
        discoveredToday: []
      });
      console.log('Knowledge store initialized with', Object.keys(initialConceptData).length, 'concepts');
      return;
    } else {
      console.error('Invalid knowledge store provided to initializeKnowledgeStore');
    }
  } catch (error) {
    console.error('Error initializing knowledge store:', error);
  }
}; 