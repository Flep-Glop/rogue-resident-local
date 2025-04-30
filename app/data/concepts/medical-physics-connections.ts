// app/data/concepts/medical-physics-connections.ts

/**
 * Connection interface for the knowledge constellation system.
 * Connections automatically appear between unlocked concepts and
 * gain mastery as players answer questions involving both concepts.
 */
export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  description: string;
  mastery: number;
  discovered?: boolean;
  isEurekaPattern?: boolean;
  patternId?: string;
}

/**
 * Predefined connections between medical physics concepts for the Rogue Resident game.
 * These connections will automatically appear when both connected concepts are unlocked.
 * Connection mastery increases when answering questions that involve both concepts.
 */
export const predefinedConnections: Connection[] = [
  // Dosimetry domain connections
  {
    id: "absorbed-dose-ionization-chamber",
    sourceId: "absorbed-dose",
    targetId: "ionization-chamber",
    description: "Ionization chambers are the primary tool used to measure absorbed dose in clinical settings.",
    mastery: 0
  },
  {
    id: "absorbed-dose-sievert",
    sourceId: "absorbed-dose",
    targetId: "sievert",
    description: "The Sievert is derived from absorbed dose, weighted by radiation type and tissue factors.",
    mastery: 0
  },
  {
    id: "absorbed-dose-gray",
    sourceId: "absorbed-dose",
    targetId: "gray",
    description: "The Gray (Gy) is the SI unit of absorbed dose, defined as 1 joule of energy per kilogram of matter.",
    mastery: 0
  },
  {
    id: "ionization-chamber-calibration",
    sourceId: "ionization-chamber",
    targetId: "calibration",
    description: "Ionization chambers require careful calibration to ensure accurate dose measurements.",
    mastery: 0
  },
  
  // Radiation therapy domain connections
  {
    id: "linac-electron-beam",
    sourceId: "linac",
    targetId: "electron-beam",
    description: "Linear accelerators generate high-energy electron beams for treatment.",
    mastery: 0
  },
  {
    id: "linac-photon-beam",
    sourceId: "linac",
    targetId: "photon-beam",
    description: "Linear accelerators produce photon beams when electrons strike a target.",
    mastery: 0
  },
  {
    id: "photon-beam-electron-beam",
    sourceId: "photon-beam",
    targetId: "electron-beam",
    description: "Photon beams are produced when electron beams strike a high-Z target.",
    mastery: 0
  },
  {
    id: "imrt-dose-distribution",
    sourceId: "imrt",
    targetId: "dose-distribution",
    description: "IMRT creates highly conformal dose distributions by modulating beam intensity.",
    mastery: 0
  },
  
  // Treatment planning connections
  {
    id: "dose-distribution-dvh",
    sourceId: "dose-distribution",
    targetId: "dvh",
    description: "DVHs quantitatively summarize the dose distribution in target volumes and organs at risk.",
    mastery: 0
  },
  {
    id: "oar-dvh",
    sourceId: "oar",
    targetId: "dvh",
    description: "DVHs are used to evaluate dose to organs at risk (OARs) during plan optimization.",
    mastery: 0
  },
  {
    id: "treatment-planning-imrt",
    sourceId: "treatment-planning",
    targetId: "imrt",
    description: "Treatment planning for IMRT requires inverse planning techniques.",
    mastery: 0
  },
  
  // Cross-domain connections
  {
    id: "linac-calibration",
    sourceId: "linac",
    targetId: "calibration",
    description: "Linear accelerators require regular calibration to ensure accurate dose delivery.",
    mastery: 0
  },
  {
    id: "treatment-planning-dose-distribution",
    sourceId: "treatment-planning",
    targetId: "dose-distribution",
    description: "The primary goal of treatment planning is to create an optimal dose distribution.",
    mastery: 0
  },
  {
    id: "dose-distribution-absorbed-dose",
    sourceId: "dose-distribution",
    targetId: "absorbed-dose",
    description: "Dose distributions represent the spatial variation of absorbed dose throughout a volume.",
    mastery: 0
  },
  
  // Pattern-related connections
  {
    id: "alara-radiation-protection",
    sourceId: "alara",
    targetId: "radiation-protection",
    description: "ALARA is a fundamental principle in radiation protection.",
    patternId: "alara-triangle",
    mastery: 0
  },
  {
    id: "radiation-protection-shielding",
    sourceId: "radiation-protection",
    targetId: "shielding",
    description: "Shielding is a primary method of radiation protection.",
    patternId: "alara-triangle",
    mastery: 0
  },
  {
    id: "alara-shielding",
    sourceId: "alara",
    targetId: "shielding",
    description: "Shielding is used to fulfill the ALARA principle by reducing unnecessary exposure.",
    patternId: "alara-triangle",
    mastery: 0
  },
  
  // Treatment Planning & Dosimetry Connections
  {
    id: "absorbed-dose-prescription",
    sourceId: "absorbed-dose",
    targetId: "prescription",
    description: "Prescriptions specify the absorbed dose to be delivered to the target volume",
    mastery: 0
  },
  {
    id: "dvh-dose-constraints",
    sourceId: "dose-volume-histogram",
    targetId: "dose-constraints",
    description: "DVHs are used to evaluate whether dose constraints for organs at risk are met",
    mastery: 0
  },
  {
    id: "target-volumes-prescription",
    sourceId: "target-volumes",
    targetId: "prescription",
    description: "Prescriptions are specified for specific target volumes (PTV, CTV, GTV)",
    mastery: 0
  },
  {
    id: "dvh-oars",
    sourceId: "dose-volume-histogram",
    targetId: "organs-at-risk",
    description: "DVHs visualize dose to organs at risk for treatment plan evaluation",
    mastery: 0
  },
  
  // Treatment Planning & Radiation Therapy Connections
  {
    id: "treatment-planning-ebrt",
    sourceId: "treatment-planning",
    targetId: "external-beam-radiation-therapy",
    description: "Treatment planning determines the parameters for external beam radiation therapy",
    mastery: 0
  },
  {
    id: "beam-modifiers-imrt",
    sourceId: "beam-modifiers",
    targetId: "intensity-modulated-radiation-therapy",
    description: "Beam modifiers create the complex dose distributions in IMRT",
    mastery: 0
  },
  {
    id: "treatment-field-target-volumes",
    sourceId: "treatment-field",
    targetId: "target-volumes",
    description: "Treatment fields are designed to cover the target volumes",
    mastery: 0
  },
  
  // Radiation Therapy & Linac Anatomy Connections
  {
    id: "linac-ebrt",
    sourceId: "linear-accelerator",
    targetId: "external-beam-radiation-therapy",
    description: "Linear accelerators generate the high-energy x-rays used in EBRT",
    mastery: 0
  },
  {
    id: "mlc-imrt",
    sourceId: "multileaf-collimator",
    targetId: "intensity-modulated-radiation-therapy",
    description: "MLCs shape the radiation beam to deliver IMRT treatments",
    mastery: 0
  },
  {
    id: "gantry-angle-treatment-field",
    sourceId: "gantry-angle",
    targetId: "treatment-field",
    description: "Gantry angles determine the direction of treatment fields",
    mastery: 0
  },
  {
    id: "linac-qa-treatment-planning",
    sourceId: "linear-accelerator-qa",
    targetId: "treatment-planning",
    description: "QA ensures the linear accelerator delivers radiation as planned",
    mastery: 0
  },
  
  // Linac Anatomy & Dosimetry Connections
  {
    id: "flattening-filter-output-calibration",
    sourceId: "flattening-filter",
    targetId: "output-calibration",
    description: "Flattening filters affect beam output and must be accounted for in calibration",
    mastery: 0
  },
  {
    id: "ionization-chamber-linac",
    sourceId: "ionization-chamber",
    targetId: "linear-accelerator",
    description: "Ionization chambers monitor beam output in linear accelerators",
    mastery: 0
  },
  {
    id: "linac-dosimetry",
    sourceId: "linear-accelerator",
    targetId: "dosimetry",
    description: "Dosimetry characterizes and verifies linear accelerator output",
    mastery: 0
  },
  
  // Dosimetry Connections
  {
    id: "absorbed-dose-phantom",
    sourceId: "absorbed-dose",
    targetId: "phantom",
    description: "Phantoms simulate human tissue for absorbed dose measurements",
    mastery: 0
  },
  {
    id: "let-radiation-quality",
    sourceId: "linear-energy-transfer",
    targetId: "radiation-quality",
    description: "LET is a measure of radiation quality and affects biological impact",
    mastery: 0
  },
  {
    id: "inverse-square-law-output-calibration",
    sourceId: "inverse-square-law",
    targetId: "output-calibration",
    description: "The inverse square law is applied in radiation output calibration",
    mastery: 0
  },
  {
    id: "hvl-attenuation",
    sourceId: "half-value-layer",
    targetId: "attenuation",
    description: "HVL quantifies beam attenuation and beam quality",
    mastery: 0
  },
  {
    id: "film-dosimetry-patient-specific-qa",
    sourceId: "film-dosimetry",
    targetId: "patient-specific-qa",
    description: "Film dosimetry is used in patient-specific QA procedures",
    mastery: 0
  },
  {
    id: "gamma-analysis-patient-specific-qa",
    sourceId: "gamma-analysis",
    targetId: "patient-specific-qa",
    description: "Gamma analysis evaluates agreement between measured and calculated dose in QA",
    mastery: 0
  },
  {
    id: "water-equivalent-phantom",
    sourceId: "water-equivalent-material",
    targetId: "phantom",
    description: "Water-equivalent materials are used to construct dosimetry phantoms",
    mastery: 0
  },
  {
    id: "ionix-absorbed-dose",
    sourceId: "ionix",
    targetId: "absorbed-dose",
    description: "Ionix is an experimental ion chamber with unique dose response properties",
    mastery: 0
  },
  
  // Treatment Planning Connections
  {
    id: "isodose-lines-dvh",
    sourceId: "isodose-lines",
    targetId: "dose-volume-histogram",
    description: "Isodose lines and DVHs are complementary methods of visualizing dose distribution",
    mastery: 0
  },
  {
    id: "tcp-ntcp",
    sourceId: "tumor-control-probability",
    targetId: "normal-tissue-complication-probability",
    description: "TCP and NTCP model the balance between tumor control and normal tissue toxicity",
    mastery: 0
  },
  {
    id: "ntcp-dose-constraints",
    sourceId: "normal-tissue-complication-probability",
    targetId: "dose-constraints",
    description: "NTCP models inform the setting of dose constraints for organs at risk",
    mastery: 0
  },
  {
    id: "fractionation-bed",
    sourceId: "fractionation",
    targetId: "biological-effective-dose",
    description: "BED allows comparison of different fractionation schemes",
    mastery: 0
  },
  
  // Radiation Therapy Connections
  {
    id: "3dcrt-imrt",
    sourceId: "3d-conformal-radiation-therapy",
    targetId: "intensity-modulated-radiation-therapy",
    description: "IMRT is an advanced form of 3D-CRT with superior dose conformality",
    mastery: 0
  },
  {
    id: "imrt-vmat",
    sourceId: "intensity-modulated-radiation-therapy",
    targetId: "volumetric-modulated-arc-therapy",
    description: "VMAT is a form of IMRT that delivers dose continuously during gantry rotation",
    mastery: 0
  },
  {
    id: "igrt-sbrt",
    sourceId: "image-guided-radiation-therapy",
    targetId: "stereotactic-body-radiation-therapy",
    description: "IGRT is essential for the precise delivery of high-dose SBRT treatments",
    mastery: 0
  },
  {
    id: "ebrt-brachytherapy",
    sourceId: "external-beam-radiation-therapy",
    targetId: "brachytherapy",
    description: "EBRT and brachytherapy are complementary approaches to radiation delivery",
    mastery: 0
  },
  
  // Linac Anatomy Connections
  {
    id: "electron-gun-waveguide",
    sourceId: "electron-gun",
    targetId: "waveguide",
    description: "The electron gun generates electrons that are accelerated by the waveguide",
    mastery: 0
  },
  {
    id: "waveguide-bending-magnet",
    sourceId: "waveguide",
    targetId: "bending-magnet",
    description: "The waveguide accelerates electrons before they're redirected by the bending magnet",
    mastery: 0
  },
  {
    id: "bending-magnet-target",
    sourceId: "bending-magnet",
    targetId: "flattening-filter",
    description: "The bending magnet directs electrons to the target for x-ray production",
    mastery: 0
  },
  {
    id: "gantry-collimator-angles",
    sourceId: "gantry-angle",
    targetId: "collimator-angle",
    description: "Gantry and collimator angles together define the beam orientation",
    mastery: 0
  },
  {
    id: "collimator-mlc",
    sourceId: "collimator-angle",
    targetId: "multileaf-collimator",
    description: "The collimator houses the MLC that shapes the treatment field",
    mastery: 0
  },
  
  // Cross-Domain Connections (For Eureka Moments)
  {
    id: "measurement-triangle",
    sourceId: "absorbed-dose",
    targetId: "phantom",
    description: "A foundational relationship in dosimetry (part of Measurement Triangle)",
    mastery: 0,
    isEurekaPattern: true
  },
  {
    id: "ionization-chamber-phantom",
    sourceId: "ionization-chamber",
    targetId: "phantom",
    description: "Ionization chambers are placed in phantoms for measurements",
    mastery: 0,
    isEurekaPattern: true
  },
  {
    id: "calibration-chain-1",
    sourceId: "output-calibration",
    targetId: "quality-assurance",
    description: "Output calibration is a critical component of QA (part of Calibration Chain)",
    mastery: 0,
    isEurekaPattern: true
  },
  {
    id: "calibration-chain-2",
    sourceId: "quality-assurance",
    targetId: "treatment-planning",
    description: "QA ensures treatment plans can be delivered accurately (part of Calibration Chain)",
    mastery: 0,
    isEurekaPattern: true
  },
  {
    id: "ionix-insight-1",
    sourceId: "ionix",
    targetId: "ionization-chamber",
    description: "Ionix is an experimental ionization chamber with unique properties",
    mastery: 0,
    isEurekaPattern: true
  },
  {
    id: "ionix-insight-2",
    sourceId: "ionix",
    targetId: "output-calibration",
    description: "Ionix exhibits unusual behavior during output calibration",
    mastery: 0,
    isEurekaPattern: true
  }
];

