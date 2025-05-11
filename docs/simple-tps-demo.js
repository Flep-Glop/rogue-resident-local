// Simple Treatment Planning System (TPS) Model
class SimpleTPS {
    constructor(ctImageData) {
        this.ctData = ctImageData;
        this.beams = [];
        this.doseGrid = [];
        this.initializeDoseGrid();
    }
    
    initializeDoseGrid() {
        // Initialize dose grid with zeros
        this.doseGrid = Array(this.ctData.height).fill().map(() => 
            Array(this.ctData.width).fill(0)
        );
    }
    
    addBeam(angle, startX, startY, beamWidth = 50, beamIntensity = 100) {
        this.beams.push({
            angle: angle * Math.PI / 180, // Convert to radians
            startX,
            startY,
            width: beamWidth,
            intensity: beamIntensity
        });
    }
    
    calculateDose() {
        this.initializeDoseGrid();
        
        for (let beam of this.beams) {
            this.calculateBeamDose(beam);
        }
        
        return this.doseGrid;
    }
    
    calculateBeamDose(beam) {
        // Simple ray-casting dose calculation
        const stepSize = 1; // pixels
        const maxDepth = Math.max(this.ctData.width, this.ctData.height);
        
        // Create parallel rays across the beam width
        for (let offset = -beam.width/2; offset <= beam.width/2; offset += 2) {
            // Calculate ray starting position based on beam angle and offset
            const perpAngle = beam.angle + Math.PI/2;
            const rayStartX = beam.startX + offset * Math.cos(perpAngle);
            const rayStartY = beam.startY + offset * Math.sin(perpAngle);
            
            // Ray direction
            const dirX = Math.cos(beam.angle);
            const dirY = Math.sin(beam.angle);
            
            let currentIntensity = beam.intensity;
            let totalAttenuation = 0;
            
            // Trace ray through tissue
            for (let depth = 0; depth < maxDepth; depth += stepSize) {
                const x = Math.round(rayStartX + dirX * depth);
                const y = Math.round(rayStartY + dirY * depth);
                
                // Check bounds
                if (x < 0 || x >= this.ctData.width || y < 0 || y >= this.ctData.height) {
                    break;
                }
                
                // Get pixel value (0-255) as proxy for density
                const pixelValue = this.ctData.data[y][x];
                const density = pixelValue / 255; // Normalize to 0-1
                
                // Simple attenuation model
                const attenuationCoeff = 0.02 * density; // Adjust this value
                totalAttenuation += attenuationCoeff * stepSize;
                
                // Calculate dose at this point
                currentIntensity = beam.intensity * Math.exp(-totalAttenuation);
                
                // Add dose to grid (with some scatter simulation)
                this.depositDose(x, y, currentIntensity * stepSize * 0.1);
                
                // Simple scatter simulation
                if (Math.random() < 0.1) {
                    const scatterX = x + Math.round((Math.random() - 0.5) * 3);
                    const scatterY = y + Math.round((Math.random() - 0.5) * 3);
                    this.depositDose(scatterX, scatterY, currentIntensity * 0.05);
                }
            }
        }
    }
    
    depositDose(x, y, dose) {
        if (x >= 0 && x < this.ctData.width && y >= 0 && y < this.ctData.height) {
            this.doseGrid[y][x] += dose;
        }
    }
    
    getDoseDistribution() {
        // Normalize dose values for visualization
        let maxDose = 0;
        for (let y = 0; y < this.doseGrid.length; y++) {
            for (let x = 0; x < this.doseGrid[0].length; x++) {
                maxDose = Math.max(maxDose, this.doseGrid[y][x]);
            }
        }
        
        // Return normalized dose grid
        return this.doseGrid.map(row => 
            row.map(dose => dose / maxDose)
        );
    }
}

// Example usage:
function demonstrateTPS() {
    // Simulate CT data (grayscale values)
    const mockCTData = {
        width: 256,
        height: 256,
        data: Array(256).fill().map(() => 
            Array(256).fill().map(() => Math.random() * 128 + 64) // Random tissue density
        )
    };
    
    // Create TPS instance
    const tps = new SimpleTPS(mockCTData);
    
    // Add three beams at different angles
    tps.addBeam(0, 128, 0, 40, 100);    // Top beam
    tps.addBeam(120, 32, 192, 40, 100); // Lower left beam
    tps.addBeam(240, 224, 192, 40, 100); // Lower right beam
    
    // Calculate dose distribution
    tps.calculateDose();
    
    // Get normalized dose for visualization
    const doseMap = tps.getDoseDistribution();
    
    return doseMap;
}

// Visualization helper
function visualizeDose(doseGrid, canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(doseGrid[0].length, doseGrid.length);
    
    for (let y = 0; y < doseGrid.length; y++) {
        for (let x = 0; x < doseGrid[0].length; x++) {
            const index = (y * doseGrid[0].length + x) * 4;
            const doseValue = doseGrid[y][x];
            
            // Color mapping: blue (low) -> green -> yellow -> red (high)
            if (doseValue < 0.25) {
                imageData.data[index] = 0;
                imageData.data[index + 1] = doseValue * 4 * 255;
                imageData.data[index + 2] = 255;
            } else if (doseValue < 0.5) {
                imageData.data[index] = (doseValue - 0.25) * 4 * 255;
                imageData.data[index + 1] = 255;
                imageData.data[index + 2] = (0.5 - doseValue) * 4 * 255;
            } else if (doseValue < 0.75) {
                imageData.data[index] = 255;
                imageData.data[index + 1] = (0.75 - doseValue) * 4 * 255;
                imageData.data[index + 2] = 0;
            } else {
                imageData.data[index] = 255;
                imageData.data[index + 1] = 0;
                imageData.data[index + 2] = 0;
            }
            
            imageData.data[index + 3] = doseValue > 0.1 ? 200 : 0; // Alpha
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}