import * as THREE from '../lib/three.js/build/three.module.js';

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
    color = 0x2ecc40
  } = {}) {
    this.group = new THREE.Group();
    this.width = width;
    this.depth = depth;
    this.height = height;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.x = x;
    this.color = color;

    // Top pipe
    const topHeight = Math.max(0.1, height - (gapY + gapHeight / 2));
    const mat = new THREE.MeshStandardMaterial({ color });
    const geoTop = new THREE.BoxGeometry(width, topHeight, depth);
    this.topPipe = new THREE.Mesh(geoTop, mat);
    this.topPipe.position.set(0, gapY + gapHeight / 2 + topHeight / 2, 0);
    this.group.add(this.topPipe);

    // Bottom pipe: extends far below to hide the bottom end
    const bottomY = gapY - gapHeight / 2;
    const bottomHeight = bottomY + 100; // Extend 100 units down from bottom of gap
    const geoBottom = new THREE.BoxGeometry(width, bottomHeight, depth);
    this.bottomPipe = new THREE.Mesh(geoBottom, mat.clone());
    // Position so top of bottom pipe is at bottom of gap
    this.bottomPipe.position.set(0, bottomY - bottomHeight / 2, 0);
    this.group.add(this.bottomPipe);

    // Set initial position
    this.group.position.x = x;
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
    this.topPipe.geometry.dispose();
    this.topPipe.material.dispose();
    this.bottomPipe.geometry.dispose();
    this.bottomPipe.material.dispose();
  }
}

export default Obstacle;