/**
 * Helper function to get a connection between two concepts (checks both directions)
 */
export function getConnectionBetweenConcepts(concept1Id: string, concept2Id: string): Connection | null {
  // Check both directions since connections are bidirectional
  const connection = predefinedConnections.find(conn => 
    (conn.sourceId === concept1Id && conn.targetId === concept2Id) || 
    (conn.sourceId === concept2Id && conn.targetId === concept1Id)
  );
  
  return connection || null;
}

/**
 * Helper function to get all connections associated with a concept
 */
export function getConnectionsForConcept(conceptId: string): Connection[] {
  return predefinedConnections.filter(conn => 
    conn.sourceId === conceptId || conn.targetId === conceptId
  );
}

/**
 * Helper function to find connections that form Eureka patterns
 */
export function getEurekaPatternConnections(): Connection[] {
  return predefinedConnections.filter(conn => conn.isEurekaPattern === true);
}

/**
 * Helper function to check if a connection should be visible
 * based on whether both concepts are unlocked
 */
export function isConnectionVisible(connection: Connection, isConceptUnlocked: (id: string) => boolean): boolean {
  // Connection is visible if both concepts are unlocked
  const sourceUnlocked = isConceptUnlocked(connection.sourceId);
  const targetUnlocked = isConceptUnlocked(connection.targetId);
  
  return sourceUnlocked && targetUnlocked;
}

