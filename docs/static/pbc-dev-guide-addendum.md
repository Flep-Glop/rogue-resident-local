# Pencil Beam Convolution Implementation Guide - Addendum

## Critical Fixes for Megavoltage Beam Physics

### Issue: Rapid Beam Die-off

The implemented beams are dying off too quickly due to incorrect attenuation values and physics modeling. Here are the required corrections:

### 1. Material Attenuation Coefficients

**Problem:** Current attenuation values are orders of magnitude too high for megavoltage beams.

**Fix:** Use physically accurate values for therapeutic beam energies:

```typescript
const MATERIALS: { [key: string]: Material } = {
  AIR: { density: 0.0012, attenuation: 0.0001 },      // was 0.001
  FAT: { density: 0.92, attenuation: 0.045 },         // was 0.90
  WATER: { density: 1.0, attenuation: 0.05 },         // was 1.0
  SOFT_TISSUE: { density: 1.06, attenuation: 0.052 }, // was 1.02
  BONE: { density: 1.85, attenuation: 0.08 }          // was 1.65
};
```

*Note: These values are approximate linear attenuation coefficients in cm⁻¹ for 6 MV photons.*

### 2. Energy Attenuation Factor

**Problem:** Current implementation overemphasizes energy dependence.

**Fix:** More realistic energy scaling:

```typescript
private getEnergyAttenuationFactor(energyMV: number): number {
    // Scale attenuation with energy (lower energy = higher attenuation)
    // At 6 MV returns 1.0, at 18 MV returns ~0.7
    return 1.0 / Math.pow(energyMV / 6, 0.3);
}
```

### 3. Unit Consistency

**Problem:** Mixing of units between pixel-based calculations and physical units.

**Fix:** Ensure consistent unit conversion:

```typescript
// If 1 pixel = 1 mm, convert attenuation coefficient
const PIXEL_TO_CM = 0.1; // 1 pixel = 1 mm = 0.1 cm
const linearAttenuationCoeff = material.attenuation * energyAttenuationFactor * PIXEL_TO_CM;
```

### 4. Improved Percentage Depth Dose Model

**Problem:** Current model uses overly aggressive exponential falloff.

**Fix:** Implement more accurate PDD calculation:

```typescript
private calculatePDD(depth: number, energy: number, fieldSize: number): number {
    const dmax = this.calculateDepthOfMaxDose(energy);
    
    if (depth < 0) return 0;
    
    if (depth < dmax) {
        // Build-up region using modified Bjärngard model
        const buildupParam = 0.7 + 0.02 * energy;
        return (1 - Math.exp(-buildupParam * depth/dmax)) * Math.exp(-0.001 * depth);
    } else {
        // Beyond dmax: exponential attenuation
        const mu_eff = this.getEffectiveAttenuationCoefficient(energy, fieldSize);
        return Math.exp(-mu_eff * (depth - dmax));
    }
}

private getEffectiveAttenuationCoefficient(energy: number, fieldSize: number): number {
    // Base attenuation coefficient for water
    const mu_water = 0.05 / Math.pow(energy/6, 0.3); // cm⁻¹
    
    // Field size correction (larger fields have more scatter, less effective attenuation)
    const fieldSizeFactor = 1 - 0.2 * Math.tanh(fieldSize / 100);
    
    return mu_water * fieldSizeFactor * 0.1; // Convert to mm⁻¹ if needed
}
```

## Physics Enhancements from Code Review

### 1. Enhanced Scatter Calculation

Replace the simple scatter model with a more realistic kernel-based approach:

```typescript
private calculateScatterKernel(lateralDistance: number, depth: number, energy: number): number {
    // Gaussian lateral spread that increases with depth
    const sigma = 2.0 + depth * 0.05; // mm
    const gaussianFactor = Math.exp(-(lateralDistance * lateralDistance) / (2 * sigma * sigma));
    
    // Energy-dependent scatter magnitude
    const scatterFraction = 0.15 * (1 - Math.exp(-energy/10));
    
    return scatterFraction * gaussianFactor;
}

private depositScatter(x: number, y: number, primaryDose: number, depth: number, beam: Beam): void {
    const scatterRadius = Math.min(10, 3 + depth * 0.02); // Adaptive radius
    
    for (let dy = -scatterRadius; dy <= scatterRadius; dy++) {
        for (let dx = -scatterRadius; dx <= scatterRadius; dx++) {
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance > scatterRadius) continue;
            
            const scatterFactor = this.calculateScatterKernel(distance, depth, beam.energy);
            const scatterDose = primaryDose * scatterFactor;
            
            this.depositDose(x + dx, y + dy, scatterDose);
        }
    }
}
```

### 2. Realistic Beam Profile

