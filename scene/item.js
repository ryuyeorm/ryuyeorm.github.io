import * as THREE from '../lib/three.js/build/three.module.js';

export class Item {
  /**
   * @param {Object} options
   * @param {string} options.type - 'obstacle-breaker' or 'coin-fever'
   * @param {number} options.x - x position
   * @param {number} options.y - y position
   * @param {number} options.z - z position
   */
  constructor({ type = 'obstacle-breaker', x = 0, y = 3, z = 0 } = {}) {
    this.type = type;
    this.collected = false;

    // Create item mesh based on type
    if (type === 'obstacle-breaker') {
      // Blue glowing box
      const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        emissive: 0x0066ff,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.4
      });
      this.mesh = new THREE.Mesh(geometry, material);
    } else if (type === 'coin-fever') {
      // Red coin (cylinder)
      const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff0000,
        emissiveIntensity: 0.7,
        metalness: 0.6,
        roughness: 0.2
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.rotation.x = Math.PI / 2; // Lay flat like a coin
    } else if (type === 'clicker') {
      // Green pulsing sphere
      const geometry = new THREE.SphereGeometry(0.4, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ff44,
        emissive: 0x00ff00,
        emissiveIntensity: 0.9,
        metalness: 0.5,
        roughness: 0.3
      });
      this.mesh = new THREE.Mesh(geometry, material);
    }

    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Animation properties
    this.time = 0;
    this.baseY = y;
  }

  update(dt) {
    if (this.collected) return;
    
    this.time += dt;
    
    // Float up and down
    this.mesh.position.y = this.baseY + Math.sin(this.time * 3) * 0.3;
    
    // Rotate
    if (this.type === 'obstacle-breaker') {
      this.mesh.rotation.y += dt * 2;
      this.mesh.rotation.x += dt * 1.5;
    } else if (this.type === 'coin-fever') {
      this.mesh.rotation.z += dt * 3;
    } else if (this.type === 'clicker') {
      this.mesh.rotation.y += dt * 4;
      // Pulsing scale effect
      const pulse = 1 + Math.sin(this.time * 5) * 0.1;
      this.mesh.scale.set(pulse, pulse, pulse);
    }
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    
    // Animate collection - scale up and fade out
    const duration = 300; // ms
    const startTime = Date.now();
    const startScale = this.mesh.scale.clone();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const scale = 1 + progress * 2; // Scale up to 3x
      this.mesh.scale.set(scale, scale, scale);
      
      if (this.mesh.material) {
        this.mesh.material.opacity = 1 - progress;
        this.mesh.material.transparent = true;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove from scene after animation
        if (this.mesh.parent) {
          this.mesh.parent.remove(this.mesh);
        }
      }
    };
    
    animate();
  }

  dispose() {
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export default Item;
