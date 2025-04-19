/**
 * Simplified patterns for testing - matches actual node IDs in the implementation
 */

import { PatternFormation } from '@/app/components/knowledge/ConstellationPatternSystem';

// Pattern interface that matches the one in ConstellationPatternSystem
export interface SimplePattern {
  id: string;
  name: string;
  description: string;
  starIds: string[];
  connectionIds: string[];
  discovered: boolean;
  formation: PatternFormation;
  reward: {
    type: 'sp' | 'ability' | 'insight' | 'challenge_bonus';
    value: number | string;
    description: string;
  };
}

// Define simplified patterns using IDs that actually exist in the system
export const SIMPLE_PATTERNS: SimplePattern[] = [
  // ALARA Safety Triangle
  {
    id: 'simple-alara-triangle',
    name: 'ALARA Safety Triangle',
    description: 'As Low As Reasonably Achievable radiation safety principle',
    starIds: [
      'treatment-planning', // Treatment Planning
      'radiation-dosimetry', // Dosimetry
      'patient-positioning', // Patient Positioning
    ],
    connectionIds: [],
    discovered: false,
    formation: 'triangle',
    reward: {
      type: 'sp',
      value: 15,
      description: 'Improved safety understanding'
    }
  },
  
  // Treatment Delivery Chain
  {
    id: 'simple-treatment-chain',
    name: 'Treatment Delivery Chain',
    description: 'Basic flow of treatment delivery',
    starIds: [
      'treatment-planning', // Treatment Planning
      'radiation-therapy', // Radiation Therapy
      'delivery-techniques', // Delivery Techniques
      'treatment-protocols', // Treatment Protocols
    ],
    connectionIds: [],
    discovered: false,
    formation: 'chain',
    reward: {
      type: 'sp',
      value: 20,
      description: 'Improved treatment delivery understanding'
    }
  },
  
  // Quality Verification Circle
  {
    id: 'simple-qa-circle',
    name: 'Quality Verification Circle',
    description: 'Basic cycle of quality verification in radiation therapy',
    starIds: [
      'output-calibration', // Output Calibration 
      'radiation-therapy',  // Radiation Therapy
      'treatment-planning'  // Treatment Planning
    ],
    connectionIds: [],
    discovered: false,
    formation: 'circuit',
    reward: {
      type: 'sp',
      value: 25,
      description: 'Improved quality assurance understanding'
    }
  },
  
  // Plan Optimization Diamond
  {
    id: 'simple-plan-optimization',
    name: 'Plan Optimization Diamond',
    description: 'Key components of optimizing a treatment plan',
    starIds: [
      'treatment-planning',         // Treatment Planning
      'target-volumes',             // Target Volumes
      'multi-criteria-optimization', // Multi-Criteria Optimization
      'dose-constraints'            // Dose Constraints
    ],
    connectionIds: [],
    discovered: false,
    formation: 'circuit',
    reward: {
      type: 'sp',
      value: 30,
      description: 'Improved plan optimization understanding'
    }
  }
]; 