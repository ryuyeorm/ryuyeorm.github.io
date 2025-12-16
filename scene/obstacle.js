import * as THREE from '../lib/three.js/build/three.module.js';
import { createGrassTexture, createSoilTexture, createOrangeGrassTexture } from './textures.js';

export class Obstacle {
  /**
   * @param {Object} options
   * @param {number} options.gapY - vertical center of the gap
   * @param {number} options.gapHeight - height of the gap
   * @param {number} options.x - initial x position
   * @param {number} options.width - pipe width
   * @param {number} options.depth - pipe depth
   * @param {number} options.height - total height of play area
   * @param {number} options.color - pipe color
   */
  constructor({
    gapY = 2.5,
    gapHeight = 2.2, // bigger opening
    x = 10,
    width = 1.5, // wider obstacle
    depth = 1.2,
    height = 6,
    color = 0x2ecc40,
    addBonusHole = false,
    isMoving = false,
    graphicsMode = 'prototype'
  } = {}) {
    this.group = new THREE.Group();
    this.width = width;
    this.depth = depth;
    this.height = height;
    this.gapY = gapY;
    this.initialGapY = gapY;
    this.gapHeight = gapHeight;
    this.x = x;
    this.color = color;
    this.bonusHole = null;
    this.bonusHoleCollected = false;
    this.isMoving = isMoving;
    this.moveTime = 0;
    this.moveSpeed = 0.8;
    this.moveRange = 1.5;

    // Prepare textures for full mode
    let createTexture, grassTextureData, soilTextureData;
    if (graphicsMode === 'full') {
      // Create pixelated textures for full mode
      const textureLoader = new THREE.TextureLoader();
      grassTextureData = isMoving 
        ? createOrangeGrassTexture()
        : createGrassTexture();
      soilTextureData = createSoilTexture();
      
      // Helper function to create a properly configured texture with tiling
      createTexture = (data, repeatX, repeatY) => {
        const tex = textureLoader.load(data);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        return tex;
      };
    }

    // Top pipe material
    const topHeight = Math.max(0.1, height - (gapY + gapHeight / 2));
    let matTop;
    
    if (graphicsMode === 'full') {
      matTop = new THREE.MeshStandardMaterial({ 
        map: createTexture(soilTextureData, width * 0.5, topHeight * 0.5),
        color: 0xffffff,
        roughness: 0.9
      });
    } else {
      // Simple colored material for prototype mode
      matTop = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.9
      });
    }
    const geoTop = new THREE.BoxGeometry(width, topHeight, depth);
    this.topPipe = new THREE.Mesh(geoTop, matTop);
    this.topPipe.position.set(0, gapY + gapHeight / 2 + topHeight / 2, 0);
    this.group.add(this.topPipe);

    // Bottom pipe material
    const bottomY = gapY - gapHeight / 2;
    const bottomHeight = bottomY + 100; // Extend 100 units down from bottom of gap
    
    let bottomMaterials;
    if (graphicsMode === 'full') {
      // Create materials array for different faces with textures
      // Box faces order: [right, left, top, bottom, front, back]
      bottomMaterials = [
        new THREE.MeshStandardMaterial({ map: createTexture(soilTextureData, depth * 0.5, bottomHeight * 0.5), color: 0xffffff, roughness: 0.9 }),  // right
        new THREE.MeshStandardMaterial({ map: createTexture(soilTextureData, depth * 0.5, bottomHeight * 0.5), color: 0xffffff, roughness: 0.9 }),  // left
        new THREE.MeshStandardMaterial({ map: createTexture(grassTextureData, width * 0.5, depth * 0.5), color: 0xffffff, roughness: 0.8 }),  // top - grass!
        new THREE.MeshStandardMaterial({ map: createTexture(soilTextureData, width * 0.5, depth * 0.5), color: 0xffffff, roughness: 0.9 }),  // bottom
        new THREE.MeshStandardMaterial({ map: createTexture(soilTextureData, width * 0.5, bottomHeight * 0.5), color: 0xffffff, roughness: 0.9 }),  // front
        new THREE.MeshStandardMaterial({ map: createTexture(soilTextureData, width * 0.5, bottomHeight * 0.5), color: 0xffffff, roughness: 0.9 })   // back
      ];
    } else {
      // Simple colored material for prototype mode
      bottomMaterials = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.9
      });
    }
    
    const geoBottom = new THREE.BoxGeometry(width, bottomHeight, depth);
    this.bottomPipe = new THREE.Mesh(geoBottom, bottomMaterials);
    // Position so top of bottom pipe is at bottom of gap
    this.bottomPipe.position.set(0, bottomY - bottomHeight / 2, 0);
    this.group.add(this.bottomPipe);

    // Randomly add a bonus hole (30% chance if requested)
    if (addBonusHole && Math.random() < 0.3) {
      const holeRadius = 0.6;
      const minOffset = gapHeight / 2 + holeRadius + 0.5;
      
      // Randomly place above or below the main gap
      const isAbove = Math.random() < 0.5;
      
      if (isAbove) {
        // Place in top pipe
        const availableSpace = topHeight - holeRadius * 2 - 0.5;
        if (availableSpace > 0) {
          const holeY = gapY + gapHeight / 2 + minOffset + Math.random() * availableSpace;
          this.createBonusHole(holeRadius, holeY);
        }
      } else {
        // Place in bottom pipe (visible area)
        const bottomGapTop = gapY - gapHeight / 2;
        const visibleBottom = Math.max(0, bottomGapTop - 3); // Keep it in visible range
        const availableSpace = bottomGapTop - visibleBottom - holeRadius * 2 - 0.5;
        if (availableSpace > 0) {
          const holeY = visibleBottom + holeRadius + Math.random() * availableSpace;
          this.createBonusHole(holeRadius, holeY);
        }
      }
    }

    // Set initial position
    this.group.position.x = x;
  }

  createBonusHole(radius, y) {
    // Determine which pipe the hole is in
    const isInTopPipe = y > this.gapY + this.gapHeight / 2;
    const targetPipe = isInTopPipe ? this.topPipe : this.bottomPipe;
    
    // Remove the original pipe from group
    this.group.remove(targetPipe);
    
    // Create the pipe with a hole using multiple boxes
    const pipeGroup = new THREE.Group();
    const mat = targetPipe.material;
    const pipeHeight = targetPipe.geometry.parameters.height;
    const pipeY = targetPipe.position.y;
    
    // Calculate hole position relative to pipe center
    const holeLocalY = y - pipeY;
    
    // Create segments above and below the hole
    const holeHeight = radius * 2;
    const topSegmentHeight = (pipeHeight / 2) - holeLocalY - (holeHeight / 2);
    const bottomSegmentHeight = (pipeHeight / 2) + holeLocalY - (holeHeight / 2);
    
    // Bottom segment (if there's space)
    if (bottomSegmentHeight > 0.1) {
      const bottomGeo = new THREE.BoxGeometry(this.width, bottomSegmentHeight, this.depth);
      const bottomSegment = new THREE.Mesh(bottomGeo, mat.clone());
      bottomSegment.position.y = -(pipeHeight / 2 - bottomSegmentHeight / 2);
      pipeGroup.add(bottomSegment);
    }
    
    // Top segment (if there's space)
    if (topSegmentHeight > 0.1) {
      const topGeo = new THREE.BoxGeometry(this.width, topSegmentHeight, this.depth);
      const topSegment = new THREE.Mesh(topGeo, mat.clone());
      topSegment.position.y = (pipeHeight / 2 - topSegmentHeight / 2);
      pipeGroup.add(topSegment);
    }
    
    // Left segment (side of the hole)
    const leftGeo = new THREE.BoxGeometry((this.width - radius * 2) / 2, holeHeight, this.depth);
    const leftSegment = new THREE.Mesh(leftGeo, mat.clone());
    leftSegment.position.set(-this.width / 2 + leftGeo.parameters.width / 2, holeLocalY, 0);
    pipeGroup.add(leftSegment);
    
    // Right segment (side of the hole)
    const rightGeo = new THREE.BoxGeometry((this.width - radius * 2) / 2, holeHeight, this.depth);
    const rightSegment = new THREE.Mesh(rightGeo, mat.clone());
    rightSegment.position.set(this.width / 2 - rightGeo.parameters.width / 2, holeLocalY, 0);
    pipeGroup.add(rightSegment);
    
    // Position the group at the original pipe position
    pipeGroup.position.copy(targetPipe.position);
    this.group.add(pipeGroup);
    
    // Replace the pipe reference
    if (isInTopPipe) {
      this.topPipe = pipeGroup;
    } else {
      this.bottomPipe = pipeGroup;
    }
    
    // Create a glowing ring to indicate the bonus hole
    const ringGeo = new THREE.TorusGeometry(radius, 0.1, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.y = Math.PI / 2; // Face forward
    ring.position.y = y;
    this.group.add(ring);
    
    this.bonusHole = {
      mesh: ring,
      radius: radius,
      y: y,
      initialY: y
    };
  }

  /** Update moving obstacles */
  update(dt) {
    if (!this.isMoving) return;
    
    this.moveTime += dt * this.moveSpeed;
    const offset = Math.sin(this.moveTime) * this.moveRange;
    this.gapY = this.initialGapY + offset;
    
    // Update pipe positions based on new gap position
    const topHeight = Math.max(0.1, this.height - (this.gapY + this.gapHeight / 2));
    this.topPipe.position.y = this.gapY + this.gapHeight / 2 + topHeight / 2;
    
    const bottomY = this.gapY - this.gapHeight / 2;
    const bottomHeight = bottomY + 100;
    this.bottomPipe.position.y = bottomY - bottomHeight / 2;
    
    // Update bonus hole position if it exists
    if (this.bonusHole) {
      this.bonusHole.y = this.bonusHole.initialY + offset;
      this.bonusHole.mesh.position.y = this.bonusHole.y;
    }
  }

  /** Move the obstacle left by dx */
  move(dx) {
    this.group.position.x += dx;
  }

  /** Set the x position */
  setX(x) {
    this.group.position.x = x;
  }

  /** Remove from scene and dispose geometry/materials */
  dispose() {
    this.group.parent?.remove(this.group);
    
    // Helper function to dispose mesh or group
    const disposeMeshOrGroup = (obj) => {
      if (obj.isGroup) {
        // If it's a group (from bonus hole creation), dispose all children
        obj.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      } else if (obj.isMesh) {
        // Regular mesh
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    };
    
    disposeMeshOrGroup(this.topPipe);
    disposeMeshOrGroup(this.bottomPipe);
    
    if (this.bonusHole) {
      this.bonusHole.mesh.geometry.dispose();
      this.bonusHole.mesh.material.dispose();
    }
  }
}

export default Obstacle;
