# Pencil Beam Convolution (PBC) Implementation Guide

## Algorithm Recommendation: Enhanced Pencil Beam Convolution

### Why PBC for Rogue Resident

1. **Educational Value**
   - Clear physics principles that align with Knowledge Constellation concepts
   - Direct connection to fundamental concepts like depth dose, beam divergence, and scatter
   - Easier for residents to understand the underlying physics

2. **Browser Performance**
   - Runs efficiently in JavaScript/WebAssembly
   - Can achieve 30-127x speedup with GPU acceleration
   - Calculation times in seconds rather than minutes

3. **Implementation Feasibility**
   - Well-documented mathematical formulation
   - Open-source reference implementations available (matRad)
   - Can implement incrementally with small team

## Implementation Approach

### Core Algorithm Structure

```javascript
// Simplified PBC implementation for educational purposes
class PencilBeamCalculator {
  constructor(beamData, patientData) {
    this.kernels = this.loadDoseKernels(beamData);
    this.tissueData = patientData;
    this.pencilBeams = this.generatePencilBeamGrid(beamData);
  }

  calculateDose(point) {
    // Basic PBC formula: D(x,y,z) = Σ Φ(x',y') * K(x-x', y-y', z) dx'dy'
    let dose = 0;
    for (let pencilBeam of this.pencilBeams) {
      dose += this.calculatePencilContribution(pencilBeam, point);
    }
    return dose;
  }

  calculatePencilContribution(pencilBeam, point) {
    // Calculate individual pencil beam contribution
    const fluence = pencilBeam.fluence;
    const kernel = this.getKernel(pencilBeam, point);
    const distance = this.calculateDistance(pencilBeam, point);
    
    return fluence * kernel * this.inverseSquareLaw(distance);
  }

  // Educational features
  visualizePencilBeams() {
    // Show individual pencil beam contributions
    return this.pencilBeams.map(beam => ({
      position: beam.position,
      contribution: beam.contribution,
      color: this.getVisualizationColor(beam.contribution)
    }));
  }
  
  demonstrateHeterogeneityEffects() {
    // Highlight algorithm limitations in lung/bone interfaces
    return this.tissueData.map(voxel => ({
      position: voxel.position,
      density: voxel.density,
      accuracyIndicator: this.getAccuracyEstimate(voxel)
    }));
  }
}
```

### Key Mathematical Components

```javascript
// Essential physics calculations
class PhysicsCalculations {
  // Percentage Depth Dose
  calculatePDD(depth, energy, fieldSize) {
    const dmax = this.getDepthOfMaxDose(energy);
    return this.pddLookupTable[energy][fieldSize](depth);
  }

  // Tissue Phantom Ratio
  calculateTPR(depth, fieldSize) {
    return this.tprLookupTable[fieldSize](depth);
  }

  // Inverse Square Law
  inverseSquareLaw(distance) {
    const referenceDistance = 100; // cm
    return Math.pow(referenceDistance / distance, 2);
  }

  // Beam Divergence
  calculateFieldSizeAtDepth(fieldSize, ssd, depth) {
    return fieldSize * (ssd + depth) / ssd;
  }

  // Scatter Factors
  calculateScatterFactors(fieldSize) {
    return {
      collimator: this.collimatorScatterTable[fieldSize],
      phantom: this.phantomScatterTable[fieldSize]
    };
  }
}
```

## Educational Enhancements

### 1. Visualization Features

```javascript
class EducationalVisualizer {
  // Show individual pencil beam contributions
  visualizePencilBeamContributions(calculator) {
    const canvas = document.getElementById('doseCanvas');
    const ctx = canvas.getContext('2d');
    
    calculator.pencilBeams.forEach(beam => {
      this.drawBeamPath(ctx, beam);
      this.showDoseContribution(ctx, beam);
    });
  }

  // Animate dose buildup and scatter
  animateDoseBuildup(calculator, timeStep) {
    const frames = [];
    for (let depth = 0; depth <= maxDepth; depth += timeStep) {
      frames.push(calculator.calculateDoseProfile(depth));
    }
    return frames;
  }

  // Highlight calculation steps in real-time
  showCalculationSteps(calculator) {
    return {
      primaryBeam: calculator.getPrimaryComponent(),
      scatterContribution: calculator.getScatterComponent(),
      heterogeneityCorrection: calculator.getHeterogeneityCorrection(),
      finalDose: calculator.getFinalDose()
    };
  }
}
```

### 2. Interactive Parameters

```javascript
class InteractiveControls {
  constructor(calculator) {
    this.calculator = calculator;
    this.setupControls();
  }

  setupControls() {
    // Beam energy control
    document.getElementById('beamEnergy').addEventListener('change', (e) => {
      this.calculator.setBeamEnergy(e.target.value);
      this.updateDepthDoseCurve();
    });

    // Field size control
    document.getElementById('fieldSize').addEventListener('change', (e) => {
      this.calculator.setFieldSize(e.target.value);
      this.updateScatterVisualization();
    });

    // Heterogeneity toggle
    document.getElementById('heterogeneityToggle').addEventListener('change', (e) => {
      this.calculator.enableHeterogeneityCorrections(e.target.checked);
      this.showAccuracyComparison();
    });
  }

  updateDepthDoseCurve() {
    const depths = Array.from({length: 30}, (_, i) => i);
    const doses = depths.map(d => this.calculator.calculateDose({x: 0, y: 0, z: d}));
    this.plotDepthDose(depths, doses);
  }
}
```

