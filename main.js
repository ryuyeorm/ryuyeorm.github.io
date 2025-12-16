 // Shark game
 //LLM Usage claim : This code was written with assist of LLM in texture, debugging and optimization
 import * as THREE from './lib/three.js/build/three.module.js';
  import { SceneManager } from './scene/setup.js';
  import { Obstacle } from './scene/obstacle.js';
  import { Coin } from './scene/coin.js';
  import { Item } from './scene/item.js';

  function createUI() {
    // Scene container
    const sceneEl = document.createElement('div');
    sceneEl.id = 'scene';
    sceneEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(sceneEl);

    // UI overlay
    const ui = document.createElement('div');
    ui.id = 'ui';

    const topbar = document.createElement('div');
    topbar.id = 'topbar';

    // Project ID
    const projectId = document.createElement('div');
    projectId.className = 'project-id';
    projectId.textContent = 'Group 1215';

    // Score UI
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'score-container';
    scoreContainer.innerHTML = `
      <div class="stat-box">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <div class="stat-label">Score</div>
          <div id="score-value" class="stat-value">0</div>
        </div>
      </div>
    `;

    // Gold UI
    const goldContainer = document.createElement('div');
    goldContainer.id = 'gold-container';
    goldContainer.innerHTML = `
      <div class="stat-box">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-label">Gold</div>
          <div id="gold-value" class="stat-value">0</div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-content">
          <div class="stat-label">High Score</div>
          <div id="highscore-value" class="stat-value">0</div>
        </div>
      </div>
    `;

    const restart = document.createElement('button');
    restart.id = 'restart';
    restart.textContent = 'Restart';

    topbar.appendChild(projectId);
    topbar.appendChild(scoreContainer);
    topbar.appendChild(goldContainer);
    topbar.appendChild(restart);

    const message = document.createElement('div');
    message.id = 'message';
    message.className = 'hidden';
    message.innerHTML = `
      <div class="game-over-text">Game Over</div>
      <div class="game-over-buttons">
        <button id="respawn-btn" class="respawn-btn">Respawn (100 Gold)</button>
        <button id="restart-gameover" class="restart-btn">Restart</button>
      </div>
    `;

    const settings = document.createElement('div');
    settings.id = 'settings';
    settings.className = 'hidden';
    settings.innerHTML = `
      <div class="settings-panel">
        <h2 class="settings-title">Settings</h2>
        <div class="settings-section">
          <label class="settings-label">Graphics Mode</label>
          <div class="mode-toggle">
            <button id="mode-prototype" class="mode-btn active">Prototype</button>
            <button id="mode-full" class="mode-btn">Full</button>
          </div>
          <div class="mode-description">Prototype: Simple geometry | Full: Models & textures</div>
        </div>
        <div class="settings-buttons">
          <button id="resume" class="settings-btn">Resume</button>
          <button id="restart-settings" class="settings-btn">Restart</button>
        </div>
        <div class="settings-hint">Press ESC to resume</div>
      </div>
    `;

    const powerUps = document.createElement('div');
    powerUps.id = 'powerups';
    powerUps.innerHTML = `
      <div id="breaker-status" class="powerup-status hidden">
        <span class="powerup-icon">🛡️</span>
        <span class="powerup-label">Obstacle Breaker</span>
        <span id="breaker-timer" class="powerup-timer">6s</span>
      </div>
      <div id="fever-status" class="powerup-status hidden">
        <span class="powerup-icon">💰</span>
        <span class="powerup-label">Coin Fever</span>
        <span id="fever-timer" class="powerup-timer">8s</span>
      </div>
      <div id="clicker-status" class="powerup-status hidden">
        <span class="powerup-icon">⚡</span>
        <span class="powerup-label">CLICK FAST!</span>
        <span id="clicker-text" class="powerup-timer"></span>
      </div>
      <div id="immunity-status" class="powerup-status hidden">
        <span class="powerup-icon">✨</span>
        <span class="powerup-label">Immunity</span>
        <span id="immunity-timer" class="powerup-timer">3s</span>
      </div>
    `;

    const startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    startScreen.innerHTML = `
      <div class="start-panel">
        <h1 class="game-title">Climb!</h1>
        <h2 class="game-subtitle">Flappy Shark</h2>
        <button id="start-game" class="start-btn">Start Game</button>
        <div class="start-hint">Press SPACE or click to flap</div>
      </div>
    `;

    const flapButton = document.createElement('button');
    flapButton.id = 'flap-button';
    flapButton.innerHTML = '⬆️';
    flapButton.setAttribute('aria-label', 'Flap');

    const countdown = document.createElement('div');
    countdown.id = 'countdown';
    countdown.className = 'hidden';
    countdown.innerHTML = '<div class="countdown-number">3</div>';

    ui.appendChild(topbar);
    ui.appendChild(powerUps);
    ui.appendChild(message);
    ui.appendChild(settings);
    ui.appendChild(startScreen);
    ui.appendChild(flapButton);
    ui.appendChild(countdown);
    document.body.appendChild(ui);

    const scoreValue = document.getElementById('score-value');
    const goldValue = document.getElementById('gold-value');
    const highscoreValue = document.getElementById('highscore-value');

    return { sceneEl, ui, scoreValue, goldValue, highscoreValue, restart, message, powerUps, settings, startScreen, flapButton, countdown };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const els = createUI();
    const scene = new SceneManager({ container: '#scene' });
    scene.start();

    // --- Bird physics ---
    let birdVY = 0;
    const GRAVITY = -9.8; // units/sec^2
    const FLAP_VELOCITY = 4.5; // units/sec
    const PLAY_WIDTH = 10;
    const PLAY_HEIGHT = 6;

    // Start bird in the middle
    let birdY = PLAY_HEIGHT / 2;
    if (scene.cube) scene.cube.position.y = birdY;

    // Level scrolls upward over time
    const LEVEL_RISE_SPEED = 1; // units/sec
    let levelRiseY = 0;

    // Game state variables
    let gameStarted = false;
    let gameOver = false;
    let isPaused = false;
    let scoreVal = 0;
    let goldVal = parseInt(localStorage.getItem('sharkGold') || '0');
    let highScore = parseInt(localStorage.getItem('sharkHighScore') || '0');
    let deathPosition = null; // Store position for respawn
    let graphicsMode = 'prototype'; // 'prototype' or 'full'
    
    // Display initial values
    els.highscoreValue.textContent = highScore;
    els.goldValue.textContent = goldVal;

    // Patch SceneManager's update to include bird physics
    const origUpdate = scene.update.bind(scene);
    scene.update = function(dt) {
          // Fade out obstacles that are behind the bird
          const birdX = scene.cube ? scene.cube.position.x : 0;
          for (const obs of obstacles) {
            const dx = obs.group.position.x - birdX;
            // Fade out if behind the bird
            let fade = 1.0;
            if (dx < -0.5) {
              // Fade out over 2 units
              fade = Math.max(0, 1 + (dx + 0.5) / 2);
            }
            // Set opacity for both pipes
            [obs.topPipe, obs.bottomPipe].forEach(pipe => {
              if (pipe.material) {
                pipe.material.transparent = true;
                pipe.material.opacity = fade;
                pipe.material.needsUpdate = true;
              }
            });
          }
      
      if (!gameStarted || isPaused || gameOver) {
        origUpdate(dt);
        return;
      }
      
      // Bird physics
      if (scene.cube) {
        birdVY += GRAVITY * dt;
        birdY += birdVY * dt;
        scene.cube.position.y = birdY;
      }
      
      // Move the level upward continuously by moving obstacles up.
      const dy = LEVEL_RISE_SPEED * dt;
      levelRiseY += dy;
      for (const obs of obstacles) {
        obs.group.position.y += dy;
      }
      // Also move coins and items up with the level
      for (const coin of coins) {
        coin.mesh.position.y += dy;
      }
      for (const item of items) {
        item.baseY += dy; // Update baseY - the update() method will handle mesh.position.y
      }

      // Update score based on height
      if (scene.cube) {
        const totalHeight = scene.cube.position.y + levelRiseY;
        scoreVal = Math.max(0, Math.floor(totalHeight * 10)); // Scale height to reasonable score
        els.scoreValue.textContent = scoreVal;
        
        // Update height bar UI with 100m tiers
        const heightIndicator = els.heightBar?.querySelector('.height-indicator');
        const heightValue = els.heightBar?.querySelector('.height-value');
        const heightTrack = els.heightBar?.querySelector('.height-bar-track');
        if (heightIndicator?.style && heightValue && heightTrack) {
          // Calculate tier (0-100m = tier 0, 100-200m = tier 1, etc.)
          const tier = Math.floor(totalHeight / 100);
          const heightInTier = totalHeight % 100; // Height within current 100m range
          const heightPercent = heightInTier; // 0-100%
          
          heightIndicator.style.bottom = heightPercent + '%';
          heightValue.textContent = Math.floor(totalHeight) + 'm';
          
          // Update bar color based on tier (skyblue to black)
          // Define colors for each tier
          const colors = [
            { top: 'rgba(100, 200, 255, 0.6)', bottom: 'rgba(135, 206, 250, 0.3)' }, // Tier 0: Sky blue
            { top: 'rgba(70, 150, 220, 0.6)', bottom: 'rgba(100, 180, 240, 0.3)' },  // Tier 1: Darker blue
            { top: 'rgba(50, 100, 180, 0.6)', bottom: 'rgba(70, 130, 200, 0.3)' },   // Tier 2: Even darker
            { top: 'rgba(40, 70, 140, 0.6)', bottom: 'rgba(50, 90, 160, 0.3)' },     // Tier 3: Dark blue
            { top: 'rgba(30, 50, 100, 0.6)', bottom: 'rgba(40, 60, 120, 0.3)' },     // Tier 4: Very dark blue
            { top: 'rgba(20, 30, 60, 0.6)', bottom: 'rgba(30, 40, 70, 0.3)' },       // Tier 5: Almost black
            { top: 'rgba(10, 15, 30, 0.6)', bottom: 'rgba(15, 20, 40, 0.3)' },       // Tier 6: Nearly black
            { top: 'rgba(5, 5, 10, 0.6)', bottom: 'rgba(10, 10, 15, 0.3)' }          // Tier 7+: Black
          ];
          
          const tierIndex = Math.min(tier, colors.length - 1);
          const colorSet = colors[tierIndex];
          
          heightTrack.style.background = `linear-gradient(to top, ${colorSet.bottom}, ${colorSet.top})`;
        }
      }

      origUpdate(dt);
    };

    function flap() {
      if (!gameStarted) {
        startGame();
      } else if (!gameOver && !isPaused) {
        birdVY = FLAP_VELOCITY;
      }
    }

    function startGame() {
      gameStarted = true;
      els.startScreen.classList.add('hidden');
      startObstacles();
    }

    // Keyboard: spacebar for flap
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        flap();
        e.preventDefault();
      }
    });

    // On-screen flap button
    els.flapButton.addEventListener('click', () => {
      flap();
    });

    // --- Flappy Bird obstacle demo ---
    const obstacles = [];
    let obstacleTimer = null;
    let moveTimer = null;
    const OBSTACLE_INTERVAL = 1800; // ms
    const OBSTACLE_SPEED = -0.06; // units/frame
    const OBSTACLE_SPACING = 4.5; // units between obstacles
    let lastObstacleX = null;

    function spawnObstacle() {
      // Ensure equal spacing: only spawn if last obstacle is far enough left
      if (obstacles.length > 0) {
        const last = obstacles[obstacles.length - 1];
        const spawnX = PLAY_WIDTH + 2;
        if (last.group.position.x > spawnX - OBSTACLE_SPACING) return;
      }
      // Randomize gap position with more variance
      const gapHeight = 2.0;
      const minGapY = gapHeight / 2 + 0.3;
      const maxGapY = PLAY_HEIGHT - gapHeight / 2 - 0.3;
      const t = Math.random() * 1.0; // uniform distribution for more variance
      const gapY = minGapY + (maxGapY - minGapY) * t;

      // 20% chance to create a moving obstacle
      const isMoving = Math.random() < 0.2;
      const obstacleColor = isMoving ? 0xff8800 : 0x2ecc40; // Orange for moving, green for static

      const obs = new Obstacle({
        gapY,
        gapHeight,
        x: PLAY_WIDTH + 2,
        width: 1.5, // match obstacle.js
        depth: 1.2,
        height: 30, // much taller so top is offscreen
        color: obstacleColor,
        addBonusHole: true, // Enable bonus holes
        isMoving: isMoving,
        graphicsMode: graphicsMode
      });
      // Spawn obstacles already offset by current level rise
      obs.group.position.y = levelRiseY;
      scene.scene.add(obs.group);
      obstacles.push(obs);
      lastObstacleX = obs.group.position.x;
    }

    function moveObstacles() {
      if (!gameStarted || isPaused || gameOver) return;
      for (let i = obstacles.length - 1; i >= 0; --i) {
        const obs = obstacles[i];
        obs.move(OBSTACLE_SPEED);
        if (obs.group.position.x < -PLAY_WIDTH - 2) {
          obs.dispose();
          obstacles.splice(i, 1);
        }
      }
      
      // Move islands and rocks with obstacles, and cleanup
      if (scene.rocks) {
        for (let i = scene.rocks.length - 1; i >= 0; i--) {
          const rock = scene.rocks[i];
          rock.position.x += OBSTACLE_SPEED;
          // Remove rocks that are far behind
          if (rock.position.x < -PLAY_WIDTH - 10) {
            scene.scene.remove(rock);
            rock.geometry.dispose();
            rock.material.dispose();
            scene.rocks.splice(i, 1);
          }
        }
      }
      if (scene.islands) {
        for (let i = scene.islands.length - 1; i >= 0; i--) {
          const island = scene.islands[i];
          island.position.x += OBSTACLE_SPEED;
          // Remove islands that are far behind
          if (island.position.x < -PLAY_WIDTH - 15) {
            island.traverse((obj) => {
              if (obj.isMesh) {
                obj.geometry.dispose();
                obj.material.dispose();
              }
            });
            scene.scene.remove(island);
            scene.islands.splice(i, 1);
          }
        }
      }
    }

    function startObstacles() {
      spawnObstacle();
      obstacleTimer = setInterval(spawnObstacle, OBSTACLE_INTERVAL);
      moveTimer = setInterval(moveObstacles, 1000 / 60);
      if (environmentTimer) clearInterval(environmentTimer);
      environmentTimer = setInterval(spawnEnvironment, 2000);
      console.log('Started obstacles and environment spawning');
    }
    function stopObstacles() {
      if (obstacleTimer) {
        clearInterval(obstacleTimer);
        obstacleTimer = null;
      }
      if (moveTimer) {
        clearInterval(moveTimer);
        moveTimer = null;
      }
      if (environmentTimer) {
        clearInterval(environmentTimer);
        environmentTimer = null;
      }
      for (const obs of obstacles) obs.dispose();
      obstacles.length = 0;
    }

    // --- Environment spawning (islands and rocks) ---
    // Helper to spawn a single rock
    function spawnRock(x, z) {
      const size = 0.3 + Math.random() * 0.5;
      const rockGeo = new THREE.DodecahedronGeometry(size, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.9,
        metalness: 0.1
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      
      rock.position.set(x, size * 0.3, z);
      
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.scene.add(rock);
      scene.rocks.push(rock);
      return rock;
    }

    // Helper to spawn a single island
    function spawnIsland(x, z) {
      const islandGroup = new THREE.Group();
      const islandSize = 2 + Math.random() * 3;
      
      const sandMat = new THREE.MeshStandardMaterial({
        color: 0xf4e4c1,
        roughness: 0.9
      });
      const islandGeo = new THREE.CylinderGeometry(islandSize, islandSize * 0.8, 0.4, 8);
      const island = new THREE.Mesh(islandGeo, sandMat);
      island.position.y = 0.2;
      islandGroup.add(island);
      
      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x6b8e23,
        roughness: 0.8
      });
      const greenGeo = new THREE.ConeGeometry(islandSize * 0.6, islandSize * 0.5, 6);
      const greenery = new THREE.Mesh(greenGeo, greenMat);
      greenery.position.y = 0.6;
      islandGroup.add(greenery);
      
      islandGroup.position.set(x, 0, z);
      
      islandGroup.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
      
      scene.scene.add(islandGroup);
      scene.islands.push(islandGroup);
      return islandGroup;
    }

    function spawnInitialEnvironment() {
      // Spawn abundant initial rocks (30)
      for (let i = 0; i < 30; i++) {
        const x = -20 + Math.random() * 60;
        const z = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 7);
        spawnRock(x, z);
      }
      
      // Spawn initial islands (8)
      for (let i = 0; i < 8; i++) {
        const x = -30 + Math.random() * 80;
        const z = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 12);
        spawnIsland(x, z);
      }
      console.log('Spawned initial environment: 30 rocks, 8 islands');
    }

    // Continuously spawn environment objects ahead of the player
    let lastEnvironmentSpawnX = 50; // Track rightmost spawn position
    function spawnEnvironmentObjects() {
      if (!scene.cube || !gameStarted || gameOver) return;
      
      const playerX = scene.cube.position.x;
      const spawnAheadDistance = 30; // Spawn objects 30 units ahead
      const targetSpawnX = playerX + spawnAheadDistance;
      
      // Spawn new objects if we need to extend the environment
      while (lastEnvironmentSpawnX < targetSpawnX) {
        // Spawn 2-4 rocks
        const numRocks = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numRocks; i++) {
          const x = lastEnvironmentSpawnX + Math.random() * 3;
          const z = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 7);
          spawnRock(x, z);
        }
        
        // 40% chance to spawn an island
        if (Math.random() < 0.4) {
          const x = lastEnvironmentSpawnX + Math.random() * 5;
          const z = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 12);
          spawnIsland(x, z);
        }
        
        lastEnvironmentSpawnX += 5 + Math.random() * 5; // Space them out
      }
      
      // Clean up rocks that are far behind the player
      for (let i = scene.rocks.length - 1; i >= 0; i--) {
        const rock = scene.rocks[i];
        if (rock.position.x < playerX - 30) {
          scene.scene.remove(rock);
          rock.geometry.dispose();
          rock.material.dispose();
          scene.rocks.splice(i, 1);
        }
      }
      
      // Clean up islands that are far behind the player
      for (let i = scene.islands.length - 1; i >= 0; i--) {
        const island = scene.islands[i];
        if (island.position.x < playerX - 30) {
          island.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
          scene.scene.remove(island);
          scene.islands.splice(i, 1);
        }
      }
    }
    
    function spawnEnvironment() {
      // Ensure arrays exist
      if (!scene.rocks) scene.rocks = [];
      if (!scene.islands) scene.islands = [];
      console.log('spawnEnvironment called, rocks:', scene.rocks.length, 'islands:', scene.islands.length);
      
      // 30% chance to spawn a rock
      if (Math.random() < 0.3) {
        const size = 0.3 + Math.random() * 0.5;
        const rockGeo = new THREE.DodecahedronGeometry(size, 0);
        const rockMat = new THREE.MeshStandardMaterial({
          color: 0x3a3a3a,
          roughness: 0.9,
          metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        
        const x = PLAY_WIDTH + 5;
        const z = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 7);
        rock.position.set(x, size * 0.3, z); // Spawn at sea level
        
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.scene.add(rock);
        scene.rocks.push(rock);
      }
      
      // 15% chance to spawn an island
      if (Math.random() < 0.15) {
        const islandType = Math.random();
        const islandGroup = new THREE.Group();
        
        if (islandType < 0.33) {
          // Type 1: Small tropical island
          const islandSize = 2 + Math.random() * 2;
          const sandMat = new THREE.MeshStandardMaterial({
            color: 0xf4e4c1,
            roughness: 0.9
          });
          const greenMat = new THREE.MeshStandardMaterial({
            color: 0x6b8e23,
            roughness: 0.8
          });
          
          const sandGeo = new THREE.CylinderGeometry(islandSize, islandSize * 0.8, 0.4, 8);
          const island = new THREE.Mesh(sandGeo, sandMat);
          island.position.y = 0.2;
          islandGroup.add(island);
          
          const greenGeo = new THREE.ConeGeometry(islandSize * 0.6, islandSize * 0.5, 6);
          const greenery = new THREE.Mesh(greenGeo, greenMat);
          greenery.position.y = 0.6;
          islandGroup.add(greenery);
          
        } else if (islandType < 0.66) {
          // Type 2: Big island
          const islandSize = 4 + Math.random() * 3;
          const rockMat = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 0.85
          });
          const greenMat = new THREE.MeshStandardMaterial({
            color: 0x2d5016,
            roughness: 0.7
          });
          
          // Main rocky base
          const baseGeo = new THREE.CylinderGeometry(islandSize, islandSize * 0.9, 0.8, 8);
          const base = new THREE.Mesh(baseGeo, rockMat);
          base.position.y = 0.4;
          islandGroup.add(base);
          
          // Multiple vegetation layers
          for (let i = 0; i < 3; i++) {
            const size = islandSize * (0.7 - i * 0.2);
            const vegGeo = new THREE.ConeGeometry(size, size * 0.6, 6);
            const veg = new THREE.Mesh(vegGeo, greenMat.clone());
            veg.position.y = 1.0 + i * 0.5;
            islandGroup.add(veg);
          }
          
        } else {
          // Type 3: Volcano island
          const islandSize = 3 + Math.random() * 2;
          const lavaMat = new THREE.MeshStandardMaterial({
            color: 0x8b0000,
            emissive: 0xff4500,
            emissiveIntensity: 0.3,
            roughness: 0.7
          });
          const rockMat = new THREE.MeshStandardMaterial({
            color: 0x2f2f2f,
            roughness: 0.9
          });
          
          // Volcanic cone
          const coneGeo = new THREE.ConeGeometry(islandSize, islandSize * 1.5, 8);
          const cone = new THREE.Mesh(coneGeo, rockMat);
          cone.position.y = islandSize * 0.75;
          islandGroup.add(cone);
          
          // Lava crater at top
          const craterGeo = new THREE.CylinderGeometry(islandSize * 0.3, islandSize * 0.2, 0.2, 8);
          const crater = new THREE.Mesh(craterGeo, lavaMat);
          crater.position.y = islandSize * 1.5;
          islandGroup.add(crater);
          
          // Lava glow particles
          const particleGeo = new THREE.SphereGeometry(0.1, 8, 8);
          for (let i = 0; i < 5; i++) {
            const particle = new THREE.Mesh(particleGeo, lavaMat.clone());
            particle.position.set(
              (Math.random() - 0.5) * 0.5,
              islandSize * 1.5 + Math.random() * 0.5,
              (Math.random() - 0.5) * 0.5
            );
            islandGroup.add(particle);
          }
        }
        
        const x = PLAY_WIDTH + 8;
        const z = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 12);
        islandGroup.position.set(x, 0, z); // Spawn at sea level
        
        islandGroup.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });
        
        scene.scene.add(islandGroup);
        scene.islands.push(islandGroup);
      }
    }

    let environmentTimer = null;

    const coins = [];
    const COIN_RADIUS = 0.35; // match Coin default
    const COIN_THICKNESS = 0.18; // match Coin default
    const COIN_COLOR = 0xffd700;
    const COIN_SCORE = 5;
    const MAX_COINS = 30; // Limit to prevent framerate drops

    const items = [];
    const ITEM_COLLECTION_RADIUS = 0.6;
    let obstacleBreakerActive = false;
    let obstacleBreakerTimer = 0;
    const OBSTACLE_BREAKER_DURATION = 6; // seconds
    let coinFeverActive = false;
    let coinFeverTimer = 0;
    const COIN_FEVER_DURATION = 8; // seconds
    let coinFeverSpawnTimer = 0;
    let immunityActive = false;
    let immunityTimer = 0;
    const IMMUNITY_DURATION = 3; // seconds

    function spawnCoin(x, y, z = 0) {
      const coin = new Coin({ x, y, z, graphicsMode });
      scene.scene.add(coin.mesh);
      coins.push(coin);
    }

    function spawnItem(x, y, z = 0) {
      // Randomly choose item type (50/50)
      const type = Math.random() < 0.5 ? 'obstacle-breaker' : 'coin-fever';
      const item = new Item({ type, x, y, z });
      // Ensure baseY is explicitly set to match the spawn position
      item.baseY = y;
      scene.scene.add(item.mesh);
      items.push(item);
    }

    function moveItems(dx) {
      for (let i = items.length - 1; i >= 0; --i) {
        const item = items[i];
        item.mesh.position.x += dx;
        if (item.mesh.position.x < -PLAY_WIDTH - 2) {
          item.dispose();
          items.splice(i, 1);
        }
      }
    }

    function updateItems(dt) {
      for (const item of items) {
        if (!item.collected) item.update(dt);
      }
    }

    function moveCoins(dx) {
      for (let i = coins.length - 1; i >= 0; --i) {
        const coin = coins[i];
        if (!coin || !coin.mesh) continue;
        coin.mesh.position.x += dx;
        if (coin.mesh.position.x < -PLAY_WIDTH - 2) {
          scene.scene.remove(coin.mesh);
          if (coin.mesh.geometry) coin.mesh.geometry.dispose();
          if (coin.mesh.material) coin.mesh.material.dispose();
          coins.splice(i, 1);
        }
      }
    }

    function updateCoins(dt) {
      for (const coin of coins) {
        if (!coin.collected) coin.update(dt);
      }
    }

    function checkCoinCollision() {
      if (!scene.cube) return;
      const birdPos = scene.cube.position;
      for (const coin of coins) {
        if (coin.collected) continue;
        const d = birdPos.distanceTo(coin.mesh.position);
        if (d < COIN_RADIUS + 0.3) { // collision threshold
          coin.collect();
          goldVal += COIN_SCORE;
          localStorage.setItem('sharkGold', goldVal.toString());
          els.goldValue.textContent = goldVal;
        }
      }
    }

    function checkItemCollision() {
      if (!scene.cube) return;
      const sharkPos = scene.cube.position;
      for (const item of items) {
        if (item.collected) continue;
        const d = sharkPos.distanceTo(item.mesh.position);
        if (d < ITEM_COLLECTION_RADIUS) {
          item.collect();
          activatePowerUp(item.type);
        }
      }
    }

    function activatePowerUp(type) {
      if (type === 'obstacle-breaker') {
        obstacleBreakerActive = true;
        obstacleBreakerTimer = OBSTACLE_BREAKER_DURATION;
      } else if (type === 'coin-fever') {
        coinFeverActive = true;
        coinFeverTimer = COIN_FEVER_DURATION;
        coinFeverSpawnTimer = 0;
      }
    }

    function openSettings() {
      if (gameOver) return;
      isPaused = true;
      els.settings.classList.remove('hidden');
    }

    function closeSettings() {
      els.settings.classList.add('hidden');
      
      if (gameStarted && !gameOver) {
        showCountdown(() => {
          isPaused = false;
        });
      } else {
        isPaused = false;
      }
    }

    function resetGame() {
      for (const coin of coins) {
        scene.scene.remove(coin.mesh);
      }
      coins.length = 0;
      
      for (const item of items) {
        item.dispose();
      }
      items.length = 0;
      
      stopObstacles();
      
      if (scene.rocks) {
        for (const rock of scene.rocks) {
          scene.scene.remove(rock);
          rock.geometry.dispose();
          rock.material.dispose();
        }
        scene.rocks.length = 0;
      }
      
      if (scene.islands) {
        for (const island of scene.islands) {
          island.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
          scene.scene.remove(island);
        }
        scene.islands.length = 0;
      }
      
      spawnInitialEnvironment();
      lastEnvironmentSpawnX = 50; 
      
      obstacleBreakerActive = false;
      obstacleBreakerTimer = 0;
      coinFeverActive = false;
      coinFeverTimer = 0;
      immunityActive = false;
      immunityTimer = 0;
      document.getElementById('breaker-status').classList.add('hidden');
      document.getElementById('fever-status').classList.add('hidden');
      document.getElementById('immunity-status').classList.add('hidden');
      
      // Reset bird
      if (scene && scene.cube) {
        // Set correct rotation based on graphics mode
        if (graphicsMode === 'prototype') {
          scene.cube.rotation.set(0, 0, Math.PI / 2); // Cone points forward
        } else {
          scene.cube.rotation.set(0, Math.PI / 2, 0); // Shark faces forward (Y rotation)
        }
        birdY = PLAY_HEIGHT / 2;
        birdVY = 0;
        scene.cube.position.set(0, birdY, 0); // Reset x, y, and z positions
      }
      
      // Reset game state
      gameStarted = true;
      gameOver = false;
      isPaused = false;
      scoreVal = 0;
      levelRiseY = 0;
      lastObstacleX = null;
      els.scoreValue.textContent = '0';
      els.goldValue.textContent = goldVal;
      els.message.classList.add('hidden');
      els.settings.classList.add('hidden');
      
      // Start obstacles and environment immediately
      startObstacles();
    }

    // ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (isPaused) {
          closeSettings();
        } else if (!gameOver) {
          openSettings();
        }
      }
    });

    // Settings button handlers
    document.getElementById('resume').addEventListener('click', () => {
      closeSettings();
    });

    document.getElementById('restart-settings').addEventListener('click', () => {
      resetGame();
    });

    // Graphics mode toggle
    document.getElementById('mode-prototype').addEventListener('click', () => {
      if (graphicsMode !== 'prototype') {
        graphicsMode = 'prototype';
        document.getElementById('mode-prototype').classList.add('active');
        document.getElementById('mode-full').classList.remove('active');
        scene.setGraphicsMode('prototype');
        recreateCoins();
        recreateObstacles();
      }
    });

    document.getElementById('mode-full').addEventListener('click', () => {
      if (graphicsMode !== 'full') {
        graphicsMode = 'full';
        document.getElementById('mode-full').classList.add('active');
        document.getElementById('mode-prototype').classList.remove('active');
        scene.setGraphicsMode('full');
        recreateCoins();
        recreateObstacles();
      }
    });

    function recreateCoins() {
      // Store positions of existing coins
      const coinPositions = coins.map(coin => ({
        x: coin.mesh.position.x,
        y: coin.mesh.position.y,
        z: coin.mesh.position.z,
        collected: coin.collected
      }));

      // Remove old coins
      for (const coin of coins) {
        scene.scene.remove(coin.mesh);
        if (coin.mesh.traverse) {
          coin.mesh.traverse((obj) => {
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
      }
      coins.length = 0;

      // Recreate coins with new graphics mode
      for (const pos of coinPositions) {
        if (!pos.collected) {
          spawnCoin(pos.x, pos.y, pos.z);
        }
      }
    }

    function recreateObstacles() {
      // Store data of existing obstacles
      const obstacleData = obstacles.map(obs => ({
        x: obs.group.position.x,
        y: obs.group.position.y,
        gapY: obs.gapY,
        gapHeight: obs.gapHeight,
        isMoving: obs.isMoving,
        bonusHoleCollected: obs.bonusHoleCollected,
        hasBonusHole: obs.bonusHole !== null
      }));

      // Remove old obstacles
      for (const obs of obstacles) {
        obs.dispose();
      }
      obstacles.length = 0;

      // Recreate obstacles with new graphics mode
      for (const data of obstacleData) {
        const obstacleColor = data.isMoving ? 0xff8800 : 0x2ecc40;
        const obs = new Obstacle({
          gapY: data.gapY,
          gapHeight: data.gapHeight,
          x: data.x,
          width: 1.5,
          depth: 1.2,
          height: 30,
          color: obstacleColor,
          addBonusHole: data.hasBonusHole,
          isMoving: data.isMoving,
          graphicsMode: graphicsMode
        });
        obs.group.position.x = data.x;
        obs.group.position.y = data.y;
        if (data.bonusHoleCollected && obs.bonusHole) {
          obs.bonusHoleCollected = true;
          obs.bonusHole.visible = false;
        }
        scene.scene.add(obs.group);
        obstacles.push(obs);
      }
    }

    // Countdown display function
    function showCountdown(callback) {
      const countdownEl = els.countdown;
      const countdownNumber = countdownEl.querySelector('.countdown-number');
      
      let count = 3;
      countdownNumber.textContent = count;
      countdownEl.classList.remove('hidden');
      
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          countdownNumber.textContent = count;
        } else {
          clearInterval(interval);
          countdownEl.classList.add('hidden');
          if (callback) callback();
        }
      }, 1000);
    }

    // Game over restart button - direct button access after DOM is ready
    setTimeout(() => {
      const restartBtn = document.getElementById('restart-gameover');
      if (restartBtn) {
        console.log('Restart button found:', restartBtn);
        restartBtn.addEventListener('click', (e) => {
          console.log('Game over restart clicked');
          e.preventDefault();
          e.stopPropagation();
          resetGame();
        });
      } else {
        console.error('Restart button not found');
      }
      
      // Respawn button handler
      const respawnBtn = document.getElementById('respawn-btn');
      if (respawnBtn) {
        respawnBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Check if player has enough gold
          if (goldVal < 100) {
            return; // Button should already be disabled, but double-check
          }
          
          // Deduct gold cost
          goldVal -= 100;
          localStorage.setItem('sharkGold', goldVal.toString());
          els.goldValue.textContent = goldVal;
          
          // Hide game over screen
          els.message.classList.add('hidden');
          
          // Show countdown then respawn
          showCountdown(() => {
            if (deathPosition && scene.cube) {
              // Restore position
              scene.cube.position.set(deathPosition.x, deathPosition.y, deathPosition.z);
              birdVY = deathPosition.vY;
              levelRiseY = deathPosition.levelRiseY;
              
              // Resume game
              gameOver = false;
              gameStarted = true;
              startObstacles();
            }
          });
        });
      }
    }, 100);

    // --- Pipe collision detection ---
    const COLLISION_RADIUS = 0.25; // Tighter shark collision radius

    function checkPipeCollision() {
      if (!gameStarted || !scene.cube || gameOver || obstacleBreakerActive || immunityActive) return;
      const sharkPos = scene.cube.position;

      for (const obs of obstacles) {
        const obsX = obs.group.position.x;
        const obsY = obs.group.position.y;
        
        // Check bonus hole collision first
        if (obs.bonusHole && !obs.bonusHoleCollected) {
          const holeWorldY = obsY + obs.bonusHole.y;
          const holeDistX = Math.abs(sharkPos.x - obsX);
          const holeDistY = Math.abs(sharkPos.y - holeWorldY);
          const holeDistZ = Math.abs(sharkPos.z - obs.group.position.z);
          
          // Check if player passes through the bonus hole
          if (holeDistX < obs.bonusHole.radius && 
              holeDistY < obs.bonusHole.radius && 
              holeDistZ < obs.bonusHole.radius) {
            // Grant immunity and bonus points
            obs.bonusHoleCollected = true;
            immunityActive = true;
            immunityTimer = IMMUNITY_DURATION;
            scoreVal += 100;
            els.scoreValue.textContent = scoreVal;
            // Visual feedback - make hole disappear
            obs.bonusHole.mesh.visible = false;
          }
        }
        
        // Only check obstacles that are close to the shark on X-axis
        const xDist = Math.abs(sharkPos.x - obsX);
        
        // Skip obstacles that are too far away (more than 2 units)
        if (xDist > 2) continue;
        
        // Check if shark is within the x-range of this obstacle
        const halfWidth = obs.width / 2;
        const halfDepth = obs.depth / 2;
        
        const zDist = Math.abs(sharkPos.z - obs.group.position.z);
        
        // Only check collision if shark is actually overlapping the obstacle's volume
        if (xDist < halfWidth + COLLISION_RADIUS && zDist < halfDepth + COLLISION_RADIUS) {
          
          // Shark is within pipe's x/z bounds, check if it's in the gap
          const gapTop = obsY + obs.gapY + obs.gapHeight / 2;
          const gapBottom = obsY + obs.gapY - obs.gapHeight / 2;
          
          // Tighter collision - only trigger if shark is actually hitting the pipes
          if (sharkPos.y > gapTop - COLLISION_RADIUS || sharkPos.y < gapBottom + COLLISION_RADIUS) {
            triggerGameOver();
            return;
          }
        }
      }
      
      // Check ground collision
      if (sharkPos.y <= 0.5) {
        triggerGameOver();
      }
    }

    function triggerGameOver() {
      if (gameOver) return;
      gameOver = true;
      
      // Save death position for respawn
      if (scene.cube) {
        deathPosition = {
          x: scene.cube.position.x,
          y: scene.cube.position.y,
          z: scene.cube.position.z,
          vY: birdVY,
          levelRiseY: levelRiseY
        };
      }
      
      // Check and update high score
      if (scoreVal > highScore) {
        highScore = scoreVal;
        localStorage.setItem('sharkHighScore', highScore.toString());
        els.highscoreValue.textContent = highScore;
      }
      
      // Enable/disable respawn based on gold
      const respawnBtn = document.getElementById('respawn-btn');
      if (respawnBtn) {
        if (goldVal >= 100) {
          respawnBtn.disabled = false;
          respawnBtn.textContent = 'Respawn (100 Gold)';
        } else {
          respawnBtn.disabled = true;
          respawnBtn.textContent = `Respawn (Need ${100 - goldVal} more gold)`;
        }
      }
      
      els.message.classList.remove('hidden');
      stopObstacles();
    }

    // --- Modify obstacle spawn to add coins and items ---
    const origSpawnObstacle = spawnObstacle;
    function spawnObstacleWithCoin() {
      origSpawnObstacle();
      // Place a coin in the center of the gap of the newest obstacle,
      // slightly towards the camera so it is clearly visible
      if (obstacles.length > 0) {
        const obs = obstacles[obstacles.length - 1];
        const gapY = obs.gapY || (PLAY_HEIGHT / 2);
        const x = obs.group.position.x ; // centered between front/back of pipes
        // Add the obstacle's Y offset to get world position
        const y = obs.group.position.y + gapY;
        const z = 0.0; // slightly towards camera
        spawnCoin(x, y, z);
        
        // 5% chance to spawn power-up items
        if (Math.random() < 0.05) {
          const itemX = x + 1.5; // Place slightly ahead
          const itemY = y + (Math.random() - 0.5) * 1.5; // Randomize height a bit
          spawnItem(itemX, itemY, z);
        }
      }
    }

    // Replace obstacle spawn and move logic
    spawnObstacle = spawnObstacleWithCoin;
    const origMoveObstacles = moveObstacles;
    function moveObstaclesWithCoins() {
      if (isPaused || gameOver) return;
      origMoveObstacles();
      moveCoins(OBSTACLE_SPEED);
      
      // Update moving obstacles
      for (const obs of obstacles) {
        obs.update(0.016);
      }
    }
    moveObstacles = moveObstaclesWithCoins;

    // Don't start obstacles until game starts
    // startObstacles(); // Removed - will be called by startGame()

    // --- Update loop: update coins and check collision ---
    const origUpdate2 = scene.update.bind(scene);
    scene.update = function(dt) {
      origUpdate2(dt);
      
      if (!gameStarted || isPaused || gameOver) return;
      
      updateCoins(dt);
      updateItems(dt);
      
      // Move items with delta time (same speed as obstacles)
      const itemSpeed = OBSTACLE_SPEED * 60; // Convert frame-based to per-second
      for (let i = items.length - 1; i >= 0; --i) {
        const item = items[i];
        item.mesh.position.x += itemSpeed * dt;
        if (item.mesh.position.x < -PLAY_WIDTH - 2) {
          item.dispose();
          items.splice(i, 1);
        }
      }
      
      checkCoinCollision();
      checkItemCollision();
      checkPipeCollision();
      
      // Spawn environment objects continuously
      spawnEnvironmentObjects();
      
      // Update power-up timers
      if (obstacleBreakerActive) {
        obstacleBreakerTimer -= dt;
        if (obstacleBreakerTimer <= 0) {
          obstacleBreakerActive = false;
          obstacleBreakerTimer = 0;
          document.getElementById('breaker-status').classList.add('hidden');
        } else {
          document.getElementById('breaker-status').classList.remove('hidden');
          document.getElementById('breaker-timer').textContent = Math.ceil(obstacleBreakerTimer) + 's';
        }
        // Visual feedback: make obstacles transparent
        for (const obs of obstacles) {
          [obs.topPipe, obs.bottomPipe].forEach(pipe => {
            if (pipe.material) {
              pipe.material.transparent = true;
              pipe.material.opacity = 0.3;
              pipe.material.needsUpdate = true;
            }
          });
        }
      } else {
        // Restore obstacle opacity when not active
        for (const obs of obstacles) {
          [obs.topPipe, obs.bottomPipe].forEach(pipe => {
            if (pipe.material && pipe.material.opacity < 1.0) {
              pipe.material.opacity = 1.0;
              pipe.material.needsUpdate = true;
            }
          });
        }
      }
      
      if (coinFeverActive) {
        coinFeverTimer -= dt;
        coinFeverSpawnTimer += dt;
        
        document.getElementById('fever-status').classList.remove('hidden');
        document.getElementById('fever-timer').textContent = Math.ceil(coinFeverTimer) + 's';
        
        // Spawn coins continuously during fever (limit to prevent framerate issues)
        if (coinFeverSpawnTimer > 0.3 && coins.length < MAX_COINS) { // Every 0.3 seconds
          coinFeverSpawnTimer = 0;
          
          // Spawn coins at obstacle gap positions, prioritizing obstacles near the player
          if (obstacles.length > 0 && scene.cube) {
            const playerX = scene.cube.position.x;
            // Pick obstacles that are ahead of player but not too far
            const validObstacles = obstacles.filter(obs => {
              const obsX = obs.group.position.x;
              return obsX > playerX - 2 && obsX < playerX + 15;
            });
            
            if (validObstacles.length > 0) {
              const obs = validObstacles[Math.floor(Math.random() * validObstacles.length)];
              const x = obs.group.position.x + (Math.random() - 0.5) * 1.5;
              const gapCenterY = obs.group.position.y + obs.gapY;
              const y = gapCenterY + (Math.random() - 0.5) * (obs.gapHeight * 0.6);
              const z = (Math.random() - 0.5) * 1.5;
              spawnCoin(x, y, z);
            }
          }
        }
        
        if (coinFeverTimer <= 0) {
          coinFeverActive = false;
          coinFeverTimer = 0;
          document.getElementById('fever-status').classList.add('hidden');
        }
      }
      
      // Update immunity timer
      if (immunityActive) {
        immunityTimer -= dt;
        
        document.getElementById('immunity-status').classList.remove('hidden');
        document.getElementById('immunity-timer').textContent = Math.ceil(immunityTimer) + 's';
        
        if (immunityTimer <= 0) {
          immunityActive = false;
          immunityTimer = 0;
          document.getElementById('immunity-status').classList.add('hidden');
        }
      }
    };

    // Start game button
    document.getElementById('start-game').addEventListener('click', () => {
      startGame();
    });

    // Top bar restart button
    els.restart.addEventListener('click', () => {
      console.log('Restart button clicked');
      resetGame();
    });

    // Expose for debugging
    window.appScene = scene;
  });
