// app/components/extensions/content/calculations.ts

/**
 * Calculation Extension Content
 * 
 * Collection of calculation interface content for medical physics calculations.
 * Enhanced with character-driven educational stages.
 * Improved character tone to maintain professionalism and rigor without sarcasm.
 */

// Content map indexed by content ID
const calculationContent: Record<string, any> = {
  // Half-Value Layer (HVL) calculation
  'hvl_calculation': {
    id: 'hvl_calculation',
    title: 'Half-Value Layer Calculation',
    description: 'Calculate the Half-Value Layer (HVL) of the beam based on transmission measurements. This fundamental calculation is essential for beam characterization and shielding design.',
    
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
    
    educationalSteps: [
      {
        id: 'formula-recognition',
        type: 'FORMULA_RECOGNITION',
        kapoorText: "Half-value layer calculations are fundamental to beam characterization. I'd like you to demonstrate your understanding of this important concept.",
        prompt: 'Which formula is used to calculate the Half-Value Layer (HVL)?',
        options: [
          { 
            text: 'x = -ln(I/I₀)/μ',
            correct: true,
            feedback: "Correct. This is one of the fundamentals that should become second nature with practice."
          },
          { 
            text: 'x = -ln(0.5)/μ',
            correct: false,
            feedback: "Not quite. While that would give you the HVL directly if you know μ, that's not how we calculate it from measured values. Understanding the derivation is important."
          },
          { 
            text: 'x = ln(I/I₀)/μ',
            correct: false,
            feedback: "Check your signs. Remember that intensity decreases with thickness - that's a negative exponent in the original exponential formula."
          }
        ],
        hint: "Try remembering what happens to intensity as it passes through a material. The relationship is exponential decay."
      },
      {
        id: 'parameter-identification',
        type: 'PARAMETER_IDENTIFICATION',
        kapoorText: "Now for the parameters. These calculations need to be precise for patient safety. What exactly do we need to measure?",
        prompt: 'Which parameters do we need to calculate the Half-Value Layer?',
        options: [
          { 
            text: 'Initial intensity (I₀), transmitted intensity (I), and attenuation coefficient (μ)',
            correct: true,
            feedback: "Correct. Each of these parameters is essential for an accurate calculation."
          },
          { 
            text: 'Only the attenuation coefficient (μ) is needed',
            correct: false,
            feedback: "That's insufficient. We need measured intensities to calculate the thickness directly."
          },
          { 
            text: 'Initial intensity (I₀) and final intensity (I) only',
            correct: false,
            feedback: "We also need the attenuation coefficient to properly characterize the material's properties."
          }
        ],
        hint: "Think about what you physically measure in the lab versus what you might look up in a reference."
      },
      {
        id: 'calculation-execution',
        type: 'CALCULATION_EXECUTION',
        kapoorText: "Let's apply the formula. Our measurement showed I₀ = 100 nC, I = 36.8 nC, with μ = 0.1 cm⁻¹. I need this result for a shielding calculation that's quite urgent.",
        prompt: 'Calculate the thickness using the provided values',
        hint: "Just plug the values into x = -ln(I/I₀)/μ and solve.",
        answer: 10,
        tolerance: 0.2
      },
      {
        id: 'clinical-judgment',
        type: 'CLINICAL_JUDGMENT',
        kapoorText: "Numbers without context lack meaning. What's the clinical application of this calculation?",
        prompt: 'What is the clinical significance of the Half-Value Layer?',
        options: [
          { 
            text: 'HVL is used for beam quality specification and shielding calculations',
            correct: true,
            feedback: "Correct. Now you're connecting the physics to practical applications."
          },
          { 
            text: 'HVL is primarily used to calculate patient dose',
            correct: false,
            feedback: "That's not its primary application. HVL characterizes the beam quality and is essential for shielding, but isn't directly used for patient dose calculations."
          },
          { 
            text: 'HVL is mainly used to calibrate ionization chambers',
            correct: false,
            feedback: "No, that's not correct. HVL is primarily used for beam quality characterization and shielding design, not chamber calibration."
          }
        ],
        hint: "Consider radiation protection applications and how we specify beam qualities."
      }
    ],
    
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
  
  // Basic Monitor Unit calculation for example dialogue
  'monitor_units_basic': {
    id: 'monitor_units_basic',
    title: 'Basic Monitor Unit Calculation',
    description: 'Calculate the monitor units required to deliver the prescribed dose to a patient. This is one of the most fundamental calculations in radiation therapy planning.',
    
    formula: {
      display: 'MU = $dose$ / ($output_factor$)',
      variables: [
        {
          id: 'dose',
          label: 'Prescribed Dose',
          value: 2.0,
          unit: 'Gy',
          isInput: true,
          isTarget: false,
          hint: 'This is the prescribed dose to be delivered to the target.'
        },
        {
          id: 'output_factor',
          label: 'Output Factor',
          value: 0.01,
          unit: 'Gy/MU',
          isInput: true,
          isTarget: false,
          hint: 'This is the calibration factor that converts MU to dose.'
        },
        {
          id: 'mu',
          label: 'MU',
          value: null,
          unit: '',
          isInput: false,
          isTarget: true,
          hint: 'Divide the prescribed dose by the output factor.',
          range: {
            min: 50,
            max: 500
          }
        }
      ],
      steps: [
        {
          id: 'step1',
          description: 'Review the prescribed dose and output factor.',
          hint: 'Make sure the units are consistent.'
        },
        {
          id: 'step2',
          description: 'Apply the formula: MU = Dose / Output Factor.',
          hint: 'With the example values: MU = 2.0 Gy / 0.01 Gy/MU'
        },
        {
          id: 'step3',
          description: 'Calculate the result and round to the nearest whole number if needed.',
          hint: 'With these values: MU = 200'
        }
      ]
    },
    
    educationalSteps: [
      {
        id: 'formula-recognition',
        type: 'FORMULA_RECOGNITION',
        kapoorText: "Calculate the monitor units required to deliver the prescribed dose to a patient. This is one of the most fundamental calculations in radiation therapy planning.",
        prompt: 'Which formula is correct for calculating Monitor Units in this basic scenario?',
        options: [
          { 
            text: 'MU = Prescribed Dose / Output Factor',
            correct: true,
            feedback: "Correct. This is the fundamental relationship we need to understand for treatment delivery."
          },
          { 
            text: 'MU = Prescribed Dose × Output Factor',
            correct: false,
            feedback: "Incorrect. Consider the units - Gy divided by Gy/MU gives you MU. This is important to understand conceptually."
          },
          { 
            text: 'MU = Output Factor / Prescribed Dose',
            correct: false,
            feedback: "That's reversed. Remember that MU is what we're solving for, and it needs to increase as the prescribed dose increases."
          }
        ],
        hint: "Look at the units. Output factor is in Gy/MU, so to isolate MU, you need to divide dose (Gy) by output factor (Gy/MU)."
      },
      {
        id: 'parameter-identification',
        type: 'PARAMETER_IDENTIFICATION',
        kapoorText: "What parameters do we need for this calculation?",
        prompt: 'What parameters do you need for this basic MU calculation?',
        options: [
          { 
            text: 'Prescribed dose (Gy) and output factor (Gy/MU)',
            correct: true,
            feedback: "Correct. These are the essential parameters for the basic calculation."
          },
          { 
            text: 'Only the prescribed dose is needed',
            correct: false,
            feedback: "We need the output factor as well. It's the conversion factor that relates machine output to delivered dose."
          },
          { 
            text: 'Prescribed dose, output factor, and beam energy',
            correct: false,
            feedback: "The beam energy affects the output factor, but we don't need it directly in the calculation. Keep it simple when you can."
          }
        ],
        hint: "Just look at the variables in the formula. What do you actually need to substitute values for?"
      },
      {
        id: 'calculation-execution',
        type: 'CALCULATION_EXECUTION',
        kapoorText: "Calculate the MUs for this patient treatment.",
        prompt: 'Calculate the Monitor Units needed for a prescribed dose of 2.0 Gy with an output factor of 0.01 Gy/MU',
        hint: "Just divide 2.0 Gy by 0.01 Gy/MU. The units will cancel appropriately.",
        answer: 200,
        tolerance: 1
      },
      {
        id: 'clinical-judgment',
        type: 'CLINICAL_JUDGMENT',
        kapoorText: "Why is this calculation clinically important?",
        prompt: 'What is the clinical significance of accurate MU calculations?',
        options: [
          { 
            text: 'They ensure the prescribed dose is delivered accurately to the tumor while minimizing unnecessary exposure to healthy tissues',
            correct: true,
            feedback: "Exactly. This is why we're meticulous about quality assurance. Patient safety and treatment efficacy depend on it."
          },
          { 
            text: 'They primarily help reduce treatment time and machine wear',
            correct: false,
            feedback: "While efficiency matters, the primary purpose is clinical accuracy and safety. We prioritize patient outcomes over machine considerations."
          },
          { 
            text: 'They are mainly used for billing purposes',
            correct: false,
            feedback: "No, these calculations are fundamental to treatment delivery. While billing may use this information, our primary concern is accurate treatment delivery."
          }
        ],
        hint: "Think about why precision matters in radiation oncology. What's at stake?"
      }
    ],
    
    conceptId: 'monitor_unit_calculation',
    difficulty: 'basic',
    domain: 'treatment-planning',
    
    solutions: [
      {
        label: 'MU',
        value: 200,
        unit: '',
        isValid: true,
        insightValue: 10
      }
    ]
  },
  
  // Advanced Monitor Unit (MU) calculation
  'monitor_units_calculation': {
    id: 'monitor_units_calculation',
    title: 'Monitor Unit Calculation',
    description: 'Calculate the monitor units required to deliver the prescribed dose for a head and neck treatment. This calculation incorporates tissue-phantom ratio and scatter factors for accurate dose delivery.',
    
    formula: {
      display: 'MU = $dose$ / ($calibration$ × $tpr$ × $scatter$)',
      variables: [
        {
          id: 'dose',
          label: 'Dose',
          value: 2.0,
          unit: 'Gy',
          isInput: true,
          isTarget: false,
          hint: 'This is the prescribed dose to be delivered to the target.'
        },
        {
          id: 'calibration',
          label: 'Cal',
          value: 0.01,
          unit: 'Gy/MU',
          isInput: true,
          isTarget: false,
          hint: 'This is the calibration factor that converts MU to dose.'
        },
        {
          id: 'tpr',
          label: 'TPR',
          value: 0.85,
          unit: '',
          isInput: true,
          isTarget: false,
          hint: 'This is the tissue-phantom ratio for the treatment depth.'
        },
        {
          id: 'scatter',
          label: 'Sc,p',
          value: 0.95,
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
    
    educationalSteps: [
      {
        id: 'formula-recognition',
        type: 'FORMULA_RECOGNITION',
        kapoorText: "What formula do we use for this calculation?",
        prompt: 'What is the correct formula for calculating Monitor Units in a clinical IMRT treatment?',
        options: [
          { 
            text: 'MU = Dose / (Calibration × TPR × Scatter)',
            correct: true,
            feedback: "Correct. This incorporates all the necessary factors for an accurate calculation."
          },
          { 
            text: 'MU = Dose × (Calibration × TPR × Scatter)',
            correct: false,
            feedback: "Incorrect. This would give you units of Gy² rather than MU. Always check your units."
          },
          { 
            text: 'MU = Dose / (Calibration + TPR + Scatter)',
            correct: false,
            feedback: "These factors multiply rather than add. Think about the physical meaning of each parameter."
          }
        ],
        hint: "Think of what units we want at the end. MU should be... well, MU."
      },
      {
        id: 'parameter-identification',
        type: 'PARAMETER_IDENTIFICATION',
        kapoorText: "What parameters do we need for this calculation?",
        prompt: 'Which factors are required for this head and neck IMRT MU calculation?',
        options: [
          { 
            text: 'Prescribed dose, calibration factor, tissue-phantom ratio, and scatter factor',
            correct: true,
            feedback: "Correct. Each of these parameters plays an important role in accurate dose delivery."
          },
          { 
            text: 'Only prescribed dose and calibration factor',
            correct: false,
            feedback: "That's incomplete. For clinical calculations, we need to account for tissue depth and field size effects."
          },
          { 
            text: 'Prescribed dose, calibration factor, patient weight, and TPR',
            correct: false,
            feedback: "Patient weight isn't directly used in MU calculations. We need the scatter factor instead."
          }
        ],
        hint: "Review the formula and identify which variables you need values for this specific calculation."
      },
      {
        id: 'calculation-execution',
        type: 'CALCULATION_EXECUTION',
        kapoorText: "Now calculate the monitor units using these values.",
        prompt: 'Calculate the Monitor Units needed for a head and neck treatment with prescribed dose of 2.0 Gy, calibration factor of 0.01 Gy/MU, TPR of 0.85, and scatter factor of 0.95',
        hint: "Multiply the denominator values first, then divide the dose by that result.",
        answer: 248,
        tolerance: 2
      },
      {
        id: 'clinical-judgment',
        type: 'CLINICAL_JUDGMENT',
        kapoorText: "Why does this calculation matter clinically?",
        prompt: 'What would happen if we used 230 MU instead of the calculated value?',
        options: [
          { 
            text: 'The tumor would receive less than the prescribed dose, potentially reducing treatment effectiveness',
            correct: true,
            feedback: "Correct. Precision matters in radiation oncology. Even small deviations can impact treatment outcomes."
          },
          { 
            text: 'It would have no significant clinical impact',
            correct: false,
            feedback: "A 7% dose difference is clinically significant. It could mean the difference between tumor control and recurrence."
          },
          { 
            text: 'The patient would receive a higher skin dose',
            correct: false,
            feedback: "Lower MUs means lower dose everywhere in the treatment field, not selective sparing."
          }
        ],
        hint: "Think about the relationship between MU and delivered dose. What happens when you reduce the MU?"
      }
    ],
    
    conceptId: 'monitor_unit_calculation',
    difficulty: 'hard',
    domain: 'treatment-planning',
    
    solutions: [
      {
        label: 'MU',
        value: 248,
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
    description: 'Calculate the output factor based on field size measurements. This is essential for accurate dose delivery with different field sizes.',
    
    formula: {
      display: 'OF = $reading_test$ / $reading_ref$ × $correction$',
      variables: [
        {
          id: 'reading_test',
          label: 'Test Reading',
          value: 85.3,
          unit: 'nC',
          isInput: true,
          isTarget: false,
          hint: 'This is the ionization reading for the test field size.'
        },
        {
          id: 'reading_ref',
          label: 'Reference Reading',
          value: 100.0,
          unit: 'nC',
          isInput: true,
          isTarget: false,
          hint: 'This is the ionization reading for the reference field size.'
        },
        {
          id: 'correction',
          label: 'PTP',
          value: 1.0,
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
    
    educationalSteps: [
      {
        id: 'formula-recognition',
        type: 'FORMULA_RECOGNITION',
        kapoorText: "Output factors - the bread and butter of commissioning. We perform this calculation hundreds of times during machine commissioning.",
        prompt: 'What is the correct formula for calculating an output factor?',
        options: [
          { 
            text: 'OF = (Test Reading / Reference Reading) × Correction Factor',
            correct: true,
            feedback: "Correct. This relative measurement approach normalizes against our reference conditions."
          },
          { 
            text: 'OF = (Reference Reading / Test Reading) × Correction Factor',
            correct: false,
            feedback: "You've inverted the ratio. Be careful with this - it would give you values above 1.0 for smaller fields, which is physically incorrect."
          },
          { 
            text: 'OF = Test Reading - Reference Reading',
            correct: false,
            feedback: "We're looking for a ratio, not a difference. Output factors are relative measurements."
          }
        ],
        hint: "Output factors are relative measurements. Think about what that means mathematically."
      },
      {
        id: 'parameter-identification',
        type: 'PARAMETER_IDENTIFICATION',
        kapoorText: "Let's identify what we need to measure. These values are essential for our commissioning report.",
        prompt: 'What parameters do you need to determine an output factor?',
        options: [
          { 
            text: 'Ionization reading for both test and reference fields, plus any correction factors',
            correct: true,
            feedback: "Correct. Don't forget the correction factors - environmental conditions can significantly affect chamber readings."
          },
          { 
            text: 'Only the test field reading is needed',
            correct: false,
            feedback: "That's insufficient. We need a reference measurement to establish the relative output."
          },
          { 
            text: 'Absolute dose measurements for both fields',
            correct: false,
            feedback: "Converting to dose adds unnecessary uncertainty. Raw ionization readings are sufficient for relative measurements."
          }
        ],
        hint: "We're making a relative measurement here. What's the bare minimum you need to measure?"
      },
      {
        id: 'calculation-execution',
        type: 'CALCULATION_EXECUTION',
        kapoorText: "The therapists are waiting for these values before they can treat. Let's calculate this promptly.",
        prompt: 'Calculate the output factor for a test field with reading 85.3 nC compared to a reference field with reading 100.0 nC. The PTP correction factor is 1.0.',
        hint: "Just divide 85.3 by 100 and multiply by 1.0.",
        answer: 0.853,
        tolerance: 0.001
      },
      {
        id: 'clinical-judgment',
        type: 'CLINICAL_JUDGMENT',
        kapoorText: "Values without context lack meaning. Why are these measurements so important clinically?",
        prompt: 'How are output factors used in clinical treatment planning?',
        options: [
          { 
            text: 'They are used to account for the change in beam output with field size in dose calculations',
            correct: true,
            feedback: "Correct. This is why we spend considerable time measuring them during commissioning. They're fundamental to accurate dose calculation."
          },
          { 
            text: 'They are primarily used for quality assurance but not for treatment planning',
            correct: false,
            feedback: "That's not accurate. We use them daily in treatment planning and occasionally verify them in QA."
          },
          { 
            text: 'They are used to adjust the linac output, not for planning',
            correct: false,
            feedback: "You're confusing output factors with calibration. We don't adjust the machine based on output factors - we account for them in our calculations."
          }
        ],
        hint: "Think about the treatment planning system. Where do these values get used?"
      }
    ],
    
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
    description: 'Calculate the percent depth dose (PDD) at a specified depth. This fundamental dosimetric parameter characterizes beam penetration and is essential for treatment planning.',
    
    formula: {
      display: 'PDD = $dose_depth$ / $dose_max$ × 100%',
      variables: [
        {
          id: 'dose_depth',
          label: 'Dose at depth',
          value: 1.35,
          unit: 'Gy',
          isInput: true,
          isTarget: false,
          hint: 'This is the dose at the specified depth.'
        },
        {
          id: 'dose_max',
          label: 'Dose at dmax',
          value: 2.0,
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
    
    educationalSteps: [
      {
        id: 'formula-recognition',
        type: 'FORMULA_RECOGNITION',
        kapoorText: "PDD calculations are foundational to our understanding of dose distribution. Let's ensure you've mastered this basic concept.",
        prompt: 'What is the correct formula for calculating Percent Depth Dose (PDD)?',
        options: [
          { 
            text: 'PDD = (Dose at depth / Dose at dmax) × 100%',
            correct: true,
            feedback: "Correct. This gives us a normalized value that characterizes beam penetration."
          },
          { 
            text: 'PDD = (Dose at dmax / Dose at depth) × 100%',
            correct: false,
            feedback: "That would give you the inverse of PDD. Values over 100% should signal that something's incorrect in your approach."
          },
          { 
            text: 'PDD = Dose at depth - Dose at dmax',
            correct: false,
            feedback: "That would give you a negative number for most depths. We need a relative measurement, not an absolute difference."
          }
        ],
        hint: "Think about what 'percent' means. We're expressing one value as a percentage of another."
      },
      {
        id: 'parameter-identification',
        type: 'PARAMETER_IDENTIFICATION',
        kapoorText: "Now let's identify the measurements needed. This concept forms the foundation of treatment planning.",
        prompt: 'What measurements do you need to calculate a PDD?',
        options: [
          { 
            text: 'Dose at the depth of interest and dose at the depth of maximum dose',
            correct: true,
            feedback: "Correct. Two measurements, one calculation. Straightforward but crucial."
          },
          { 
            text: 'Only the dose at the depth of interest',
            correct: false,
            feedback: "That's insufficient. A percentage requires a reference value for normalization."
          },
          { 
            text: 'Dose at depth, dose at dmax, and beam energy',
            correct: false,
            feedback: "The beam energy affects the PDD curve, but it's not part of the calculation itself. The formula only requires the two dose values."
          }
        ],
        hint: "To calculate a percentage, what values do you need? Think about the formula."
      },
      {
        id: 'calculation-execution',
        type: 'CALCULATION_EXECUTION',
        kapoorText: "Let's calculate this. I need to include these values in my patient evaluation document today.",
        prompt: 'Calculate the PDD for a point receiving 1.35 Gy when the dose at dmax is 2.0 Gy',
        hint: "Just divide 1.35 by 2.0 and multiply by 100.",
        answer: 67.5,
        tolerance: 0.5
      },
      {
        id: 'clinical-judgment',
        type: 'CLINICAL_JUDGMENT',
        kapoorText: "Let's consider the broader context. Why do we measure and calculate PDD values?",
        prompt: 'What clinical information does the PDD provide?',
        options: [
          { 
            text: 'It shows how dose changes with depth, which is essential for treatment planning in deep-seated tumors',
            correct: true,
            feedback: "Correct. Understanding depth dose characteristics is fundamental to accurate treatment planning."
          },
          { 
            text: 'It primarily describes lateral beam profiles, not depth distribution',
            correct: false,
            feedback: "That would be a beam profile, not a PDD. PDD specifically characterizes depth distribution."
          },
          { 
            text: 'It is mainly used for machine calibration, not clinical planning',
            correct: false,
            feedback: "While PDDs are part of commissioning, they're primarily used daily in clinical planning to understand depth distribution."
          }
        ],
        hint: "Think about treatment planning. Where do we use PDD values in clinical practice?"
      }
    ],
    
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
  }
};

export default calculationContent;