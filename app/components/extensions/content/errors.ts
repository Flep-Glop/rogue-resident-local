/**
 * Error Identification Content
 * 
 * Content definitions for the ErrorIdentification extension type.
 * Provides scenarios for identifying errors in medical physics setups and procedures.
 */

// Define the error identification content type
export interface ErrorIdentificationContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  scenario: string;
  errors: ErrorItem[];
  conceptId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain: string;
  timeLimit?: number; // Optional time limit in seconds
  hint?: string;
  correctMessage?: string;
  incorrectMessage?: string;
}

export interface ErrorItem {
  id: string;
  description: string;
  position?: { x: number; y: number; width: number; height: number };
  isCritical: boolean;
  hint?: string;
}

/**
 * Collection of error identification content
 */
const errorIdentificationContent: Record<string, ErrorIdentificationContent> = {
  // Treatment Setup Errors
  'treatment_setup_errors': {
    id: 'treatment_setup_errors',
    title: 'Treatment Setup Error Identification',
    description: 'Identify potential errors in this patient treatment setup that could affect treatment quality or safety.',
    imageUrl: '/images/extensions/errors/treatment_setup.jpg',
    imageWidth: 800,
    imageHeight: 600,
    scenario: 'This patient is being set up for a head and neck IMRT treatment. The therapists have positioned the patient and are preparing to begin treatment. Identify any errors in the setup.',
    difficulty: 'medium',
    conceptId: 'patient-positioning',
    domain: 'radiation-therapy',
    hint: 'Look for issues with immobilization, positioning landmarks, and equipment setup.',
    correctMessage: 'Well done. You\'ve correctly identified all the critical errors that could impact treatment delivery.',
    incorrectMessage: 'You missed some critical errors that could significantly impact treatment quality and safety.',
    errors: [
      {
        id: 'thermoplastic_mask',
        description: 'Thermoplastic mask is not properly secured on the right side',
        position: { x: 320, y: 150, width: 80, height: 60 },
        isCritical: true,
        hint: 'Check the immobilization device attachment points'
      },
      {
        id: 'couch_position',
        description: 'Treatment couch position does not match setup values',
        position: { x: 120, y: 400, width: 100, height: 40 },
        isCritical: true,
        hint: 'Verify the digital readout of couch coordinates'
      },
      {
        id: 'bolus_missing',
        description: 'Bolus material is missing from treatment field',
        position: { x: 380, y: 220, width: 90, height: 50 },
        isCritical: true,
        hint: 'Check if all additional treatment materials are in place'
      },
      {
        id: 'setup_field',
        description: 'Setup field parameters don\'t match prescription',
        position: { x: 600, y: 250, width: 120, height: 40 },
        isCritical: false,
        hint: 'Compare the field size parameters with the prescription'
      },
      {
        id: 'wrong_accessory',
        description: 'Incorrect accessory tray inserted',
        position: { x: 500, y: 350, width: 70, height: 60 },
        isCritical: false,
        hint: 'Verify that the inserted accessory matches the treatment plan'
      }
    ]
  },
  
  // QA Procedure Errors
  'qa_procedure_errors': {
    id: 'qa_procedure_errors',
    title: 'Quality Assurance Procedure Errors',
    description: 'Review this QA procedure and identify errors that could lead to incorrect measurements.',
    imageUrl: '/images/extensions/errors/qa_setup.jpg',
    imageWidth: 900,
    imageHeight: 700,
    scenario: 'A physicist is performing monthly QA measurements on a linear accelerator. Identify errors in the measurement setup and procedure.',
    difficulty: 'hard',
    conceptId: 'quality-assurance',
    domain: 'dosimetry',
    timeLimit: 180, // 3 minutes
    hint: 'Pay attention to chamber positioning, buildup material, and measurement conditions.',
    errors: [
      {
        id: 'chamber_orientation',
        description: 'Chamber is oriented incorrectly relative to beam axis',
        position: { x: 400, y: 250, width: 70, height: 40 },
        isCritical: true,
        hint: 'Check the orientation of the ionization chamber'
      },
      {
        id: 'insufficient_buildup',
        description: 'Insufficient buildup material for the beam energy',
        position: { x: 380, y: 300, width: 100, height: 50 },
        isCritical: true,
        hint: 'Verify that buildup material is appropriate for the beam energy'
      },
      {
        id: 'wrong_cable',
        description: 'Wrong extension cable used for electrometer',
        position: { x: 560, y: 450, width: 80, height: 30 },
        isCritical: false,
        hint: 'Examine the cable connections'
      },
      {
        id: 'field_size',
        description: 'Field size does not match reference conditions',
        position: { x: 300, y: 200, width: 120, height: 60 },
        isCritical: true,
        hint: 'Compare field size settings with reference values'
      },
      {
        id: 'electrometer_settings',
        description: 'Electrometer settings incorrect for collected charge',
        position: { x: 650, y: 350, width: 90, height: 60 },
        isCritical: true,
        hint: 'Check the electrometer range and collection mode'
      },
      {
        id: 'phantom_alignment',
        description: 'Water phantom not properly leveled',
        position: { x: 250, y: 400, width: 100, height: 80 },
        isCritical: false,
        hint: 'Check the level of the water surface'
      }
    ]
  },
  
  // Treatment Planning Errors
  'treatment_planning_errors': {
    id: 'treatment_planning_errors',
    title: 'Treatment Planning Error Identification',
    description: 'Review this treatment plan and identify potential errors that could affect treatment quality.',
    imageUrl: '/images/extensions/errors/treatment_plan.jpg',
    imageWidth: 1024,
    imageHeight: 768,
    scenario: 'A treatment plan for a prostate case has been created. Before approval, identify any errors or issues in the plan.',
    difficulty: 'hard',
    conceptId: 'treatment-planning',
    domain: 'clinical-practice',
    hint: 'Consider dose constraints, target coverage, and organ at risk sparing.',
    errors: [
      {
        id: 'ptv_coverage',
        description: 'PTV has inadequate coverage (less than 95%)',
        position: { x: 400, y: 300, width: 80, height: 60 },
        isCritical: true,
        hint: 'Examine the target coverage statistics'
      },
      {
        id: 'oar_constraint',
        description: 'Rectum exceeds dose constraint',
        position: { x: 350, y: 400, width: 70, height: 50 },
        isCritical: true,
        hint: 'Compare OAR doses with established constraints'
      },
      {
        id: 'heterogeneity_correction',
        description: 'Heterogeneity correction not enabled',
        position: { x: 700, y: 200, width: 90, height: 40 },
        isCritical: true,
        hint: 'Check calculation algorithm settings'
      },
      {
        id: 'hotspot',
        description: 'Unacceptable hotspot outside PTV',
        position: { x: 500, y: 350, width: 60, height: 60 },
        isCritical: false,
        hint: 'Look for areas of high dose outside the target volume'
      },
      {
        id: 'couch_structure',
        description: 'Treatment couch not included in calculation',
        position: { x: 300, y: 500, width: 100, height: 40 },
        isCritical: false,
        hint: 'Verify if all relevant structures are included in the calculation'
      }
    ]
  }
};

export default errorIdentificationContent; 