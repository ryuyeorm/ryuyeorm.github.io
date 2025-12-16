import * as THREE from '../lib/three.js/build/three.module.js';
import { GLTFLoader } from '../lib/three.js/examples/jsm/loaders/GLTFLoader.js';

export class Coin {
  constructor({ x = 0, y = 2, z = 0, graphicsMode = 'prototype' } = {}) {
    this.mesh = new THREE.Object3D();
    this.mesh.position.set(x, y, z);
    this.collected = false;
    this.graphicsMode = graphicsMode;

    if (graphicsMode === 'full') {
      // Full mode: load GLTF model
      const loader = new GLTFLoader();
      loader.load(
        'scene/coin.glb',
        (gltf) => {
        const model = gltf.scene || gltf.scenes[0];
        if (!model) return;

        // Center model around the origin so root position is the visual center
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center);

        // Scale to a consistent size
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetDiameter = 1.2; // make coin more visible
        const scale = targetDiameter / maxDim;
        model.scale.setScalar(scale);

        // Force a bright gold material so it’s not dark/black
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffd700,
              metalness: 1.0,
              roughness: 0.25,
              emissive: 0xffd700,
              emissiveIntensity: 0.7
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.mesh.add(model);
      },
      undefined,
      (err) => {
        console.warn('Failed to load coin.glb', err);
        this._createPrototypeCoin();
      }
    );
    } else {
      // Prototype mode: simple geometry
      this._createPrototypeCoin();
    }
  }

  _createPrototypeCoin() {
    // Create a simple cylinder for the coin
    const geometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0xffd700,
      emissiveIntensity: 0.4
    });
    const coin = new THREE.Mesh(geometry, material);
    coin.rotation.z = Math.PI / 2; // Make it stand upright
    coin.castShadow = true;
    coin.receiveShadow = true;
    this.mesh.add(coin);
  }

  update(dt) {
    // Spin the coin root around the vertical axis for visual effect
    this.mesh.rotation.y += dt * 2;
  }

  collect() {
    this.collected = true;
    this.mesh.visible = false;
  }
}
