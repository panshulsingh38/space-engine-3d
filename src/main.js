import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { StellarUniverse } from './universe.js';
import { ModularRocket, PART_LIBRARY } from './spacecraft.js';

// Get Canvas Viewport
const canvas = document.getElementById('game-canvas');

// 1. WebGL Core Scene & Post-processing Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020108, 0.00000000005); // low density fog for vast space

// perspective camera with astronomical clipping planes
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1e13);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
  logarithmicDepthBuffer: true // prevents z-fighting at astronomical scales
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;

// Ambient lighting for solar system visibility
const ambientLight = new THREE.AmbientLight(0x12121a);
scene.add(ambientLight);

// Headlight to ensure the spacecraft details are always visible from the camera POV
const headlight = new THREE.DirectionalLight(0xffffff, 0.22);
scene.add(headlight);

// WebGL Post-processing Composer
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Unreal Bloom: simulates star glow and engine blast with reduced glare
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.05,
  0.2,
  0.98
);
composer.addPass(bloomPass);

// 2. Stars Particle Field
const starCount = 8000;
const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

// Distribute stars evenly on a sphere of radius 1e11 (extremely far away)
for (let i = 0; i < starCount * 3; i += 3) {
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);
  const r = 1e11 + Math.random() * 5e11;

  starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
  starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
  starPositions[i + 2] = r * Math.cos(phi);

  const colorType = Math.random();
  if (colorType > 0.6) {
    starColors[i] = 0.85; starColors[i + 1] = 0.95; starColors[i + 2] = 1.0;
  } else if (colorType > 0.3) {
    starColors[i] = 1.0; starColors[i + 1] = 1.0; starColors[i + 2] = 1.0;
  } else {
    starColors[i] = 1.0; starColors[i + 1] = 0.85; starColors[i + 2] = 0.65;
  }
}

starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMat = new THREE.PointsMaterial({
  size: 3.2e8,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  opacity: 0.58
});

const starfield = new THREE.Points(starGeo, starMat);
scene.add(starfield);

// 3. Instantiate Game Engines
const universe = new StellarUniverse(scene);
const spacecraft = new ModularRocket(camera);

// 3D rocket model group
const rocketGroup = new THREE.Group();
scene.add(rocketGroup);

// Raycasting target selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let activeTargetKey = null;

// Camera Keyboard POV Keys State
const cameraKeys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  BracketLeft: false,
  BracketRight: false
};

window.addEventListener('keydown', (e) => {
  if (spacecraft.isAssembled) {
    if (e.code in cameraKeys) {
      cameraKeys[e.code] = true;
      e.preventDefault(); // Stop page scrolling
    }
  } else {
    // VAB Mode Keyboard Pan Controls (W/S or ArrowUp/ArrowDown to move camera vertically, A/D or ArrowLeft/ArrowRight to move horizontally)
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      vabTarget.y = Math.min(30.0, vabTarget.y + 0.5);
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      vabTarget.y = Math.max(-15.0, vabTarget.y - 0.5);
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
      vabTarget.addScaledVector(right, -0.5);
      e.preventDefault();
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
      vabTarget.addScaledVector(right, 0.5);
      e.preventDefault();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code in cameraKeys) {
    cameraKeys[e.code] = false;
  }
});

// ==========================================
// VAB EDITOR USER INTERFACE CONTROLLERS
// ==========================================
const screenVAB = document.getElementById('vab-screen');
const screenFlight = document.getElementById('flight-screen');
let selectedPartIndex = spacecraft.parts.length > 0 ? spacecraft.parts.length - 1 : -1;

// Category Tabs Selection
const categories = ['command', 'propulsion', 'tanks', 'utilities', 'presets'];
categories.forEach(cat => {
  const btn = document.getElementById(`tab-${cat}`);
  btn.addEventListener('click', () => {
    document.querySelectorAll('.vab-toolbar-vertical button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.parts-cat-grid').forEach(grid => grid.classList.remove('active'));
    document.getElementById(`cat-${cat}`).classList.add('active');
  });
});

const EXTRA_CATALOG_PARTS = {
  command: ['mk1-lander-can', 'mk1-3-pod', 'probe-core', 'hecs-core'],
  propulsion: [
    'flea-srb', 'hammer-srb', 'thumper-srb', 'kickback-srb',
    'reliant-engine', 'swivel-engine', 'terrier-engine', 'spark-engine',
    'skipper-engine', 'vector-engine', 'rhino-engine', 'rapier-engine', 'juno-engine'
  ],
  tanks: ['fl-t100', 'fl-t200', 'x200-16', 'x200-32', 'oscar-b', 'mk2-fuselage'],
  utilities: [
    'reaction-wheel', 'battery-z400', 'service-bay', 'science-jr', 'communotron',
    'separator', 'radial-decoupler', 'fairing', 'heat-shield', 'docking-port',
    'rcs-block', 'strut-connector'
  ]
};

function describePart(part) {
  if (part.type === 'command') return 'Control module with avionics for crewed or probe missions.';
  if (part.type === 'tank') return `Propellant storage. Fuel mass ${part.fuel.toFixed(1)}t.`;
  if (part.solid) return 'Solid rocket booster for high-thrust launch stages.';
  if (part.liquid || part.ion) return 'Engine module for powered flight and orbital maneuvers.';
  if (part.decoupler) return 'Staging hardware for clean vehicle separation.';
  if (part.parachute) return 'Atmospheric recovery system for safe descent.';
  return 'Utility hardware for spacecraft systems and mission equipment.';
}

function formatPartStats(part) {
  if (part.thrust > 0) return `THRUST: ${part.thrust}kN | ISP: ${part.isp}s`;
  if (part.fuel > 0) return `FUEL: ${part.fuel.toFixed(1)}t | DRY: ${part.dryMass.toFixed(2)}t`;
  return `MASS: ${part.dryMass.toFixed(2)}t`;
}

function addCatalogPartCards() {
  Object.entries(EXTRA_CATALOG_PARTS).forEach(([category, partKeys]) => {
    const grid = document.getElementById(`cat-${category}`);
    if (!grid) return;

    partKeys.forEach(partKey => {
      if (grid.querySelector(`[data-part="${partKey}"]`)) return;
      const part = PART_LIBRARY[partKey];
      if (!part) return;

      const card = document.createElement('div');
      card.className = 'part-card';
      card.setAttribute('data-part', partKey);
      card.innerHTML = `
        <div class="part-name">${part.name}</div>
        <div class="part-desc">${describePart(part)}</div>
        <div class="part-stats">${formatPartStats(part)}</div>
      `;
      grid.appendChild(card);
    });
  });
}

addCatalogPartCards();

// Part catalogue clicks
document.querySelectorAll('.part-card').forEach(card => {
  card.addEventListener('click', () => {
    const partKey = card.getAttribute('data-part');
    spacecraft.addPart(partKey);
    selectedPartIndex = spacecraft.parts.length - 1;
    updateVABInterface();
    build3DRocketModel();
  });
});

// Preset blueprint clicks
document.querySelectorAll('.preset-card').forEach(card => {
  card.addEventListener('click', () => {
    const presetKey = card.getAttribute('data-preset');
    loadPresetRocket(presetKey);
  });
});

function loadPresetRocket(presetKey) {
  if (presetKey === 'kerbal-x') {
    spacecraft.setParts([
      'mk1-pod',
      'fl-t800',
      'decoupler',
      'fl-t800',
      'mainsail-900'
    ]);
  } else if (presetKey === 'saturn-v') {
    spacecraft.setParts([
      'mk3-bridge',
      'fl-t400',
      'mainsail-900',
      'decoupler',
      'fl-t800',
      'decoupler',
      'fl-t800',
      'fl-t800',
      'mainsail-900',
      'srb-500',
      'srb-500'
    ]);
  } else if (presetKey === 'ion-explorer') {
    spacecraft.setParts([
      'mk1-pod',
      'xenon-tank',
      'xenon-50',
      'solar-panel',
      'solar-panel'
    ]);
  }
  selectedPartIndex = Math.max(0, spacecraft.parts.length - 1);
  spacecraft.compileSpecs();
  updateVABInterface();
  build3DRocketModel();
  logFlightConsole(`Loaded Blueprint: ${presetKey.toUpperCase()}`);
}

document.getElementById('btn-clear-rocket').addEventListener('click', () => {
  spacecraft.clearAssembly();
  selectedPartIndex = -1;
  updateVABInterface();
  build3DRocketModel();
});

function selectPart(index) {
  selectedPartIndex = index;
  updateVABInterface();
  build3DRocketModel();
}

function moveSelectedPartStack(direction) {
  if (selectedPartIndex < 0) return;
  selectedPartIndex = spacecraft.movePart(selectedPartIndex, direction);
  updateVABInterface();
  build3DRocketModel();
}

function nudgeSelectedPart(axis, amount) {
  if (selectedPartIndex < 0) return;
  spacecraft.nudgePart(selectedPartIndex, axis, amount);
  updateVABInterface();
  build3DRocketModel();
}

document.getElementById('btn-stack-up').addEventListener('click', () => moveSelectedPartStack(1));
document.getElementById('btn-stack-down').addEventListener('click', () => moveSelectedPartStack(-1));
document.getElementById('btn-part-up').addEventListener('click', () => nudgeSelectedPart('z', -0.25));
document.getElementById('btn-part-down').addEventListener('click', () => nudgeSelectedPart('z', 0.25));
document.getElementById('btn-part-left').addEventListener('click', () => nudgeSelectedPart('x', -0.25));
document.getElementById('btn-part-right').addEventListener('click', () => nudgeSelectedPart('x', 0.25));

document.getElementById('btn-compile-launch').addEventListener('click', () => {
  if (spacecraft.parts.length === 0) {
    alert("CRITICAL ERROR: Cannot launch empty vehicle assembly. Please add a Command Pod first.");
    return;
  }

  const hasControl = spacecraft.parts.some(p => PART_LIBRARY[p].type === 'command');
  if (!hasControl) {
    alert("WARNING: Rocket requires a Command Pod/Bridge to establish flight computer controls.");
    return;
  }

  // Compile and launch rocket onto Earth surface (launch pad)
  spacecraft.isAssembled = true;
  window.parachuteLogged = false; // Reset logging flag for parachute trigger
  spacecraft.compileSpecs();
  spacecraft.resetToEarthSurface(universe);

  flightOrbitY = 0.5;
  flightOrbitX = 0.12;
  flightOrbitDist = 35.0; // Zoomed in near surface

  build3DRocketModel();

  // Highlight Earth target by default
  selectCelestialTarget('earth', universe.celestials['earth']);

  screenVAB.classList.add('hidden');
  screenFlight.classList.remove('hidden');
  logFlightConsole("VEHICLE COMPILED. IGNTION CODES ARMED. ENGAGE THROTTLE WITH 'I'.");
});

