/**
 * Extensions Index
 * 
 * Central export point for all extension types and their content
 */

// Extension interfaces
import CalculationInterface from './types/CalculationInterface';
import EquipmentIdentificationInterface from './types/EquipmentIdentificationInterface';

// Extension content
import calculationContent from './content/calculations';
import equipmentIdentificationContent from './content/equipmentIdentification';

// Export extension interfaces
export {
  CalculationInterface,
  EquipmentIdentificationInterface
};

// Export extension content
export {
  calculationContent,
  equipmentIdentificationContent
};

// Extension type registry
export const extensionTypes = {
  'calculation': CalculationInterface,
  'equipment-identification': EquipmentIdentificationInterface
};

// Extension content registry
export const extensionContent = {
  'calculation': calculationContent,
  'equipment-identification': equipmentIdentificationContent
};

// Extension type mapping
export const getExtensionTypeForContent = (contentId: string): string => {
  if (contentId.includes('calculation') || contentId.includes('monitor_units') || 
      contentId.includes('hvl') || contentId.includes('pdd')) {
    return 'calculation';
  }
  
  if (contentId.includes('components') || contentId.includes('chamber') || 
      contentId.includes('electrometer') || contentId.includes('linac')) {
    return 'equipment-identification';
  }
  
  // Default fallback
  return 'calculation';
}; 