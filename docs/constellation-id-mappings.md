# Constellation System ID Mappings

This document maps the original node IDs from the constellation system documentation to the actual implementation IDs used in the codebase.

## Node ID Mappings

| Original Documentation ID | Implementation ID | Description |
|---------------------------|------------------|-------------|
| tp-core | treatment-planning | Treatment Planning (core concept) |
| do-core | radiation-dosimetry | Radiation Dosimetry (core concept) |
| rt-core | radiation-therapy | Radiation Therapy (core concept) |
| la-core | linac-anatomy | Linac Anatomy (core concept) |
| rt-patient-pos | patient-positioning | Patient Positioning |
| do-output-cal | output-calibration | Output Calibration |
| rt-deliver-tech | delivery-techniques | Delivery Techniques |
| rt-treat-protocol | treatment-protocols | Treatment Protocols |
| tp-plan-qa | (none) | Plan QA - no direct equivalent |
| do-patient-qa | (none) | Patient-Specific QA - no direct equivalent |
| rt-imaging-guidance | (none) | Imaging Guidance - no direct equivalent |

## Pattern Adaptations

We've adapted the patterns in `ConstellationPatternSystem.ts` to use the implementation IDs. Here's what changed:

### Quality Assurance Circuit
- Original: `['do-output-cal', 'do-patient-qa', 'tp-plan-qa', 'rt-imaging-guidance']`
- Adapted: `['output-calibration', 'radiation-therapy', 'treatment-planning']`

### ALARA Principle Triangle
- Original: `['do-core', 'tp-dose-constraints', 'rt-patient-pos']`
- Adapted: `['radiation-dosimetry', 'treatment-planning', 'patient-positioning']`

### Treatment Planning Cascade
- Original: `['tp-target-volumes', 'tp-prescription', 'tp-plan-eval', 'tp-dvh', 'tp-plan-qa']`
- Adapted: `['treatment-planning', 'radiation-therapy', 'delivery-techniques', 'treatment-protocols']`

### Beam Delivery Precision Star
- Original: `['rt-imrt', 'la-mlc', 'do-small-field', 'la-beam-mod', 'rt-imaging-guidance']`
- Adapted: `['radiation-therapy', 'delivery-techniques', 'output-calibration']`

### Plan Optimization Diamond
- Original: `['tp-plan-eval', 'tp-dvh', 'tp-mco', 'tp-plan-qa']`
- Adapted: `['treatment-planning', 'radiation-therapy', 'output-calibration', 'radiation-dosimetry']`

## Maintenance Notes

When updating the constellation system or adding new patterns:

1. Always use the implementation IDs from the right column
2. Check the existence of nodes using the debug tools first
3. Test patterns in the simplified test environment before adding to main system
4. Update this mapping document as new nodes are added 