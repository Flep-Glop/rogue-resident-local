// app/components/extensions/content/anatomical.ts

/**
 * Anatomical Identification Extension Content
 * 
 * Collection of anatomical identification content for radiation therapy structures.
 */

// Content map indexed by content ID
const anatomicalContent: Record<string, any> = {
    // Head and Neck OARs
    'head_neck_oars': {
      id: 'head_neck_oars',
      title: 'Head & Neck Critical Structures',
      description: 'Identify the critical organs at risk (OARs) in this head and neck CT scan that must be considered during treatment planning.',
      
      imageUrl: '/images/extensions/anatomical/head_neck_ct.png',
      imageWidth: 600,
      imageHeight: 480,
      
      structures: [
        {
          id: 'parotid_left',
          name: 'Left Parotid Gland',
          labelPosition: { x: 120, y: 200 },
          regions: [
            { x: 140, y: 210, radius: 20 }
          ],
          isCritical: true,
          description: 'Major salivary gland. Dose constraints are important to reduce risk of xerostomia (dry mouth).'
        },
        {
          id: 'parotid_right',
          name: 'Right Parotid Gland',
          labelPosition: { x: 480, y: 200 },
          regions: [
            { x: 460, y: 210, radius: 20 }
          ],
          isCritical: true,
          description: 'Major salivary gland. Dose constraints are important to reduce risk of xerostomia (dry mouth).'
        },
        {
          id: 'spinal_cord',
          name: 'Spinal Cord',
          labelPosition: { x: 300, y: 320 },
          regions: [
            { x: 300, y: 320, radius: 12 }
          ],
          isCritical: true,
          description: 'Critical neural structure with a maximum dose constraint. Exceeding tolerance can result in myelopathy.'
        },
        {
          id: 'brainstem',
          name: 'Brainstem',
          labelPosition: { x: 300, y: 150 },
          regions: [
            { x: 300, y: 150, radius: 18 }
          ],
          isCritical: true,
          description: 'Neural structure connecting the brain to the spinal cord. Has strict dose constraints.'
        },
        {
          id: 'mandible',
          name: 'Mandible',
          labelPosition: { x: 300, y: 240 },
          regions: [
            { x: 230, y: 250, radius: 15 },
            { x: 370, y: 250, radius: 15 }
          ],
          isCritical: false,
          description: 'Bone structure forming the lower jaw. Dose constraints help prevent osteoradionecrosis.'
        },
        {
          id: 'oral_cavity',
          name: 'Oral Cavity',
          labelPosition: { x: 300, y: 210 },
          regions: [
            { x: 300, y: 225, radius: 25 }
          ],
          isCritical: false,
          description: 'Includes the tongue and other oral structures. Dose constraints help preserve taste and function.'
        },
        {
          id: 'larynx',
          name: 'Larynx',
          labelPosition: { x: 300, y: 280 },
          regions: [
            { x: 300, y: 280, radius: 15 }
          ],
          isCritical: false,
          description: 'Voice box structure. Dose constraints help preserve speech and swallowing function.'
        }
      ],
      
      conceptId: 'oar_identification',
      difficulty: 'medium',
      domain: 'radiation-therapy',
      hint: 'Look for paired structures on either side of the head that help produce saliva, and the critical neural structure in the center.'
    },
    
    // Prostate Region
    'prostate_region': {
      id: 'prostate_region',
      title: 'Prostate Treatment Planning Structures',
      description: 'Identify the target volume and surrounding organs at risk in this prostate CT scan.',
      
      imageUrl: '/images/extensions/anatomical/prostate_ct.png',
      imageWidth: 600,
      imageHeight: 480,
      
      structures: [
        {
          id: 'prostate',
          name: 'Prostate (CTV)',
          labelPosition: { x: 300, y: 240 },
          regions: [
            { x: 300, y: 240, radius: 25 }
          ],
          isCritical: true,
          description: 'Clinical Target Volume containing the prostate gland and potentially seminal vesicles.'
        },
        {
          id: 'bladder',
          name: 'Bladder',
          labelPosition: { x: 300, y: 180 },
          regions: [
            { x: 300, y: 180, radius: 30 }
          ],
          isCritical: true,
          description: 'Hollow organ that stores urine. Dose constraints help prevent radiation cystitis.'
        },
        {
          id: 'rectum',
          name: 'Rectum',
          labelPosition: { x: 300, y: 310 },
          regions: [
            { x: 300, y: 310, radius: 20 }
          ],
          isCritical: true,
          description: 'Terminal part of the large intestine. Dose constraints help prevent radiation proctitis.'
        },
        {
          id: 'femoral_head_left',
          name: 'Left Femoral Head',
          labelPosition: { x: 200, y: 350 },
          regions: [
            { x: 200, y: 350, radius: 20 }
          ],
          isCritical: false,
          description: 'Proximal end of the femur. Dose constraints help prevent fractures and necrosis.'
        },
        {
          id: 'femoral_head_right',
          name: 'Right Femoral Head',
          labelPosition: { x: 400, y: 350 },
          regions: [
            { x: 400, y: 350, radius: 20 }
          ],
          isCritical: false,
          description: 'Proximal end of the femur. Dose constraints help prevent fractures and necrosis.'
        },
        {
          id: 'penile_bulb',
          name: 'Penile Bulb',
          labelPosition: { x: 300, y: 270 },
          regions: [
            { x: 300, y: 270, radius: 10 }
          ],
          isCritical: false,
          description: 'Proximal end of the corpus spongiosum. Dose constraints may help preserve sexual function.'
        }
      ],
      
      conceptId: 'prostate_planning',
      difficulty: 'medium',
      domain: 'treatment-planning',
      hint: 'Focus on identifying the centrally located target (prostate) and the critical hollow organs superior (bladder) and posterior (rectum) to it.'
    },
    
    // Brain Tumor Planning
    'brain_tumor_planning': {
      id: 'brain_tumor_planning',
      title: 'Brain Tumor Planning Structures',
      description: 'Identify the tumor and critical neural structures that must be protected during brain radiotherapy.',
      
      imageUrl: '/images/extensions/anatomical/brain_mri.png',
      imageWidth: 600,
      imageHeight: 480,
      
      structures: [
        {
          id: 'gtv',
          name: 'Gross Tumor Volume',
          labelPosition: { x: 350, y: 220 },
          regions: [
            { x: 350, y: 220, radius: 22 }
          ],
          isCritical: true,
          description: 'The visible tumor volume as seen on imaging studies.'
        },
        {
          id: 'brainstem',
          name: 'Brainstem',
          labelPosition: { x: 300, y: 330 },
          regions: [
            { x: 300, y: 330, radius: 18 }
          ],
          isCritical: true,
          description: 'Neural structure connecting the brain to the spinal cord. Has strict dose constraints.'
        },
        {
          id: 'optic_chiasm',
          name: 'Optic Chiasm',
          labelPosition: { x: 300, y: 260 },
          regions: [
            { x: 300, y: 260, radius: 10 }
          ],
          isCritical: true,
          description: 'Junction of the optic nerves. Critical for vision, with strict dose constraints.'
        },
        {
          id: 'optic_nerve_left',
          name: 'Left Optic Nerve',
          labelPosition: { x: 270, y: 240 },
          regions: [
            { x: 270, y: 240, radius: 8 }
          ],
          isCritical: true,
          description: 'Transmits visual information from the eye to the brain. Critical for vision.'
        },
        {
          id: 'optic_nerve_right',
          name: 'Right Optic Nerve',
          labelPosition: { x: 330, y: 240 },
          regions: [
            { x: 330, y: 240, radius: 8 }
          ],
          isCritical: true,
          description: 'Transmits visual information from the eye to the brain. Critical for vision.'
        },
        {
          id: 'cochlea_left',
          name: 'Left Cochlea',
          labelPosition: { x: 230, y: 300 },
          regions: [
            { x: 230, y: 300, radius: 8 }
          ],
          isCritical: false,
          description: 'Inner ear organ responsible for hearing. Dose constraints help preserve auditory function.'
        },
        {
          id: 'cochlea_right',
          name: 'Right Cochlea',
          labelPosition: { x: 370, y: 300 },
          regions: [
            { x: 370, y: 300, radius: 8 }
          ],
          isCritical: false,
          description: 'Inner ear organ responsible for hearing. Dose constraints help preserve auditory function.'
        },
        {
          id: 'pituitary',
          name: 'Pituitary Gland',
          labelPosition: { x: 300, y: 280 },
          regions: [
            { x: 300, y: 280, radius: 7 }
          ],
          isCritical: false,
          description: 'Endocrine gland that regulates many hormonal functions. Dose constraints help prevent endocrine dysfunction.'
        }
      ],
      
      conceptId: 'cranial_oar_identification',
      difficulty: 'hard',
      domain: 'treatment-planning',
      hint: 'Identify the tumor (GTV) and focus on the small but critical neural structures involved in vision.'
    }
  };
  
  export default anatomicalContent;