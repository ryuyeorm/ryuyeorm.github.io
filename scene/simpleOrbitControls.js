import * as THREE from '../lib/three.js/build/three.module.js';

export class SimpleOrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document;
    this.enabled = true;
    this.target = new THREE.Vector3(0, 0.5, 0);
    this.minDistance = 1;
    this.maxDistance = 100;
    this.enableDamping = true;
    this.dampingFactor = 0.08;

    this._spherical = new THREE.Spherical();
    this._offset = new THREE.Vector3();

    this._state = {
      rotating: false,
      start: new THREE.Vector2(),
      delta: new THREE.Vector2(),
    };

    this._bindHandlers();
    this.update();
  }

  _bindHandlers() {
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onWheel = this._onWheel.bind(this);

    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
  }

  _onPointerDown(e) {
    if (!this.enabled) return;
    this._state.rotating = true;
    this.domElement.setPointerCapture?.(e.pointerId);
    this._state.start.set(e.clientX, e.clientY);
  }

  _onPointerMove(e) {
    if (!this.enabled || !this._state.rotating) return;
    this._state.delta.set(e.clientX - this._state.start.x, e.clientY - this._state.start.y);
    this._state.start.set(e.clientX, e.clientY);

    const el = this.domElement;
    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };

    const rotateSpeed = 2 * Math.PI / Math.max(rect.width, rect.height);
    const thetaDelta = -this._state.delta.x * rotateSpeed;
    const phiDelta = -this._state.delta.y * rotateSpeed;

    this._spherical.theta += thetaDelta;
    this._spherical.phi += phiDelta;

    const eps = 0.000001;
    this._spherical.phi = Math.max(eps, Math.min(Math.PI - eps, this._spherical.phi));
  }

  _onPointerUp(e) {
    this._state.rotating = false;
    this.domElement.releasePointerCapture?.(e.pointerId);
  }

  _onWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const delta = e.deltaY * 0.01;
    this._spherical.radius += delta * this._spherical.radius;
    this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius));
  }

  update() {
    // compute spherical from current camera position
    this._offset.copy(this.camera.position).sub(this.target);
    this._spherical.setFromVector3(this._offset);

    // apply damping by moving current spherical values slowly towards target (no explicit target here)
    // For this simple control we'll just apply the spherical values directly
    const newPos = new THREE.Vector3().setFromSpherical(this._spherical).add(this.target);
    if (this.enableDamping) {
      this.camera.position.lerp(newPos, this.dampingFactor);
      this.camera.lookAt(this.target);
    } else {
      this.camera.position.copy(newPos);
      this.camera.lookAt(this.target);
    }
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this.domElement.removeEventListener('wheel', this._onWheel);
  }
}

export default SimpleOrbitControls;