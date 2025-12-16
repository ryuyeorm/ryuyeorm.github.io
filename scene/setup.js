import * as THREE from '../lib/three.js/build/three.module.js';
import { GLTFLoader } from '../lib/three.js/examples/jsm/loaders/GLTFLoader.js';
import SimpleOrbitControls from './simpleOrbitControls.js';
import { createRiverMaterial } from './River.js';
export class SceneManager {
  constructor(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container || document.body;

    this.width = options.width || this.container.clientWidth || window.innerWidth;
    this.height = options.height || this.container.clientHeight || window.innerHeight;
    this._rafId = null;
    this._running = false;

    this.graphicsMode = 'prototype'; // 'prototype' or 'full'
    this._init();
  }

  _init() {
    // Scene
    this.scene = new THREE.Scene();

    // Sky background using a simple vertical gradient texture
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 512;
    this.skyCanvas.height = 512;
    this.skyCtx = this.skyCanvas.getContext('2d');

    const gradient = this.skyCtx.createLinearGradient(0, 0, 0, this.skyCanvas.height);
    // Top of the sky: deeper blue
    gradient.addColorStop(0, '#4a90e2');
    // Near horizon: lighter blue
    gradient.addColorStop(1, '#cfe9ff');

    this.skyCtx.fillStyle = gradient;
    this.skyCtx.fillRect(0, 0, this.skyCanvas.width, this.skyCanvas.height);

    this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);
    this.skyTexture.encoding = THREE.sRGBEncoding;
    this.scene.background = this.skyTexture;

    // Time cycle tracking (0-120 seconds = 4 phases of 30s each)
    this.dayTime = 0;
    this.TIME_CYCLE = 120; // 2 minutes for full day cycle