document.getElementById('btn-return-vab').addEventListener('click', () => {
  spacecraft.isAssembled = false;
  screenFlight.classList.add('hidden');
  screenVAB.classList.remove('hidden');
  
  // Reset camera Up axis for VAB hangar
  camera.up.set(0, 1, 0);
  
  // reset time warp
  activeWarpIndex = 0;
  updateTimeWarpDisplay();
  
  build3DRocketModel();
});

// Update VAB panel telemetry & staging scheme
function updateVABInterface() {
  // Set parts count
  document.getElementById('vab-part-count').textContent = spacecraft.parts.length;

  document.getElementById('vab-mass-wet').textContent = `${spacecraft.wetMass.toFixed(2)}t`;
  document.getElementById('vab-mass-dry').textContent = `${spacecraft.dryMass.toFixed(2)}t`;
  document.getElementById('vab-thrust-max').textContent = `${spacecraft.maxThrust.toFixed(0)}kN`;
  document.getElementById('vab-deltav').textContent = `${spacecraft.deltaV.toFixed(0)} m/s`;

  const stack = document.getElementById('staging-list');
  stack.innerHTML = '';

  for (let s = spacecraft.compiledStages.length - 1; s >= 0; s--) {
    const stage = spacecraft.compiledStages[s];
    const stageBlock = document.createElement('div');
    stageBlock.className = 'stage-block';
    
    const header = document.createElement('div');
    header.className = 'stage-header';
    header.innerHTML = `<span>STAGE ${s}</span>`;
    stageBlock.appendChild(header);

    const partsList = document.createElement('div');
    partsList.className = 'stage-parts';
    stage.forEach(p => {
      const partEl = document.createElement('div');
      partEl.className = `stage-part${p.sourceIndex === selectedPartIndex ? ' selected' : ''}`;
      partEl.textContent = `${p.sourceIndex + 1}. ${p.name}`;
      partEl.addEventListener('click', () => selectPart(p.sourceIndex));
      partsList.appendChild(partEl);
    });
    stageBlock.appendChild(partsList);

    stack.appendChild(stageBlock);
  }
}

// ==========================================
// VAB HANGAR 3D STRUCTURE
// ==========================================
const vabHangar = new THREE.Group();
scene.add(vabHangar);

function buildVABHangar() {
  // Clear any existing children
  while (vabHangar.children.length > 0) {
    vabHangar.remove(vabHangar.children[0]);
  }

  const rHeight = totalHeightCompiled(spacecraft);
  const gridY = -rHeight / 2;

  const grid = new THREE.GridHelper(120, 48, 0x00f0ff, 0x2c2d33);
  grid.position.y = gridY;
  vabHangar.add(grid);
}

buildVABHangar();

// ==========================================
// LOCAL ENVIRONMENT & LAUNCHPAD (SFS-Style)
// ==========================================
const localSurfaceGroup = new THREE.Group();
const localPadGroup = new THREE.Group();
const localTerrainGroup = new THREE.Group();

localSurfaceGroup.add(localPadGroup);
localSurfaceGroup.add(localTerrainGroup);
scene.add(localSurfaceGroup);

let terrainMesh = null;
let gantry = null;

function buildLocalSurface() {
  // 1. Concrete Launch Pad Platform
  const padGeo = new THREE.CylinderGeometry(80, 80, 2, 64);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x333538,
    roughness: 0.85,
    metalness: 0.15
  });
  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.position.y = -1; // sit flush with terrain surface
  localPadGroup.add(padMesh);

  // Yellow dashed safety border ring
  const borderGeo = new THREE.RingGeometry(18, 18.5, 64);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = Math.PI / 2;
  border.position.y = 0.02;
  localPadGroup.add(border);

  // 2. Launch Tower (Gantry) Truss Structure
  gantry = new THREE.Group();
  gantry.position.set(0, 15, -12); // placed 12 meters behind rocket launch pad center
  
  // Vertical main beams (4 corner posts)
  const beamGeo = new THREE.CylinderGeometry(0.18, 0.18, 30, 8);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8b251e, metalness: 0.8, roughness: 0.3 }); // industrial orange-red
  
  for (let x = -2.5; x <= 2.5; x += 5) {
    for (let z = -2.5; z <= 2.5; z += 5) {
      const post = new THREE.Mesh(beamGeo, metalMat);
      post.position.set(x, 0, z);
      gantry.add(post);
    }
  }
  
  // Cross bracing trusses (diagonal support beams at multiple height levels)
  const trussMat = new THREE.MeshStandardMaterial({ color: 0xdde0e5, metalness: 0.9, roughness: 0.25 }); // silver steel
  for (let h = -14; h < 15; h += 4) {
    // Horizontal frame rings
    const frameGeo = new THREE.BoxGeometry(5.2, 0.2, 5.2);
    const frame = new THREE.Mesh(frameGeo, metalMat);
    frame.position.y = h;
    gantry.add(frame);
    
    // Diagonal braces
    const braceGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.4, 8);
    
    // X brace front (z = 2.5)
    const b1 = new THREE.Mesh(braceGeo, trussMat);
    b1.position.set(0, h + 2, 2.5);
    b1.rotation.z = 0.68;
    gantry.add(b1);
    const b2 = new THREE.Mesh(braceGeo, trussMat);
    b2.position.set(0, h + 2, 2.5);
    b2.rotation.z = -0.68;
    gantry.add(b2);
    
    // X brace back (z = -2.5)
    const b1_b = new THREE.Mesh(braceGeo, trussMat);
    b1_b.position.set(0, h + 2, -2.5);
    b1_b.rotation.z = 0.68;
    gantry.add(b1_b);
    const b2_b = new THREE.Mesh(braceGeo, trussMat);
    b2_b.position.set(0, h + 2, -2.5);
    b2_b.rotation.z = -0.68;
    gantry.add(b2_b);
    
    // X brace left (x = -2.5)
    const b3 = new THREE.Mesh(braceGeo, trussMat);
    b3.position.set(-2.5, h + 2, 0);
    b3.rotation.x = 0.68;
    gantry.add(b3);
    const b4 = new THREE.Mesh(braceGeo, trussMat);
    b4.position.set(-2.5, h + 2, 0);
    b4.rotation.x = -0.68;
    gantry.add(b4);
    
    // X brace right (x = 2.5)
    const b5 = new THREE.Mesh(braceGeo, trussMat);
    b5.position.set(2.5, h + 2, 0);
    b5.rotation.x = 0.68;
    gantry.add(b5);
    const b6 = new THREE.Mesh(braceGeo, trussMat);
    b6.position.set(2.5, h + 2, 0);
    b6.rotation.x = -0.68;
    gantry.add(b6);
  }
  
  // Flashing red warning beacon at the top of gantry
  const lightGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const beacon = new THREE.Mesh(lightGeo, lightMat);
  beacon.position.y = 15.3;
  gantry.add(beacon);
  localPadGroup.add(gantry);

  // 3. Floodlight Poles
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 8, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.8 });
  const polePositions = [
    [25, 25],
    [-25, 25],
    [25, -25],
    [-25, -25]
  ];
  
  polePositions.forEach(([px, pz]) => {
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(px, 4, pz);
    localPadGroup.add(pole);

    // Spotlight pointing at rocket base
    const spot = new THREE.SpotLight(0xffffff, 45, 60, Math.PI / 4, 0.5, 1.2);
    spot.position.set(px, 7.8, pz);
    spot.target.position.set(0, 2, 0);
    localPadGroup.add(spot);
    localPadGroup.add(spot.target);
  });

  // 4. Surrounding Terrain Mesh
  const terrainGeo = new THREE.CylinderGeometry(6000, 6000, 1.2, 32);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.95,
    metalness: 0.05
  });
  terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.y = -1.6; // slightly lower than the concrete pad
  localTerrainGroup.add(terrainMesh);
}

buildLocalSurface();