/**
 * Helper function to check if a connection should be emphasized
 * based on whether both concepts are activated
 */
export function isConnectionEmphasized(
  connection: Connection, 
  isConceptActive: (id: string) => boolean,
  isConceptUnlocked: (id: string) => boolean
): boolean {
  // Connection is emphasized if both connected concepts are activated
  // but only if the connection is already visible (both concepts unlocked)
  if (!isConnectionVisible(connection, isConceptUnlocked)) {
    return false;
  }
  
  const sourceActive = isConceptActive(connection.sourceId);
  const targetActive = isConceptActive(connection.targetId);
  
  return sourceActive && targetActive;
}

/**
 * Helper function to get the visual style properties for a connection
 * based on its mastery level and emphasis state
 */
export function getConnectionVisualProperties(connection: Connection, isEmphasized: boolean) {
  const masteryLevel = connection.mastery;
  
  let lineStyle = "dotted"; // Default low mastery (0-30%)
  let lineWidth = 1;
  let lineClass = "connection-low";
  
  if (masteryLevel > 70) {
    // High mastery (70-100%)
    lineStyle = "solid";
    lineWidth = 3;
    lineClass = "connection-high";
  } else if (masteryLevel > 30) {
    // Medium mastery (30-70%)
    lineStyle = "solid";
    lineWidth = 1.5;
    lineClass = "connection-medium";
  }
  
  // Use additional emphasis for connections between activated stars
  if (isEmphasized) {
    lineClass += " connection-emphasized";
  }
  
  return {
    lineStyle,
    lineWidth,
    lineClass
  };
}

