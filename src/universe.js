import * as THREE from 'three';

// Atmospheric Rayleigh Scattering Halo Shaders
const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main() {
      // Limb darkening intensity
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
      gl_FragColor = vec4(0.1, 0.55, 1.0, 1.0) * intensity;
    }
  `
};

// Procedural Earth Surface Shader
const EarthShader = {
  uniforms: {
    time: { value: 0 },
    sunDir: { value: new THREE.Vector3(1, 0, 0) }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 sunDir;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 fp = fract(p);
      float a = rand(ip);
      float b = rand(ip + vec2(1.0, 0.0));
      float c = rand(ip + vec2(0.0, 1.0));
      float d = rand(ip + vec2(1.0, 1.0));
      vec2 u = fp*fp*(3.0-2.0*fp);
      return mix(a, b, u.x) + (c - a)*u.y*(1.0-u.x) + (d - b)*u.x*u.y;
    }
    
    void main() {
      // Multi-octave fractional brownian noise
      float n = noise(vUv * 16.0) * 0.5 + noise(vUv * 32.0) * 0.25;
      float clouds = noise(vUv * 24.0 + vec2(time * 0.015, time * 0.005)) * 0.4 + noise(vUv * 48.0 - vec2(time * 0.01)) * 0.15;
      
      // Determine base terrain type
      vec3 terrainColor;
      if (n < 0.47) {
        terrainColor = vec3(0.02, 0.18, 0.55); // Deep Blue Ocean
      } else if (n < 0.50) {
        terrainColor = vec3(0.8, 0.72, 0.55);  // Beige sandy coast
      } else {
        terrainColor = mix(vec3(0.08, 0.42, 0.12), vec3(0.12, 0.28, 0.08), n); // Green/Dark-Green forests
      }
      
      // Render clouds overlay
      if (clouds > 0.22) {
        terrainColor = mix(terrainColor, vec3(0.95, 0.95, 0.98), (clouds - 0.22) * 2.0);
      }
      
      // Dynamic solar diffuse shading
      float diffuse = max(0.08, dot(vNormal, sunDir));
      gl_FragColor = vec4(terrainColor * diffuse, 1.0);
    }
  `
};