// ==========================================
// DETAILED 3D ROCKET PART GENERATION (KSP-Style)
// ==========================================
function build3DRocketModel() {
  while (rocketGroup.children.length > 0) {
    rocketGroup.remove(rocketGroup.children[0]);
  }

  let totalHeight = 0;
  
  spacecraft.compiledStages.forEach(stage => {
    stage.forEach(p => {
      totalHeight += getPartHeight(p);
    });
  });

  let heightOffset = -totalHeight / 2;
  
  spacecraft.compiledStages.forEach(stage => {
    stage.forEach(p => {
      const partContainer = new THREE.Group();
      const pHeight = getPartHeight(p);
      
      if (p.type === 'command') {
        // Highly-detailed Command capsule (truncated cone)
        const podGeo = new THREE.CylinderGeometry(0.3, 1.2, 2.0, 64);
        // Premium painted carbon composite capsule look
        const podMat = new THREE.MeshStandardMaterial({ color: 0xf5f6f8, metalness: 0.25, roughness: 0.35 });
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.position.y = heightOffset + 1.0;
        partContainer.add(pod);

        // Dark metallic bottom heat-shield plate (titanium-charcoal)
        const shieldGeo = new THREE.CylinderGeometry(1.2, 1.22, 0.15, 64);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.85, roughness: 0.45 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.y = heightOffset + 0.08;
        partContainer.add(shield);

        // Cockpit window frame (dark metal chrome)
        const frameGeo = new THREE.BoxGeometry(0.56, 0.46, 0.08);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222225, metalness: 0.85, roughness: 0.15 });
        const windowFrame = new THREE.Mesh(frameGeo, frameMat);
        windowFrame.position.set(0, heightOffset + 1.2, 0.9);
        windowFrame.rotation.x = -0.3;
        partContainer.add(windowFrame);

        // Cockpit window glass (glossy blue space reflections)
        const winGeo = new THREE.BoxGeometry(0.5, 0.4, 0.12);
        const winMat = new THREE.MeshStandardMaterial({ color: 0x00a0ff, metalness: 0.9, roughness: 0.05, emissive: 0x001133 });
        const windowMesh = new THREE.Mesh(winGeo, winMat);
        windowMesh.position.set(0, heightOffset + 1.2, 0.94);
        windowMesh.rotation.x = -0.3;
        partContainer.add(windowMesh);

        // Red nose cap / Parachute cover (semi-gloss protective coating)
        const noseGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.2, 64);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xe62c4b, metalness: 0.15, roughness: 0.3 });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.set(0, heightOffset + 2.0, 0);
        partContainer.add(nose);

        // 4 RCS Thruster Blocks
        const rcsBlockGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const rcsBlockMat = new THREE.MeshStandardMaterial({ color: 0x444448, roughness: 0.4 });
        const rcsNozzleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
        const rcsNozzleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });

        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const rcsGroup = new THREE.Group();
          rcsGroup.position.set(Math.cos(angle) * 0.72, heightOffset + 1.5, Math.sin(angle) * 0.72);
          rcsGroup.rotation.y = -angle;

          const block = new THREE.Mesh(rcsBlockGeo, rcsBlockMat);
          rcsGroup.add(block);

          const nOut = new THREE.Mesh(rcsNozzleGeo, rcsNozzleMat);
          nOut.position.set(0, 0, 0.08);
          nOut.rotation.x = Math.PI / 2;
          rcsGroup.add(nOut);

          const nUp = new THREE.Mesh(rcsNozzleGeo, rcsNozzleMat);
          nUp.position.set(0, 0.08, 0);
          rcsGroup.add(nUp);

          const nSide1 = new THREE.Mesh(rcsNozzleGeo, rcsNozzleMat);
          nSide1.position.set(0.08, 0, 0);
          nSide1.rotation.z = Math.PI / 2;
          rcsGroup.add(nSide1);

          partContainer.add(rcsGroup);
        }

      } else if (p.solid) {
        // Long solid booster body
        const boosterBodyHeight = Math.max(1.2, pHeight - 1.0);
        const boosterGeo = new THREE.CylinderGeometry(0.7, 0.7, boosterBodyHeight, 64);
        // Semi-matte military casing
        const boosterMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, metalness: 0.2, roughness: 0.45 });
        const booster = new THREE.Mesh(boosterGeo, boosterMat);
        booster.position.y = heightOffset + 0.55 + boosterBodyHeight / 2;
        partContainer.add(booster);

        // Aerodynamic Nosecone
        const coneGeo = new THREE.ConeGeometry(0.7, 1.0, 64);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xe62c4b, metalness: 0.15, roughness: 0.35 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = heightOffset + boosterBodyHeight + 1.05;
        partContainer.add(cone);

        // Steel reinforcement rings (retaining bands)
        const bandGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 64);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x3d3d40, metalness: 0.8 });
        
        const band1 = new THREE.Mesh(bandGeo, bandMat); band1.position.set(0, heightOffset + 0.7, 0); partContainer.add(band1);
        const band2 = new THREE.Mesh(bandGeo, bandMat); band2.position.set(0, heightOffset + 0.55 + boosterBodyHeight * 0.5, 0); partContainer.add(band2);
        const band3 = new THREE.Mesh(bandGeo, bandMat); band3.position.set(0, heightOffset + boosterBodyHeight + 0.35, 0); partContainer.add(band3);

        // Booster Nozzle (dark steel bell)
        const nozzleGeo = new THREE.CylinderGeometry(0.35, 0.6, 0.6, 64);
        const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1d, metalness: 0.9, roughness: 0.4 });
        const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozzle.position.y = heightOffset - 0.1;
        partContainer.add(nozzle);

        // Exhaust smoke / heat glow emitter cone
        const glowGeo = new THREE.ConeGeometry(0.25, 0.3, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = heightOffset - 0.25;
        glow.rotation.x = Math.PI;
        partContainer.add(glow);

      } else if (p.type === 'tank') {
        if (p.key === 'jumbo-64') {
          // Giant orange fuel tank cylinder
          const tankGeo = new THREE.CylinderGeometry(1.4, 1.4, 5.0, 64);
          const tankMat = new THREE.MeshStandardMaterial({ color: 0xd35400, metalness: 0.5, roughness: 0.45 });
          const tank = new THREE.Mesh(tankGeo, tankMat);
          tank.position.y = heightOffset + 2.5;
          partContainer.add(tank);

          // Black metal structural rib bands
          const ribMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.9, roughness: 0.22 });
          const ribGeo = new THREE.CylinderGeometry(1.415, 1.415, 0.1, 64);
          
          const ribTop = new THREE.Mesh(ribGeo, ribMat); ribTop.position.set(0, heightOffset + 4.85, 0); partContainer.add(ribTop);
          const ribBot = new THREE.Mesh(ribGeo, ribMat); ribBot.position.set(0, heightOffset + 0.15, 0); partContainer.add(ribBot);
          const ribMid1 = new THREE.Mesh(ribGeo, ribMat); ribMid1.position.set(0, heightOffset + 1.66, 0); partContainer.add(ribMid1);
          const ribMid2 = new THREE.Mesh(ribGeo, ribMat); ribMid2.position.set(0, heightOffset + 3.33, 0); partContainer.add(ribMid2);

          // 2 External pipelines running down the sides
          const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 4.6, 16);
          const pipeMat = new THREE.MeshStandardMaterial({ color: 0xe6e9ee, metalness: 0.95, roughness: 0.12 });
          
          const pipe1 = new THREE.Mesh(pipeGeo, pipeMat); pipe1.position.set(1.41, heightOffset + 2.5, 0); partContainer.add(pipe1);
          const pipe2 = new THREE.Mesh(pipeGeo, pipeMat); pipe2.position.set(-1.41, heightOffset + 2.5, 0); partContainer.add(pipe2);
        } else if (p.key === 'rcs-tank') {
          // Monopropellant tank body (dark grey metal cylinder)
          const tankGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.0, 64);
          const tankMat = new THREE.MeshStandardMaterial({ color: 0x2e3035, metalness: 0.7, roughness: 0.35 });
          const tank = new THREE.Mesh(tankGeo, tankMat);
          tank.position.y = heightOffset + 1.0;
          partContainer.add(tank);

          // Metal support band in the middle
          const bandGeo = new THREE.CylinderGeometry(1.215, 1.215, 0.12, 64);
          const bandMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
          const band = new THREE.Mesh(bandGeo, bandMat);
          band.position.set(0, heightOffset + 1.0, 0);
          partContainer.add(band);

          // 4 Spherical yellow fuel capsules
          const sphereGeo = new THREE.SphereGeometry(0.35, 32, 32);
          const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.2, roughness: 0.4 });
          
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.set(Math.cos(angle) * 1.15, heightOffset + 1.0, Math.sin(angle) * 1.15);
            partContainer.add(sphere);
          }
        } else {
          const tankHeight = p.key === 'fl-t800' ? 4.0 : 2.0;
          
          // Detailed tank cylinder (64 segments) - brushed aluminum texture look
          const tankGeo = new THREE.CylinderGeometry(1.2, 1.2, tankHeight, 64);
          const tankMat = new THREE.MeshStandardMaterial({ color: 0xdde0e5, metalness: 0.68, roughness: 0.28 });
          const tank = new THREE.Mesh(tankGeo, tankMat);
          tank.position.y = heightOffset + (tankHeight / 2);
          partContainer.add(tank);

          // Structural metal rib bands wrapping around cylinder (dark iron bands)
          const ribMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.9, roughness: 0.22 });
          const ribGeo = new THREE.CylinderGeometry(1.215, 1.215, 0.08, 64);
          
          const ribTop = new THREE.Mesh(ribGeo, ribMat);
          ribTop.position.set(0, heightOffset + tankHeight - 0.15, 0);
          partContainer.add(ribTop);

          const ribBottom = new THREE.Mesh(ribGeo, ribMat);
          ribBottom.position.set(0, heightOffset + 0.15, 0);
          partContainer.add(ribBottom);

          if (p.key === 'fl-t800') {
            const ribMid1 = new THREE.Mesh(ribGeo, ribMat); ribMid1.position.set(0, heightOffset + 1.33, 0); partContainer.add(ribMid1);
            const ribMid2 = new THREE.Mesh(ribGeo, ribMat); ribMid2.position.set(0, heightOffset + 2.66, 0); partContainer.add(ribMid2);
          }

          // External plumbing/fuel conduit running down the side (polished steel pipeline)
          const pipeGeo = new THREE.CylinderGeometry(0.03, 0.03, tankHeight - 0.4, 16);
          const pipeMat = new THREE.MeshStandardMaterial({ color: 0xe6e9ee, metalness: 0.95, roughness: 0.12 });
          const pipe = new THREE.Mesh(pipeGeo, pipeMat);
          pipe.position.set(1.21, heightOffset + (tankHeight / 2), 0);
          partContainer.add(pipe);

          // Pipe brackets holding it to the hull
          const bracketGeo = new THREE.BoxGeometry(0.08, 0.04, 0.08);
          const bracketMat = new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: 0.5 });
          
          const brTop = new THREE.Mesh(bracketGeo, bracketMat); brTop.position.set(1.21, heightOffset + tankHeight - 0.3, 0); partContainer.add(brTop);
          const brMid = new THREE.Mesh(bracketGeo, bracketMat); brMid.position.set(1.21, heightOffset + (tankHeight / 2), 0); partContainer.add(brMid);
          const brBot = new THREE.Mesh(bracketGeo, bracketMat); brBot.position.set(1.21, heightOffset + 0.3, 0); partContainer.add(brBot);

          // KSP Orange stripe marking
          const stripeGeo = new THREE.BoxGeometry(0.15, tankHeight - 0.4, 0.04);
          const stripeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
          const stripe = new THREE.Mesh(stripeGeo, stripeMat);
          stripe.position.set(0, heightOffset + (tankHeight / 2), 1.205);
          partContainer.add(stripe);
        }

      } else if (p.type === 'propulsion') {
        if (p.key === 'poodle-150') {
          // Poodle Engine (wide flat adapter with dual nozzles)
          const adapterGeo = new THREE.CylinderGeometry(1.2, 1.1, 0.4, 64);
          const adapterMat = new THREE.MeshStandardMaterial({ color: 0x2e3035, metalness: 0.85, roughness: 0.3 });
          const adapter = new THREE.Mesh(adapterGeo, adapterMat);
          adapter.position.y = heightOffset + 0.8;
          partContainer.add(adapter);

          // Dual Engine Nozzles (placed side by side at X = -0.35 and 0.35)
          const nozzleGeo = new THREE.CylinderGeometry(0.2, 0.45, 0.6, 64);
          const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.95, roughness: 0.4 });
          
          const glowGeo = new THREE.ConeGeometry(0.15, 0.25, 16);
          const glowMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });

          const positions = [-0.35, 0.35];
          positions.forEach(xOffset => {
            const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
            nozzle.position.set(xOffset, heightOffset + 0.3, 0);
            partContainer.add(nozzle);

            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.set(xOffset, heightOffset + 0.2, 0);
            glow.rotation.x = Math.PI;
            partContainer.add(glow);

            // Hydraulic Actuators
            const strutGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8);
            const strutMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, metalness: 0.98, roughness: 0.05 });
            const strut1 = new THREE.Mesh(strutGeo, strutMat);
            strut1.position.set(xOffset - 0.12, heightOffset + 0.6, 0);
            partContainer.add(strut1);

            const strut2 = new THREE.Mesh(strutGeo, strutMat);
            strut2.position.set(xOffset + 0.12, heightOffset + 0.6, 0);
            partContainer.add(strut2);
          });
        } else if (p.key === 'nerv-nuclear') {
          // LV-N Nerv Nuclear Engine (long casing, external radiators, cyan/green glow)
          const adapterGeo = new THREE.CylinderGeometry(1.2, 0.9, 0.3, 64);
          const adapterMat = new THREE.MeshStandardMaterial({ color: 0x4f525c, metalness: 0.8, roughness: 0.3 });
          const adapter = new THREE.Mesh(adapterGeo, adapterMat);
          adapter.position.y = heightOffset + 2.35;
          partContainer.add(adapter);

          const reactorGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.2, 64);
          const reactorMat = new THREE.MeshStandardMaterial({ color: 0x2e3033, metalness: 0.6, roughness: 0.4 });
          const reactor = new THREE.Mesh(reactorGeo, reactorMat);
          reactor.position.y = heightOffset + 1.6;
          partContainer.add(reactor);

          const radGeo = new THREE.CylinderGeometry(0.92, 0.92, 1.0, 32, 1, true, 0, Math.PI * 0.8);
          const radMat = new THREE.MeshStandardMaterial({ color: 0xe6e9ee, metalness: 0.85, roughness: 0.25 });
          
          const radLeft = new THREE.Mesh(radGeo, radMat);
          radLeft.position.set(0, heightOffset + 1.6, 0);
          radLeft.rotation.y = Math.PI * 0.1;
          partContainer.add(radLeft);

          const radRight = new THREE.Mesh(radGeo, radMat);
          radRight.position.set(0, heightOffset + 1.6, 0);
          radRight.rotation.y = Math.PI * 1.1;
          partContainer.add(radRight);

          const stripeGeo = new THREE.CylinderGeometry(0.86, 0.86, 0.08, 64);
          const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00ff33 });
          
          const stripeTop = new THREE.Mesh(stripeGeo, stripeMat);
          stripeTop.position.set(0, heightOffset + 2.1, 0);
          partContainer.add(stripeTop);

          const stripeBot = new THREE.Mesh(stripeGeo, stripeMat);
          stripeBot.position.set(0, heightOffset + 1.1, 0);
          partContainer.add(stripeBot);

          const pipeGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 16);
          const pipeMat = new THREE.MeshStandardMaterial({ color: 0xd35400, metalness: 0.9, roughness: 0.1 });
          
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2 + Math.PI / 4;
            const pipe = new THREE.Mesh(pipeGeo, pipeMat);
            pipe.position.set(Math.cos(angle) * 0.88, heightOffset + 1.6, Math.sin(angle) * 0.88);
            partContainer.add(pipe);
          }

          const nozzleGeo = new THREE.CylinderGeometry(0.4, 0.85, 1.0, 64);
          const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.9, roughness: 0.45 });
          const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
          nozzle.position.y = heightOffset + 0.5;
          partContainer.add(nozzle);

          const glowGeo = new THREE.ConeGeometry(0.3, 0.4, 16);
          const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
          const glow = new THREE.Mesh(glowGeo, glowMat);
          glow.position.y = heightOffset + 0.65;
          glow.rotation.x = Math.PI;
          partContainer.add(glow);
        } else if (p.key === 'lvt45-engine') {
          // LV-T45 Liquid Engine (silver bell, compact adapter, steering struts)
          const adapterGeo = new THREE.CylinderGeometry(1.2, 0.95, 0.25, 64);
          const adapterMat = new THREE.MeshStandardMaterial({ color: 0x3a3c42, metalness: 0.8, roughness: 0.3 });
          const adapter = new THREE.Mesh(adapterGeo, adapterMat);
          adapter.position.y = heightOffset + 1.08;
          partContainer.add(adapter);

          const ballGeo = new THREE.SphereGeometry(0.3, 32, 16);
          const ballMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.9 });
          const ball = new THREE.Mesh(ballGeo, ballMat);
          ball.position.set(0, heightOffset + 0.9, 0);
          partContainer.add(ball);

          const nozzleGeo = new THREE.CylinderGeometry(0.3, 0.75, 0.7, 64);
          const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.92, roughness: 0.15 });
          const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
          nozzle.position.y = heightOffset + 0.45;
          partContainer.add(nozzle);

          const glowGeo = new THREE.ConeGeometry(0.25, 0.3, 16);
          const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
          const glow = new THREE.Mesh(glowGeo, glowMat);
          glow.position.y = heightOffset + 0.55;
          glow.rotation.x = Math.PI;
          partContainer.add(glow);

          const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
          const strutMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, metalness: 0.98, roughness: 0.05 });
          
          const strut1 = new THREE.Mesh(strutGeo, strutMat);
          strut1.position.set(0.4, heightOffset + 0.85, 0);
          strut1.rotation.z = -0.15;
          partContainer.add(strut1);

          const strut2 = new THREE.Mesh(strutGeo, strutMat);
          strut2.position.set(-0.4, heightOffset + 0.85, 0);
          strut2.rotation.z = 0.15;
          partContainer.add(strut2);

          const lineGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
          const lineMat = new THREE.MeshStandardMaterial({ color: 0xd35400, metalness: 0.9 });
          const line = new THREE.Mesh(lineGeo, lineMat);
          line.position.set(0.25, heightOffset + 0.55, 0.25);
          line.rotation.z = 0.2;
          partContainer.add(line);
        } else {
          // Engine Adapter Plate (heavy structural iron)
          const bodyGeo = new THREE.CylinderGeometry(1.2, 1.0, 0.3, 64);
          const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2e3035, metalness: 0.85, roughness: 0.28 });
          const body = new THREE.Mesh(bodyGeo, bodyMat);
          body.position.y = heightOffset + 1.05;
          partContainer.add(body);

          // 4 Gimbal Actuator Hydraulic Struts (polished chrome rods)
          const strutGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8);
          const strutMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, metalness: 0.98, roughness: 0.05 });
          
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const strut = new THREE.Mesh(strutGeo, strutMat);
            strut.position.set(Math.cos(angle) * 0.65, heightOffset + 0.75, Math.sin(angle) * 0.65);
            strut.rotation.z = Math.cos(angle) * 0.25;
            strut.rotation.x = -Math.sin(angle) * 0.25;
            partContainer.add(strut);
          }

          // Turbopump exhaust bleed pipe running next to nozzle
          const bleedGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
          const bleedMat = new THREE.MeshStandardMaterial({ color: 0x222225, metalness: 0.8, roughness: 0.4 });
          const bleed = new THREE.Mesh(bleedGeo, bleedMat);
          bleed.position.set(-0.55, heightOffset + 0.6, 0.4);
          bleed.rotation.z = 0.15;
          partContainer.add(bleed);

          // Stepped curved nozzle bell
          const upperBellGeo = new THREE.CylinderGeometry(0.4, 0.75, 0.4, 64);
          const upperBellMat = new THREE.MeshStandardMaterial({ color: 0x2b2c30, metalness: 0.9, roughness: 0.3 });
          const upperBell = new THREE.Mesh(upperBellGeo, upperBellMat);
          upperBell.position.y = heightOffset + 0.7;
          partContainer.add(upperBell);

          const lowerBellGeo = new THREE.CylinderGeometry(0.73, 1.2, 0.6, 64);
          const lowerBellMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.95, roughness: 0.4 });
          const lowerBell = new THREE.Mesh(lowerBellGeo, lowerBellMat);
          lowerBell.position.y = heightOffset + 0.3;
          partContainer.add(lowerBell);

          // Glowing combustion throat
          const glowGeo = new THREE.ConeGeometry(0.35, 0.3, 16);
          const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
          const glow = new THREE.Mesh(glowGeo, glowMat);
          glow.position.y = heightOffset + 0.45;
          glow.rotation.x = Math.PI;
          partContainer.add(glow);
        }

      } else if (p.decoupler || p.key === 'decoupler') {
        // Detailed Decoupler Band (machined structural casing)
        const decGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.4, 64);
        const decMat = new THREE.MeshStandardMaterial({ color: 0x34363c, metalness: 0.65, roughness: 0.35 });
        const decoupler = new THREE.Mesh(decGeo, decMat);
        decoupler.position.y = heightOffset + 0.2;
        partContainer.add(decoupler);

        // Explosive Bolt Cartridge Boxes
        const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8);
        const boltMat = new THREE.MeshStandardMaterial({ color: 0xff3355, roughness: 0.4 });
        const bracketGeo = new THREE.BoxGeometry(0.1, 0.15, 0.15);
        const bracketMat = new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: 0.5 });

        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const bracket = new THREE.Mesh(bracketGeo, bracketMat);
          bracket.position.set(Math.cos(angle) * 1.23, heightOffset + 0.2, Math.sin(angle) * 1.23);
          bracket.rotation.y = -angle;
          partContainer.add(bracket);

          const bolt = new THREE.Mesh(boltGeo, boltMat);
          bolt.position.set(Math.cos(angle) * 1.27, heightOffset + 0.2, Math.sin(angle) * 1.27);
          bolt.rotation.x = Math.PI / 2;
          bolt.rotation.y = -angle;
          partContainer.add(bolt);
        }

        // Hazard stripes on decoupler band
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12;
          const stripeGeo = new THREE.BoxGeometry(0.2, 0.3, 0.03);
          const stripeMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xffcc00 : 0x111111 });
          const stripe = new THREE.Mesh(stripeGeo, stripeMat);
          
          stripe.position.set(Math.cos(angle) * 1.235, heightOffset + 0.2, Math.sin(angle) * 1.235);
          stripe.rotation.y = -angle + Math.PI / 2;
          partContainer.add(stripe);
        }

      } else if (p.key === 'solar-panel') {
        const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x4f525c, metalness: 0.88, roughness: 0.25 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = heightOffset + 0.4;
        partContainer.add(core);

        const hingeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16);
        const hingeMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.95, roughness: 0.15 });
        const leftHinge = new THREE.Mesh(hingeGeo, hingeMat);
        leftHinge.position.set(0.15, heightOffset + 0.4, 0);
        leftHinge.rotation.z = Math.PI / 2;
        partContainer.add(leftHinge);

        const rightHinge = new THREE.Mesh(hingeGeo, hingeMat);
        rightHinge.position.set(-0.15, heightOffset + 0.4, 0);
        rightHinge.rotation.z = Math.PI / 2;
        partContainer.add(rightHinge);

        // Detailed Solar Panel Grid Plates (matte carbon support wings)
        const panelGeo = new THREE.BoxGeometry(2.2, 0.55, 0.04);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x15161a, metalness: 0.35, roughness: 0.65 });
        
        const leftWing = new THREE.Mesh(panelGeo, panelMat);
        leftWing.position.set(1.25, heightOffset + 0.4, 0);
        partContainer.add(leftWing);

        const rightWing = new THREE.Mesh(panelGeo, panelMat);
        rightWing.position.set(-1.25, heightOffset + 0.4, 0);
        partContainer.add(rightWing);

        // Thin cells grid dividers (glossy photovoltaic blue with subtle emission)
        const cellGeo = new THREE.BoxGeometry(0.48, 0.48, 0.015);
        const cellMat = new THREE.MeshStandardMaterial({ color: 0x004ad9, emissive: 0x000e33, metalness: 0.9, roughness: 0.08, transparent: true, opacity: 0.88 });
        
        for (let j = 0; j < 4; j++) {
          const cellPos = 0.35 + j * 0.52;
          const cL = new THREE.Mesh(cellGeo, cellMat);
          cL.position.set(cellPos, heightOffset + 0.4, 0.025);
          partContainer.add(cL);
          
          const cL_back = new THREE.Mesh(cellGeo, cellMat);
          cL_back.position.set(cellPos, heightOffset + 0.4, -0.025);
          partContainer.add(cL_back);

          const cR = new THREE.Mesh(cellGeo, cellMat);
          cR.position.set(-cellPos, heightOffset + 0.4, 0.025);
          partContainer.add(cR);
          
          const cR_back = new THREE.Mesh(cellGeo, cellMat);
          cR_back.position.set(-cellPos, heightOffset + 0.4, -0.025);
          partContainer.add(cR_back);
        }

      } else if (p.key === 'nose-cone') {
        // Aerodynamic Nose Cone (sharp cone + red tip)
        const coneGeo = new THREE.CylinderGeometry(0.2, 1.2, 1.8, 64);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf5f6f8, metalness: 0.2, roughness: 0.35 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = heightOffset + 0.9;
        partContainer.add(cone);

        const tipGeo = new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xe62c4b, metalness: 0.1, roughness: 0.3 });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(0, heightOffset + 1.8, 0);
        partContainer.add(tip);

        // Yellow framing stripe
        const stripeGeo = new THREE.CylinderGeometry(1.21, 1.21, 0.1, 64);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, heightOffset + 0.1, 0);
        partContainer.add(stripe);

      } else if (p.key === 'wing-fin') {
        // Aerodynamic stabilizer fin core stack
        const coreGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 64);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xdde0e5, metalness: 0.5, roughness: 0.3 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = heightOffset + 0.4;
        partContainer.add(core);

        // 3 Aerodynamic stabilizer winglets offset at 120-degree angles
        const finGeo = new THREE.BoxGeometry(0.08, 0.8, 0.8);
        const finMat = new THREE.MeshStandardMaterial({ color: 0xf5f6f8, metalness: 0.2, roughness: 0.4 });
        
        const tipGeo = new THREE.BoxGeometry(0.1, 0.15, 0.82);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xe62c4b });

        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3;
          const finGroup = new THREE.Group();
          finGroup.position.set(0, heightOffset + 0.4, 0);
          finGroup.rotation.y = -angle;

          const wing = new THREE.Mesh(finGeo, finMat);
          wing.position.set(0, 0, 1.5);
          wing.rotation.x = 0.2; // slant backwards
          finGroup.add(wing);

          const tip = new THREE.Mesh(tipGeo, tipMat);
          tip.position.set(0, 0.38, 1.55);
          tip.rotation.x = 0.2;
          finGroup.add(tip);

          partContainer.add(finGroup);
        }
      } else if (p.key === 'landing-legs') {
        // LT-2 Landing Struts (collar + 4 telescoping structural pistons + footpads)
        const collarGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.45, 64);
        const collarMat = new THREE.MeshStandardMaterial({ color: 0x2e3035, metalness: 0.7, roughness: 0.4 });
        const collar = new THREE.Mesh(collarGeo, collarMat);
        collar.position.y = heightOffset + 0.225;
        partContainer.add(collar);

        const pistonMat = new THREE.MeshStandardMaterial({ color: 0xdde0e5, metalness: 0.95, roughness: 0.1 });
        const supportMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.5, roughness: 0.3 });
        const footMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.8 });

        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const legGroup = new THREE.Group();
          legGroup.position.set(0, heightOffset + 0.2, 0);
          legGroup.rotation.y = -angle;

          const trussGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
          const truss = new THREE.Mesh(trussGeo, supportMat);
          truss.position.set(0, -0.3, 1.5);
          truss.rotation.x = -0.6;
          legGroup.add(truss);

          const pistonGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8);
          const piston = new THREE.Mesh(pistonGeo, pistonMat);
          piston.position.set(0, -0.7, 1.85);
          piston.rotation.x = -0.6;
          legGroup.add(piston);

          const footGeo = new THREE.BoxGeometry(0.35, 0.08, 0.35);
          const foot = new THREE.Mesh(footGeo, footMat);
          foot.position.set(0, -1.05, 2.1);
          legGroup.add(foot);

          partContainer.add(legGroup);
        }
      } else if (p.key === 'parachute') {
        // Mk16 Parachute (housing canister)
        const canisterGeo = new THREE.CylinderGeometry(0.3, 0.5, 0.6, 64);
        const canisterMat = new THREE.MeshStandardMaterial({ color: 0xf5f6f8, metalness: 0.2, roughness: 0.4 });
        const canister = new THREE.Mesh(canisterGeo, canisterMat);
        canister.position.y = heightOffset + 0.3;
        partContainer.add(canister);

        const capGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.1, 64);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xe62c4b, roughness: 0.3 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = heightOffset + 0.55;
        partContainer.add(cap);

        const stripeGeo = new THREE.CylinderGeometry(0.51, 0.51, 0.08, 64);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = heightOffset + 0.1;
        partContainer.add(stripe);

        // Deployed Parachute Canopy (Render in flight only, under atmosphere)
        if (spacecraft.isAssembled && !spacecraft.landedCelestialKey) {
          const speed = spacecraft.getSpeed(universe);
          const earth = universe.celestials['earth'];
          if (earth) {
            const distToEarth = spacecraft.position.distanceTo(earth.position) - earth.radius;
            if (distToEarth < 5000 && speed < 0.250) {
              const canopyGroup = new THREE.Group();
              canopyGroup.position.set(0, heightOffset + 12.0, 0);

              const domeGeo = new THREE.SphereGeometry(3.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
              const domeMat = new THREE.MeshStandardMaterial({
                color: 0xe62c4b,
                roughness: 0.7,
                side: THREE.DoubleSide
              });
              const dome = new THREE.Mesh(domeGeo, domeMat);
              dome.rotation.x = Math.PI;
              canopyGroup.add(dome);

              for (let j = 0; j < 8; j += 2) {
                const angle = (j * Math.PI * 2) / 8;
                const whiteStripeGeo = new THREE.SphereGeometry(3.55, 32, 16, angle, Math.PI * 2 / 16, 0, Math.PI / 2);
                const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
                const whiteStripe = new THREE.Mesh(whiteStripeGeo, whiteMat);
                whiteStripe.rotation.x = Math.PI;
                canopyGroup.add(whiteStripe);
              }

              const lineMat = new THREE.LineBasicMaterial({ color: 0xeeeeee });
              const lineGeo = new THREE.BufferGeometry();
              const linePoints = [];

              for (let j = 0; j < 8; j++) {
                const angle = (j * Math.PI * 2) / 8;
                const startX = Math.cos(angle) * 3.5;
                const startZ = Math.sin(angle) * 3.5;
                linePoints.push(new THREE.Vector3(startX, 0, startZ));
                linePoints.push(new THREE.Vector3(0, -11.4, 0));
              }

              lineGeo.setFromPoints(linePoints);
              const lines = new THREE.LineSegments(lineGeo, lineMat);
              canopyGroup.add(lines);

              partContainer.add(canopyGroup);

              if (typeof window !== 'undefined' && window.logFlightConsole && !window.parachuteLogged) {
                window.logFlightConsole("STAGE: Mk16 PARACHUTE DEPLOYED. RETARDATION FORCES ACTIVE.");
                window.parachuteLogged = true;
              }
            }
          }
        }
      } else if (p.type === 'utility') {
        const moduleGeo = new THREE.CylinderGeometry(1.05, 1.05, pHeight, 48);
        const moduleMat = new THREE.MeshStandardMaterial({ color: 0x30343b, metalness: 0.65, roughness: 0.35 });
        const module = new THREE.Mesh(moduleGeo, moduleMat);
        module.position.y = heightOffset + pHeight / 2;
        partContainer.add(module);

        const trimGeo = new THREE.CylinderGeometry(1.07, 1.07, 0.06, 48);
        const trimMat = new THREE.MeshStandardMaterial({ color: 0xdde0e5, metalness: 0.85, roughness: 0.18 });
        const topTrim = new THREE.Mesh(trimGeo, trimMat);
        topTrim.position.y = heightOffset + pHeight - 0.04;
        partContainer.add(topTrim);

        const bottomTrim = new THREE.Mesh(trimGeo, trimMat);
        bottomTrim.position.y = heightOffset + 0.04;
        partContainer.add(bottomTrim);

        if (p.key === 'communotron') {
          const mastGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
          const mastMat = new THREE.MeshStandardMaterial({ color: 0xe6e9ee, metalness: 0.9 });
          const mast = new THREE.Mesh(mastGeo, mastMat);
          mast.position.set(0.8, heightOffset + pHeight + 0.55, 0);
          mast.rotation.z = -0.35;
          partContainer.add(mast);
        }

        if (p.key === 'docking-port') {
          const portGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.18, 48);
          const portMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, metalness: 0.8, roughness: 0.2 });
          const port = new THREE.Mesh(portGeo, portMat);
          port.position.y = heightOffset + pHeight + 0.06;
          partContainer.add(port);
        }
      }

      partContainer.position.set(p.offsetX || 0, 0, p.offsetZ || 0);

      if (p.sourceIndex === selectedPartIndex && !spacecraft.isAssembled) {
        const markerGeo = new THREE.TorusGeometry(1.42, 0.025, 8, 64);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.y = heightOffset + pHeight / 2;
        marker.rotation.x = Math.PI / 2;
        partContainer.add(marker);
      }

      rocketGroup.add(partContainer);
      heightOffset += pHeight;
    });
  });

  // Re-add flameMesh so it persists after clear
  rocketGroup.add(flameMesh);
}

