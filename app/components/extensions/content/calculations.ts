// app/components/extensions/content/calculations.ts

/**
 * Calculation Extension Content
 * 
 * Collection of calculation interface content for medical physics calculations.
 */

// Content map indexed by content ID
const calculationContent: Record<string, any> = {
    // Half-Value Layer (HVL) calculation
    'hvl_calculation': {
      id: 'hvl_calculation',
      title: 'Half-Value Layer Calculation',
      description: 'Calculate the Half-Value Layer (HVL) of the beam based on transmission measurements.',
      
      formula: {
        display: 'I = I$0$ × e^(-$mu$ × $x$)',
        variables: [
          {
            id: 'I0',
            label: 'I₀',
            value: null,
            unit: 'nC',
            isInput: true,
            isTarget: false,
            hint: 'This is the initial intensity without any attenuation material.'
          },
          {
            id: 'I',
            label: 'I',
            value: null,
            unit: 'nC',
            isInput: true,
            isTarget: false,
            hint: 'This is the intensity after passing through the attenuator.'
          },
          {
            id: 'mu',
            label: 'μ',
            value: null,
            unit: 'cm⁻¹',
            isInput: true,
            isTarget: false,
            hint: 'This is the linear attenuation coefficient of the material.'
          },
          {
            id: 'x',
            label: 'x',
            value: null,
            unit: 'cm',
            isInput: false,
            isTarget: true,
            hint: 'Solve for x using the formula: x = -ln(I/I₀)/μ',
            range: {
              min: 0.1,
              max: 5.0
            }
          }
        ],
        steps: [
          {
            id: 'step1',
            description: 'Rearrange the formula I = I₀ × e^(-μx) to solve for x.',
            hint: 'Divide both sides by I₀ first.'
          },
          {
            id: 'step2',
            description: 'Take the natural logarithm of both sides.',
            hint: 'ln(I/I₀) = -μx'
          },
          {
            id: 'step3',
            description: 'Solve for x by dividing by -μ.',
            hint: 'x = -ln(I/I₀)/μ'
          }
        ]
      },
      
      conceptId: 'hvl_measurement',
      difficulty: 'medium',
      domain: 'dosimetry',
      
      solutions: [
        {
          label: 'HVL',
          value: 0.693,
          unit: 'cm',
          isValid: true,
          insightValue: 15
        }
      ]
    },
    
    // Monitor Unit (MU) calculation
    'monitor_units_calculation': {
      id: 'monitor_units_calculation',
      title: 'Monitor Unit Calculation',
      description: 'Calculate the monitor units required to deliver the prescribed dose.',
      
      formula: {
        display: 'MU = $dose$ / ($calibration$ × $tpr$ × $scatter$)',
        variables: [
          {
            id: 'dose',
            label: 'Dose',
            value: null,
            unit: 'Gy',
            isInput: true,
            isTarget: false,
            hint: 'This is the prescribed dose to be delivered to the target.'
          },
          {
            id: 'calibration',
            label: 'Cal',
            value: null,
            unit: 'Gy/MU',
            isInput: true,
            isTarget: false,
            hint: 'This is the calibration factor that converts MU to dose.'
          },
          {
            id: 'tpr',
            label: 'TPR',
            value: null,
            unit: '',
            isInput: true,
            isTarget: false,
            hint: 'This is the tissue-phantom ratio for the treatment depth.'
          },
          {
            id: 'scatter',
            label: 'Sc,p',
            value: null,
            unit: '',
            isInput: true,
            isTarget: false,
            hint: 'This is the total scatter factor for the field size.'
          },
          {
            id: 'mu',
            label: 'MU',
            value: null,
            unit: '',
            isInput: false,
            isTarget: true,
            hint: 'Divide the prescribed dose by the product of calibration, TPR, and scatter factor.',
            range: {
              min: 50,
              max: 500
            }
          }
        ],
        steps: [
          {
            id: 'step1',
            description: 'Identify the parameters needed for the MU calculation.',
            hint: 'You need prescribed dose, calibration factor, tissue-phantom ratio, and scatter factor.'
          },
          {
            id: 'step2',
            description: 'Apply the formula: MU = Dose / (Cal × TPR × Sc,p).',
            hint: 'Make sure all units are consistent before calculation.'
          },
          {
            id: 'step3',
            description: 'Round to the nearest whole number, as most treatment machines use integer MU values.',
            hint: 'Linacs typically deliver whole MU values.'
          }
        ]
      },
      
      conceptId: 'monitor_unit_calculation',
      difficulty: 'hard',
      domain: 'treatment-planning',
      
      solutions: [
        {
          label: 'MU',
          value: 267.86,
          unit: '',
          isValid: true,
          insightValue: 20
        }
      ]
    },
    
    // Output Calibration Factor
    'output_factor_calculation': {
      id: 'output_factor_calculation',
      title: 'Output Factor Determination',
      description: 'Calculate the output factor based on field size measurements.',
      
      formula: {
        display: 'OF = $reading_test$ / $reading_ref$ × $correction$',
        variables: [
          {
            id: 'reading_test',
            label: 'Test Reading',
            value: null,
            unit: 'nC',
            isInput: true,
            isTarget: false,
            hint: 'This is the ionization reading for the test field size.'
          },
          {
            id: 'reading_ref',
            label: 'Reference Reading',
            value: null,
            unit: 'nC',
            isInput: true,
            isTarget: false,
            hint: 'This is the ionization reading for the reference field size.'
          },
          {
            id: 'correction',
            label: 'PTP',
            value: null,
            unit: '',
            isInput: true,
            isTarget: false,
            hint: 'This is the pressure-temperature-polarization correction factor.'
          },
          {
            id: 'of',
            label: 'OF',
            value: null,
            unit: '',
            isInput: false,
            isTarget: true,
            hint: 'Divide the test reading by the reference reading and multiply by the correction factor.',
            range: {
              min: 0.7,
              max: 1.2
            }
          }
        ],
        steps: [
          {
            id: 'step1',
            description: 'Normalize the test field reading to the reference field reading.',
            hint: 'Divide the test reading by the reference reading.'
          },
          {
            id: 'step2',
            description: 'Apply any necessary correction factors.',
            hint: 'Multiply by the PTP correction factor if conditions changed between measurements.'
          }
        ]
      },
      
      conceptId: 'output_factors',
      difficulty: 'easy',
      domain: 'dosimetry',
      
      solutions: [
        {
          label: 'OF',
          value: 0.853,
          unit: '',
          isValid: true,
          insightValue: 10
        }
      ]
    },
    
    // Percent Depth Dose calculation
    'pdd_calculation': {
      id: 'pdd_calculation',
      title: 'Percent Depth Dose Calculation',
      description: 'Calculate the percent depth dose (PDD) at a specified depth.',
      
      formula: {
        display: 'PDD = $dose_depth$ / $dose_max$ × 100%',
        variables: [
          {
            id: 'dose_depth',
            label: 'Dose at depth',
            value: null,
            unit: 'Gy',
            isInput: true,
            isTarget: false,
            hint: 'This is the dose at the specified depth.'
          },
          {
            id: 'dose_max',
            label: 'Dose at dmax',
            value: null,
            unit: 'Gy',
            isInput: true,
            isTarget: false,
            hint: 'This is the maximum dose, typically at the depth of dose maximum.'
          },
          {
            id: 'pdd',
            label: 'PDD',
            value: null,
            unit: '%',
            isInput: false,
            isTarget: true,
            hint: 'Divide the dose at depth by the dose at dmax and multiply by 100.',
            range: {
              min: 0,
              max: 100
            }
          }
        ],
        steps: [
          {
            id: 'step1',
            description: 'Divide the dose at the specified depth by the dose at dmax.',
            hint: 'Make sure both doses are in the same units.'
          },
          {
            id: 'step2',
            description: 'Multiply by 100 to convert to a percentage.',
            hint: 'The result should be between 0% and 100%.'
          }
        ]
      },
      
      conceptId: 'percent_depth_dose',
      difficulty: 'easy',
      domain: 'dosimetry',
      
      solutions: [
        {
          label: 'PDD',
          value: 67.5,
          unit: '%',
          isValid: true,
          insightValue: 10
        }
      ]
    },
    
    // Effective Dose calculation
    'effective_dose_calculation': {
      id: 'effective_dose_calculation',
      title: 'Effective Dose Calculation',
      description: 'Calculate the effective dose using tissue weighting factors.',
      
      formula: {
        display: 'E = Σ ($tissue_dose$ × $wt$)',
        variables: [
          {
            id: 'tissue_dose_1',
            label: 'Lung Dose',
            value: null,
            unit: 'Gy',
            isInput: true,
            isTarget: false,
            hint: 'This is the equivalent dose to the lungs.'
          },
          {
            id: 'wt_1',
            label: 'wT (Lung)',
            value: 0.12,
            unit: '',
            isInput: false,
            isTarget: false,
            hint: 'This is the tissue weighting factor for lungs.'
          },
          {
            id: 'tissue_dose_2',
            label: 'Breast Dose',
            value: null,
            unit: 'Gy',
            isInput: true,
            isTarget: false,
            hint: 'This is the equivalent dose to the breast.'
          },
          {
            id: 'wt_2',
            label: 'wT (Breast)',
            value: 0.12,
            unit: '',
            isInput: false,
            isTarget: false,
            hint: 'This is the tissue weighting factor for breast.'
          },
          {
            id: 'effective_dose',
            label: 'E',
            value: null,
            unit: 'Sv',
            isInput: false,
            isTarget: true,
            hint: 'Sum the products of tissue doses and their respective weighting factors.',
            range: {
              min: 0,
              max: 1
            }
          }
        ],
        steps: [
          {
            id: 'step1',
            description: 'Multiply each tissue dose by its respective weighting factor.',
            hint: 'Lung dose × 0.12 and Breast dose × 0.12.'
          },
          {
            id: 'step2',
            description: 'Sum all the weighted doses to get the effective dose.',
            hint: 'E = (Lung dose × 0.12) + (Breast dose × 0.12)'
          }
        ]
      },
      
      conceptId: 'effective_dose',
      difficulty: 'medium',
      domain: 'radiation-therapy',
      
      solutions: [
        {
          label: 'E',
          value: 0.18,
          unit: 'Sv',
          isValid: true,
          insightValue: 15
        }
      ]
    }
  };
  
  export default calculationContent;