// Procedural Mars Surface Shader
const MarsShader = {
  vertexShader: EarthShader.vertexShader,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 fp = fract(p);
      float a = rand(ip);
      float b = rand(ip + vec2(1.0, 0.0));
      float c = rand(ip + vec2(0.0, 1.0));
      float d = rand(ip + vec2(1.0, 1.0));
      vec2 u = fp*fp*(3.0-2.0*fp);
      return mix(a, b, u.x) + (c - a)*u.y*(1.0-u.x) + (d - b)*u.x*u.y;
    }
    
    void main() {
      float n = noise(vUv * 15.0) * 0.6 + noise(vUv * 30.0) * 0.3;
      
      // Rusty Mars hues
      vec3 marsColor = mix(vec3(0.85, 0.25, 0.08), vec3(0.5, 0.15, 0.05), n);
      
      // Add small polar white cap visual at top UVs
      if (vUv.y > 0.92) {
        marsColor = mix(marsColor, vec3(0.95, 0.95, 0.98), (vUv.y - 0.92) * 12.0);
      } else if (vUv.y < 0.08) {
        marsColor = mix(marsColor, vec3(0.95, 0.95, 0.98), (0.08 - vUv.y) * 12.0);
      }
      
      float diffuse = max(0.1, dot(vNormal, vec3(1.0, 0.4, 0.2)));
      gl_FragColor = vec4(marsColor * diffuse, 1.0);
    }
  `
};

function seededNoise(x, y, seed = 1) {
  return Math.abs(Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453) % 1;
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function createPlanetTexture(width, height, palette, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const seed = options.seed || 1;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const n =
        seededNoise(Math.floor(u * 18), Math.floor(v * 9), seed) * 0.55 +
        seededNoise(Math.floor(u * 42), Math.floor(v * 21), seed + 2) * 0.3 +
        seededNoise(Math.floor(u * 96), Math.floor(v * 48), seed + 5) * 0.15;

      let color = palette[0];
      if (options.ocean && n < options.ocean) color = palette[0];
      else if (options.ocean && n < options.ocean + 0.035) color = palette[1];
      else color = palette[Math.min(palette.length - 1, Math.floor(n * palette.length))];

      if (options.poles) {
        const polar = Math.max(0, Math.abs(v - 0.5) * 2 - options.poles.start) / (1 - options.poles.start);
        if (polar > 0) color = lerpColor(color, options.poles.color, Math.min(1, polar * options.poles.strength));
      }

      if (options.bands) {
        const band = (Math.sin(v * Math.PI * options.bands.count + n * options.bands.noise) + 1) * 0.5;
        color = lerpColor(color, options.bands.color, band * options.bands.strength);
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createSunTexture() {
  return createPlanetTexture(1024, 512, [0xff6a00, 0xffb000, 0xffdd55, 0xffffff], {
    seed: 91,
    bands: { count: 18, noise: 10, color: 0xff3300, strength: 0.38 }
  });
}

function createCloudTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const n =
        seededNoise(Math.floor(u * 32), Math.floor(v * 16), 333) * 0.5 +
        seededNoise(Math.floor(u * 76), Math.floor(v * 38), 335) * 0.35 +
        seededNoise(Math.floor(u * 140), Math.floor(v * 70), 337) * 0.15;
      const alpha = Math.max(0, (n - 0.48) * 2.4);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.62, alpha)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function addAtmosphereShell(mesh, color, scale = 1.025, opacity = 0.32) {
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(scale, 48, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
  );
  mesh.add(glow);
  return glow;
}

export class StellarUniverse {
  constructor(scene) {
    this.scene = scene;
    this.celestials = {};
    this.time = 0;
    this.timeDilation = 1.0; // multiplier (e.g. 1x to 100000x)
    this.G = 6.6743e-11;     // Real Newtonian constant
    
    this.initSystems();
  }

  initSystems() {
    // Shared unit sphere geometry
    const unitGeo = new THREE.SphereGeometry(1, 32, 32);

    // 1. SUN (α-Centauri Core / Sol)
    // Radius: 696,340 km = 6.9634e8 m, Mass: 1.989e30 kg
    const sunMat = new THREE.MeshBasicMaterial({ map: createSunTexture(), color: 0xfff1a0 });
    const sunMesh = new THREE.Mesh(unitGeo, sunMat);
    sunMesh.scale.setScalar(6.9634e8);
    this.scene.add(sunMesh);
    addAtmosphereShell(sunMesh, 0xffaa22, 1.08, 0.5);

    // Dynamic point light source centered at Sun (decay 0 = infinite range)
    // Attached as child of sunMesh so it follows the Sun's relative position in the floating origin system
    const sunLight = new THREE.PointLight(0xffffff, 1.35, 0, 0);
    sunMesh.add(sunLight);

    this.celestials['sun'] = {
      key: 'sun',
      mesh: sunMesh,
      name: 'Sol (Sun)',
      type: 'Star',
      mass: 1.989e30,
      mu: this.G * 1.989e30,
      radius: 6.9634e8,
      distance: 0,
      angle: 0,
      orbitPeriod: 0,
      rotationSpeed: 2.7e-6,
      position: new THREE.Vector3(0, 0, 0)
    };

    // Helper: Add orbits as children of the Sun
    const createOrbitRing = (dist) => {
      const points = [];
      const segments = 256;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * dist, 0, Math.sin(theta) * dist));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x00a0ff,
        transparent: true,
        opacity: 0.12
      });
      return new THREE.LineLoop(ringGeo, ringMat);
    };

    // 2. MERCURY
    // Radius: 2,439.7 km = 2.4397e6 m, Mass: 3.3011e23 kg, Orbit: 5.7909e10 m
    const mercMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(512, 256, [0x4c4b49, 0x6f6d69, 0x8a8780, 0x2f3031], {
        seed: 11,
        poles: { start: 0.9, color: 0x777777, strength: 0.2 }
      }),
      roughness: 0.98
    });
    const mercMesh = new THREE.Mesh(unitGeo, mercMat);
    mercMesh.scale.setScalar(2.4397e6);
    this.scene.add(mercMesh);
    sunMesh.add(createOrbitRing(5.7909e10));

    this.celestials['mercury'] = {
      key: 'mercury',
      mesh: mercMesh,
      name: 'Mercury',
      type: 'Terrestrial Planet',
      mass: 3.3011e23,
      mu: this.G * 3.3011e23,
      radius: 2.4397e6,
      distance: 5.7909e10,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 88 * 24 * 3600,
      rotationSpeed: 1.24e-6,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // 3. VENUS
    // Radius: 6,051.8 km = 6.0518e6 m, Mass: 4.8675e24 kg, Orbit: 1.0821e11 m
    const venusMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(512, 256, [0xc68f49, 0xe3bd75, 0xf2d89a, 0x9d6d37], {
        seed: 22,
        bands: { count: 14, noise: 7, color: 0xffffff, strength: 0.18 }
      }),
      roughness: 0.9
    });
    const venusMesh = new THREE.Mesh(unitGeo, venusMat);
    venusMesh.scale.setScalar(6.0518e6);
    this.scene.add(venusMesh);
    addAtmosphereShell(venusMesh, 0xf4c475, 1.035, 0.22);
    sunMesh.add(createOrbitRing(1.0821e11));

    this.celestials['venus'] = {
      key: 'venus',
      mesh: venusMesh,
      name: 'Venus',
      type: 'Terrestrial Planet',
      mass: 4.8675e24,
      mu: this.G * 4.8675e24,
      radius: 6.0518e6,
      distance: 1.0821e11,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 224.7 * 24 * 3600,
      rotationSpeed: -2.99e-7,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // 4. EARTH (Oceans, Continents, Clouds + Rayleigh Scattering Atmosphere)
    // Radius: 6,371 km = 6.371e6 m, Mass: 5.9722e24 kg, Orbit: 1.496e11 m
    this.earthShaderMat = null;
    const earthMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(1024, 512, [0x123f8c, 0xe3d2a4, 0x2f8f45, 0x145923, 0xffffff], {
        seed: 33,
        ocean: 0.52,
        poles: { start: 0.78, color: 0xffffff, strength: 0.9 }
      }),
      roughness: 0.86,
      metalness: 0.0
    });
    const earthMesh = new THREE.Mesh(unitGeo, earthMat);
    earthMesh.scale.setScalar(6.371e6);
    this.scene.add(earthMesh);
    sunMesh.add(createOrbitRing(1.496e11));

    // Earth Rayleigh Scattering Atmosphere Shell (120 km thick)
    const atmGeo = new THREE.SphereGeometry(1.025, 32, 32);
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: AtmosphereShader.vertexShader,
      fragmentShader: AtmosphereShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    earthMesh.add(atmosphere);

    const cloudShell = new THREE.Mesh(
      new THREE.SphereGeometry(1.018, 48, 32),
      new THREE.MeshStandardMaterial({
        map: createCloudTexture(),
        transparent: true,
        opacity: 0.46,
        depthWrite: false
      })
    );
    earthMesh.add(cloudShell);

    this.celestials['earth'] = {
      key: 'earth',
      mesh: earthMesh,
      name: 'Earth (Reality)',
      type: 'Habitable Planet',
      mass: 5.9722e24,
      mu: this.G * 5.9722e24,
      radius: 6.371e6,
      distance: 1.496e11,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 365.25 * 24 * 3600,
      rotationSpeed: 7.2921e-5,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // 5. MOON
    // Radius: 1,737.4 km = 1.7374e6 m, Mass: 7.3477e22 kg, Orbit: 3.844e8 m from Earth
    const moonMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(512, 256, [0x8f8f8b, 0xb8b8b2, 0xd0d0c8, 0x5f5f5c], {
        seed: 44,
        poles: { start: 0.96, color: 0xd8d8d8, strength: 0.12 }
      }),
      roughness: 0.98
    });
    const moonMesh = new THREE.Mesh(unitGeo, moonMat);
    moonMesh.scale.setScalar(1.7374e6);
    this.scene.add(moonMesh);
    earthMesh.add(createOrbitRing(3.844e8));

    this.celestials['moon'] = {
      key: 'moon',
      mesh: moonMesh,
      name: 'The Moon',
      type: 'Celestial Satellite',
      mass: 7.3477e22,
      mu: this.G * 7.3477e22,
      radius: 1.7374e6,
      distance: 3.844e8,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 27.3 * 24 * 3600,
      rotationSpeed: 2.66e-6,
      parent: 'earth',
      position: new THREE.Vector3()
    };

    // 6. ISS-HORIZON (Space Station orbiting Earth)
    // Mass: 450,000 kg, Altitude: 400 km = Orbit radius 6.771e6 m
    const issGroup = new THREE.Group();
    
    // Core Modules
    const habGeo = new THREE.CylinderGeometry(4, 4, 30, 8);
    const habMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const coreHab = new THREE.Mesh(habGeo, habMat);
    coreHab.rotation.z = Math.PI / 2;
    issGroup.add(coreHab);

    const labGeo = new THREE.CylinderGeometry(3.5, 3.5, 20, 8);
    const lab = new THREE.Mesh(labGeo, habMat);
    issGroup.add(lab);

    // Support Truss Structure
    const trussGeo = new THREE.CylinderGeometry(1.2, 1.2, 70, 4);
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 });
    const truss = new THREE.Mesh(trussGeo, trussMat);
    truss.rotation.x = Math.PI / 2;
    issGroup.add(truss);

    // Massive Glowing Solar Panels
    const panelGeo = new THREE.BoxGeometry(0.3, 15, 60);
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x0077ff, side: THREE.DoubleSide });
    
    const panelLeft = new THREE.Mesh(panelGeo, panelMat);
    panelLeft.position.set(0, 0, 36);
    panelLeft.rotation.y = 0.5;
    issGroup.add(panelLeft);

    const panelRight = new THREE.Mesh(panelGeo, panelMat);
    panelRight.position.set(0, 0, -36);
    panelRight.rotation.y = 0.5;
    issGroup.add(panelRight);

    this.scene.add(issGroup);
    earthMesh.add(createOrbitRing(6.771e6));

    this.celestials['iss'] = {
      key: 'iss',
      mesh: issGroup,
      name: 'ISS-Horizon',
      type: 'Modular Space Station',
      mass: 450000,
      mu: 0,
      radius: 100, // Safe bounding radius
      distance: 6.771e6,
      angle: 0,
      orbitPeriod: 5568,
      rotationSpeed: 0.001,
      parent: 'earth',
      position: new THREE.Vector3()
    };

    // 7. MARS
    // Radius: 3,389.5 km = 3.3895e6 m, Mass: 6.4171e23 kg, Orbit: 2.2794e11 m
    const marsMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(1024, 512, [0x6e2e1c, 0xa84f2b, 0xc8753f, 0x3f241c], {
        seed: 66,
        poles: { start: 0.84, color: 0xf2eadb, strength: 0.75 }
      }),
      roughness: 0.94
    });
    const marsMesh = new THREE.Mesh(unitGeo, marsMat);
    marsMesh.scale.setScalar(3.3895e6);
    this.scene.add(marsMesh);
    sunMesh.add(createOrbitRing(2.2794e11));

    this.celestials['mars'] = {
      key: 'mars',
      mesh: marsMesh,
      name: 'Mars',
      type: 'Red Planet',
      mass: 6.4171e23,
      mu: this.G * 6.4171e23,
      radius: 3.3895e6,
      distance: 2.2794e11,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 687 * 24 * 3600,
      rotationSpeed: 7.088e-5,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // 8. JUPITER (Gas Giant)
    // Radius: 69,911 km = 6.9911e7 m, Mass: 1.8982e27 kg, Orbit: 7.7855e11 m
    const jupMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(1024, 512, [0x8b5f42, 0xc99a6b, 0xf1d3a6, 0x6b4333], {
        seed: 77,
        bands: { count: 28, noise: 14, color: 0xffffff, strength: 0.35 }
      }),
      roughness: 0.72
    });
    const jupMesh = new THREE.Mesh(unitGeo, jupMat);
    jupMesh.scale.setScalar(6.9911e7);
    this.scene.add(jupMesh);
    const stormGeo = new THREE.SphereGeometry(1.01, 32, 16);
    const stormMat = new THREE.MeshBasicMaterial({ color: 0xb7472a, transparent: true, opacity: 0.55 });
    const greatRedSpot = new THREE.Mesh(stormGeo, stormMat);
    greatRedSpot.scale.set(0.18, 0.08, 0.02);
    greatRedSpot.position.set(0.82, -0.22, 0.48);
    jupMesh.add(greatRedSpot);
    sunMesh.add(createOrbitRing(7.7855e11));

    this.celestials['jupiter'] = {
      key: 'jupiter',
      mesh: jupMesh,
      name: 'Jupiter',
      type: 'Gas Giant',
      mass: 1.8982e27,
      mu: this.G * 1.8982e27,
      radius: 6.9911e7,
      distance: 7.7855e11,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 11.86 * 365.25 * 24 * 3600,
      rotationSpeed: 1.76e-4,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // 9. SATURN (Gas Giant with Rings)
    // Radius: 58,232 km = 5.8232e7 m, Mass: 5.6834e26 kg, Orbit: 1.4335e12 m
    const satMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(1024, 512, [0xb69b68, 0xd9c895, 0xf1e1af, 0x8f7650], {
        seed: 88,
        bands: { count: 34, noise: 8, color: 0xffffff, strength: 0.22 }
      }),
      roughness: 0.8
    });
    const satMesh = new THREE.Mesh(unitGeo, satMat);
    satMesh.scale.setScalar(5.8232e7);
    this.scene.add(satMesh);
    sunMesh.add(createOrbitRing(1.4335e12));

    // Saturn's Rings
    const ringGeo = new THREE.RingGeometry(1.4, 2.5, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xaba085,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 0.9
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 2.3;
    satMesh.add(rings);

    this.celestials['saturn'] = {
      key: 'saturn',
      mesh: satMesh,
      name: 'Saturn',
      type: 'Ringed Gas Giant',
      mass: 5.6834e26,
      mu: this.G * 5.6834e26,
      radius: 5.8232e7,
      distance: 1.4335e12,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 29.45 * 365.25 * 24 * 3600,
      rotationSpeed: 1.64e-4,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // 10. URANUS (Ice Giant with faint rings)
    // Radius: 25,362 km = 2.5362e7 m, Mass: 8.681e25 kg, Orbit: 2.8710e12 m
    const uranMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(1024, 512, [0xb4e1e3, 0x98cfd1, 0x82bec2, 0x5a9a9e], {
        seed: 99,
        bands: { count: 8, noise: 3, color: 0xffffff, strength: 0.08 }
      }),
      roughness: 0.78
    });
    const uranMesh = new THREE.Mesh(unitGeo, uranMat);
    uranMesh.scale.setScalar(2.5362e7);
    this.scene.add(uranMesh);
    addAtmosphereShell(uranMesh, 0xd0f5f7, 1.025, 0.15);
    sunMesh.add(createOrbitRing(2.8710e12));

    // Uranus faint rings (tilted on its side!)
    const uranRingGeo = new THREE.RingGeometry(1.5, 2.0, 64);
    const uranRingMat = new THREE.MeshStandardMaterial({
      color: 0x8ecad6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
      roughness: 0.95
    });
    const uranRings = new THREE.Mesh(uranRingGeo, uranRingMat);
    uranRings.rotation.x = Math.PI / 12; // tilted roll axis
    uranRings.rotation.y = Math.PI / 2.1;
    uranMesh.add(uranRings);

    this.celestials['uranus'] = {
      key: 'uranus',
      mesh: uranMesh,
      name: 'Uranus',
      type: 'Ice Giant',
      mass: 8.681e25,
      mu: this.G * 8.681e25,
      radius: 2.5362e7,
      distance: 2.8710e12,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 84.01 * 365.25 * 24 * 3600,
      rotationSpeed: -1.04e-4,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // 11. NEPTUNE (Ice Giant)
    // Radius: 24,622 km = 2.4622e7 m, Mass: 1.024e26 kg, Orbit: 4.4983e12 m
    const neptMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(1024, 512, [0x274687, 0x3d63b8, 0x1f3972, 0x4f7fe8], {
        seed: 111,
        bands: { count: 12, noise: 5, color: 0x001144, strength: 0.15 }
      }),
      roughness: 0.75
    });
    const neptMesh = new THREE.Mesh(unitGeo, neptMat);
    neptMesh.scale.setScalar(2.4622e7);
    this.scene.add(neptMesh);
    addAtmosphereShell(neptMesh, 0x5a8eff, 1.025, 0.18);
    sunMesh.add(createOrbitRing(4.4983e12));

    this.celestials['neptune'] = {
      key: 'neptune',
      mesh: neptMesh,
      name: 'Neptune',
      type: 'Ice Giant',
      mass: 1.024e26,
      mu: this.G * 1.024e26,
      radius: 2.4622e7,
      distance: 4.4983e12,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 164.82 * 365.25 * 24 * 3600,
      rotationSpeed: 1.08e-4,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // 12. PLUTO (Dwarf Planet)
    // Radius: 1,188.3 km = 1.1883e6 m, Mass: 1.303e22 kg, Orbit: 5.9064e12 m
    const plutMat = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(512, 256, [0x7a6b58, 0x9c8a75, 0xbfac95, 0x544738], {
        seed: 122,
        poles: { start: 0.88, color: 0xffffff, strength: 0.5 }
      }),
      roughness: 0.95
    });
    const plutMesh = new THREE.Mesh(unitGeo, plutMat);
    plutMesh.scale.setScalar(1.1883e6);
    this.scene.add(plutMesh);
    sunMesh.add(createOrbitRing(5.9064e12));

    this.celestials['pluto'] = {
      key: 'pluto',
      mesh: plutMesh,
      name: 'Pluto',
      type: 'Dwarf Planet',
      mass: 1.303e22,
      mu: this.G * 1.303e22,
      radius: 1.1883e6,
      distance: 5.9064e12,
      angle: Math.random() * Math.PI * 2,
      orbitPeriod: 248.0 * 365.25 * 24 * 3600,
      rotationSpeed: -1.22e-5,
      parent: 'sun',
      position: new THREE.Vector3()
    };

    // Initialize all celestial coordinate vectors
    this.update(0);
  }

  /**
   * Analytical Kepler equations to position objects
   */
  update(dt) {
    this.time += dt * this.timeDilation;

    // 1. Update Earth time uniform for moving clouds
    if (this.earthShaderMat) {
      this.earthShaderMat.uniforms.time.value = this.time;
    }

    // 2. Solve absolute orbital positions
    for (let key in this.celestials) {
      const cel = this.celestials[key];
      
      if (key === 'sun') {
        cel.position.set(0, 0, 0);
      } else if (cel.orbitPeriod > 0) {
        const omega = (2 * Math.PI) / cel.orbitPeriod;
        cel.angle += omega * dt * this.timeDilation;

        if (cel.parent === 'sun') {
          cel.position.set(
            Math.cos(cel.angle) * cel.distance,
            0,
            Math.sin(cel.angle) * cel.distance
          );
        } else if (cel.parent) {
          const parentCel = this.celestials[cel.parent];
          const localX = Math.cos(cel.angle) * cel.distance;
          const localZ = Math.sin(cel.angle) * cel.distance;
          cel.position.set(
            parentCel.position.x + localX,
            parentCel.position.y,
            parentCel.position.z + localZ
          );
        }
      }

      // Spin celestial bodies
      if (cel.rotationSpeed) {
        cel.mesh.rotation.y += cel.rotationSpeed * dt * this.timeDilation;
      }
    }

    // 3. Update Earth shader light uniforms pointing relative to the Sun (0, 0, 0)
    if (this.earthShaderMat && this.celestials['earth']) {
      const dirToSun = new THREE.Vector3().copy(this.celestials['earth'].position).multiplyScalar(-1).normalize();
      this.earthShaderMat.uniforms.sunDir.value.copy(dirToSun);
    }
  }

  getCelestialPositionAtTime(key, timeOffset) {
    const cel = this.celestials[key];
    if (!cel) return new THREE.Vector3();

    if (key === 'sun') {
      return new THREE.Vector3(0, 0, 0);
    }

    const omega = (2 * Math.PI) / cel.orbitPeriod;
    const futureAngle = cel.angle + omega * timeOffset;
    const pos = new THREE.Vector3();

    if (cel.parent === 'sun') {
      pos.set(
        Math.cos(futureAngle) * cel.distance,
        0,
        Math.sin(futureAngle) * cel.distance
      );
    } else if (cel.parent) {
      const parentPos = this.getCelestialPositionAtTime(cel.parent, timeOffset);
      pos.set(
        parentPos.x + Math.cos(futureAngle) * cel.distance,
        parentPos.y,
        parentPos.z + Math.sin(futureAngle) * cel.distance
      );
    }
    return pos;
  }

  getCelestialVelocity(key) {
    const cel = this.celestials[key];
    if (!cel) return new THREE.Vector3();

    if (key === 'sun') {
      return new THREE.Vector3(0, 0, 0);
    }

    const omega = (2 * Math.PI) / cel.orbitPeriod;
    const vel = new THREE.Vector3();

    if (cel.parent === 'sun') {
      vel.set(
        -cel.distance * omega * Math.sin(cel.angle),
        0,
        cel.distance * omega * Math.cos(cel.angle)
      );
    } else if (cel.parent) {
      const parentVel = this.getCelestialVelocity(cel.parent);
      vel.set(
        parentVel.x - cel.distance * omega * Math.sin(cel.angle),
        0,
        parentVel.z + cel.distance * omega * Math.cos(cel.angle)
      );
    }
    return vel;
  }

  checkTargetIntersection(raycaster, mouse, camera) {
    const intersects = [];
    for (let key in this.celestials) {
      const obj = this.celestials[key];
      const intersect = raycaster.intersectObject(obj.mesh, true);
      if (intersect.length > 0) {
        intersects.push({
          key: key,
          distance: intersect[0].distance,
          data: obj
        });
      }
    }

    if (intersects.length > 0) {
      intersects.sort((a, b) => a.distance - b.distance);
      return intersects[0];
    }
    return null;
  }
}