// ==========================================
// FLIGHT SIMULATOR INTERACTIVE LOGIC
// ==========================================

// Click selection for celestials
window.addEventListener('click', (e) => {
  if (e.target.closest('#vab-screen') || e.target.closest('#flight-screen .hud-side-panel') || e.target.closest('#flight-screen .hud-card')) {
    return;
  }

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersect = universe.checkTargetIntersection(raycaster, mouse, camera);

  if (intersect) {
    selectCelestialTarget(intersect.key, intersect.data);
    logFlightConsole(`Target locked: ${intersect.data.name} [Radar Class: ${intersect.data.type}]`);
  }
});

function selectCelestialTarget(key, data) {
  activeTargetKey = key;
  
  document.querySelectorAll('#teleport-list button').forEach(btn => {
    if (btn.getAttribute('data-target') === key) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.getElementById('hud-target-name').textContent = data.name.toUpperCase();
  
  // Format mass display nicely
  let formattedMass = typeof data.mass === 'number' ? data.mass.toExponential(4) + ' kg' : data.mass;
  let formattedOrbit = data.distance > 0 ? (data.distance / 1e3).toLocaleString() + ' km' : 'Central Star';
  
  document.getElementById('hud-target-details').innerHTML = `
    <span>MASS: ${formattedMass}</span>
    <span>RADIUS: ${(data.radius / 1e3).toFixed(1)} km</span>
    <span>ORBIT RAD: ${formattedOrbit}</span>
  `;
}

// Staging Spacebar trigger setup
function triggerActiveStage() {
  const result = spacecraft.triggerStage();
  logFlightConsole(result.message);
  
  if (result.success) {
    build3DRocketModel();
  }
}

window.addEventListener('keydown', (e) => {
  if (!spacecraft.isAssembled) return;

  if (e.code === 'Space') {
    triggerActiveStage();
  }
});

// Teleport travel button bindings
document.querySelectorAll('#teleport-list button').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-target');
    const targetObj = universe.celestials[key];
    
    if (targetObj) {
      selectCelestialTarget(key, targetObj);
      
      const targetWorldPos = targetObj.position.clone();
      
      // Hyperjump positioning
      spacecraft.teleportTo(targetWorldPos, targetObj.radius);
      
      // Match velocity vector and establish orbit
      const targetVel = universe.getCelestialVelocity(key);
      
      if (key === 'iss') {
        // Space Station rendezvous: place 200m away, match velocity
        const offset = new THREE.Vector3(200, 50, 200);
        spacecraft.position.copy(targetWorldPos).add(offset);
        spacecraft.velocity.copy(targetVel);
      } else if (key === 'sun') {
        // Safe orbit around Sol
        spacecraft.position.copy(targetWorldPos).add(new THREE.Vector3(0, 0, targetObj.radius * 2.5));
        const orbSpeed = Math.sqrt(targetObj.mu / (targetObj.radius * 2.5));
        spacecraft.velocity.copy(targetVel).add(new THREE.Vector3(orbSpeed, 0, 0));
      } else {
        // Orbit around planet
        const orbitRadius = targetObj.radius + Math.max(200000, targetObj.radius * 0.18);
        const orbSpeed = Math.sqrt(targetObj.mu / orbitRadius);
        
        spacecraft.position.copy(targetWorldPos).add(new THREE.Vector3(0, 0, orbitRadius));
        spacecraft.velocity.copy(targetVel).add(new THREE.Vector3(orbSpeed, 0, 0));
      }
      
      logFlightConsole(`Hyperjump to ${targetObj.name} successful. Orbit synchronized.`);
    }
  });
});