    // --- Random clouds ---
    this.clouds = [];
    this._createClouds();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
    this.camera.position.set(5, 5, 7);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Append canvas
    this.canvas = this.renderer.domElement;
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Controls (disabled for third-person follow)
    this.controls = null;

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sunLight.position.set(5, 10, 7);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);

    // Ocean ground using River.js shader material
    const oceanGeo = new THREE.PlaneGeometry(100, 100, 1, 1);
    const oceanMat = createRiverMaterial();
    this.ocean = new THREE.Mesh(oceanGeo, oceanMat);
    this.ocean.rotation.x = -Math.PI / 2; // lay flat
    this.ocean.position.y = 0; // ground level
    this.ocean.receiveShadow = true;
    this.scene.add(this.ocean);

    // Add rocks and islands scattered on the sea
    this.rocks = [];
    this.islands = [];
    
    // Create rocks - small dark stones
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.9,
      metalness: 0.1
    });
    
    for (let i = 0; i < 30; i++) {
      // Random size for variety
      const size = 0.3 + Math.random() * 0.5;
      const rockGeo = new THREE.DodecahedronGeometry(size, 0);
      const rock = new THREE.Mesh(rockGeo, rockMaterial.clone());
      
      // Position rocks away from the main flight path (z = 0)
      const x = -20 + Math.random() * 60; // Spread along x-axis
      const z = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 7); // Keep away from center
      rock.position.set(x, size * 0.3, z);
      
      // Random rotation for natural look
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.rocks.push(rock);
    }
    
    // Create islands - larger flat formations
    const islandMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b8e23,
      roughness: 0.8,
      metalness: 0.0
    });
    
    const sandMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4e4c1,
      roughness: 0.9,
      metalness: 0.0
    });
    
    for (let i = 0; i < 8; i++) {
      const islandGroup = new THREE.Group();
      
      // Main island body (sand/beach)
      const islandSize = 2 + Math.random() * 3;
      const islandGeo = new THREE.CylinderGeometry(islandSize, islandSize * 0.8, 0.4, 8);
      const island = new THREE.Mesh(islandGeo, sandMaterial.clone());
      island.position.y = 0.2;
      islandGroup.add(island);
      
      // Add some greenery on top
      const greenGeo = new THREE.ConeGeometry(islandSize * 0.6, islandSize * 0.5, 6);
      const greenery = new THREE.Mesh(greenGeo, islandMaterial.clone());
      greenery.position.y = 0.6;
      islandGroup.add(greenery);
      
      // Position islands away from flight path
      const x = -30 + Math.random() * 80;
      const z = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 12);
      islandGroup.position.set(x, 0, z);
      
      islandGroup.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
      
      this.scene.add(islandGroup);
      this.islands.push(islandGroup);
    }

    // Player object
    this.cube = null;
    this._createPlayer();

    // Clock
    this.clock = new THREE.Clock();

    // Resize handling
    this._onResize = this.resize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.clock.start();
    this._lastTime = performance.now();
    const loop = () => {
      const dt = this.clock.getDelta();
      this.update(dt);
      this.render();
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this.clock.stop();
  }

  update(dt) {
    // Remove demo rotation
    // Third-person camera follow: camera stays behind and above the cube, looking forward
    if (this.cube) {
      // Camera offset (behind and slightly above)
      const offset = new THREE.Vector3(-3, 1, 0); // lower angle: less above
      // The cube's world position
      const birdPos = this.cube.position.clone();
      // Camera position is birdPos + offset
      this.camera.position.copy(birdPos).add(offset);
      // Look at a point ahead of the bird
      const lookAt = birdPos.clone().add(new THREE.Vector3(2, 0, 0));
      this.camera.lookAt(lookAt);
    }

      // Animate River.js water shader via time uniform
      if (this.ocean && this.ocean.material && this.ocean.material.uniforms && this.ocean.material.uniforms.uTime) {
        this.ocean.material.uniforms.uTime.value = this.clock.getElapsedTime();
      }

      // Update day-night cycle
      this.dayTime = (this.dayTime + dt) % this.TIME_CYCLE;
      const timeProgress = this.dayTime / this.TIME_CYCLE; // 0 to 1
      
      // Determine time of day (0-0.25=morning, 0.25-0.5=noon, 0.5-0.75=afternoon, 0.75-1=night)
      let topColor, bottomColor, lightIntensity, ambientIntensity;
      
      if (timeProgress < 0.25) {
        // Morning (sunrise) - vibrant orange to pink
        const t = timeProgress / 0.25;
        topColor = this.lerpColor('#ff6b9d', '#00bfff', t);
        bottomColor = this.lerpColor('#ffaa00', '#ffd700', t);
        lightIntensity = 0.4 + t * 0.4;
        ambientIntensity = 0.3 + t * 0.3;
      } else if (timeProgress < 0.5) {
        // Noon (bright day) - vibrant blue sky
        const t = (timeProgress - 0.25) / 0.25;
        topColor = this.lerpColor('#00bfff', '#00aaff', t);
        bottomColor = this.lerpColor('#ffd700', '#87ceeb', t);
        lightIntensity = 0.8;
        ambientIntensity = 0.6;
      } else if (timeProgress < 0.75) {
        // Afternoon (sunset) - vibrant orange to purple
        const t = (timeProgress - 0.5) / 0.25;
        topColor = this.lerpColor('#00aaff', '#ff1493', t);
        bottomColor = this.lerpColor('#87ceeb', '#ff4500', t);
        lightIntensity = 0.8 - t * 0.5;
        ambientIntensity = 0.6 - t * 0.4;
      } else {
        // Night - deep purple to dark blue
        const t = (timeProgress - 0.75) / 0.25;
        topColor = this.lerpColor('#ff1493', '#191970', t);
        bottomColor = this.lerpColor('#ff4500', '#2f4f7f', t);
        lightIntensity = 0.3 - t * 0.15;
        ambientIntensity = 0.2;
      }
      
      // Update sky
      const gradient = this.skyCtx.createLinearGradient(0, 0, 0, this.skyCanvas.height);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(1, bottomColor);
      this.skyCtx.fillStyle = gradient;
      this.skyCtx.fillRect(0, 0, this.skyCanvas.width, this.skyCanvas.height);
      this.skyTexture.needsUpdate = true;
      
      // Update light intensity
      this.sunLight.intensity = lightIntensity;
      this.ambientLight.intensity = ambientIntensity;

    // Slowly drift clouds from right to left, wrapping ahead of the bird
    if (this.clouds && this.cube) {
      const birdPos = this.cube.position;
      const driftSpeed = 0.5; // units per second
      for (const cloud of this.clouds) {
        cloud.position.x -= driftSpeed * dt;
        const minX = birdPos.x - 40;
        const maxX = birdPos.x + 60;
        if (cloud.position.x < minX) {
          cloud.position.x = maxX + Math.random() * 20;
          cloud.position.y = 4 + Math.random() * 6;
        }
      }
    }
  }

  lerpColor(color1, color2, t) {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    
    const r1 = (c1 >> 16) & 255;
    const g1 = (c1 >> 8) & 255;
    const b1 = c1 & 255;
    
    const r2 = (c2 >> 16) & 255;
    const g2 = (c2 >> 8) & 255;
    const b2 = c2 & 255;
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize(width = null, height = null) {
    this.width = width || this.container.clientWidth || window.innerWidth;
    this.height = height || this.container.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  _createClouds() {
    // Clear existing clouds
    for (const cloud of this.clouds) {
      this.scene.remove(cloud);
      if (cloud.material) cloud.material.dispose();
      if (cloud.geometry) cloud.geometry.dispose();
    }
    this.clouds = [];

    const CLOUD_COUNT = 20;
    
    if (this.graphicsMode === 'full') {
      // Full mode: use cloud texture
      const cloudTexture = new THREE.TextureLoader().load('scene/cloud.png');
      cloudTexture.encoding = THREE.sRGBEncoding;

      for (let i = 0; i < CLOUD_COUNT; i++) {
        const cloudMat = new THREE.SpriteMaterial({
          map: cloudTexture,
          transparent: true,
          depthWrite: false
        });
        const cloud = new THREE.Sprite(cloudMat);

        const size = 4 + Math.random() * 4;
        cloud.scale.set(size, size * 0.6, 1);

        const x = Math.random() * 40;
        const y = 4 + Math.random() * 15;
        const z = -8 + Math.random() * 14;
        cloud.position.set(x, y, z);

        this.clouds.push(cloud);
        this.scene.add(cloud);
      }
    } else {
      // Prototype mode: simple white spheres
      for (let i = 0; i < CLOUD_COUNT; i++) {
        const cloudGeo = new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8);
        const cloudMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);

        const x = Math.random() * 40;
        const y = 4 + Math.random() * 15;
        const z = -8 + Math.random() * 14;
        cloud.position.set(x, y, z);

        this.clouds.push(cloud);
        this.scene.add(cloud);
      }
    }
  }

  _createPlayer() {
    // Remove existing player
    if (this.cube) {
      this.scene.remove(this.cube);
      if (this.cube.traverse) {
        this.cube.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
      this.cube = null;
    }

    if (this.graphicsMode === 'full') {
      // Full mode: load shark GLTF model
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        'scene/shark/scene.gltf',
        (gltf) => {
          const shark = gltf.scene || gltf.scenes?.[0];
          if (!shark) return;

          shark.scale.set(0.6, 0.6, 0.6);
          shark.position.set(0, 0.6, 0);

          shark.traverse((obj) => {
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });

          this.cube = shark;
          this.scene.add(shark);
        },
        undefined,
        (error) => {
          console.error('Failed to load shark model, falling back to cube', error);
          this._createPrototypePlayer();
        }
      );
    } else {
      // Prototype mode: simple geometry
      this._createPrototypePlayer();
    }
  }

  _createPrototypePlayer() {
    const geo = new THREE.ConeGeometry(0.3, 0.8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const player = new THREE.Mesh(geo, mat);
    player.rotation.z = Math.PI / 2; // Point forward
    player.position.y = 0.4;
    player.castShadow = true;
    player.receiveShadow = true;
    this.cube = player;
    this.scene.add(player);
  }

  setGraphicsMode(mode) {
    if (this.graphicsMode === mode) return;
    this.graphicsMode = mode;
    
    // Recreate clouds and player with new mode
    this._createClouds();
    
    const oldPos = this.cube ? { x: this.cube.position.x, y: this.cube.position.y, z: this.cube.position.z } : { x: 0, y: 0.4, z: 0 };
    const oldRot = this.cube ? { x: this.cube.rotation.x, y: this.cube.rotation.y, z: this.cube.rotation.z } : { x: 0, y: 0, z: 0 };
    
    this._createPlayer();
    
    // Restore position after recreation
    if (this.cube) {
      this.cube.position.set(oldPos.x, oldPos.y, oldPos.z);
      this.cube.rotation.set(oldRot.x, oldRot.y, oldRot.z);
    }
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.canvas && this.canvas.parentElement) this.canvas.parentElement.removeChild(this.canvas);
  }
}

export default SceneManager;
