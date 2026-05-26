import * as THREE from 'three';

export const PART_LIBRARY = {
  'mk1-pod': { name: 'Mk1 Command Pod', type: 'command', mass: 0.8, dryMass: 0.8, fuel: 0, thrust: 0, isp: 0 },
  'mk1-lander-can': { name: 'Mk1 Lander Can', type: 'command', mass: 0.6, dryMass: 0.6, fuel: 0, thrust: 0, isp: 0 },
  'mk1-3-pod': { name: 'Mk1-3 Command Pod', type: 'command', mass: 2.6, dryMass: 2.6, fuel: 0, thrust: 0, isp: 0 },
  'mk3-bridge': { name: 'Mk3 Flight Bridge', type: 'command', mass: 3.5, dryMass: 3.5, fuel: 0, thrust: 0, isp: 0 },
  'probe-core': { name: 'Probodobodyne OKTO', type: 'command', mass: 0.1, dryMass: 0.1, fuel: 0, thrust: 0, isp: 0 },
  'hecs-core': { name: 'HECS Probe Core', type: 'command', mass: 0.2, dryMass: 0.2, fuel: 0, thrust: 0, isp: 0 },
  'reaction-wheel': { name: 'Advanced Reaction Wheel', type: 'utility', mass: 0.2, dryMass: 0.2, fuel: 0, thrust: 0, isp: 0 },
  'battery-z400': { name: 'Z-400 Battery Bank', type: 'utility', mass: 0.02, dryMass: 0.02, fuel: 0, thrust: 0, isp: 0 },
  'service-bay': { name: 'Service Bay', type: 'utility', mass: 0.15, dryMass: 0.15, fuel: 0, thrust: 0, isp: 0 },
  'science-jr': { name: 'SC-9001 Science Jr.', type: 'utility', mass: 0.2, dryMass: 0.2, fuel: 0, thrust: 0, isp: 0 },
  'communotron': { name: 'Communotron 16 Antenna', type: 'utility', mass: 0.005, dryMass: 0.005, fuel: 0, thrust: 0, isp: 0 },
  'fl-t400': { name: 'FL-T400 Tank', type: 'tank', mass: 4.5, dryMass: 0.5, fuel: 4.0, thrust: 0, isp: 0 },
  'fl-t100': { name: 'FL-T100 Tank', type: 'tank', mass: 1.125, dryMass: 0.125, fuel: 1.0, thrust: 0, isp: 0 },
  'fl-t200': { name: 'FL-T200 Tank', type: 'tank', mass: 2.25, dryMass: 0.25, fuel: 2.0, thrust: 0, isp: 0 },
  'fl-t800': { name: 'FL-T800 Tank', type: 'tank', mass: 9.0, dryMass: 1.0, fuel: 8.0, thrust: 0, isp: 0 },
  'x200-16': { name: 'Rockomax X200-16', type: 'tank', mass: 9.0, dryMass: 1.0, fuel: 8.0, thrust: 0, isp: 0 },
  'x200-32': { name: 'Rockomax X200-32', type: 'tank', mass: 18.0, dryMass: 2.0, fuel: 16.0, thrust: 0, isp: 0 },
  'jumbo-64': { name: 'Jumbo-64 Orange Tank', type: 'tank', mass: 36.0, dryMass: 4.0, fuel: 32.0, thrust: 0, isp: 0 },
  'xenon-tank': { name: 'Xenon Container', type: 'tank', mass: 0.9, dryMass: 0.1, fuel: 0.8, thrust: 0, isp: 0 },
  'rcs-tank': { name: 'FL-R25 Monoprop Tank', type: 'tank', mass: 2.0, dryMass: 0.4, fuel: 1.6, thrust: 0, isp: 0 },
  'oscar-b': { name: 'Oscar-B Fuel Tank', type: 'tank', mass: 0.225, dryMass: 0.025, fuel: 0.2, thrust: 0, isp: 0 },
  'mk2-fuselage': { name: 'Mk2 Liquid Fuel Fuselage', type: 'tank', mass: 4.5, dryMass: 0.7, fuel: 3.8, thrust: 0, isp: 0 },
  'srb-500': { name: 'SRB-500 Booster', type: 'propulsion', mass: 4.0, dryMass: 0.5, fuel: 3.5, thrust: 250, isp: 250, solid: true },
  'flea-srb': { name: 'RT-5 Flea Booster', type: 'propulsion', mass: 1.5, dryMass: 0.25, fuel: 1.25, thrust: 160, isp: 165, solid: true },
  'hammer-srb': { name: 'RT-10 Hammer Booster', type: 'propulsion', mass: 3.5, dryMass: 0.5, fuel: 3.0, thrust: 227, isp: 195, solid: true },
  'thumper-srb': { name: 'BACC Thumper Booster', type: 'propulsion', mass: 7.6, dryMass: 1.1, fuel: 6.5, thrust: 315, isp: 210, solid: true },
  'kickback-srb': { name: 'S1 Kickback Booster', type: 'propulsion', mass: 21.8, dryMass: 3.0, fuel: 18.8, thrust: 670, isp: 220, solid: true },
  'mainsail-900': { name: 'Mainsail Engine', type: 'propulsion', mass: 2.0, dryMass: 2.0, fuel: 0, thrust: 400, isp: 320, liquid: true },
  'reliant-engine': { name: 'LV-T30 Reliant Engine', type: 'propulsion', mass: 1.25, dryMass: 1.25, fuel: 0, thrust: 215, isp: 310, liquid: true },
  'swivel-engine': { name: 'LV-T45 Swivel Engine', type: 'propulsion', mass: 1.5, dryMass: 1.5, fuel: 0, thrust: 200, isp: 320, liquid: true },
  'terrier-engine': { name: 'LV-909 Terrier Engine', type: 'propulsion', mass: 0.5, dryMass: 0.5, fuel: 0, thrust: 60, isp: 345, liquid: true },
  'spark-engine': { name: '48-7S Spark Engine', type: 'propulsion', mass: 0.1, dryMass: 0.1, fuel: 0, thrust: 20, isp: 320, liquid: true },
  'skipper-engine': { name: 'RE-I5 Skipper Engine', type: 'propulsion', mass: 3.0, dryMass: 3.0, fuel: 0, thrust: 650, isp: 320, liquid: true },
  'vector-engine': { name: 'S3 KS-25 Vector Engine', type: 'propulsion', mass: 4.0, dryMass: 4.0, fuel: 0, thrust: 1000, isp: 315, liquid: true },
  'rhino-engine': { name: 'Kerbodyne Rhino Engine', type: 'propulsion', mass: 9.0, dryMass: 9.0, fuel: 0, thrust: 2000, isp: 340, liquid: true },
  'poodle-150': { name: 'RE-L4 Poodle Engine', type: 'propulsion', mass: 1.75, dryMass: 1.75, fuel: 0, thrust: 220, isp: 350, liquid: true },
  'lvt45-engine': { name: 'LV-T45 Liquid Engine', type: 'propulsion', mass: 1.2, dryMass: 1.2, fuel: 0, thrust: 200, isp: 320, liquid: true },
  'nerv-nuclear': { name: 'LV-N Nerv Nuclear Engine', type: 'propulsion', mass: 3.0, dryMass: 3.0, fuel: 0, thrust: 75, isp: 800, liquid: true },
  'xenon-50': { name: 'Ion Thruster', type: 'propulsion', mass: 0.5, dryMass: 0.5, fuel: 0, thrust: 15, isp: 4200, ion: true },
  'rapier-engine': { name: 'CR-7 R.A.P.I.E.R. Engine', type: 'propulsion', mass: 2.0, dryMass: 2.0, fuel: 0, thrust: 360, isp: 305, liquid: true },
  'juno-engine': { name: 'J-20 Juno Jet Engine', type: 'propulsion', mass: 0.25, dryMass: 0.25, fuel: 0, thrust: 20, isp: 800, liquid: true },
  'solar-panel': { name: 'Solar Panels', type: 'utility', mass: 0.1, dryMass: 0.1, fuel: 0, thrust: 0, isp: 0 },
  'decoupler': { name: 'Stack Decoupler', type: 'utility', mass: 0.2, dryMass: 0.2, fuel: 0, thrust: 0, isp: 0, decoupler: true },
  'separator': { name: 'TR-18A Stack Separator', type: 'utility', mass: 0.3, dryMass: 0.3, fuel: 0, thrust: 0, isp: 0, decoupler: true },
  'radial-decoupler': { name: 'TT-38K Radial Decoupler', type: 'utility', mass: 0.05, dryMass: 0.05, fuel: 0, thrust: 0, isp: 0, decoupler: true },
  'nose-cone': { name: 'Aerodynamic Nose Cone', type: 'utility', mass: 0.08, dryMass: 0.08, fuel: 0, thrust: 0, isp: 0 },
  'fairing': { name: 'AE-FF1 Protective Fairing', type: 'utility', mass: 0.35, dryMass: 0.35, fuel: 0, thrust: 0, isp: 0 },
  'heat-shield': { name: 'Heat Shield', type: 'utility', mass: 0.3, dryMass: 0.3, fuel: 0, thrust: 0, isp: 0 },
  'wing-fin': { name: 'AV-R8 Aerodynamic Fin', type: 'utility', mass: 0.1, dryMass: 0.1, fuel: 0, thrust: 0, isp: 0 },
  'landing-legs': { name: 'LT-2 Landing Struts', type: 'utility', mass: 0.25, dryMass: 0.25, fuel: 0, thrust: 0, isp: 0 },
  'parachute': { name: 'Mk16 Parachute', type: 'utility', mass: 0.1, dryMass: 0.1, fuel: 0, thrust: 0, isp: 0, parachute: true },
  'docking-port': { name: 'Clamp-O-Tron Docking Port', type: 'utility', mass: 0.05, dryMass: 0.05, fuel: 0, thrust: 0, isp: 0 },
  'rcs-block': { name: 'RV-105 RCS Thruster Block', type: 'utility', mass: 0.05, dryMass: 0.05, fuel: 0, thrust: 0, isp: 0 },
  'strut-connector': { name: 'EAS-4 Strut Connector', type: 'utility', mass: 0.02, dryMass: 0.02, fuel: 0, thrust: 0, isp: 0 }
};

