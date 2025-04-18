// app/components/extensions/content/equipment.ts

/**
 * Equipment Identification Extension Content
 * 
 * Collection of equipment identification content for medical physics devices and components.
 */

// Content map indexed by content ID
const equipmentContent: Record<string, any> = {
    // Linear Accelerator Components
    'linac_components': {
      id: 'linac_components',
      title: 'Linear Accelerator Components',
      description: 'Identify the key components of a modern linear accelerator used in radiation therapy.',
      
      imageUrl: '/items/linac.png',
      imageWidth: 512,
      imageHeight: 512,
      
      components: [
        {
          id: 'treatment_head',
          name: 'Treatment Head',
          description: 'Rotational component that houses the treatment head and beam generation components. Allows the beam to be directed from different angles around the patient.',
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
          position: { x: 15, y: 180, width: 100, height: 100 },
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
      
      conceptId: 'linac_components',
      difficulty: 'medium',
      domain: 'linac-anatomy',
      sequenceRequired: true,
      hint: 'Start with the treatment head, then identify the imaging components used for patient positioning and verification.'
    },
    
    // Brachytherapy Equipment
    'brachytherapy_equipment': {
      id: 'brachytherapy_equipment',
      title: 'HDR Brachytherapy Equipment',
      description: 'Identify the key components of a High Dose Rate (HDR) brachytherapy system.',
      
      imageUrl: '/images/extensions/equipment/brachytherapy_system.png',
      imageWidth: 800,
      imageHeight: 500,
      
      components: [
        {
          id: 'afterloader',
          name: 'Remote Afterloader',
          description: 'Computer-controlled device that stores the radioactive source and delivers it through transfer tubes to specific positions within applicators.',
          position: { x: 200, y: 150, width: 180, height: 200 },
          isCritical: true,
          order: 1
        },
        {
          id: 'source',
          name: 'Radiation Source',
          description: 'Typically Iridium-192, a high-activity gamma-emitting radioisotope attached to a cable for remote positioning.',
          position: { x: 240, y: 200, width: 50, height: 50 },
          isCritical: true,
          order: 2
        },
        {
          id: 'transfer_tubes',
          name: 'Transfer Tubes',
          description: 'Flexible tubes that guide the source from the afterloader to the applicators inserted in the patient.',
          position: { x: 400, y: 180, width: 150, height: 40 },
          isCritical: true,
          order: 3
        },
        {
          id: 'applicators',
          name: 'Applicators',
          description: 'Specialized devices inserted into body cavities or tissues to position the radiation source near the tumor.',
          position: { x: 600, y: 200, width: 120, height: 80 },
          isCritical: true,
          order: 4
        },
        {
          id: 'control_unit',
          name: 'Control Console',
          description: 'Computer system used to plan and control the treatment, including dwell positions and times.',
          position: { x: 350, y: 400, width: 150, height: 80 },
          isCritical: false,
          order: 5
        },
        {
          id: 'emergency_container',
          name: 'Emergency Safe',
          description: 'Shielded container used to safely store the source in case of equipment failure or emergency.',
          position: { x: 50, y: 300, width: 100, height: 100 },
          isCritical: false,
          order: 6
        },
        {
          id: 'radiation_monitor',
          name: 'Radiation Monitor',
          description: 'Device that continuously measures radiation levels in the treatment room to ensure safety.',
          position: { x: 680, y: 80, width: 80, height: 60 },
          isCritical: false,
          order: 7
        }
      ],
      
      conceptId: 'brachytherapy_equipment',
      difficulty: 'hard',
      domain: 'radiation-therapy',
      sequenceRequired: true,
      hint: 'Start with the main device that houses and controls the radioactive source, then follow the path of the source to the patient.'
    },
    
    // Dosimetry Equipment
    'dosimetry_equipment': {
      id: 'dosimetry_equipment',
      title: 'Radiation Dosimetry Equipment',
      description: 'Identify the devices used for radiation measurement and calibration.',
      
      imageUrl: '/images/extensions/equipment/dosimetry_equipment.png',
      imageWidth: 800,
      imageHeight: 600,
      
      components: [
        {
          id: 'ionization_chamber',
          name: 'Farmer-Type Ionization Chamber',
          description: 'Cylindrical gas-filled cavity with electrodes used for absolute dose measurements in radiotherapy beams.',
          position: { x: 100, y: 150, width: 150, height: 80 },
          isCritical: true,
          order: 1
        },
        {
          id: 'electrometer',
          name: 'Electrometer',
          description: 'Precision device for measuring the charge or current produced in an ionization chamber when exposed to radiation.',
          position: { x: 300, y: 150, width: 120, height: 100 },
          isCritical: true,
          order: 2
        },
        {
          id: 'water_phantom',
          name: 'Water Phantom',
          description: 'Tank filled with water used for radiation beam measurements, as water closely approximates human tissue.',
          position: { x: 500, y: 200, width: 200, height: 150 },
          isCritical: true,
          order: 3
        },
        {
          id: 'scanning_system',
          name: '3D Scanning System',
          description: 'Motorized system that precisely positions detectors within the water phantom for beam profile measurements.',
          position: { x: 550, y: 250, width: 100, height: 50 },
          isCritical: false,
          order: 4
        },
        {
          id: 'radiochromic_film',
          name: 'Radiochromic Film',
          description: 'Self-developing film that changes color in proportion to radiation dose, used for 2D dose distribution verification.',
          position: { x: 150, y: 300, width: 100, height: 50 },
          isCritical: false,
          order: 5
        },
        {
          id: 'tld_reader',
          name: 'TLD Reader',
          description: 'Device that heats thermoluminescent dosimeters (TLDs) and measures the light emitted, which is proportional to radiation dose.',
          position: { x: 300, y: 350, width: 120, height: 80 },
          isCritical: false,
          order: 6
        },
        {
          id: 'diode_array',
          name: 'Diode Array',
          description: 'Matrix of semiconductor detectors used for rapid verification of radiation treatment plans.',
          position: { x: 450, y: 400, width: 150, height: 100 },
          isCritical: false,
          order: 7
        }
      ],
      
      conceptId: 'dosimetry_equipment',
      difficulty: 'medium',
      domain: 'dosimetry',
      sequenceRequired: false,
      hint: 'Focus on identifying the standard equipment used for radiation calibration, starting with the chamber used for absolute dose measurements.'
    }
  };
  
  export default equipmentContent;