// Simplified Material Model for TPS
// Using relative attenuation coefficients inspired by NIST data

const MATERIALS = {
    // Linear attenuation coefficients (relative to water = 1.0)
    // Based on typical 6 MV photon beam energies (~2 MeV average)
    AIR: {
        density: 0.0012,      // g/cm³
        attenuation: 0.001,   // Nearly transparent
        color: [200, 200, 255, 100]  // Light blue, transparent
    },
    FAT: {
        density: 0.92,        // g/cm³
        attenuation: 0.90,    // Slightly less than water
        color: [255, 255, 200, 180]  // Light yellow
    },
    WATER: {
        density: 1.0,         // g/cm³
        attenuation: 1.0,     // Reference material
        color: [100, 150, 255, 200]  // Blue
    },
    SOFT_TISSUE: {
        density: 1.06,        // g/cm³
        attenuation: 1.02,    // Very close to water
        color: [255, 200, 200, 200]  // Light pink
    },
    BONE: {
        density: 1.85,        // g/cm³ (cortical bone)
        attenuation: 1.65,    // Significantly higher
        color: [255, 255, 255, 250]  // White
    }
};

// Material assignment based on pixel intensity
function getMaterialFromPixel(pixelValue) {
    // Map grayscale (0-255) to materials
    if (pixelValue < 10) return MATERIALS.AIR;
    if (pixelValue < 60) return MATERIALS.FAT;
    if (pixelValue < 120) return MATERIALS.WATER;
    if (pixelValue < 200) return MATERIALS.SOFT_TISSUE;
    return MATERIALS.BONE;
}

// Enhanced TPS with material-based physics
class PhysicallyBasedTPS {
    constructor(ctImageData) {
        this.ctData = ctImageData;
        this.materialMap = this.generateMaterialMap();
        this.beams = [];
        this.doseGrid = [];
        this.initializeDoseGrid();
    }
    
    generateMaterialMap() {
        const map = [];
        for (let y = 0; y < this.ctData.height; y++) {
            map[y] = [];
            for (let x = 0; x < this.ctData.width; x++) {
                const pixelValue = this.ctData.data[y][x];
                map[y][x] = getMaterialFromPixel(pixelValue);
            }
        }
        return map;
    }
    
    calculateBeamDose(beam) {
        const stepSize = 0.5; // Smaller steps for better accuracy
        const maxDepth = Math.max(this.ctData.width, this.ctData.height);
        
        // Simulate photon beam spectrum (simplified)
        const beamEnergy = beam.energy || 6; // MV
        const attenuationScale = this.getAttenuationScale(beamEnergy);
        
        for (let offset = -beam.width/2; offset <= beam.width/2; offset += 1) {
            const perpAngle = beam.angle + Math.PI/2;
            const rayStartX = beam.startX + offset * Math.cos(perpAngle);
            const rayStartY = beam.startY + offset * Math.sin(perpAngle);
            
            const dirX = Math.cos(beam.angle);
            const dirY = Math.sin(beam.angle);
            
            let currentIntensity = beam.intensity;
            let totalAttenuation = 0;
            let depth = 0;
            
            // Build-up region simulation
            let buildUpFactor = 0;
            const dmax = this.getDepthOfMaximum(beamEnergy); // Depth of maximum dose
            
            for (depth = 0; depth < maxDepth; depth += stepSize) {
                const x = Math.round(rayStartX + dirX * depth);
                const y = Math.round(rayStartY + dirY * depth);
                
                if (x < 0 || x >= this.ctData.width || y < 0 || y >= this.ctData.height) {
                    break;
                }
                
                const material = this.materialMap[y][x];
                
                // Physical attenuation calculation
                const linearAttenuation = material.attenuation * attenuationScale;
                totalAttenuation += linearAttenuation * stepSize;
                
                // Simulate build-up effect
                if (depth < dmax) {
                    buildUpFactor = Math.pow(depth / dmax, 1.5);
                } else {
                    buildUpFactor = Math.exp(-(depth - dmax) * 0.01);
                }
                
                // Calculate dose with build-up
                currentIntensity = beam.intensity * Math.exp(-totalAttenuation) * buildUpFactor;
                
                // Deposit dose
                const dose = currentIntensity * stepSize * material.density;
                this.depositDose(x, y, dose);
                
                // Enhanced scatter simulation based on material
                this.simulateScatter(x, y, material, currentIntensity);
            }
        }
    }
    
    getAttenuationScale(energyMV) {
        // Simplified energy scaling
        // Lower energy = higher attenuation
        return 2.0 / Math.sqrt(energyMV);
    }
    
    getDepthOfMaximum(energyMV) {
        // Approximate depth of maximum dose
        // Higher energy = deeper dmax
        return 1.5 * Math.sqrt(energyMV);
    }
    
    simulateScatter(x, y, material, intensity) {
        // Material-dependent scatter probability
        const scatterProb = material.density * 0.1;
        
        if (Math.random() < scatterProb) {
            const scatterRadius = 2;
            const scatterAngle = Math.random() * 2 * Math.PI;
            const scatterDistance = Math.random() * scatterRadius;
            
            const scatterX = x + Math.round(Math.cos(scatterAngle) * scatterDistance);
            const scatterY = y + Math.round(Math.sin(scatterAngle) * scatterDistance);
            
            const scatterDose = intensity * 0.05 * material.density;
            this.depositDose(scatterX, scatterY, scatterDose);
        }
    }
    
    // Visualization method that shows material composition
    visualizeMaterials(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(this.ctData.width, this.ctData.height);
        
        for (let y = 0; y < this.ctData.height; y++) {
            for (let x = 0; x < this.ctData.width; x++) {
                const index = (y * this.ctData.width + x) * 4;
                const material = this.materialMap[y][x];
                
                imageData.data[index] = material.color[0];
                imageData.data[index + 1] = material.color[1];
                imageData.data[index + 2] = material.color[2];
                imageData.data[index + 3] = material.color[3];
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
}

// Example patient scenarios with realistic material distributions
const PATIENT_SCENARIOS = {
    CHEST: {
        description: "Lung tumor treatment",
        generateCT: function(width, height) {
            const data = [];
            for (let y = 0; y < height; y++) {
                data[y] = [];
                for (let x = 0; x < width; x++) {
                    // Basic chest anatomy
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    // Outer body contour
                    if (dist > width * 0.4) {
                        data[y][x] = 0; // Air
                    }
                    // Lung regions
                    else if (Math.abs(dx) > width * 0.15 && dist < width * 0.35) {
                        data[y][x] = 5; // Lung (mostly air)
                    }
                    // Spine
                    else if (Math.abs(dx) < width * 0.05 && dy > 0) {
                        data[y][x] = 220; // Bone
                    }
                    // Ribs
                    else if (Math.abs(dy) < height * 0.02 && Math.abs(dx) > width * 0.1) {
                        data[y][x] = 200; // Bone
                    }
                    // Tumor
                    else if (dx > width * 0.1 && dx < width * 0.2 && 
                             dy > -height * 0.1 && dy < 0) {
                        data[y][x] = 150; // Soft tissue (tumor)
                    }
                    // Mediastinum/heart
                    else if (Math.abs(dx) < width * 0.15) {
                        data[y][x] = 100; // Water equivalent
                    }
                    // General soft tissue
                    else {
                        data[y][x] = 120; // Soft tissue
                    }
                }
            }
            return data;
        }
    },
    
    HEAD: {
        description: "Brain tumor treatment",
        generateCT: function(width, height) {
            // Similar pattern for head anatomy
            // ... implementation
        }
    }
};