/**
 * Updates the mastery level of a connection between two concepts
 */
export function updateConnectionMastery(
  concept1Id: string, 
  concept2Id: string, 
  masteryAmount: number
): Connection | null {
  const connection = getConnectionBetweenConcepts(concept1Id, concept2Id);
  
  if (connection) {
    connection.mastery = Math.min(100, connection.mastery + masteryAmount);
    connection.discovered = true;
    return connection;
  }
  
  return null;
}

/**
 * Finds all potential connections between a newly unlocked node and other unlocked nodes
 */
export function findPotentialConnectionsForNode(
  nodeId: string,
  unlockedNodeIds: string[]
): Connection[] {
  // Start with all connections involving this node
  return predefinedConnections.filter(conn => 
    // Connection involves this node
    (conn.sourceId === nodeId || conn.targetId === nodeId) &&
    // And involves another unlocked node
    ((conn.sourceId === nodeId && unlockedNodeIds.includes(conn.targetId)) ||
     (conn.targetId === nodeId && unlockedNodeIds.includes(conn.sourceId)))
  );
}

/**
 * Finds all potential connections between all unlocked nodes
 * This is useful when initializing the constellation
 */
export function findAllPotentialConnections(
  unlockedNodeIds: string[]
): Connection[] {
  // Find all connections where both nodes are unlocked
  const potentialConnections = predefinedConnections.filter(conn => 
    unlockedNodeIds.includes(conn.sourceId) && unlockedNodeIds.includes(conn.targetId)
  );
  
  // Remove duplicates (in case connections appear in predefined connections more than once)
  const uniqueConnectionIds = new Set<string>();
  const uniqueConnections: Connection[] = [];
  
  potentialConnections.forEach(conn => {
    if (!uniqueConnectionIds.has(conn.id)) {
      uniqueConnectionIds.add(conn.id);
      uniqueConnections.push(conn);
    }
  });
  
  return uniqueConnections;
}

