/**
 * Equipment Identification Extension Content
 * 
 * Collection of equipment identification interface content for medical physics equipment.
 * Simplified version focused on basic component identification.
 */

// Import equipment content from the equipment.ts file
import equipmentContent from './equipment';

// Content map indexed by content ID
const equipmentIdentificationContent: Record<string, any> = {
  // Import equipment content items that should be available in identification challenges
  ...equipmentContent,
  
  // Add alias for linac_components to ensure both IDs work
  'linac_components': equipmentContent['linac_components'],
  
  // Linear Accelerator (LINAC) components
  'linac_components_basic': {
    id: 'linac_components_basic',
    title: 'Linear Accelerator Components',
    description: 'Identify the key components of a medical linear accelerator used in radiation therapy treatments.',
    imageUrl: '/items/linac.png',
    imageWidth: 512,
    imageHeight: 512,
    conceptId: 'linac-anatomy',
    difficulty: 'medium',
    domain: 'radiation-therapy-equipment',
    
    components: [
      {
        id: 'treatment_head',
        name: 'Treatment Head',
        description: 'The rotating arm that houses the radiation source and can rotate 360 degrees around the patient.',
        position: { x: 20, y: 20, width: 300, height: 160 },
        isCritical: true,
        order: 1
      },
      {
        id: 'kv_tube',
        name: 'kV Tube',
        description: 'X-ray tube that generates kilovoltage imaging beams for patient positioning verification.',
        position: { x: 190, y: 200, width: 90, height: 60 },
        isCritical: true,
        order: 2
      },
      {
        id: 'kv_panel',
        name: 'kV Panel',
        description: 'Flat panel detector that captures kilovoltage X-ray images for patient positioning.',
        position: { x: 15, y: 180, width: 85, height: 100 },
        isCritical: true,
        order: 3
      },
      {
        id: 'mv_panel',
        name: 'MV Panel',
        description: 'Megavoltage imaging panel that can detect therapeutic beam for portal imaging.',
        position: { x: 95, y: 300, width: 130, height: 85 },
        isCritical: true,
        order: 4
      }
    ],
    
    educationalSteps: [
      {
        id: 'start-identification',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "Let's review the key components of a linear accelerator. First, can you locate the Treatment Head for me?",
        prompt: 'Click on the Treatment Head in the diagram',
        component: 'treatment_head',
        hint: "The Treatment Head is the large rotating arm that houses the radiation source and beam-shaping components."
      },
      {
        id: 'identify-kv-tube',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "Good. Now, where is the kV Tube located? This is an important component for imaging.",
        prompt: 'Click on the kV Tube in the diagram',
        component: 'kv_tube',
        hint: "The kV Tube generates kilovoltage X-rays used for patient positioning verification."
      },
      {
        id: 'identify-kv-panel',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "Excellent. Can you now identify the kV Panel? It works together with the kV Tube.",
        prompt: 'Click on the kV Panel in the diagram',
        component: 'kv_panel',
        hint: "The kV Panel is a detector that captures the kilovoltage X-ray images."
      },
      {
        id: 'identify-mv-panel',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "Very good. Where is the MV Panel located? This is used for a different type of imaging.",
        prompt: 'Click on the MV Panel in the diagram',
        component: 'mv_panel',
        hint: "The MV Panel detects the therapeutic megavoltage beam for portal imaging."
      },
      {
        id: 'mlc-question',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "Now let's test your knowledge. Which component contains the multi-leaf collimators (MLCs) that shape the treatment beam?",
        prompt: 'Click on the component that contains the multi-leaf collimators (MLCs)',
        component: 'treatment_head',
        hint: "MLCs are beam-shaping devices that conform the radiation field to the target volume."
      },
      {
        id: 'cbct-question-kv-tube',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "For Cone Beam CT (CBCT) imaging, we need two components working together. First, click on the component that generates the kV X-rays for CBCT.",
        prompt: 'Click on the component that generates X-rays for CBCT imaging',
        component: 'kv_tube',
        hint: "CBCT uses kilovoltage (kV) imaging. Which component generates the kV X-rays?"
      },
      {
        id: 'cbct-question-kv-panel',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "Now, click on the component that detects the X-rays to create the CBCT images.",
        prompt: 'Click on the component that detects X-rays for CBCT imaging',
        component: 'kv_panel',
        hint: "This component captures the kV X-rays after they pass through the patient."
      },
      {
        id: 'epid-question',
        type: 'COMPONENT_IDENTIFICATION',
        kapoorText: "Which component functions as the Electronic Portal Imaging Device (EPID) for capturing images using the treatment beam?",
        prompt: 'Click on the component that functions as the EPID',
        component: 'mv_panel',
        hint: "The EPID uses the megavoltage (MV) treatment beam to create portal images during treatment."
      },
      {
        id: 'clinical-applications',
        type: 'CLINICAL_APPLICATION',
        kapoorText: "Excellent job! Understanding these components is crucial for ensuring accurate treatment delivery.",
        prompt: "Why is it important for medical physicists to correctly identify these components?",
        options: [
          { 
            text: "For quality assurance, troubleshooting, and ensuring accurate image guidance for treatment",
            correct: true,
            feedback: "Exactly! Being able to identify components correctly is essential for performing QA, troubleshooting issues, and ensuring patient safety and treatment accuracy."
          },
          { 
            text: "Only for maintenance and repair purposes",
            correct: false,
            feedback: "That's not the complete picture. While maintenance is important, understanding components is crucial for clinical applications like quality assurance and treatment verification."
          },
          { 
            text: "Primarily for teaching and certification exams",
            correct: false,
            feedback: "While important for education, the primary clinical importance is ensuring quality assurance, troubleshooting, and accurate treatment delivery."
          }
        ],
        hint: "Think about the daily responsibilities of a medical physicist in a radiation therapy department."
      }
    ]
  }
};

export default equipmentIdentificationContent; 