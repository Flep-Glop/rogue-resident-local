/**
 * Measurement Reading Content
 * 
 * Content definitions for the MeasurementReading extension type.
 * Provides realistic scenarios for measurement interpretation.
 */

// Define the measurement reading content type
export interface MeasurementContent {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  instruments: MeasurementInstrument[];
  questions: MeasurementQuestion[];
  timeLimit?: number; // Optional time limit in seconds
  conceptId: string;
  domain: string;
  hint?: string;
  instructions?: string;
}

// Instrument display definition
export interface MeasurementInstrument {
  id: string;
  type: 'digital' | 'analog' | 'hybrid';
  name: string;
  imageUrl: string;
  readingValue: number | string;
  readingUnit: string;
  precision: number;
  isMainReading?: boolean;
  displayFormat?: string;
}

// Question about the measurement
export interface MeasurementQuestion {
  id: string;
  text: string;
  type: 'numeric' | 'multiple-choice' | 'range';
  correctAnswer: number | string | [number, number];
  tolerance?: number | [number, number]; // Allowed deviation for numeric answers
  options?: string[]; // For multiple-choice questions
  explanation: string;
  unit?: string;
  isCritical?: boolean; // Indicates critical knowledge check
}

/**
 * Collection of measurement reading content
 */
const measurementContent: Record<string, MeasurementContent> = {
  // Electrometer Reading
  'electrometer_reading': {
    id: 'electrometer_reading',
    title: 'Electrometer Reading',
    description: 'Read and interpret an electrometer display to determine the charge collected from an ionization chamber.',
    difficulty: 'easy',
    conceptId: 'dosimetry',
    domain: 'radiation-physics',
    instructions: 'Read the values from the electrometer display and calculate the dose in cGy using the calibration factor.',
    instruments: [
      {
        id: 'electrometer_main',
        type: 'digital',
        name: 'Standard Therapy Electrometer',
        imageUrl: '/images/extensions/measurements/electrometer.jpg',
        readingValue: 3.574,
        readingUnit: 'nC',
        precision: 0.001,
        isMainReading: true
      },
      {
        id: 'calibration_certificate',
        type: 'hybrid',
        name: 'Calibration Certificate',
        imageUrl: '/images/extensions/measurements/calibration_cert.jpg',
        readingValue: '5.42 cGy/nC',
        readingUnit: 'cGy/nC',
        precision: 0.01
      }
    ],
    questions: [
      {
        id: 'charge_reading',
        text: 'What is the collected charge reading from the electrometer?',
        type: 'numeric',
        correctAnswer: 3.574,
        tolerance: 0.002,
        unit: 'nC',
        explanation: 'The electrometer display shows 3.574 nC.'
      },
      {
        id: 'calibration_factor',
        text: 'What is the chamber calibration factor?',
        type: 'numeric',
        correctAnswer: 5.42,
        tolerance: 0.01,
        unit: 'cGy/nC',
        explanation: 'The calibration certificate shows 5.42 cGy/nC.'
      },
      {
        id: 'calculated_dose',
        text: 'Calculate the absorbed dose based on these readings.',
        type: 'numeric',
        correctAnswer: 19.37,
        tolerance: 0.1,
        unit: 'cGy',
        explanation: 'Dose = Charge × Calibration factor = 3.574 nC × 5.42 cGy/nC = 19.37 cGy',
        isCritical: true
      }
    ]
  },
  
  // TG-51 Measurement Set
  'tg51_measurement': {
    id: 'tg51_measurement',
    title: 'TG-51 Measurements',
    description: 'Read and interpret a set of measurements for TG-51 calibration protocol.',
    difficulty: 'medium',
    conceptId: 'output-calibration',
    domain: 'dosimetry',
    hint: 'Remember to apply all correction factors including PTP, Pion, and Ppol.',
    instruments: [
      {
        id: 'electrometer_reading',
        type: 'digital',
        name: 'Calibrated Electrometer',
        imageUrl: '/images/extensions/measurements/tg51_electrometer.jpg',
        readingValue: 12.87,
        readingUnit: 'nC',
        precision: 0.01,
        isMainReading: true
      },
      {
        id: 'barometer',
        type: 'analog',
        name: 'Barometer',
        imageUrl: '/images/extensions/measurements/barometer.jpg',
        readingValue: 752.1,
        readingUnit: 'mmHg',
        precision: 0.1
      },
      {
        id: 'thermometer',
        type: 'digital',
        name: 'Thermometer',
        imageUrl: '/images/extensions/measurements/thermometer.jpg',
        readingValue: 22.4,
        readingUnit: '°C',
        precision: 0.1
      },
      {
        id: 'polarity_reading',
        type: 'digital',
        name: 'Polarity Measurement',
        imageUrl: '/images/extensions/measurements/polarity.jpg',
        readingValue: '+12.87 nC / -12.81 nC',
        readingUnit: 'nC',
        precision: 0.01
      }
    ],
    questions: [
      {
        id: 'raw_reading',
        text: 'What is the raw charge reading?',
        type: 'numeric',
        correctAnswer: 12.87,
        tolerance: 0.01,
        unit: 'nC',
        explanation: 'The electrometer display shows 12.87 nC.'
      },
      {
        id: 'ptp_factor',
        text: 'Calculate the PTP correction factor. (P0 = 760 mmHg, T0 = 22°C)',
        type: 'numeric',
        correctAnswer: 1.013,
        tolerance: 0.005,
        explanation: 'PTP = (760/P) × ((273.2+T)/(273.2+T0)) = (760/752.1) × ((273.2+22.4)/(273.2+22)) = 1.013'
      },
      {
        id: 'ppol_factor',
        text: 'Calculate the polarity correction factor.',
        type: 'numeric',
        correctAnswer: 1.0023,
        tolerance: 0.001,
        explanation: 'Ppol = (|M+| + |M-|)/(2 × M) = (|12.87| + |-12.81|)/(2 × 12.87) = 1.0023'
      },
      {
        id: 'corrected_reading',
        text: 'What is the fully corrected reading?',
        type: 'numeric',
        correctAnswer: 13.06,
        tolerance: 0.05,
        unit: 'nC',
        explanation: 'Mcorr = M × PTP × Ppol = 12.87 × 1.013 × 1.0023 = 13.06 nC',
        isCritical: true
      }
    ]
  },
  
  // QA Constancy Check
  'qa_constancy': {
    id: 'qa_constancy',
    title: 'QA Constancy Check',
    description: 'Read and interpret multiple measurements from a daily QA check.',
    difficulty: 'easy',
    conceptId: 'daily-qa',
    domain: 'quality-assurance',
    instruments: [
      {
        id: 'photon_output',
        type: 'digital',
        name: 'Daily QA Device - Photon Output',
        imageUrl: '/images/extensions/measurements/daily_qa_photon.jpg',
        readingValue: '101.3%',
        readingUnit: '%',
        precision: 0.1,
        isMainReading: true
      },
      {
        id: 'electron_output',
        type: 'digital',
        name: 'Daily QA Device - Electron Output',
        imageUrl: '/images/extensions/measurements/daily_qa_electron.jpg',
        readingValue: '99.7%',
        readingUnit: '%',
        precision: 0.1
      },
      {
        id: 'flatness',
        type: 'digital',
        name: 'Daily QA Device - Flatness',
        imageUrl: '/images/extensions/measurements/daily_qa_flatness.jpg',
        readingValue: '100.9%',
        readingUnit: '%',
        precision: 0.1
      },
      {
        id: 'symmetry',
        type: 'digital',
        name: 'Daily QA Device - Symmetry',
        imageUrl: '/images/extensions/measurements/daily_qa_symmetry.jpg',
        readingValue: '101.6%',
        readingUnit: '%',
        precision: 0.1
      }
    ],
    questions: [
      {
        id: 'within_tolerance',
        text: 'Are all measurements within acceptable tolerance (±3%)?',
        type: 'multiple-choice',
        options: [
          'Yes, all measurements are within tolerance',
          'No, photon output exceeds tolerance',
          'No, electron output exceeds tolerance',
          'No, symmetry exceeds tolerance'
        ],
        correctAnswer: 'Yes, all measurements are within tolerance',
        explanation: 'All measurements are within the ±3% tolerance range.'
      },
      {
        id: 'highest_deviation',
        text: 'Which parameter shows the highest deviation from baseline?',
        type: 'multiple-choice',
        options: [
          'Photon Output',
          'Electron Output',
          'Flatness',
          'Symmetry'
        ],
        correctAnswer: 'Symmetry',
        explanation: 'Symmetry at 101.6% shows the highest deviation from the baseline value (100%).'
      },
      {
        id: 'action_needed',
        text: 'What action is needed based on these measurements?',
        type: 'multiple-choice',
        options: [
          'Immediate physicist consultation',
          'Machine recalibration',
          'Document readings and proceed with treatments',
          'Repeat measurements to confirm readings'
        ],
        correctAnswer: 'Document readings and proceed with treatments',
        explanation: 'Since all values are within tolerance, the appropriate action is to document the readings and proceed with treatments.',
        isCritical: true
      }
    ]
  }
};

export default measurementContent; 