Implement a more accurate beam intensity profile:

```typescript
private generatePencilBeamGrid(beam: Beam, pencilBeamSpacing: number = 1): PencilBeamElement[] {
    const pencilBeams: PencilBeamElement[] = [];
    const halfWidth = beam.width / 2;
    
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
    pencilBeams.forEach(pb => pb.fluenceWeight /= totalWeight);
    
    return pencilBeams;
}
```

### 3. Field Size Dependent Output Factors

Add proper collimator and phantom scatter factors:

```typescript
private calculateOutputFactor(fieldSize: number, energy: number): number {
    // Collimator scatter factor (Sc)
    // Increases slowly with field size
    const sc = 0.95 + 0.05 * Math.tanh(fieldSize / 50);
    
    // Phantom scatter factor (Sp)
    // Increases more significantly with field size
    const sp = 1.0 + 0.15 * (1 - Math.exp(-fieldSize / 100));
    
    // Total output factor
    return sc * sp;
}
```

### 4. Tissue Heterogeneity Corrections

Implement radiological path length corrections:

```typescript
private calculateEffectiveDepth(path: {x: number, y: number}[], stepSize: number): number {
    let waterEquivalentDepth = 0;
    
    for (let i = 1; i < path.length; i++) {
        const material = this.materialMap[path[i].y][path[i].x];
        
        // Use relative electron density for depth scaling
        const relativeElectronDensity = material.density;
        waterEquivalentDepth += stepSize * relativeElectronDensity;
    }
    
    return waterEquivalentDepth;
}
```

### 5. Depth of Maximum Dose Refinement

Improve dmax calculation to be field-size dependent:

```typescript
private calculateDepthOfMaxDose(energy: number, fieldSize: number = 100): number {
    // Base dmax for 10x10 cm² field
    const baseDmax = {
        6: 15,   // 1.5 cm
        10: 25,  // 2.5 cm
        15: 30,  // 3.0 cm
        18: 35   // 3.5 cm
    };
    
    // Get base dmax or interpolate
    let dmax = baseDmax[energy] || (15 + energy * 1.1);
    
    // Field size correction (smaller fields have shallower dmax)
    if (fieldSize < 50) { // Less than 5x5 cm²
        dmax *= 0.8 + 0.2 * (fieldSize / 50);
    }
    
    return dmax;
}
```

## Performance Optimizations

### 1. Reduce Calculation Points

Only calculate dose in regions where it's significant:

```typescript
// Skip calculations for points far from beam path
const distanceFromBeamAxis = calculateDistanceFromBeamAxis(x, y, beam);
if (distanceFromBeamAxis > beam.width * 2) continue;
```

### 2. Adaptive Step Size

Use smaller steps near interfaces, larger steps in homogeneous regions:

```typescript
let stepSize = 0.5; // Default step size

// Check if we're near a material interface
if (isNearInterface(x, y)) {
    stepSize = 0.1; // Finer steps near boundaries
} else if (material.density < 0.3) {
    stepSize = 1.0; // Larger steps in air
}
```

### 3. Precalculated Kernels

Store frequently used kernel values:

```typescript
private kernelCache = new Map<string, number>();

private getCachedKernel(depth: number, lateralDistance: number, energy: number): number {
    const key = `${depth.toFixed(1)}_${lateralDistance.toFixed(1)}_${energy}`;
    
    if (!this.kernelCache.has(key)) {
        const kernelValue = this.calculateKernel(depth, lateralDistance, energy);
        this.kernelCache.set(key, kernelValue);
    }
    
    return this.kernelCache.get(key)!;
}
```

## Testing Recommendations

1. **Verify Depth Dose Curves**: Compare calculated PDD curves with published data for different energies
2. **Check Beam Profiles**: Validate beam profiles at different depths match expected shapes
3. **Test Heterogeneity**: Ensure dose changes appropriately at tissue interfaces
4. **Benchmark Performance**: Measure calculation times for typical clinical scenarios

## Critical Implementation Checklist

- [ ] Update material attenuation coefficients to megavoltage values
- [ ] Fix energy attenuation scaling
- [ ] Implement proper PDD calculation
- [ ] Add unit consistency throughout calculations
- [ ] Verify beam penetration matches clinical expectations (15-20 cm in tissue)
- [ ] Test with multiple beam energies (6, 10, 18 MV)
- [ ] Validate dose normalization is working correctly

## References

- Khan, F. M., & Gibbons, J. P. (2014). *Khan's the physics of radiation therapy*
- Papanikolaou, N., et al. (2004). *Tissue inhomogeneity corrections for megavoltage photon beams* (AAPM TG-65)
- Van Dyk, J., et al. (1993). *Commissioning and quality assurance of treatment planning computers* (AAPM TG-53)