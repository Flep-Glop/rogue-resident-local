import { DoseCalculationCache } from './DoseCalculationCache';

// Define constants
const FOV_DIAMETER_PIXELS = 400; // 400x400 pixel canvas (200cm x 200cm) at 1px = 5mm
const PIXEL_TO_CM = 0.5; // 1 pixel = 5mm = 0.5cm

// Treatment Planning System Core Model
export interface CTImageData {
  width: number;
  height: number;
  data: number[][];  // 2D array of density values
}

export interface Beam {
  angle: number;      // Beam angle in radians (converted from degrees upon addBeam)
  startX: number;     // Starting X position (currently unused, isocenter assumed at center)
  startY: number;     // Starting Y position (currently unused, isocenter assumed at center)
  width: number;      // Beam width in pixels
  energy: number;     // Beam energy in MV (e.g., 6, 10, 18)
}

// Represents a single pencil beam element within a larger clinical beam
interface PencilBeamElement {
  lateralOffset: number; // Offset from the center of the main beam, perpendicular to beam direction
  fluenceWeight: number; // Relative intensity/fluence of this pencil beam (e.g., 1.0 for flat beam)
}

// Define Material properties
interface Material {
  density: number;      // g/cm³ or relative
  attenuation: number;  // Linear attenuation coefficient (relative to water=1.0)
  // color: number[]; // Color for visualization, if needed later
}

// Simplified Material Definitions (inspired by docs/simplified-material-model (1).js)
const MATERIALS: { [key: string]: Material } = {
  AIR: { density: 0.0012, attenuation: 0.0001 },
  FAT: { density: 0.92, attenuation: 0.045 },
  WATER: { density: 1.0, attenuation: 0.05 },
  SOFT_TISSUE: { density: 1.06, attenuation: 0.052 },
  BONE: { density: 1.85, attenuation: 0.08 }
};

interface SurfaceContext {
  x: number; // surface x-coordinate
  y: number; // surface y-coordinate
  distanceFromIso: number; // Euclidean distance from isocenter to this surface point
  sign: number; // sign of this point relative to isocenter (+1 if further along beam from iso, -1 if before)
  depthAlongPbAxis: number; // geometric depth from pencil beam origin (pbOriginX,Y) to this surface point
}

// Material assignment based on pixel intensity (0-255 from CTImageData)
function getMaterialFromPixel(pixelValue: number): Material {
  if (pixelValue < 10) return MATERIALS.AIR;       // Typically HU -1000 to -800
  if (pixelValue < 60) return MATERIALS.FAT;       // Typically HU -120 to -80
  if (pixelValue < 120) return MATERIALS.WATER;     // Typically HU -20 to +20 (Water is 0 HU, 100 here is placeholder)
  if (pixelValue < 200) return MATERIALS.SOFT_TISSUE; // Typically HU +20 to +80
  return MATERIALS.BONE;                          // Typically HU +200 to +1000
}

export class SimpleTPS {
  private ctData: CTImageData;
  private beams: Beam[] = [];
  private doseGrid: number[][] = [];
  private materialMap: Material[][] = []; // Added material map
  private static readonly NOMINAL_SSD = 1000; // pixels or mm, (e.g. 100cm)
  private depthDoseFactorCache: DoseCalculationCache<number>;
  private scatterKernelCache = new Map<string, number>();
  
  constructor(ctImageData: CTImageData) {
    this.ctData = ctImageData;
    this.initializeDoseGrid();
    this.generateMaterialMap(); // Generate material map on construction
    this.depthDoseFactorCache = new DoseCalculationCache<number>(1000); // Initialize cache
  }
  
  private initializeDoseGrid(): void {
    // Initialize dose grid with zeros
    this.doseGrid = Array(this.ctData.height).fill(0).map(() => 
      Array(this.ctData.width).fill(0)
    );
  }
  
  private generateMaterialMap(): void {
    this.materialMap = Array(this.ctData.height).fill(null).map((_, y) =>
      Array(this.ctData.width).fill(null).map((_, x) =>
        getMaterialFromPixel(this.ctData.data[y][x])
      )
    );
  }
  
  public addBeam(angle: number, startX: number, startY: number, beamWidth: number = 20, energy: number = 6): void {
    // Store the original IEC convention angle in degrees (0° = top, 90° = right, etc.)
    this.beams.push({
      angle: angle * Math.PI / 180, // Convert to radians but preserve original angle convention
      startX,
      startY,
      width: beamWidth,
      energy: energy
    });
  }
  