// Time warp controls (KSP-style buttons)
const WARP_LEVELS = [1, 5, 25, 100, 500, 2500, 10000, 100000];
let activeWarpIndex = 0;

function updateTimeWarpDisplay() {
  const currentWarp = WARP_LEVELS[activeWarpIndex];
  universe.timeDilation = currentWarp;
  document.getElementById('hud-dilation-val').textContent = `${currentWarp}x`;
}

document.getElementById('btn-warp-down').addEventListener('click', () => {
  if (activeWarpIndex > 0) {
    activeWarpIndex--;
    updateTimeWarpDisplay();
    logFlightConsole(`Time warp decreased to ${WARP_LEVELS[activeWarpIndex]}x`);
  }
});

document.getElementById('btn-warp-up').addEventListener('click', () => {
  if (activeWarpIndex < WARP_LEVELS.length - 1) {
    activeWarpIndex++;
    updateTimeWarpDisplay();
    logFlightConsole(`Time warp increased to ${WARP_LEVELS[activeWarpIndex]}x`);
  }
});

// Expose log function to window
window.logFlightConsole = logFlightConsole;
function logFlightConsole(msg) {
  document.getElementById('log-text').textContent = msg.toUpperCase();
}

// Window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// On-screen camera control button event listeners
document.getElementById('btn-cam-zoom-in').addEventListener('click', () => {
  flightOrbitDist = Math.max(10.0, flightOrbitDist - 8.0);
  logFlightConsole("Camera Zoom In");
});