/**
 * Create a new connection between two unlocked nodes
 * Returns the new connection object
 */
export function createNewConnection(
  sourceId: string,
  targetId: string,
  description?: string
): Connection {
  // First check if this is a predefined connection
  const predefinedConn = predefinedConnections.find(conn => 
    (conn.sourceId === sourceId && conn.targetId === targetId) ||
    (conn.sourceId === targetId && conn.targetId === sourceId)
  );
  
  if (predefinedConn) {
    // Use the predefined connection but ensure source/target match the input
    return {
      ...predefinedConn,
      sourceId: sourceId,
      targetId: targetId,
      mastery: 0,
      discovered: true
    };
  }
  
  // If not predefined, create a new one
  return {
    id: `${sourceId}-${targetId}`,
    sourceId: sourceId,
    targetId: targetId,
    description: description || `Connection between ${sourceId} and ${targetId}`,
    mastery: 0,
    discovered: true
  };
}

/**
 * Calculate the visual style for a connection based on mastery level and activation
 * @param mastery Connection mastery level (0-100)
 * @param isEmphasized Whether the connection should be emphasized (both nodes active)
 * @returns CSS properties for the connection
 */
export function calculateConnectionStyle(mastery: number, isEmphasized: boolean) {
  // Base styling based on mastery
  const baseStyle = { 
    opacity: 0.3 + (mastery / 200),  // Ranges from 0.3 to 0.8 based on mastery
    strokeWidth: 1 + (mastery / 40), // Ranges from 1 to 3.5 based on mastery
    strokeDasharray: mastery < 30 ? "4,4" : "none",
    stroke: "#ffffff"
  };
  
  // Enhanced styling for emphasized connections
  if (isEmphasized) {
    return {
      ...baseStyle,
      opacity: Math.min(1.0, baseStyle.opacity + 0.2),
      strokeWidth: baseStyle.strokeWidth + 1,
      stroke: "#8be9fd" // Bright cyan for active connections
    };
  }
  
  return baseStyle;
}

/**
 * Enhanced function to update connection mastery with notifications
 * @param connection The connection to update
 * @param amount Amount of mastery to add
 * @param notifyFn Optional callback function to notify about mastery updates
 * @returns Updated connection
 */
export function enhanceConnectionMastery(
  connection: Connection, 
  amount: number,
  notifyFn?: (connection: Connection, increase: number) => void
): Connection {
  const oldMastery = connection.mastery;
  connection.mastery = Math.min(100, connection.mastery + amount);
  connection.discovered = true;
  
  // If mastery level crossed a threshold, notify
  const oldTier = getMasteryTier(oldMastery);
  const newTier = getMasteryTier(connection.mastery);
  
  if (notifyFn && (newTier > oldTier || oldMastery === 0)) {
    notifyFn(connection, amount);
  }
  
  return connection;
}

/**
 * Helper function to determine mastery tier
 * Used to detect when a connection crosses a significant threshold
 */
function getMasteryTier(mastery: number): number {
  if (mastery < 30) return 0; // Low
  if (mastery < 70) return 1; // Medium
  return 2; // High
}