  public calculateDose(): number[][] {
    this.initializeDoseGrid();
    this.depthDoseFactorCache.clear(); // Clear cache to ensure fresh calculations with new geometry
    this.scatterKernelCache.clear(); // Also clear scatter kernel cache
    
    console.log(`Calculating dose for ${this.beams.length} beams`); // Log beam count
    
    for (let beam of this.beams) {
      this.calculateBeamDose(beam);
    }
    
    // Log depth profile along central axis
    const centerX = Math.floor(this.ctData.width / 2);
    console.log("Depth profile along central axis:");
    for (let y = 0; y < this.doseGrid.length; y += 5) { // Sample every 5 pixels to keep log readable
      console.log(`Depth: ${y}, Dose: ${this.doseGrid[y][centerX]}`);
    }
    
    return this.getDoseDistribution(); // Return normalized dose
  }
  
  // Corresponds to getAttenuationScale(energyMV) in the JS model
  private getEnergyAttenuationFactor(energyMV: number): number {
    // Scale attenuation with energy (lower energy = higher attenuation)
    // At 6 MV returns 1.0, at 18 MV returns ~0.7
    return 1.0 / Math.pow(energyMV / 6, 0.3);
  }
  
  // Corresponds to getDepthOfMaximum(energyMV) in the JS model
  private calculateDepthOfMaxDose(energy: number, fieldSize: number = 100): number {
    // Base dmax for 10x10 cm² field (100 pixels or mm)
    const baseDmaxTable: {[key: number]: number} = {
        6: 15,   // 1.5 cm = 15 mm (pixels)
        10: 25,  // 2.5 cm = 25 mm
        15: 30,  // 3.0 cm = 30 mm
        18: 35   // 3.5 cm = 35 mm
    };
    
    // Get base dmax or interpolate/extrapolate linearly for other energies
    let dmax = baseDmaxTable[energy];
    if (dmax === undefined) {
        // Simple linear interpolation/extrapolation from 6MV and 18MV points
        // (y - y1) = m * (x - x1) => y = m * (x - x1) + y1
        // m = (y2 - y1) / (x2 - x1)
        if (energy < 6) {
            // Extrapolate towards lower energy (e.g. from 6MV point, steeper rise from 0)
            // dmax = (15/6) * energy, but this may be too simplistic
            // Let's use the 6MV value as a floor or a gentle slope from 0,0 to 6,15
             dmax = 15 * (energy / 6);
        } else if (energy > 18) {
            // Extrapolate towards higher energy (e.g. from 18MV point)
            const m = (baseDmaxTable[18] - baseDmaxTable[15]) / (18 - 15); // slope from last two points
            dmax = baseDmaxTable[18] + m * (energy - 18);
        } else { // Interpolate between known points
            const lowerEnergies = Object.keys(baseDmaxTable).map(Number).sort((a,b)=>a-b).filter(e => e < energy);
            const higherEnergies = Object.keys(baseDmaxTable).map(Number).sort((a,b)=>a-b).filter(e => e > energy);
            const e1 = lowerEnergies.length > 0 ? Math.max(...lowerEnergies) : 6;
            const e2 = higherEnergies.length > 0 ? Math.min(...higherEnergies) : 18;
            const d1 = baseDmaxTable[e1] || (15 + e1 * 1.1); // fallback if e1 not in table (should be)
            const d2 = baseDmaxTable[e2] || (15 + e2 * 1.1); // fallback
            if (e1 === e2) { // Should not happen if energy is not in table
                 dmax = d1;
            } else {
                 dmax = d1 + (d2 - d1) * (energy - e1) / (e2 - e1);
            }
        }
        // Ensure dmax is at least a small positive value if energy is very low but positive
        if (energy > 0 && dmax <=0) dmax = 1.0; 
    }
    
    // Field size correction (smaller fields have shallower dmax)
    // fieldSize is in pixels (mm)
    if (fieldSize < 50) { // Less than 5x5 cm² (50mm)
        dmax *= (0.8 + 0.2 * (fieldSize / 50));
    }
    
    return Math.max(1, dmax); // Ensure dmax is at least 1 pixel/mm
  }
  
  // From PBC Guide: PhysicsCalculations.inverseSquareLaw
  private inverseSquareLaw(distance: number, referenceDistance: number): number {
    // Assuming distance and referenceDistance are in consistent units (e.g., cm or pixels)
    // For now, this is a placeholder and not directly integrated into dose calculation.
    if (distance <= 0) return Infinity; // Avoid division by zero or non-physical distance
    return Math.pow(referenceDistance / distance, 2);
  }