document.getElementById('btn-cam-zoom-out').addEventListener('click', () => {
  flightOrbitDist = Math.min(250.0, flightOrbitDist + 8.0);
  logFlightConsole("Camera Zoom Out");
});

document.getElementById('btn-cam-reset').addEventListener('click', () => {
  const back = new THREE.Vector3(0, -1, 0).applyQuaternion(spacecraft.quaternion);
  flightOrbitX = Math.asin(Math.max(-0.99, Math.min(0.99, back.y))) + 0.15;
  flightOrbitY = Math.atan2(back.x, back.z);
  flightOrbitDist = 45.0;
  logFlightConsole("Camera POV Reset behind Rocket");
});

function bindHoldButton(button, onChange) {
  const activate = (e) => {
    e.preventDefault();
    onChange(true);
    button.classList.add('pressed');
  };
  const release = (e) => {
    if (e) e.preventDefault();
    onChange(false);
    button.classList.remove('pressed');
  };

  button.addEventListener('pointerdown', activate);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

document.querySelectorAll('[data-hold-key]').forEach(btn => {
  const controlKey = btn.getAttribute('data-hold-key');
  bindHoldButton(btn, (isPressed) => {
    if (spacecraft.isAssembled) {
      spacecraft.setControlKey(controlKey, isPressed);
    }
  });
});

document.getElementById('btn-touch-stage').addEventListener('click', (e) => {
  e.preventDefault();
  if (spacecraft.isAssembled) {
    triggerActiveStage();
  }
});

window.addEventListener('blur', () => {
  spacecraft.releaseAllControls();
});

// ==========================================
// RENDER & PHYSICS LOOP
// ==========================================
let lastTime = 0;

// Dynamic Trajectory Line (glowing)
let trajectoryLine = null;

function initTrajectoryLine() {
  const trajectoryGeo = new THREE.BufferGeometry();
  const maxPoints = 300;
  const positions = new Float32Array(maxPoints * 3);
  trajectoryGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const trajectoryMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  
  trajectoryLine = new THREE.Line(trajectoryGeo, trajectoryMat);
  scene.add(trajectoryLine);
}

function updateTrajectoryLine() {
  if (!trajectoryLine) return;
  
  if (!spacecraft.isAssembled || spacecraft.landedCelestialKey) {
    trajectoryLine.visible = false;
    return;
  }
  
  trajectoryLine.visible = true;
  
  const points = spacecraft.getPredictedTrajectory(universe, 300);
  const positions = trajectoryLine.geometry.attributes.position.array;
  
  for (let i = 0; i < 300; i++) {
    if (i < points.length) {
      // Offset relative to the spacecraft centered at (0, 0, 0)
      positions[i * 3] = points[i].x - spacecraft.position.x;
      positions[i * 3 + 1] = points[i].y - spacecraft.position.y;
      positions[i * 3 + 2] = points[i].z - spacecraft.position.z;
    } else {
      const lastPoint = points[points.length - 1] || spacecraft.position;
      positions[i * 3] = lastPoint.x - spacecraft.position.x;
      positions[i * 3 + 1] = lastPoint.y - spacecraft.position.y;
      positions[i * 3 + 2] = lastPoint.z - spacecraft.position.z;
    }
  }
  
  trajectoryLine.geometry.attributes.position.needsUpdate = true;
  trajectoryLine.geometry.setDrawRange(0, points.length);
}

// Exhaust flame mesh setup
const flameGeo = new THREE.ConeGeometry(0.7, 3.5, 16);
const flameMat = new THREE.MeshBasicMaterial({
  color: 0xff5500,
  transparent: true,
  opacity: 0.0,
  blending: THREE.AdditiveBlending
});
const flameMesh = new THREE.Mesh(flameGeo, flameMat);
flameMesh.rotation.x = Math.PI; // point downwards relative to rocket Y
rocketGroup.add(flameMesh);

// Exhaust smoke particles array
const smokeParticles = [];

// Camera Orbit States
let isDraggingVAB = false;
let prevMouseX = 0;
let prevMouseY = 0;
let dragButton = 0;
let prevTouchDistance = 0;

let vabOrbitY = 0.0;
let vabOrbitX = 0.15;
let vabOrbitDist = 24.0;
let vabTarget = new THREE.Vector3(0, 2.5, 0); // Camera 3D pan lookAt target

let flightOrbitY = 0.0;
let flightOrbitX = 0.2;
let flightOrbitDist = 45.0; // default 45 meters

// Disable context menu on game canvas so right click drag works perfectly
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Drag controls
canvas.addEventListener('mousedown', (e) => {
  isDraggingVAB = true;
  dragButton = e.button;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
  if (isDraggingVAB) {
    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;
    
    if (spacecraft.isAssembled) {
      flightOrbitY -= deltaX * 0.007;
      flightOrbitX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, flightOrbitX - deltaY * 0.007));
    } else {
      if (dragButton === 2 || e.shiftKey) {
        // Right-click drag or Shift-drag: Free Pan camera target along camera view plane
        const factor = vabOrbitDist * 0.0012;
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        vabTarget.addScaledVector(right, -deltaX * factor);
        vabTarget.addScaledVector(up, deltaY * factor);
        // Clamp vertical target to reasonable range
        vabTarget.y = Math.max(-15.0, Math.min(30.0, vabTarget.y));
      } else {
        // Left-click drag: Orbit camera angles
        vabOrbitY -= deltaX * 0.007;
        vabOrbitX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, vabOrbitX - deltaY * 0.007));
      }
    }
    
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  }
});