/**
 * ModularRocket - Dynamic KSP Vehicle Assembler & Real-Scale Physics Engine
 */
export class ModularRocket {
  constructor(camera) {
    this.camera = camera;
    
    // Design-time parts stack
    this.parts = [];
    this.partOffsets = [];
    
    // Flight-time SI coordinate variables (meters, m/s)
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.rotationSpeed = new THREE.Vector3();
    this.thrustSetting = 0.0;
    this.dampenersActive = true; // On by default (SAS) to stabilize controls!
    this.activeStage = 0;
    this.isAssembled = false;

    // Staging and landed flags
    this.compiledStages = [];
    this.landedCelestialKey = null;
    this.landedLat = 0;
    this.landedLongOffset = 0;
    this.justLanded = false;
    this.hasCrashed = false;
    this.crashSpeed = 0;
    
    this.keys = {
      w: false, s: false, // Pitch
      a: false, d: false, // Yaw
      q: false, e: false, // Roll
      i: false, k: false, // Thrust +/-
      shift: false, control: false // KSP standard throttle +/- keys
    };

    this.setupListeners();
    this.loadDefaultAssembly();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) {
        this.keys[key] = true;
      }
      if (key === 'h' || key === 't') {
        this.dampenersActive = !this.dampenersActive;
      }
      if (key === 'z') {
        this.thrustSetting = 1.0;
      }
      if (key === 'x') {
        this.thrustSetting = 0.0;
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) {
        this.keys[key] = false;
      }
    });
  }

  loadDefaultAssembly() {
    this.parts = [];
    this.partOffsets = [];
    this.compileSpecs();
  }

  addPart(partKey) {
    if (PART_LIBRARY[partKey]) {
      this.parts.push(partKey);
      this.partOffsets.push({ x: 0, z: 0 });
      this.compileSpecs();
    }
  }

  clearAssembly() {
    this.parts = [];
    this.partOffsets = [];
    this.compileSpecs();
  }

  setParts(partKeys) {
    this.parts = [...partKeys];
    this.partOffsets = this.parts.map(() => ({ x: 0, z: 0 }));
    this.compileSpecs();
  }

  movePart(index, direction) {
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || index >= this.parts.length || nextIndex >= this.parts.length) {
      return index;
    }

    [this.parts[index], this.parts[nextIndex]] = [this.parts[nextIndex], this.parts[index]];
    [this.partOffsets[index], this.partOffsets[nextIndex]] = [this.partOffsets[nextIndex], this.partOffsets[index]];
    this.compileSpecs();
    return nextIndex;
  }

  nudgePart(index, axis, amount) {
    if (index < 0 || index >= this.parts.length) return;
    if (!this.partOffsets[index]) this.partOffsets[index] = { x: 0, z: 0 };
    this.partOffsets[index][axis] = Math.max(-2.5, Math.min(2.5, this.partOffsets[index][axis] + amount));
    this.compileSpecs();
  }

  setControlKey(key, isPressed) {
    if (key in this.keys) {
      this.keys[key] = isPressed;
    }
  }

  releaseAllControls() {
    Object.keys(this.keys).forEach(key => {
      this.keys[key] = false;
    });
  }

  compileSpecs() {
    this.compiledStages = [];
    
    if (this.parts.length === 0) {
      this.wetMass = 0;
      this.dryMass = 0;
      this.maxThrust = 0;
      this.deltaV = 0;
      return;
    }

    let stageParts = [];

    for (let i = 0; i < this.parts.length; i++) {
      const partKey = this.parts[i];
      const part = PART_LIBRARY[partKey];
      
      stageParts.push({
        sourceIndex: i,
        offsetX: this.partOffsets[i]?.x || 0,
        offsetZ: this.partOffsets[i]?.z || 0,
        key: partKey,
        ...part,
        activeFuel: part.fuel
      });

      if (part.decoupler && i < this.parts.length - 1) {
        this.compiledStages.push(stageParts);
        stageParts = [];
      }
    }
    
    if (stageParts.length > 0) {
      this.compiledStages.push(stageParts);
    }

    this.compiledStages.reverse();
    this.activeStage = this.compiledStages.length - 1;

    this.recalculateTotalMasses();
  }

  recalculateTotalMasses() {
    let wetTotal = 0;
    let dryTotal = 0;
    let thrustTotal = 0;
    let calculatedDeltaV = 0;

    for (let s = 0; s < this.compiledStages.length; s++) {
      const stage = this.compiledStages[s];
      let stageWet = 0;
      let stageDry = 0;
      let stageThrust = 0;
      let stageIsp = 0;
      let engineCount = 0;

      stage.forEach(p => {
        stageWet += p.dryMass + p.activeFuel;
        stageDry += p.dryMass;
        if (p.thrust > 0) {
          stageThrust += p.thrust;
          stageIsp += p.isp;
          engineCount++;
        }
      });

      wetTotal += stageWet;
      dryTotal += stageDry;

      if (s === this.activeStage) {
        thrustTotal = stageThrust;
      }

      if (stageThrust > 0 && stageWet > stageDry) {
        const avgIsp = stageIsp / engineCount;
        calculatedDeltaV += avgIsp * 9.81 * Math.log(stageWet / stageDry);
      }
    }

    this.wetMass = wetTotal;
    this.dryMass = dryTotal;
    this.maxThrust = thrustTotal;
    this.deltaV = calculatedDeltaV;
  }

  triggerStage() {
    if (this.activeStage > 0) {
      const droppedStage = this.compiledStages.pop();
      this.activeStage = this.compiledStages.length - 1;
      this.thrustSetting = 0.0;
      this.recalculateTotalMasses();
      return {
        success: true,
        message: `STAGING SEQUENCE INITIATED: Detached stage. ${droppedStage.length} parts dropped.`
      };
    }
    return {
      success: false,
      message: "WARNING: No decouplers remaining in assembly."
    };
  }

  resetToEarthOrbit(universe) {
    const earth = universe.celestials['earth'];
    const earthPos = earth.position;
    const earthVel = universe.getCelestialVelocity('earth');
    
    // Circular starting orbit 300 km above Earth surface
    const leoRadius = earth.radius + 300000;
    this.position.copy(earthPos).add(new THREE.Vector3(0, 0, leoRadius));
    
    const leoSpeed = Math.sqrt(earth.mu / leoRadius);
    this.velocity.copy(earthVel).add(new THREE.Vector3(leoSpeed, 0, 0));
    
    this.thrustSetting = 0.0;
    this.landedCelestialKey = null;
    this.justLanded = false;
    this.hasCrashed = false;
    
    // Reset camera look direction to point along orbital velocity (+X)
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.position.clone().add(new THREE.Vector3(100, 0, 0)));
  }

  resetToEarthSurface(universe) {
    const earth = universe.celestials['earth'];
    const earthPos = earth.position;
    
    this.thrustSetting = 0.0;
    this.landedCelestialKey = 'earth';
    this.landedLat = Math.PI / 2; // equator
    this.landedLongOffset = 0;
    this.justLanded = false;
    this.hasCrashed = false;

    // Set position to surface point
    const r = earth.radius + 0.45;
    const currentLong = this.landedLongOffset + earth.mesh.rotation.y;
    const relX = r * Math.sin(this.landedLat) * Math.cos(currentLong);
    const relY = r * Math.cos(this.landedLat);
    const relZ = r * Math.sin(this.landedLat) * Math.sin(currentLong);
    
    this.position.set(earthPos.x + relX, earthPos.y + relY, earthPos.z + relZ);
    
    const earthVel = universe.getCelestialVelocity('earth');
    const rPerp = r * Math.sin(this.landedLat);
    const rotSpeedVec = new THREE.Vector3(
      -rPerp * earth.rotationSpeed * Math.sin(currentLong),
      0,
      rPerp * earth.rotationSpeed * Math.cos(currentLong)
    );
    this.velocity.copy(earthVel).add(rotSpeedVec);

    // Point upright normal to surface
    const normal = new THREE.Vector3(relX, relY, relZ).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    this.quaternion.setFromUnitVectors(up, normal);
  }

  teleportTo(targetPosition, targetRadius) {
    this.thrustSetting = 0.0;
    this.velocity.set(0, 0, 0);
    this.landedCelestialKey = null;
    this.justLanded = false;
    this.hasCrashed = false;

    // Offset spacecraft relative to target body (e.g. 15% above surface)
    const orbitRadius = targetRadius + Math.max(150000, targetRadius * 0.15);
    this.position.copy(targetPosition).add(new THREE.Vector3(0, 0, orbitRadius));
  }

  update(dt, universe) {
    if (!universe) return;

    // Flight attitude rotation controls
    const turnAccel = 2.0;
    const maxRotSpeed = 1.2;

    if (this.keys.w) this.rotationSpeed.x = Math.max(-maxRotSpeed, this.rotationSpeed.x - turnAccel * dt);
    else if (this.keys.s) this.rotationSpeed.x = Math.min(maxRotSpeed, this.rotationSpeed.x + turnAccel * dt);
    else if (this.dampenersActive) this.rotationSpeed.x *= 0.85;

    if (this.keys.a) this.rotationSpeed.y = Math.min(maxRotSpeed, this.rotationSpeed.y + turnAccel * dt);
    else if (this.keys.d) this.rotationSpeed.y = Math.max(-maxRotSpeed, this.rotationSpeed.y - turnAccel * dt);
    else if (this.dampenersActive) this.rotationSpeed.y *= 0.85;

    if (this.keys.q) this.rotationSpeed.z = Math.min(maxRotSpeed, this.rotationSpeed.z + turnAccel * dt);
    else if (this.keys.e) this.rotationSpeed.z = Math.max(-maxRotSpeed, this.rotationSpeed.z - turnAccel * dt);
    else if (this.dampenersActive) this.rotationSpeed.z *= 0.85;

    const localPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.rotationSpeed.x * dt);
    const localYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationSpeed.y * dt);
    const localRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.rotationSpeed.z * dt);
    
    this.quaternion.multiply(localPitch);
    this.quaternion.multiply(localYaw);
    this.quaternion.multiply(localRoll);

    // Throttle controls
    const throttleSpeed = 0.5;
    if (this.keys.i || this.keys.shift) this.thrustSetting = Math.min(1.0, this.thrustSetting + throttleSpeed * dt);
    if (this.keys.k || this.keys.control) this.thrustSetting = Math.max(0.0, this.thrustSetting - throttleSpeed * dt);

    // If landed, lock coordinate systems to the rotating surface
    if (this.landedCelestialKey) {
      const cel = universe.celestials[this.landedCelestialKey];
      const celPos = cel.position;
      
      const currentLong = this.landedLongOffset + cel.mesh.rotation.y;
      
      // Normal offset from center of planet
      const r = cel.radius + 0.45;
      const relX = r * Math.sin(this.landedLat) * Math.cos(currentLong);
      const relY = r * Math.cos(this.landedLat);
      const relZ = r * Math.sin(this.landedLat) * Math.sin(currentLong);
      
      this.position.set(celPos.x + relX, celPos.y + relY, celPos.z + relZ);
      
      // Surface velocity = orbital velocity of body + rotational speed of landing point
      const celVel = universe.getCelestialVelocity(this.landedCelestialKey);
      const rPerp = r * Math.sin(this.landedLat);
      const rotSpeedVec = new THREE.Vector3(
        -rPerp * cel.rotationSpeed * Math.sin(currentLong),
        0,
        rPerp * cel.rotationSpeed * Math.cos(currentLong)
      );
      this.velocity.copy(celVel).add(rotSpeedVec);
      
      // Gravity on surface
      const G = 6.6743e-11;
      const g = (G * cel.mass) / (r * r);
      const gravityForce = this.wetMass * g;

      // Calculate total thrust force from active stage
      let activeStageParts = this.compiledStages[this.activeStage];
      let totalThrustForce = 0;
      if (activeStageParts) {
        activeStageParts.forEach(p => {
          if (p.thrust > 0) {
            if (p.solid) {
              if (p.activeFuel > 0) totalThrustForce += p.thrust;
            } else {
              totalThrustForce += p.thrust * this.thrustSetting;
            }
          }
        });
      }

      // Check liftoff: thrust must exceed gravity force (TWR > 1.0)
      if (totalThrustForce > gravityForce + 1.0) {
        const normal = new THREE.Vector3(relX, relY, relZ).normalize();
        this.position.addScaledVector(normal, 3.0); // pop upwards
        this.velocity.addScaledVector(normal, 10.0); // initial lift speed
        
        this.landedCelestialKey = null;
        if (typeof window !== 'undefined' && window.logFlightConsole) {
          const twr = totalThrustForce / gravityForce;
          window.logFlightConsole(`LIFTOFF! TWR: ${twr.toFixed(2)}. ESCAPING ${cel.name.toUpperCase()}.`);
        }
      } else if (this.thrustSetting > 0.05) {
        if (typeof window !== 'undefined' && window.logFlightConsole && Math.random() < 0.05) {
          const twr = totalThrustForce / Math.max(0.1, gravityForce);
          window.logFlightConsole(`THRUST INSIGNIFICANT. TWR: ${twr.toFixed(2)} < 1.0.`);
        }
      }
      this.syncCamera();
      return;
    }

    // Precise physics substepping solver for numerical stability
    const totalTime = dt * universe.timeDilation;
    const maxSubstep = 0.05;
    let remainingTime = totalTime;

    while (remainingTime > 0) {
      const stepDt = Math.min(remainingTime, maxSubstep);
      remainingTime -= stepDt;
      this.integratePhysics(stepDt, universe);
    }
    
    this.syncCamera();
  }

  integratePhysics(stepDt, universe) {
    if (this.hasCrashed || this.landedCelestialKey) return;

    let activeStageParts = this.compiledStages[this.activeStage];
    let totalThrustForce = 0;

    if (activeStageParts) {
      let availableFuel = 0;
      let engines = [];

      activeStageParts.forEach(p => {
        if (p.type === 'tank' && p.activeFuel > 0) {
          availableFuel += p.activeFuel;
        }
        if (p.thrust > 0) {
          if (p.solid) {
            if (p.activeFuel > 0) {
              availableFuel += p.activeFuel;
              engines.push(p);
            }
          } else {
            engines.push(p);
          }
        }
      });

      if (availableFuel > 0 && engines.length > 0 && this.thrustSetting > 0) {
        engines.forEach(eng => {
          const engThrust = eng.solid ? eng.thrust : eng.thrust * this.thrustSetting;
          totalThrustForce += engThrust;

          const burnRate = engThrust / (eng.isp * 9.81);
          const fuelBurnt = burnRate * stepDt;

          let fuelToBurn = fuelBurnt;
          if (eng.solid) {
            const taken = Math.min(eng.activeFuel, fuelToBurn);
            eng.activeFuel -= taken;
            fuelToBurn -= taken;
          } else {
            for (let p of activeStageParts) {
              if (p.type === 'tank' && p.activeFuel > 0) {
                const taken = Math.min(p.activeFuel, fuelToBurn);
                p.activeFuel -= taken;
                fuelToBurn -= taken;
                if (fuelToBurn <= 0) break;
              }
            }
          }
        });
        this.recalculateTotalMasses();
      }
    }

    // F = m * a -> a = F / m
    const thrustAccel = new THREE.Vector3();
    if (totalThrustForce > 0 && this.wetMass > 0) {
      const forward = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
      const accelMag = totalThrustForce / this.wetMass;
      thrustAccel.addScaledVector(forward, accelMag);
    }

    // Atmospheric Drag calculation (especially for re-entry and parachutes)
    const dragAccel = new THREE.Vector3();
    const earth = universe.celestials['earth'];
    if (earth && this.wetMass > 0) {
      const distToEarth = this.position.distanceTo(earth.position);
      const alt = distToEarth - earth.radius;
      if (alt < 80000) { // 80 km atmosphere depth
        const density = Math.exp(-alt / 8500.0); // exponential decay
        const earthVel = universe.getCelestialVelocity('earth');
        // Relative velocity to Earth
        const relVel = new THREE.Vector3().subVectors(this.velocity, earthVel);
        const relSpeed = relVel.length();
        if (relSpeed > 0.1) {
          // If parachute is on the spacecraft, and altitude < 5000m, and speed < 250m/s, apply massive parachute drag
          const hasParachute = this.parts.includes('parachute');
          const isParachuteDeployed = hasParachute && alt < 5000 && relSpeed < 250;
          const dragCoeff = isParachuteDeployed ? 45.0 : 0.2;
          
          // Drag force = 0.5 * rho * v^2 * Cd * Area (scale to spacecraft mass)
          const dragForceMag = 0.5 * density * relSpeed * relSpeed * dragCoeff * 0.15;
          const dragAccMag = Math.min(250.0, dragForceMag / this.wetMass); // clamp max deceleration
          dragAccel.addScaledVector(relVel.normalize().negate(), dragAccMag);
        }
      }
    }

    // Gravity calculation: G * M_cel / d^2
    const gravityAccel = new THREE.Vector3();
    const G = 6.6743e-11;

    for (let key in universe.celestials) {
      const cel = universe.celestials[key];
      if (key === 'iss') continue;

      const toCel = new THREE.Vector3().subVectors(cel.position, this.position);
      const distSq = toCel.lengthSq();
      const dist = Math.sqrt(distSq);

      if (dist > 0.1) {
        const accelMag = (G * cel.mass) / distSq;
        gravityAccel.addScaledVector(toCel.normalize(), accelMag);
      }
    }

    const totalAccel = new THREE.Vector3().add(thrustAccel).add(gravityAccel).add(dragAccel);
    this.velocity.addScaledVector(totalAccel, stepDt);

    // Dampen angular velocity for SAS, but do not dampen linear orbital velocity in vacuum

    this.position.addScaledVector(this.velocity, stepDt);

    // Spherical Proximity Collision Checks
    for (let key in universe.celestials) {
      const cel = universe.celestials[key];
      if (key === 'iss') continue;

      const toCel = new THREE.Vector3().subVectors(cel.position, this.position);
      const dist = toCel.length();

      if (dist < cel.radius) {
        const celVel = universe.getCelestialVelocity(key);
        
        // Surface rotational velocity calculation
        const r = cel.radius;
        const toCraft = toCel.clone().multiplyScalar(-1);
        const latAngle = Math.acos(toCraft.y / Math.max(0.1, toCraft.length()));
        const longAngle = Math.atan2(toCraft.z, toCraft.x);
        const rPerp = r * Math.sin(latAngle);
        const rotSpeedVec = new THREE.Vector3(
          -rPerp * cel.rotationSpeed * Math.sin(longAngle),
          0,
          rPerp * cel.rotationSpeed * Math.cos(longAngle)
        );
        const surfaceVel = new THREE.Vector3().addVectors(celVel, rotSpeedVec);

        const relVel = new THREE.Vector3().subVectors(this.velocity, surfaceVel);
        const relSpeed = relVel.length();

        if (relSpeed > 800.0) {
          // Crash! (Speed > 800 m/s)
          this.hasCrashed = true;
          this.crashSpeed = relSpeed / 1000.0; // in km/s
          this.velocity.set(0, 0, 0);
          break;
        } else {
          // Soft Landing lock!
          this.landedCelestialKey = key;
          this.landedLat = latAngle;
          this.landedLongOffset = longAngle - cel.mesh.rotation.y;
          this.justLanded = true;
          this.velocity.copy(surfaceVel);
          
          const normal = toCraft.clone().normalize();
          this.position.copy(cel.position).addScaledVector(normal, cel.radius + 0.45);
          break;
        }
      }
    }
  }

  syncCamera() {
    // In local reference frame rendering, the spacecraft sits at (0, 0, 0)
    // The camera orbit system handles placement around it.
  }

  getSpeed(universe) {
    if (!universe) return this.velocity.length();
    
    // Relative speed: find nearest planet and get speed relative to its surface!
    let minDistance = 999999999999;
    let nearestKey = 'earth';
    for (let key in universe.celestials) {
      if (key === 'iss') continue;
      const cel = universe.celestials[key];
      const d = this.position.distanceTo(cel.position);
      if (d < minDistance) {
        minDistance = d;
        nearestKey = key;
      }
    }

    const cel = universe.celestials[nearestKey];
    const celVel = universe.getCelestialVelocity(nearestKey);
    const toCraft = new THREE.Vector3().subVectors(this.position, cel.position);
    const latAngle = Math.acos(toCraft.y / Math.max(0.1, toCraft.length()));
    const longAngle = Math.atan2(toCraft.z, toCraft.x);
    const rPerp = cel.radius * Math.sin(latAngle);
    const rotSpeedVec = new THREE.Vector3(
      -rPerp * cel.rotationSpeed * Math.sin(longAngle),
      0,
      rPerp * cel.rotationSpeed * Math.cos(longAngle)
    );
    const surfaceVel = new THREE.Vector3().addVectors(celVel, rotSpeedVec);
    
    return new THREE.Vector3().subVectors(this.velocity, surfaceVel).length() / 1000.0; // km/s
  }

  getPropellantRatio() {
    if (!this.isAssembled || this.parts.length === 0) return 0;
    
    let activeParts = this.compiledStages[this.activeStage];
    if (!activeParts) return 0;

    let maxFuel = 0;
    let curFuel = 0;

    activeParts.forEach(p => {
      if (p.type === 'tank') {
        const baseSpec = PART_LIBRARY[p.key];
        maxFuel += baseSpec.fuel;
        curFuel += p.activeFuel;
      }
      if (p.thrust > 0 && p.solid) {
        const baseSpec = PART_LIBRARY[p.key];
        maxFuel += baseSpec.fuel;
        curFuel += p.activeFuel;
      }
    });

    return maxFuel === 0 ? 0 : curFuel / maxFuel;
  }

  getPropellantMass() {
    if (this.parts.length === 0) return 0;
    
    let activeParts = this.compiledStages[this.activeStage];
    if (!activeParts) return 0;

    let curFuel = 0;
    activeParts.forEach(p => {
      if (p.type === 'tank') curFuel += p.activeFuel;
      if (p.thrust > 0 && p.solid) curFuel += p.activeFuel;
    });

    return curFuel;
  }

  getPredictedTrajectory(universe, steps = 300) {
    const points = [];
    const tempPos = this.position.clone();
    const tempVel = this.velocity.clone();
    
    let minDistance = 999999999999;
    for (let key in universe.celestials) {
      if (key === 'iss') continue;
      const cel = universe.celestials[key];
      const d = tempPos.distanceTo(cel.position);
      if (d < minDistance) {
        minDistance = d;
      }
    }
    
    // Dynamic step sizes depending on celestial proximity (from 0.2s up to 200s)
    const stepSize = Math.max(0.05, Math.min(200.0, minDistance / 50000.0));
    const G = 6.6743e-11;
    
    for (let i = 0; i < steps; i++) {
      const timeOffset = i * stepSize;
      const gravityAccel = new THREE.Vector3();
      
      for (let key in universe.celestials) {
        if (key === 'iss') continue;
        const cel = universe.celestials[key];
        
        const celFuturePos = universe.getCelestialPositionAtTime(key, timeOffset);
        const toCel = new THREE.Vector3().subVectors(celFuturePos, tempPos);
        const distSq = toCel.lengthSq();
        
        if (distSq > 1.0) {
          const accelMag = (G * cel.mass) / distSq;
          gravityAccel.addScaledVector(toCel.normalize(), accelMag);
        }
      }
      
      tempVel.addScaledVector(gravityAccel, stepSize);
      tempPos.addScaledVector(tempVel, stepSize);
      
      points.push(tempPos.clone());
      
      // Truncate if we hit a planet
      let collided = false;
      for (let key in universe.celestials) {
        if (key === 'iss') continue;
        const cel = universe.celestials[key];
        const celFuturePos = universe.getCelestialPositionAtTime(key, timeOffset);
        const dist = tempPos.distanceTo(celFuturePos);
        
        if (dist < cel.radius) {
          collided = true;
          const surfacePos = new THREE.Vector3().subVectors(tempPos, celFuturePos).setLength(cel.radius).add(celFuturePos);
          points.push(surfacePos);
          break;
        }
      }
      if (collided) break;
    }
    
    return points;
  }
}