### 3. Algorithm Limitations as Learning Points

```javascript
class LimitationDemonstrator {
  constructor(calculator) {
    this.calculator = calculator;
  }

  demonstrateLungInterfaceError() {
    // Show dose calculation at lung-tissue interface
    const lungDose = this.calculator.calculateDose({x: 0, y: 0, z: 10}, 'lung');
    const referenceDose = this.getMonteCarloDose({x: 0, y: 0, z: 10}, 'lung');
    
    return {
      pbcDose: lungDose,
      accurateDose: referenceDose,
      percentError: ((lungDose - referenceDose) / referenceDose) * 100,
      explanation: "PBC overestimates dose in low-density regions due to..."
    };
  }

  compareAlgorithmAccuracy() {
    const scenarios = ['water', 'lung', 'bone', 'interface'];
    return scenarios.map(scenario => ({
      scenario,
      pbcAccuracy: this.calculateAccuracy('pbc', scenario),
      explanation: this.getAccuracyExplanation('pbc', scenario)
    }));
  }
}
```

## Performance Optimizations

### 1. Web Workers for Parallel Calculations

```javascript
// main.js
class DoseCalculationManager {
  constructor() {
    this.workers = [];
    this.initializeWorkers();
  }

  initializeWorkers() {
    const numWorkers = navigator.hardwareConcurrency || 4;
    for (let i = 0; i < numWorkers; i++) {
      this.workers.push(new Worker('doseWorker.js'));
    }
  }

  async calculateDoseParallel(grid) {
    const chunks = this.divideGrid(grid, this.workers.length);
    const promises = chunks.map((chunk, index) => 
      this.calculateChunk(chunk, this.workers[index])
    );
    
    const results = await Promise.all(promises);
    return this.combineResults(results);
  }
}

// doseWorker.js
self.addEventListener('message', (e) => {
  const { chunk, beamData } = e.data;
  const calculator = new PencilBeamCalculator(beamData);
  const results = chunk.map(point => calculator.calculateDose(point));
  self.postMessage(results);
});
```

### 2. WebGL for GPU Acceleration

```javascript
class GPUAcceleratedPBC {
  constructor() {
    this.gl = this.initWebGL();
    this.shaders = this.loadShaders();
  }

  initWebGL() {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2');
  }

  calculateDoseGPU(points, beamData) {
    // Prepare data for GPU
    const pointsTexture = this.createTexture(points);
    const kernelTexture = this.createTexture(beamData.kernels);
    
    // Set up shader program
    this.gl.useProgram(this.shaders.doseProgram);
    this.gl.bindTexture(this.gl.TEXTURE_2D, pointsTexture);
    
    // Execute calculation
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    
    // Read results
    return this.readPixels();
  }
}
```

### 3. Progressive Calculation

```javascript
class ProgressiveDoseCalculator {
  constructor(calculator) {
    this.calculator = calculator;
    this.resolutionLevels = [8, 4, 2, 1]; // mm
  }

  async calculateProgressive(grid, onProgress) {
    const results = [];
    
    for (let resolution of this.resolutionLevels) {
      const coarseGrid = this.downsampleGrid(grid, resolution);
      const coarseDose = await this.calculator.calculateDose(coarseGrid);
      
      const interpolatedDose = this.interpolateToFullGrid(coarseDose, grid);
      results.push(interpolatedDose);
      
      onProgress({
        resolution,
        dose: interpolatedDose,
        progress: resolution === 1 ? 1.0 : 0.5
      });
    }
    
    return results[results.length - 1];
  }
}
```

### 4. Caching System

```javascript
class DoseCalculationCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  getCacheKey(point, beamParams) {
    return `${point.x}_${point.y}_${point.z}_${beamParams.energy}_${beamParams.fieldSize}`;
  }

  get(point, beamParams) {
    const key = this.getCacheKey(point, beamParams);
    if (this.cache.has(key)) {
      // Move to end (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(point, beamParams, dose) {
    const key = this.getCacheKey(point, beamParams);
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, dose);
  }
}
```

## Testing and Validation

```javascript
class PBCValidator {
  validateAgainstReference() {
    const testCases = [
      { scenario: 'homogeneous water', expectedAccuracy: 0.98 },
      { scenario: 'lung interface', expectedAccuracy: 0.85 },
      { scenario: 'bone interface', expectedAccuracy: 0.90 }
    ];

    return testCases.map(test => ({
      scenario: test.scenario,
      accuracy: this.calculateAccuracy(test.scenario),
      passed: this.calculateAccuracy(test.scenario) >= test.expectedAccuracy
    }));
  }

  benchmarkPerformance() {
    const gridSizes = [64, 128, 256];
    return gridSizes.map(size => {
      const start = performance.now();
      this.calculator.calculateDose(this.generateGrid(size));
      const end = performance.now();
      
      return {
        gridSize: size,
        time: end - start,
        pointsPerSecond: (size * size * size) / ((end - start) / 1000)
      };
    });
  }
}
```