  // Placeholder for PDD/TPR calculations, currently using build-up logic
  // PBC Refactor Note: This will be replaced by more accurate PDD/TPR calculations
  // based on energy, field size, and depth.
  private calculatePDD(depth: number, energy: number, fieldSize: number): number {
    const dmax = this.calculateDepthOfMaxDose(energy, fieldSize);
    
    if (depth < 0) return 0;
    
    if (depth < dmax) {
        // SIMPLIFIED: Pure linear build-up from very low entrance dose to maximum
        // Using a fixed 5% entrance dose to make the build-up region extremely clear
        const entranceDoseFraction = 0.05; // Fixed 5% entrance dose
        return entranceDoseFraction + ((1 - entranceDoseFraction) * depth / dmax);
    } else {
        // Beyond dmax: exponential attenuation with realistic falloff
        const mu_eff = this.getEffectiveAttenuationCoefficient(energy, fieldSize);
        
        // Add small amount of hardening (beam spectrum shifts to higher energy as it penetrates)
        const hardeningFactor = 1.0 - 0.0003 * (depth - dmax);
        
        return Math.exp(-mu_eff * (depth - dmax) * hardeningFactor);
    }
  }

  private getEffectiveAttenuationCoefficient(energy: number, fieldSize: number): number {
    // Updated attenuation coefficients for megavoltage beams
    // Base values in cm⁻¹
    const attenuationValues = {
      6: 0.0471,   // 6MV
      10: 0.0378,  // 10MV
      15: 0.0328,  // 15MV
      18: 0.0295   // 18MV
    };
    
    // Get base mu value with interpolation
    let mu_water: number;
    if (attenuationValues[energy]) {
      mu_water = attenuationValues[energy];
    } else if (energy < 6) {
      // Extrapolate for lower energies
      mu_water = 0.0471 + (0.01 * (6 - energy));
    } else {
      // Interpolate between known values
      const energies = Object.keys(attenuationValues).map(Number).sort((a, b) => a - b);
      const lower = energies.filter(e => e <= energy).pop() || 6;
      const upper = energies.filter(e => e > energy).shift() || 18;
      
      if (lower === upper) {
        mu_water = attenuationValues[lower];
      } else {
        const fraction = (energy - lower) / (upper - lower);
        mu_water = attenuationValues[lower] * (1 - fraction) + attenuationValues[upper] * fraction;
      }
    }
    
    // Field size correction (larger fields have more scatter, less effective attenuation)
    // Improved to handle very small and very large fields better
    const normalizedFieldSize = fieldSize / 100; // Normalize to 10x10cm (100mm)
    const fieldSizeFactor = 1 - 0.2 * (2 / (1 + Math.exp(-2 * normalizedFieldSize)) - 1); // Sigmoid function
    
    // Convert to mm⁻¹ by multiplying by PIXEL_TO_CM (0.1)
    return mu_water * fieldSizeFactor * 0.1; 
  }
  
  // From PBC Guide: PhysicsCalculations.calculateFieldSizeAtDepth
  // Calculates the geometric field size at a given depth beyond a reference SSD
  // where initialFieldSize is defined.
  private calculateFieldSizeAtDepth(initialFieldSize: number, ssd: number, depth_beyond_ssd: number): number {
    if (ssd <= 0) return initialFieldSize; // Avoid division by zero, return initial size
    return initialFieldSize * (ssd + depth_beyond_ssd) / ssd;
  }

  // Placeholder for kernel lookup/calculation
  // In a full PBC, this would return a factor based on the 2D/3D distance from
  // the pencil beam's central axis to the current calculation point, and depth.
  // For now, it returns 1.0 as we are calculating dose *on* the pencil beam axis.
  private getKernelFactor(depth_from_surface: number, lateral_distance_from_pencil_beam_center: number, energy: number): number {
    // This is a simplified placeholder. Real kernels are complex 2D/3D functions.
    // For points directly on the pencil beam axis, lateral_distance is 0.
    // A simple model might have the kernel factor decrease as lateral_distance increases.
    // For now, since we trace directly along the pencil beam, we assume factor of 1.0.
    // This will be replaced by calculateScatterKernel or a similar mechanism.
    return 1.0; 
  }