window.addEventListener('mouseup', () => {
  isDraggingVAB = false;
});

// Touch controls for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length === 1) {
    isDraggingVAB = true;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
    prevTouchDistance = 0;
  } else if (e.touches.length === 2) {
    isDraggingVAB = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    prevTouchDistance = Math.hypot(dx, dy);
  }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (isDraggingVAB || e.touches.length === 2) {
    if (e.cancelable) e.preventDefault();
  }
  if (isDraggingVAB && e.touches.length === 1) {
    const deltaX = e.touches[0].clientX - prevMouseX;
    const deltaY = e.touches[0].clientY - prevMouseY;
    
    if (spacecraft.isAssembled) {
      flightOrbitY -= deltaX * 0.007;
      flightOrbitX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, flightOrbitX - deltaY * 0.007));
    } else {
      vabOrbitY -= deltaX * 0.007;
      vabOrbitX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, vabOrbitX - deltaY * 0.007));
    }
    
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const touchDistance = Math.hypot(dx, dy);
    
    if (prevTouchDistance > 0) {
      const zoomDelta = prevTouchDistance - touchDistance;
      if (spacecraft.isAssembled) {
        flightOrbitDist = Math.max(10.0, Math.min(250.0, flightOrbitDist + zoomDelta * 0.25));
      } else {
        vabOrbitDist = Math.max(14.0, Math.min(42.0, vabOrbitDist + zoomDelta * 0.045));
      }
    }
    
    prevTouchDistance = touchDistance;
  }
}, { passive: false });

window.addEventListener('touchend', () => {
  isDraggingVAB = false;
  prevTouchDistance = 0;
});

// Scroll Zoom & Height Pan
window.addEventListener('wheel', (e) => {
  if (spacecraft.isAssembled) {
    flightOrbitDist = Math.max(10.0, Math.min(250.0, flightOrbitDist + e.deltaY * 0.08));
  } else {
    if (e.shiftKey) {
      // Shift + Scroll: Pan VAB camera lookAt height
      vabTarget.y = Math.max(-15.0, Math.min(30.0, vabTarget.y + e.deltaY * 0.015));
      if (e.cancelable) e.preventDefault();
    } else {
      // Scroll only: Zoom camera distance
      vabOrbitDist = Math.max(14.0, Math.min(42.0, vabOrbitDist + e.deltaY * 0.015));
    }
  }
}, { passive: false });

function spawnSmoke() {
  const smokeGeo = new THREE.SphereGeometry(0.5, 8, 8);
  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0x6e6e73,
    transparent: true,
    opacity: 0.35
  });
  const mesh = new THREE.Mesh(smokeGeo, smokeMat);
  
  // Nozzle exit position relative to origin (0,0,0)
  const baseOffset = new THREE.Vector3(0, -totalHeightCompiled(spacecraft) / 2 - 1.2, 0).applyQuaternion(rocketGroup.quaternion);
  mesh.position.copy(rocketGroup.position).add(baseOffset);
  
  // Blast backwards relative to rocket attitude
  const drift = new THREE.Vector3(
    (Math.random() - 0.5) * 1.5,
    -12.0 + (Math.random() - 0.5) * 3.0,
    (Math.random() - 0.5) * 1.5
  ).applyQuaternion(rocketGroup.quaternion);
  
  scene.add(mesh);
  smokeParticles.push({
    mesh: mesh,
    velocity: drift,
    age: 0,
    maxAge: 1.4
  });
}

function spawnExplosionParticles(pos) {
  const pCount = 100;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);
  const pVelocities = [];
  
  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = pos.x + (Math.random() - 0.5) * 5;
    pPositions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 5;
    pPositions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 5;
    
    pVelocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50
    ));
  }
  
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xff3c00,
    size: 3.5,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });
  
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);
  
  let age = 0;
  function updateExplosion() {
    age += 0.016;
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] += pVelocities[i].x * 0.016;
      positions[i * 3 + 1] += pVelocities[i].y * 0.016;
      positions[i * 3 + 2] += pVelocities[i].z * 0.016;
      pVelocities[i].multiplyScalar(0.95); // drag slowing particles
    }
    particles.geometry.attributes.position.needsUpdate = true;
    pMat.opacity = 1.0 - (age / 1.6);
    
    if (age < 1.6) {
      requestAnimationFrame(updateExplosion);
    } else {
      scene.remove(particles);
      particles.geometry.dispose();
      pMat.dispose();
    }
  }
  updateExplosion();
}

function triggerCrashSequence(crashSpeed) {
  spacecraft.isAssembled = false;
  for (let k in spacecraft.keys) {
    spacecraft.keys[k] = false;
  }

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(100, 5, 10, 0.88)';
  overlay.style.color = 'white';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '100000';
  overlay.style.fontFamily = "'Orbitron', sans-serif";
  overlay.style.backdropFilter = 'blur(12px)';
  overlay.style.transition = 'opacity 0.5s ease';
  
  overlay.innerHTML = `
    <h1 style="font-size: 3rem; color: #ff3355; margin-bottom: 20px; letter-spacing: 4px; text-shadow: 0 0 25px rgba(255,0,0,0.6); font-weight: 900;">MISSION FAILURE</h1>
    <p style="font-size: 1.4rem; letter-spacing: 2px; text-transform: uppercase;">Spacecraft Disintegrated on Impact</p>
    <p style="font-size: 1.1rem; color: #ccc; margin-top: 10px;">Impact Velocity: ${crashSpeed.toFixed(3)} km/s (Structural Limit: 0.800 km/s)</p>
    <p style="font-size: 0.9rem; color: #888; margin-top: 40px; text-transform: uppercase; letter-spacing: 1px;">Reverting flight telemetry to VAB...</p>
  `;
  document.body.appendChild(overlay);

  // Spawn explosion at coordinate center where rocket exploded
  spawnExplosionParticles(new THREE.Vector3(0, 0, 0));

  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(overlay);
      document.getElementById('btn-return-vab').click();
    }, 500);
  }, 3800);
}

