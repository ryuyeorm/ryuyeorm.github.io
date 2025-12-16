/**
 * Generate pixelated textures for obstacles
 * Updated: 2025-12-16
 */

// Generate grass texture (16x16 pixels)
export function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  
  // Base grass colors
  const grassColors = [
    '#3a8c3a', // Dark green
    '#4fa84f', // Medium green
    '#5dbe5d', // Light green
    '#2d7a2d'  // Very dark green
  ];
  
  // Fill with random grass pixels
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const color = grassColors[Math.floor(Math.random() * grassColors.length)];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  // Add some bright highlights
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(Math.random() * 16);
    const y = Math.floor(Math.random() * 16);
    ctx.fillStyle = '#7cd37c';
    ctx.fillRect(x, y, 1, 1);
  }
  
  return canvas.toDataURL();
}

// Generate soil/dirt texture (16x16 pixels) - spotty, not striped
export function createSoilTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  
  // Base brown tones - mid range
  const baseBrown = '#7a5030';
  const darkBrown = '#5a3818';
  const lightBrown = '#9b6a3b';
  
  // Fill with base color first
  ctx.fillStyle = baseBrown;
  ctx.fillRect(0, 0, 16, 16);
  
  // Add dark spots (clusters of 1-3 pixels)
  for (let i = 0; i < 15; i++) {
    const x = Math.floor(Math.random() * 16);
    const y = Math.floor(Math.random() * 16);
    const size = Math.floor(Math.random() * 3) + 1; // 1-3 pixel clusters
    
    ctx.fillStyle = darkBrown;
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        if (Math.random() < 0.7 && (x + dx) < 16 && (y + dy) < 16) { // Some randomness in cluster
          ctx.fillRect(x + dx, y + dy, 1, 1);
        }
      }
    }
  }
  
  // Add light spots (clusters of 1-2 pixels)
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(Math.random() * 16);
    const y = Math.floor(Math.random() * 16);
    const size = Math.floor(Math.random() * 2) + 1; // 1-2 pixel clusters
    
    ctx.fillStyle = lightBrown;
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        if (Math.random() < 0.6 && (x + dx) < 16 && (y + dy) < 16) {
          ctx.fillRect(x + dx, y + dy, 1, 1);
        }
      }
    }
  }
  
  // Add some very dark spots (single pixels)
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(Math.random() * 16);
    const y = Math.floor(Math.random() * 16);
    ctx.fillStyle = '#3d2210';
    ctx.fillRect(x, y, 1, 1);
  }
  
  // Add some lighter highlights (single pixels)
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(Math.random() * 16);
    const y = Math.floor(Math.random() * 16);
    ctx.fillStyle = '#b08050';
    ctx.fillRect(x, y, 1, 1);
  }
  
  return canvas.toDataURL();
}

// Generate orange variant for moving obstacles
export function createOrangeGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  
  // Orange grass colors
  const grassColors = [
    '#d97520', // Dark orange
    '#ff8c30', // Medium orange
    '#ffa050', // Light orange
    '#c86510'  // Very dark orange
  ];
  
  // Fill with random pixels
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const color = grassColors[Math.floor(Math.random() * grassColors.length)];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  // Add highlights
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(Math.random() * 16);
    const y = Math.floor(Math.random() * 16);
    ctx.fillStyle = '#ffb870';
    ctx.fillRect(x, y, 1, 1);
  }
  
  return canvas.toDataURL();
}