  private calculateScatterKernel(lateralDistance: number, depth: number, energy: number): number {
    const key = `sk_${depth.toFixed(1)}_${lateralDistance.toFixed(1)}_${energy.toFixed(0)}`;
    if (this.scatterKernelCache.has(key)) {
        return this.scatterKernelCache.get(key)!;
    }

    // Energy-dependent parameters for realistic scatter profiles
    const energyFactor = Math.sqrt(energy / 6); // Higher energy = wider scatter
    
    // Dual-Gaussian model for realistic lateral dose profiles
    // Primary narrow Gaussian for central portion
    const primarySigma = (2.0 + depth * 0.06) * energyFactor;
    const primaryWeight = 0.85 - (0.01 * energy); // Slightly less primary component at higher energies
    
    // Secondary wider Gaussian for scatter tails
    const scatterSigma = (5.0 + depth * 0.2) * energyFactor;
    const scatterWeight = 1.0 - primaryWeight;
    
    // Combined dual-Gaussian model
    const primaryComponent = Math.exp(-(lateralDistance * lateralDistance) / (2 * primarySigma * primarySigma));
    const scatterComponent = Math.exp(-(lateralDistance * lateralDistance) / (2 * scatterSigma * scatterSigma));
    const combinedGaussian = (primaryWeight * primaryComponent) + (scatterWeight * scatterComponent);
    
    // Energy-dependent scatter magnitude adjustment
    const scatterMagnitude = 0.2 * (1 - Math.exp(-energy/12));
    
    // Depth-dependent factor (more scatter at depth)
    const depthFactor = Math.min(1.0, 0.7 + depth / 100);
    
    const result = scatterMagnitude * depthFactor * combinedGaussian;
    this.scatterKernelCache.set(key, result);
    return result;
  }