function animate(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  const clampedDt = Math.min(dt, 0.1);

  if (spacecraft.isAssembled) {
    vabHangar.visible = false;

    // Camera Keyboard Controls Update
    const camRotSpeed = 1.8;
    const camZoomSpeed = 80.0;
    
    if (cameraKeys.ArrowLeft) flightOrbitY -= camRotSpeed * clampedDt;
    if (cameraKeys.ArrowRight) flightOrbitY += camRotSpeed * clampedDt;
    
    if (cameraKeys.ArrowUp) flightOrbitX = Math.min(Math.PI / 2.2, flightOrbitX + camRotSpeed * clampedDt);
    if (cameraKeys.ArrowDown) flightOrbitX = Math.max(-Math.PI / 2.2, flightOrbitX - camRotSpeed * clampedDt);
    
    if (cameraKeys.BracketLeft) flightOrbitDist = Math.max(10.0, flightOrbitDist - camZoomSpeed * clampedDt);
    if (cameraKeys.BracketRight) flightOrbitDist = Math.min(250.0, flightOrbitDist + camZoomSpeed * clampedDt);

    // Flight physics & coordinates update
    spacecraft.update(clampedDt, universe);
    universe.update(clampedDt);

    // Verify if rocket crashed
    if (spacecraft.hasCrashed) {
      const cSpd = spacecraft.crashSpeed;
      spacecraft.hasCrashed = false;
      triggerCrashSequence(cSpd);
      return;
    }

    // Verify if rocket landed
    if (spacecraft.justLanded) {
      spacecraft.justLanded = false;
      const cel = universe.celestials[spacecraft.landedCelestialKey];
      logFlightConsole(`Touchdown Successful! Landed on ${cel.name}.`);
      
      // Align upright to normal
      const celPos = cel.position;
      const normal = new THREE.Vector3().subVectors(spacecraft.position, celPos).normalize();
      const currentUp = new THREE.Vector3(0, 1, 0).applyQuaternion(spacecraft.quaternion);
      const alignQuat = new THREE.Quaternion().setFromUnitVectors(currentUp, normal);
      spacecraft.quaternion.premultiply(alignQuat);
    }

    // Floating origin mesh updates
    rocketGroup.position.set(0, 0, 0);
    rocketGroup.quaternion.copy(spacecraft.quaternion);

    const altitudeInfo = getAltitudeAboveSurface();
    const nearestKey = altitudeInfo.key;
    const altitude = altitudeInfo.altitude;
    const cel = universe.celestials[nearestKey];

    // Orbit Camera position (aligned with nearest planet horizon for SFS-style launch view)
    // Normal vector pointing straight up from planet center to rocket
    const localNormal = new THREE.Vector3().copy(cel.mesh.position).normalize().negate();
    const horizonQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), localNormal);

    const localOffset = new THREE.Vector3(
      Math.sin(flightOrbitY) * Math.cos(flightOrbitX) * flightOrbitDist,
      Math.sin(flightOrbitX) * flightOrbitDist,
      Math.cos(flightOrbitY) * Math.cos(flightOrbitX) * flightOrbitDist
    );

    camera.position.copy(localOffset).applyQuaternion(horizonQuat);
    camera.up.copy(new THREE.Vector3(0, 1, 0)).applyQuaternion(horizonQuat);
    camera.lookAt(0, 0, 0);

    // Starfield centered at camera to appear infinite
    starfield.position.copy(camera.position);

    // Translate all celestial meshes relative to spacecraft position
    for (let key in universe.celestials) {
      const cel = universe.celestials[key];
      cel.mesh.visible = true;
      const relPos = new THREE.Vector3().subVectors(cel.position, spacecraft.position);
      cel.mesh.position.copy(relPos);
    }

    // Atmosphere scattering & local surface structures (SFS-Style)

    const ATMOSPHERES = {
      earth: { color: 0x5fa3fc, height: 75000, maxFog: 0.0035 },
      mars: { color: 0xb05535, height: 50000, maxFog: 0.0028 },
      venus: { color: 0xd9ab56, height: 65000, maxFog: 0.005 }
    };

    if (nearestKey in ATMOSPHERES && altitude < ATMOSPHERES[nearestKey].height) {
      const atm = ATMOSPHERES[nearestKey];
      const t = altitude / atm.height;
      const skyIntensity = Math.max(0, 1.0 - t);
      const skyColor = new THREE.Color(atm.color).multiplyScalar(skyIntensity);

      scene.background = skyColor;
      if (scene.fog) {
        scene.fog.color.copy(skyColor);
        scene.fog.density = atm.maxFog * (1.0 - t) + 0.00000000005 * t;
      }
      starMat.opacity = 0.58 * t;
    } else {
      scene.background = new THREE.Color(0x020108);
      if (scene.fog) {
        scene.fog.color.set(0x020108);
        scene.fog.density = 0.00000000005;
      }
      starMat.opacity = 0.58;
    }

    if (altitude < 35000) {
      localSurfaceGroup.visible = true;

      if (terrainMesh) {
        if (nearestKey === 'earth') terrainMesh.material.color.setHex(0x223c1e);
        else if (nearestKey === 'mars') terrainMesh.material.color.setHex(0x943d23);
        else if (nearestKey === 'venus') terrainMesh.material.color.setHex(0x8a7238);
        else terrainMesh.material.color.setHex(0x3a3b3d);
      }

      // Mobile Terrain under rocket
      const toCraft = new THREE.Vector3().subVectors(spacecraft.position, cel.position).normalize();
      const relPlanetCenter = new THREE.Vector3().subVectors(cel.position, spacecraft.position);
      localTerrainGroup.position.copy(relPlanetCenter).addScaledVector(toCraft, cel.radius);
      
      const alignQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), toCraft);
      localTerrainGroup.quaternion.copy(alignQuat);

      // Fixed Launch Pad tower and platform
      if (spacecraft.lastLandedCelestialKey === nearestKey) {
        const currentLong = spacecraft.lastLandedLongOffset + cel.mesh.rotation.y;
        const padNormal = new THREE.Vector3(
          Math.sin(spacecraft.lastLandedLat) * Math.cos(currentLong),
          Math.cos(spacecraft.lastLandedLat),
          Math.sin(spacecraft.lastLandedLat) * Math.sin(currentLong)
        );

        const relPadPos = new THREE.Vector3().copy(relPlanetCenter).addScaledVector(padNormal, cel.radius);
        
        if (relPadPos.length() < 12000) {
          localPadGroup.visible = true;
          localPadGroup.position.copy(relPadPos);
          
          const padQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), padNormal);
          localPadGroup.quaternion.copy(padQuat);

          // Blink warning beacon at top of tower
          if (gantry && gantry.children.length > 0) {
            const beaconMesh = gantry.children[gantry.children.length - 1];
            if (beaconMesh && beaconMesh.material) {
              beaconMesh.material.color.setHex((Math.floor(timestamp * 0.002) % 2 === 0) ? 0xff0000 : 0x220000);
            }
          }
        } else {
          localPadGroup.visible = false;
        }
      } else {
        localPadGroup.visible = false;
      }
    } else {
      localSurfaceGroup.visible = false;
    }

    // Trajectory rendering
    updateTrajectoryLine();

    // Engine exhaust flames
    if (spacecraft.thrustSetting > 0.05 && spacecraft.getPropellantMass() > 0) {
      flameMesh.visible = true;
      flameMesh.position.y = -totalHeightCompiled(spacecraft) / 2 - 1.2;
      
      const wobble = 1.0 + Math.sin(timestamp * 0.05) * 0.12;
      flameMesh.scale.set(wobble * spacecraft.thrustSetting, wobble * spacecraft.thrustSetting, wobble * spacecraft.thrustSetting);
      flameMesh.material.opacity = 0.5 + Math.random() * 0.4;
      
      if (Math.random() < 0.45) {
        spawnSmoke();
      }
    } else {
      flameMesh.visible = false;
    }

    // Exhaust smoke drift
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const p = smokeParticles[i];
      p.age += clampedDt;
      p.mesh.position.addScaledVector(p.velocity, clampedDt);
      p.mesh.scale.addScalar(0.045 * clampedDt * universe.timeDilation);
      
      p.mesh.material.opacity = 0.35 * (1.0 - p.age / p.maxAge);

      if (p.age >= p.maxAge) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        smokeParticles.splice(i, 1);
      }
    }

    // UI Telemetry updates
    document.getElementById('hud-velocity').textContent = spacecraft.getSpeed(universe).toFixed(3);
    const altitudeValue = altitudeInfo.altitude >= 1000 ? altitudeInfo.altitude / 1000 : altitudeInfo.altitude;
    document.getElementById('hud-altitude').textContent = altitudeValue.toFixed(altitudeInfo.altitude >= 1000 ? 1 : 0);
    document.getElementById('hud-altitude-unit').textContent = altitudeInfo.altitude >= 1000 ? 'km' : 'm';
    
    const propellantRatio = spacecraft.getPropellantRatio() * 100;
    document.getElementById('propellant-bar').style.width = `${propellantRatio}%`;
    document.getElementById('hud-propellant-pct').textContent = Math.round(propellantRatio);
    document.getElementById('hud-propellant-mass').textContent = `${spacecraft.getPropellantMass().toFixed(1)}t`;

    const thrustPct = Math.round(spacecraft.thrustSetting * 100);
    document.getElementById('thrust-bar').style.width = `${thrustPct}%`;
    document.getElementById('hud-thrust-pct').textContent = thrustPct;

    document.getElementById('hud-active-stage').textContent = spacecraft.activeStage;

    const damp = document.getElementById('hud-dampeners');
    if (spacecraft.dampenersActive) {
      damp.textContent = "ACTIVE";
      damp.className = "damp-active";
    } else {
      damp.textContent = "DISABLED";
      damp.className = "damp-inactive";
    }
  } else {
    // VAB Design Phase
    vabHangar.visible = true;
    flameMesh.visible = false;
    if (trajectoryLine) trajectoryLine.visible = false;

    // Hide surface elements in VAB design mode
    localSurfaceGroup.visible = false;
    scene.background = new THREE.Color(0x020108);
    if (scene.fog) {
      scene.fog.color.set(0x020108);
      scene.fog.density = 0.00000000005;
    }
    starMat.opacity = 0.58;

    // Hide all celestial meshes in VAB
    for (let key in universe.celestials) {
      universe.celestials[key].mesh.visible = false;
    }

    while (smokeParticles.length > 0) {
      const p = smokeParticles.pop();
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }

    universe.update(clampedDt * 0.1);
    
    rocketGroup.position.set(0, 0, 0);
    
    if (!isDraggingVAB) {
      rocketGroup.rotation.y += 0.005;
    }
    
    camera.position.x = Math.sin(vabOrbitY) * Math.cos(vabOrbitX) * vabOrbitDist + vabTarget.x;
    camera.position.z = Math.cos(vabOrbitY) * Math.cos(vabOrbitX) * vabOrbitDist + vabTarget.z;
    camera.position.y = Math.sin(vabOrbitX) * vabOrbitDist + vabTarget.y;
    camera.lookAt(vabTarget);
  }

  // Update headlight position to follow the camera POV
  if (typeof headlight !== 'undefined') {
    headlight.position.copy(camera.position);
  }

  composer.render();
  requestAnimationFrame(animate);
}

function getPartHeight(p) {
  if (p.solid) {
    if (p.key === 'flea-srb') return 2.0;
    if (p.key === 'hammer-srb') return 2.8;
    if (p.key === 'thumper-srb') return 4.0;
    if (p.key === 'kickback-srb') return 5.6;
    return 3.0;
  }
  if (p.key === 'jumbo-64') return 5.0;
  if (p.key === 'x200-32') return 4.0;
  if (p.key === 'x200-16') return 2.6;
  if (p.key === 'fl-t100') return 1.0;
  if (p.key === 'fl-t200') return 1.4;
  if (p.key === 'oscar-b') return 0.8;
  if (p.key === 'mk2-fuselage') return 2.8;
  if (p.type === 'command') return 2.0;
  if (p.type === 'tank') return (p.key === 'fl-t800' ? 4.0 : (p.key === 'rcs-tank' ? 2.0 : 2.0));
  if (p.type === 'propulsion') {
    if (p.key === 'poodle-150') return 1.0;
    if (p.key === 'nerv-nuclear') return 2.5;
    if (p.key === 'lvt45-engine') return 1.2;
    if (p.key === 'spark-engine' || p.key === 'juno-engine') return 0.8;
    if (p.key === 'terrier-engine') return 1.0;
    if (p.key === 'rhino-engine') return 1.8;
    return 1.2; // Mainsail/Ion
  }
  if (p.decoupler || p.key === 'decoupler') return 0.4;
  if (p.key === 'nose-cone') return 2.0;
  if (p.key === 'wing-fin') return 0.8;
  if (p.key === 'landing-legs') return 0.5;
  if (p.key === 'parachute') return 0.6;
  return 0.8; // solar panels etc.
}

function totalHeightCompiled(sc) {
  let height = 0;
  sc.compiledStages.forEach(stage => {
    stage.forEach(p => {
      height += getPartHeight(p);
    });
  });
  return height;
}

function getAltitudeAboveSurface() {
  let nearestAltitude = Infinity;
  let nearestKey = 'earth';

  for (let key in universe.celestials) {
    const cel = universe.celestials[key];
    if (key === 'iss') continue;
    const altitude = spacecraft.position.distanceTo(cel.position) - cel.radius;
    if (altitude < nearestAltitude) {
      nearestAltitude = altitude;
      nearestKey = key;
    }
  }

  return { altitude: Math.max(0, nearestAltitude), key: nearestKey };
}

// Initialize components
initTrajectoryLine();
updateTimeWarpDisplay();
build3DRocketModel();
updateVABInterface();

requestAnimationFrame(animate);