  private depositScatter(x: number, y: number, primaryDose: number, depth: number, beam: Beam): void {
    // Convert to the standard IEC gantry angle convention (0° = top, 90° = right, etc.)
    const beamAngle = beam.angle + Math.PI/2;
    
    // Adaptive scatter radius based on depth
    const scatterRadius = Math.min(10, 3 + depth * 0.02);
    
    // Lateral scatter is more pronounced perpendicular to beam direction
    const perpAngle = beamAngle + Math.PI/2;
    
    for (let dy = -scatterRadius; dy <= scatterRadius; dy++) {
      for (let dx = -scatterRadius; dx <= scatterRadius; dx++) {
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance > scatterRadius) continue;
        
        // Calculate lateral distance from pencil beam axis (perpendicular to beam direction)
        const lateralDistance = Math.abs(dx * Math.cos(perpAngle) + dy * Math.sin(perpAngle));
        
        // Calculate longitudinal distance (parallel to beam direction)
        const longitudinalDistance = Math.abs(dx * Math.cos(beamAngle) + dy * Math.sin(beamAngle));
        
        // Scatter intensity decreases with lateral distance from beam axis
        const scatterFactor = this.calculateScatterKernel(lateralDistance, depth, beam.energy);
        
        // Energy dependence - higher energy has more forward-peaked scatter
        const forwardFactor = 1.0 - 0.2 * (1 - Math.exp(-longitudinalDistance / (5 + beam.energy)));
        
        const scatterDose = primaryDose * scatterFactor * forwardFactor;
        
        // Deposit the scatter dose at the offset point
        if (scatterDose > 0) {
          this.depositDose(Math.floor(x + dx), Math.floor(y + dy), scatterDose);
        }
      }
    }
  }

  // From PBC Guide: PhysicsCalculations.calculateScatterFactors
  // Placeholder for calculating scatter factors. Real implementations would use lookup tables or complex models.
  private calculateScatterFactors(fieldSize: number, energy: number, depth: number): { collimatorScatter: number, phantomScatter: number } {
    // Simplified placeholder values. These would depend significantly on the input parameters.
    // Collimator scatter (Sc) typically increases with field size.
    // Phantom scatter (Sp) increases with field size and depth, and varies with energy.
    const basicCollimatorFactor = 1.0 + (fieldSize / 100); // e.g., for 10cm field (100 units), factor is 1.1
    const basicPhantomFactor = 0.05 + (fieldSize / 500) + (depth / 1000); // Small base, increases with FS and depth

    return {
      collimatorScatter: Math.min(1.2, basicCollimatorFactor), // Capped
      phantomScatter: Math.min(0.3, basicPhantomFactor)    // Capped
    };
  }

  // Conceptual method to get scatter dose contribution at a point
  // This is highly simplified. True scatter kernels are spatially complex.
  private getScatterContribution(primaryDoseComponent: number, scatterFactors: { collimatorScatter: number, phantomScatter: number }, material: Material, energy: number): number {
    // For now, a very simple model: scatter is a fraction of primary, scaled by phantom scatter and density.
    // Collimator scatter (Sc) primarily affects the beam's output/fluence, so it might be better applied to beam.mu or currentBeamOutput earlier.
    // However, for simplicity here, we'll just use phantomScatter. 
    // A more advanced model would use both Sc and Sp appropriately.
    const scatterFraction = scatterFactors.phantomScatter * material.density; // Example: higher density, more scatter
    return primaryDoseComponent * scatterFraction;
  }

  // Generates a grid of pencil beam elements for a given clinical beam
  private generatePencilBeamGrid(beam: Beam, pencilBeamSpacing: number = 1): PencilBeamElement[] {
    const pencilBeams: PencilBeamElement[] = [];
    const halfWidth = beam.width / 2;
    
    if (halfWidth === 0 && beam.width > 0) { // If width is very small but non-zero, create one central PB
        pencilBeams.push({
            lateralOffset: 0,
            fluenceWeight: 1.0
        });
        return pencilBeams;
    } else if (beam.width === 0) { // If width is truly zero, no pencil beams
        return [];
    }

    for (let offset = -halfWidth; offset <= halfWidth; offset += pencilBeamSpacing) {
        const normalizedOffset = Math.abs(offset) / halfWidth;
        
        // Primary Gaussian component
        const gaussianSigma = halfWidth / 2.5;
        const gaussianComponent = Math.exp(-(offset * offset) / (2 * gaussianSigma * gaussianSigma));
        
        // Flattening filter horn effect
        const hornComponent = normalizedOffset > 0.8 ? 
            1.1 + 0.2 * (normalizedOffset - 0.8) : 1.0;
        
        // Penumbra softening at edges
        const edgeSoftening = normalizedOffset > 0.9 ? 
            Math.cos((normalizedOffset - 0.9) * Math.PI / 0.2) : 1.0;
        
        pencilBeams.push({
            lateralOffset: offset,
            fluenceWeight: gaussianComponent * hornComponent * edgeSoftening
        });
    }
    
    // Normalize weights
    const totalWeight = pencilBeams.reduce((sum, pb) => sum + pb.fluenceWeight, 0);
    if (totalWeight > 0) {
        pencilBeams.forEach(pb => pb.fluenceWeight /= totalWeight);
    } else if (pencilBeams.length > 0) {
        // If total weight is zero but there are beams (e.g. all factors resulted in 0)
        // assign equal weight to avoid division by zero issues if this case is possible.
        // This path should ideally not be taken with the new model unless beam.width is tiny.
        const equalWeight = 1.0 / pencilBeams.length;
        pencilBeams.forEach(pb => pb.fluenceWeight = equalWeight);
    }
    
    return pencilBeams;
  }

  private calculateOutputFactor(fieldSize: number, energy: number): number {
    // Collimator scatter factor (Sc)
    // Increases slowly with field size
    const sc = 0.95 + 0.05 * Math.tanh(fieldSize / 50); // fieldsize in pixels (mm)
    
    // Phantom scatter factor (Sp)
    // Increases more significantly with field size
    const sp = 1.0 + 0.15 * (1 - Math.exp(-fieldSize / 100)); // fieldsize in pixels (mm)
    
    // Total output factor
    return sc * sp;
  }

  private calculateEffectiveDepth(path: {x: number, y: number}[], stepSize: number): number {
    let waterEquivalentDepth = 0;
    
    for (let i = 1; i < path.length; i++) {
        // Get material at the current point (path[i])
        // Ensure coordinates are within bounds and correctly mapped
        const x = Math.floor(path[i].x);
        const y = Math.floor(path[i].y);

        if (x < 0 || x >= this.ctData.width || y < 0 || y >= this.ctData.height) {
            // Point is outside the CT grid, assume it continues in AIR or handle as error
            // For simplicity, let's assume AIR if outside for radiological path calculation
            // or stop accumulation. If it's outside, it might not matter for dose inside patient.
            // Let's use a density of AIR if out of bounds for continuation of path.
            waterEquivalentDepth += stepSize * MATERIALS.AIR.density; // Or handle differently
            continue;
        }

        const material = this.materialMap[y][x];
        if (!material) {
            // Should not happen if materialMap is complete
            waterEquivalentDepth += stepSize * MATERIALS.WATER.density; // Default to water if material somehow missing
            continue;
        }
        
        // Use relative electron density for depth scaling (density is used as a proxy here)
        const relativeElectronDensity = material.density;
        waterEquivalentDepth += stepSize * relativeElectronDensity;
    }
    
    return waterEquivalentDepth;
  }

  private isNearInterface(x: number, y: number, checkRadius: number = 1): boolean {
    const currentMaterial = this.materialMap[Math.floor(y)][Math.floor(x)];
    if (!currentMaterial) return false; // Should not happen if point is valid

    for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = Math.floor(x + dx);
            const ny = Math.floor(y + dy);

            if (nx >= 0 && nx < this.ctData.width && ny >= 0 && ny < this.ctData.height) {
                const neighborMaterial = this.materialMap[ny][nx];
                if (neighborMaterial && neighborMaterial !== currentMaterial) {
                    return true; // Found a different material nearby
                }
            }
        }
    }
    return false;
  }

  private traceToSurface(
    pbOriginX: number,
    pbOriginY: number,
    beamAngle: number,
    isoX: number,
    isoY: number,
    maxSearchDepth: number = 500 // Max distance along pencil beam axis to search
  ): SurfaceContext | null {
    const step = 0.5; // Smaller step size for more accurate surface detection
    let previousMaterial: Material | null = null;
    
    // First trace from origin to find surface (air to material transition)
    for (let depth = 0; depth < maxSearchDepth; depth += step) {
      const currentX = pbOriginX + depth * Math.cos(beamAngle);
      const currentY = pbOriginY + depth * Math.sin(beamAngle);

      const ix = Math.floor(currentX);
      const iy = Math.floor(currentY);

      // Check bounds
      if (ix < 0 || ix >= this.ctData.width || iy < 0 || iy >= this.ctData.height) {
        // Ray has gone outside CT boundaries
        return null;
      }

      const material = this.materialMap[iy][ix];
      
      // Two detection modes:
      // 1. Material density threshold
      // 2. Density gradient (transition from air to material)
      const isAirRegion = material && material.density < MATERIALS.AIR.density * 1.5;
      const isMaterialRegion = material && material.density > MATERIALS.AIR.density * 1.2;
      
      // Detect transition from air to material
      const isTransition = previousMaterial && isAirRegion && isMaterialRegion;
      
      // Consider surface point if:
      // - We're in a material region with sufficient density
      // - OR we just crossed from air to material (transition detection)
      if (isMaterialRegion || isTransition) {
        const distIso = Math.sqrt(
          Math.pow(currentX - isoX, 2) + Math.pow(currentY - isoY, 2)
        );
        
        // Determine sign relative to isocenter along beam direction
        const dotProduct = (currentX - isoX) * Math.cos(beamAngle) + (currentY - isoY) * Math.sin(beamAngle);
        const sign = Math.sign(dotProduct);

        return {
          x: currentX,
          y: currentY,
          distanceFromIso: distIso,
          sign: sign === 0 ? 1 : sign, // Default to 1 if directly at isocenter plane
          depthAlongPbAxis: depth,
        };
      }
      
      previousMaterial = material;
    }
    
    return null; // No surface found within maxSearchDepth
  }

  private calculateBeamDose(beam: Beam): void {
    const stepSize = 0.5; // pixels, smaller for better accuracy
    const maxDepth = Math.max(this.ctData.width, this.ctData.height) * 1.5; // Ensure it can pass through

    const centerX = this.ctData.width / 2;
    const centerY = this.ctData.height / 2;

    // Convert to the standard IEC gantry angle convention
    // Input angle: 0 = top, 90 = right, 180 = bottom, 270 = left
    // Math angle: 0 = right, 90 = down, 180 = left, 270 = up
    const beamAngle = beam.angle + Math.PI/2;

    const energyAttenuationFactor = this.getEnergyAttenuationFactor(beam.energy);
    // const dmax_pixels = this.calculateDepthOfMaxDose(beam.energy); // dmax_pixels is not directly used here, PDD uses it

    // Calculate the output factor for this beam based on field size
    const outputFactor = this.calculateOutputFactor(beam.width, beam.energy);

    // Generate the pencil beams for this clinical beam
    const pencilBeamElements = this.generatePencilBeamGrid(beam, 1);

    // Loop over each pencil beam element within the larger clinical beam
    for (const pBeam of pencilBeamElements) {
      // Initial pencil beam output
      let currentPencilBeamOutput = beam.energy * pBeam.fluenceWeight * outputFactor;
      
      // Calculate the pencil beam's coordinates as it crosses the ISOCENTER plane
      const pencilBeamAxisAtIsoX = centerX - (pBeam.lateralOffset * Math.sin(beamAngle));
      const pencilBeamAxisAtIsoY = centerY + (pBeam.lateralOffset * Math.cos(beamAngle));

      // Define a distance upstream from the isocenter plane to start the surface search trace.
      // FOV_DIAMETER_PIXELS is defined as 400 at the top of the file.
      // Using half of this ensures the trace starts well outside a phantom centered in the FOV.
      const BEAM_TRACE_START_DISTANCE_UPSTREAM = FOV_DIAMETER_PIXELS / 2; // 200 pixels

      // Calculate the actual starting point for the trace, upstream from the isocenter plane
      const traceOriginX = pencilBeamAxisAtIsoX - BEAM_TRACE_START_DISTANCE_UPSTREAM * Math.cos(beamAngle);
      const traceOriginY = pencilBeamAxisAtIsoY - BEAM_TRACE_START_DISTANCE_UPSTREAM * Math.sin(beamAngle);
      
      // Max search depth for traceToSurface: must be able to reach from traceOrigin,
      // cross the BEAM_TRACE_START_DISTANCE_UPSTREAM, and then traverse the phantom (approx FOV_DIAMETER_PIXELS).
      const traceMaxSearchDepth = BEAM_TRACE_START_DISTANCE_UPSTREAM + FOV_DIAMETER_PIXELS; // e.g., 200 + 400 = 600 pixels

      // Find where this pencil beam intersects the phantom surface, starting trace from outside
      const surfaceEntryPoint = this.traceToSurface(
        traceOriginX,
        traceOriginY,
        beamAngle,
        centerX, // isocenter X (passed for context for distance/sign calculation within traceToSurface)
        centerY, // isocenter Y (passed for context for distance/sign calculation within traceToSurface)
        traceMaxSearchDepth // Specify the max search depth for the trace
      );
      
      // If no surface found (e.g. beam misses phantom), skip this pencil beam
      if (!surfaceEntryPoint) {
        continue;
      }
      
      // Set maximum depth for tracing to ensure we go through the entire phantom
      const maxDepthAlongPencilBeam = surfaceEntryPoint.distanceFromIso + Math.max(this.ctData.width, this.ctData.height);
      
      // Initialize path calculation starting at the surface for accurate depth calculation
      const pathTaken: {x: number, y: number}[] = [];
      
      // Start from the surface entry point (not the beam origin)
      pathTaken.push({x: surfaceEntryPoint.x, y: surfaceEntryPoint.y});
      
      // Reset depth counters at the surface
      let accumulatedWaterEquivalentDepth = 0;
      
      // For dose deposition, start from actual surface point (not beam origin)
      // The loop for currentGeometricDepthAlongBeam will start from 0 at the surfaceEntryPoint.
      for (let currentGeometricDepthAlongBeam = 0; currentGeometricDepthAlongBeam < maxDepthAlongPencilBeam; /* adaptive step size controlled inside */) {
        // Calculate current position along the beam from the surface point
        const currentX = surfaceEntryPoint.x + currentGeometricDepthAlongBeam * Math.cos(beamAngle);
        const currentY = surfaceEntryPoint.y + currentGeometricDepthAlongBeam * Math.sin(beamAngle);

        // Check if we've gone outside the CT image boundaries
        if (currentX < 0 || currentX >= this.ctData.width || currentY < 0 || currentY >= this.ctData.height) {
          break; 
        }
        
        // Get the material at this position
        const ix = Math.floor(currentX);
        const iy = Math.floor(currentY);
        const material = this.materialMap[iy][ix];
        if (!material) {
            currentGeometricDepthAlongBeam += 0.5; // Default step if material is missing
            continue;
        }

        // Adaptive step size based on material and position
        let stepSize = 0.5; // Default step size
        if (this.isNearInterface(currentX, currentY)) {
            stepSize = 0.1; // Finer steps near boundaries
        } else if (material.density < 0.3) { // Air regions
            stepSize = 1.0; // Larger steps in low-density regions
        }

        // Track the path for later calculations
        pathTaken.push({x: currentX, y: currentY});

        // Calculate attenuation using energy-specific attenuation
        const linearAttenuationCoeff = material.attenuation * energyAttenuationFactor * PIXEL_TO_CM;
        
        // Update water equivalent depth for this step
        accumulatedWaterEquivalentDepth += stepSize * material.density;
        
        // Calculate PDD factor based on the water equivalent depth
        const pddFactor = this.calculatePDD(accumulatedWaterEquivalentDepth, beam.energy, beam.width);

        // Calculate energy deposition in current step
        const attenuationForStep = (1 - Math.exp(-linearAttenuationCoeff * stepSize));
        const primaryEnergyDepositedLocal = currentPencilBeamOutput * attenuationForStep; 
        
        // Apply PDD factor to the deposited energy
        const doseToDepositAtPoint = primaryEnergyDepositedLocal * pddFactor; 

        // Apply inverse square law adjustment
        const distFromIsoToCurrentPoint = Math.sqrt(Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2));
        const sign = ((currentX - centerX) * Math.cos(beamAngle) + (currentY - centerY) * Math.sin(beamAngle)) >= 0 ? 1 : -1;
        const depth_from_isocenter_for_isl = distFromIsoToCurrentPoint * sign;
        const ISL_factor = this.inverseSquareLaw(SimpleTPS.NOMINAL_SSD + depth_from_isocenter_for_isl, SimpleTPS.NOMINAL_SSD);
        
        // Calculate final dose for this point
        const finalPrimaryDoseThisStep = doseToDepositAtPoint * ISL_factor;
        
        // Deposit primary dose
        if(finalPrimaryDoseThisStep > 0) {
            this.depositDose(ix, iy, finalPrimaryDoseThisStep);
            
            // Temporarily disable scatter to see if it's causing the second peak
            // this.depositScatter(currentX, currentY, finalPrimaryDoseThisStep, accumulatedWaterEquivalentDepth, beam);
        }
        
        // Update remaining beam output (attenuation)
        currentPencilBeamOutput *= (1 - attenuationForStep); 

        // Stop tracing if beam is sufficiently attenuated
        if (currentPencilBeamOutput < 0.0001 * beam.energy * pBeam.fluenceWeight * outputFactor) { 
          break;
        }
        
        // Move to next step with adaptive step size
        currentGeometricDepthAlongBeam += stepSize;
      }
    }
  }
  
  // private simulateScatter(x: number, y: number, material: Material, beamOutputAtPoint: number): void { .. } // Commented out or remove

  private depositDose(x: number, y: number, dose: number): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    const gridHeight = this.doseGrid.length;
    if (gridHeight === 0) return; // No grid to deposit to
    const gridWidth = this.doseGrid[0].length;
    if (gridWidth === 0) return; // No grid columns to deposit to

    if (iy >= 0 && iy < gridHeight && ix >= 0 && ix < gridWidth) {
      // Add debug logging for significant dose depositions
      const centerX = this.ctData.width / 2;
      const centerY = this.ctData.height / 2;
      const isNearTop = (iy < centerY - 50); // Near top of phantom
      const isNearIsocenter = (Math.abs(iy - centerY) < 10); // Near isocenter
      
      // Log significant dose depositions in key regions
      if (dose > 0.1 && (isNearTop || isNearIsocenter)) {
        const region = isNearTop ? "TOP_SURFACE" : "ISOCENTER";
        console.log(`Depositing significant dose (${dose.toFixed(2)}) at [${ix},${iy}] - ${region} region`);
      }
      
      if (typeof this.doseGrid[iy][ix] === 'number' && isFinite(dose) && !isNaN(dose)) {
        this.doseGrid[iy][ix] += dose;
      } else {
        // Handle cases where current dose is not a number or input dose is not valid
        // This could be a log or a specific handling if necessary
        // For now, let's prevent NaN propagation if cell wasn't a number or dose is bad
        if (isFinite(dose) && !isNaN(dose)) {
             // If this.doseGrid[iy][ix] was not a number, but dose is, initialize it.
             // This case should ideally not happen with proper initialization.
             this.doseGrid[iy][ix] = dose; 
        }
      }
    }
  }
  
  public getDoseDistribution(): number[][] {
    // Normalize dose values for visualization
    let maxDose = 0;
    for (let y = 0; y < this.doseGrid.length; y++) {
      for (let x = 0; x < this.doseGrid[0].length; x++) {
        maxDose = Math.max(maxDose, this.doseGrid[y][x]);
      }
    }
    
    // Return normalized dose grid (0-1 values)
    if (maxDose > 0) {
      return this.doseGrid.map(row => 
        row.map(dose => dose / maxDose)
      );
    }
    
    return this.doseGrid; // Return original grid if maxDose is 0
  }
  
  public getBeams(): Beam[] {
    return this.beams;
  }
  
  public removeBeam(index: number): void {
    if (index >= 0 && index < this.beams.length) {
      this.beams.splice(index, 1);
    }
  }
  
  public clearBeams(): void {
    this.beams = [];
    this.initializeDoseGrid();
  }
  
  // Create a realistic phantom with standard dimensions (1px = 5mm)
  public static createSimplePhantom(originalWidth: number, originalHeight: number): CTImageData {
    // Use full FOV size (400×400 pixels at 5mm scale)
    const newWidth = FOV_DIAMETER_PIXELS;
    const newHeight = FOV_DIAMETER_PIXELS;
    
    // Standard dimensions for a circular water phantom (scaled to 1px = 5mm)
    const phantomDiameter = 80;  // 40cm diameter / 5mm per pixel = 80 pixels

    // Initialize entire canvas with air (low HU value like 5)
    const data: number[][] = Array(newHeight).fill(0).map(() => Array(newWidth).fill(5));

    // Center coordinates within the grid
    const centerX = Math.floor(newWidth / 2);
    const centerY = Math.floor(newHeight / 2);
    
    // Draw a simple homogeneous circular phantom
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        // Calculate distance from center
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        // Inside the circular phantom
        if (distFromCenter < phantomDiameter / 2) {
          // Uniform water density (pixel value 100)
          data[y][x] = 100; // Water equivalent (~ 0 HU)
        }
      }
    }
    
    return { width: newWidth, height: newHeight, data };
  }
  
  public updateBeam(index: number, angle: number, startX: number, startY: number, beamWidth: number = 20, energy: number = 6): void {
    if (index >= 0 && index < this.beams.length) {
      this.beams[index] = {
        angle: angle * Math.PI / 180, // Convert to radians but preserve original angle convention
        startX,
        startY,
        width: beamWidth,
        energy: energy
      };
    }
  }
} 