import * as THREE from 'three';
import waterfallVert from '../../shaders/waterfall.vert';
import waterfallFrag from '../../shaders/waterfall.frag';
import rapidsVert from '../../shaders/rapids.vert';
import rapidsFrag from '../../shaders/rapids.frag';

/**
 * Salto Angel — Milestone 1: Hydrological Emergence Chute & Fluid Modules
 * Document: src/assets/BOM.md (Assets WATER-086 through WATER-094)
 *
 * Implements high-fidelity, physically motivated procedural BufferGeometries for:
 * 1. WATER-086: createWater086PrimaryCascadeEmergenceChute (3.5 x 8.0 x 4.0)
 *    - Ballistic 3D curved crest trough where main torrent erupts from cleft lip
 * 2. WATER-087: createWater087SecondaryCascadeEmergenceChute (2.0 x 7.0 x 3.5)
 *    - Parallel right crest trough emerging from adjacent fissure notch
 * 3. WATER-088: createWater088UpperCompactCoreRibbon (4.0 x 14.0 x 2.5)
 *    - High-density hyper-stretched liquid column mesh with vertical parabolic ballistic curve
 * 4. WATER-089: createWater089UpperCompactCoreRibbonSec (2.2 x 13.0 x 2.0)
 *    - Parallel secondary dense stream with vertical filament banding
 * 5. WATER-090: createWater090AtomizedCometaryPulseVeil (8.0 x 16.0 x 4.5)
 *    - Expanding parabolic spray shroud with downward gravitational cometary pulses
 * 6. WATER-091: createWater091DispersedEtherealVaporCurtain (14.0 x 18.0 x 6.0)
 *    - Wide billowing spray curtain with fluttering wave displacement
 * 7. WATER-092: createWater092SideTrickleThreadletChuteLeft (0.8 x 12.0 x 1.2)
 *    - Delicate fine stream dripping from lateral rock crevice
 * 8. WATER-093: createWater093SideTrickleThreadletChuteRight (0.6 x 10.0 x 1.0)
 *    - Thin capillary stream on right wall fading into mist halfway down
 * 9. WATER-094: createWater094CauldronImpactBoilRing (radius = 8.0, height = 4.0)
 *    - Concentric circular turbulent foam surge ring at the plunge cauldron
 *
 * Required Buffer Attributes:
 * - position (Float32BufferAttribute, 3)
 * - normal (Float32BufferAttribute, 3)
 * - uv (Float32BufferAttribute, 2) [u across width/azimuth, v along flow direction]
 * - aSpeed (Float32BufferAttribute, 1) [gravity acceleration / flow speed multiplier]
 * - aAO (Float32BufferAttribute, 1) [inner trough / core crevice shadow depth]
 * - aCurvature (Float32BufferAttribute, 1) [chute ridge & standing wave highlight factor]
 * - aPartType (Float32BufferAttribute, 1) [1.0 = water/fluid]
 */

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(min, max, val) {
  const x = clamp((val - min) / (max - min), 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

/**
 * 1. WATER-086: Primary Cascade Emergence Chute (~ 3.5 x 8.0 x 4.0)
 * Ballistic 3D curved crest trough where main torrent erupts from cleft lip.
 * U-shaped cross-section with curled containment sidewalls transitioning into free fall.
 */
export function createWater086PrimaryCascadeEmergenceChute(width = 3.5, height = 8.0, depth = 4.0, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 3.5;
    height = options.height ?? 8.0;
    depth = options.depth ?? 4.0;
  }

  const segX = options.segX ?? 36;
  const segY = options.segY ?? 80;

  const vCount = (segX + 1) * (segY + 1);
  const triCount = segX * segY * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let j = 0; j <= segY; j++) {
    const vCoord = j / segY; // 0.0 at cave exit, 1.0 at free-fall plunge boundary

    // 1. Longitudinal Trajectory:
    // vCoord in [0, 0.40]: sloping horizontal conduit inside cleft tunnel mouth
    // vCoord in [0.40, 1.0]: ballistic acceleration over the overhanging cleft lip
    let yBase = 0;
    let zBase = 0;

    if (vCoord <= 0.40) {
      const tIn = vCoord / 0.40;
      zBase = -depth * 0.5 + tIn * (depth * 0.55);
      yBase = height * 0.5 - tIn * 0.6;
    } else {
      const tFall = (vCoord - 0.40) / 0.60;
      // Parabolic forward ballistic curve: z = z0 + v0*t, y = y0 - 0.5*g*t^2
      zBase = (-depth * 0.5 + depth * 0.55) + tFall * (depth * 0.45) - 0.18 * Math.pow(tFall, 2.0);
      yBase = (height * 0.5 - 0.6) - tFall * (height - 0.6) - 0.55 * Math.pow(tFall, 2.0);
    }

    // Width expands slightly as stream emerges from bedrock confinement
    const widthScale = width * (0.88 + 0.38 * vCoord);
    const speedVal = Math.sqrt(1.0 + 4.8 * vCoord);

    for (let i = 0; i <= segX; i++) {
      const uCoord = i / segX;
      const xNorm = (uCoord - 0.5) * 2.0; // -1.0 to 1.0

      // Transverse U-shaped trough profile
      const x = xNorm * widthScale * 0.5;
      const troughDepression = -(1.0 - xNorm * xNorm) * 0.42 * (1.0 - 0.45 * Math.min(1.0, vCoord * 1.8));

      // Lateral curled containment wings (spray curl at boundaries)
      const edgeCurl = Math.pow(Math.abs(xNorm), 2.2) * 0.22;

      // Longitudinal hydraulic roping (water cords streaming over bedrock irregularities)
      const cordRipples = Math.cos(xNorm * Math.PI * 6.0) * 0.08 * (1.0 - 0.35 * vCoord);

      const y = yBase + troughDepression + cordRipples;
      const z = zBase + edgeCurl;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      uvs[vIdx * 2 + 0] = uCoord;
      uvs[vIdx * 2 + 1] = 1.0 - vCoord;

      aSpeed[vIdx] = speedVal;
      // Occlusion: deeper within the depressed trough, unoccluded at the outer spray wings
      aAO[vIdx] = THREE.MathUtils.lerp(0.42, 1.0, Math.abs(xNorm));
      // Curvature: ridges catch highlight, trough center is concave
      aCurvature[vIdx] = 0.48 + 0.38 * cordRipples * 8.0 + 0.25 * Math.abs(xNorm);

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = (j + 1) * (segX + 1) + i;
      const c = (j + 1) * (segX + 1) + (i + 1);
      const d = j * (segX + 1) + (i + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * 2. WATER-087: Secondary Cascade Emergence Chute (~ 2.0 x 7.0 x 3.5)
 * Parallel right crest trough emerging from adjacent fissure notch.
 * Narrower, steeper, asymmetric channel with a deep central V-notch keel.
 */
export function createWater087SecondaryCascadeEmergenceChute(width = 2.0, height = 7.0, depth = 3.5, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 2.0;
    height = options.height ?? 7.0;
    depth = options.depth ?? 3.5;
  }

  const segX = options.segX ?? 28;
  const segY = options.segY ?? 72;

  const vCount = (segX + 1) * (segY + 1);
  const triCount = segX * segY * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let j = 0; j <= segY; j++) {
    const vCoord = j / segY;

    let yBase = 0;
    let zBase = 0;

    if (vCoord <= 0.35) {
      const tIn = vCoord / 0.35;
      zBase = -depth * 0.5 + tIn * (depth * 0.52);
      yBase = height * 0.5 - tIn * 0.75;
    } else {
      const tFall = (vCoord - 0.35) / 0.65;
      zBase = (-depth * 0.5 + depth * 0.52) + tFall * (depth * 0.48) - 0.20 * Math.pow(tFall, 2.0);
      yBase = (height * 0.5 - 0.75) - tFall * (height - 0.75) - 0.65 * Math.pow(tFall, 2.0);
    }

    const widthScale = width * (0.85 + 0.32 * vCoord);
    const speedVal = Math.sqrt(1.2 + 4.5 * vCoord);

    for (let i = 0; i <= segX; i++) {
      const uCoord = i / segX;
      // Slight asymmetric bias toward left due to right fissure bedrock wall:
      const xNorm = (uCoord - 0.48) * 2.0;

      const x = xNorm * widthScale * 0.5;
      // Sharp V-notch keel
      const vNotch = -Math.max(0.0, 1.0 - Math.abs(xNorm)) * 0.36;
      const sideSplash = Math.pow(Math.abs(xNorm), 1.8) * 0.18;
      const cords = Math.cos(xNorm * Math.PI * 4.0) * 0.06;

      const y = yBase + vNotch + cords;
      const z = zBase + sideSplash;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      uvs[vIdx * 2 + 0] = uCoord;
      uvs[vIdx * 2 + 1] = 1.0 - vCoord;

      aSpeed[vIdx] = speedVal;
      aAO[vIdx] = THREE.MathUtils.lerp(0.38, 0.98, Math.abs(xNorm));
      aCurvature[vIdx] = 0.50 + 0.35 * Math.abs(xNorm);

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = (j + 1) * (segX + 1) + i;
      const c = (j + 1) * (segX + 1) + (i + 1);
      const d = j * (segX + 1) + (i + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * 3. WATER-088: Upper Compact Core Ribbon (Main) (~ 4.0 x 14.0 x 2.5)
 * High-density hyper-stretched liquid column mesh with vertical parabolic ballistic curve.
 * Contracts (necks) in upper third due to gravitational acceleration, then flutes into 8 strands.
 */
export function createWater088UpperCompactCoreRibbon(width = 4.0, height = 14.0, depth = 2.5, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 4.0;
    height = options.height ?? 14.0;
    depth = options.depth ?? 2.5;
  }

  const segX = options.segX ?? 36;
  const segY = options.segY ?? 110;

  const vCount = (segX + 1) * (segY + 1);
  const triCount = segX * segY * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let j = 0; j <= segY; j++) {
    const vCoord = j / segY; // 0.0 at top brink, 1.0 at mid-fall

    // Vertical Y position:
    const y = height * 0.5 - vCoord * height;

    // Parabolic Ballistic Curve: forward arc carried by initial velocity
    const zArc = -depth * 0.5 + Math.sin(vCoord * Math.PI * 0.55) * depth;

    // Fluid dynamics: stream necking (continuity A ~ 1/sqrt(v)) in upper 30%,
    // followed by aerodynamic splaying & cometary plume expansion in lower 70%
    const necking = 1.0 - 0.18 * Math.sin(vCoord * Math.PI * 0.5) + 0.70 * Math.pow(vCoord, 1.4);
    const curWidth = width * necking;

    const speedVal = Math.sqrt(1.0 + 3.8 * vCoord);

    for (let i = 0; i <= segX; i++) {
      const uCoord = i / segX;
      const xNorm = (uCoord - 0.5) * 2.0;

      const x = xNorm * curWidth * 0.5;

      // 8 Longitudinal hydraulic core cords
      const cordRipples = Math.cos(xNorm * Math.PI * 8.0) * 0.12 * (1.0 - 0.25 * vCoord);
      // Convex central core fullness
      const coreFullness = (1.0 - xNorm * xNorm) * 0.32;
      const z = zArc + coreFullness + cordRipples;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      uvs[vIdx * 2 + 0] = uCoord;
      uvs[vIdx * 2 + 1] = 1.0 - vCoord;

      aSpeed[vIdx] = speedVal;
      aAO[vIdx] = THREE.MathUtils.lerp(0.36, 1.0, Math.pow(Math.abs(xNorm), 0.7));
      aCurvature[vIdx] = 0.50 + cordRipples * 3.5 + 0.25 * (1.0 - Math.abs(xNorm));

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = (j + 1) * (segX + 1) + i;
      const c = (j + 1) * (segX + 1) + (i + 1);
      const d = j * (segX + 1) + (i + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * 4. WATER-089: Upper Compact Core Ribbon Sec (~ 2.2 x 13.0 x 2.0)
 * Parallel secondary dense stream with vertical filament banding.
 * Twin braided stream cords with gentle helical twist.
 */
export function createWater089UpperCompactCoreRibbonSec(width = 2.2, height = 13.0, depth = 2.0, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 2.2;
    height = options.height ?? 13.0;
    depth = options.depth ?? 2.0;
  }

  const segX = options.segX ?? 26;
  const segY = options.segY ?? 96;

  const vCount = (segX + 1) * (segY + 1);
  const triCount = segX * segY * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let j = 0; j <= segY; j++) {
    const vCoord = j / segY;

    const y = height * 0.5 - vCoord * height;
    const zArc = -depth * 0.5 + Math.sin(vCoord * Math.PI * 0.52) * depth;

    // Twin stream braiding & downward cometary atomization expansion
    const necking = 1.0 - 0.15 * Math.sin(vCoord * Math.PI * 0.5) + 0.60 * Math.pow(vCoord, 1.5);
    const curWidth = width * necking;

    const speedVal = Math.sqrt(1.1 + 3.4 * vCoord);

    for (let i = 0; i <= segX; i++) {
      const uCoord = i / segX;
      const xNorm = (uCoord - 0.5) * 2.0;

      const x = xNorm * curWidth * 0.5;

      // Twin braided cords with center furrow
      const twinCords = (Math.cos(xNorm * Math.PI * 4.0) + 0.35 * Math.sin(vCoord * 8.0)) * 0.10;
      const z = zArc + (1.0 - xNorm * xNorm) * 0.22 + twinCords;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      uvs[vIdx * 2 + 0] = uCoord;
      uvs[vIdx * 2 + 1] = 1.0 - vCoord;

      aSpeed[vIdx] = speedVal;
      aAO[vIdx] = THREE.MathUtils.lerp(0.40, 1.0, Math.abs(xNorm));
      aCurvature[vIdx] = 0.52 + twinCords * 3.0;

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = (j + 1) * (segX + 1) + i;
      const c = (j + 1) * (segX + 1) + (i + 1);
      const d = j * (segX + 1) + (i + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * 5. WATER-090: Atomized Cometary Pulse Veil (~ 8.0 x 16.0 x 4.5)
 * Expanding parabolic spray shroud with downward gravitational cometary pulses.
 * Models the mid-air atomization where aerodynamic drag shatters the core into water comets.
 */
export function createWater090AtomizedCometaryPulseVeil(width = 8.0, height = 16.0, depth = 4.5, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 8.0;
    height = options.height ?? 16.0;
    depth = options.depth ?? 4.5;
  }

  const segX = options.segX ?? 48;
  const segY = options.segY ?? 120;

  const vCount = (segX + 1) * (segY + 1);
  const triCount = segX * segY * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let j = 0; j <= segY; j++) {
    const vCoord = j / segY;

    const y = height * 0.5 - vCoord * height;
    // Parabolic billow forward envelope
    const zBase = -depth * 0.45 + Math.sin(vCoord * Math.PI * 0.6) * depth;

    // Expanding width from 3.8m at top to 8.0m at bottom
    const curWidth = THREE.MathUtils.lerp(width * 0.48, width, Math.pow(vCoord, 0.75));
    const speedVal = 1.6 + 2.6 * vCoord;

    for (let i = 0; i <= segX; i++) {
      const uCoord = i / segX;
      const xNorm = (uCoord - 0.5) * 2.0;

      const x = xNorm * curWidth * 0.5;

      // Downward-traveling V-shaped water comet pulses:
      // Comet heads are sharp V-shapes pointing downward:
      const cometCoord = vCoord * 9.0 - Math.abs(xNorm) * 1.5;
      const cometWave = Math.sin(cometCoord * Math.PI);
      const cometBump = Math.pow(Math.max(0.0, cometWave), 2.2) * 0.38 * vCoord;

      // Lateral scalloped billow lobes
      const scallopLobe = Math.sin(vCoord * 14.0) * Math.cos(xNorm * Math.PI * 3.0) * 0.18 * vCoord;

      const z = zBase + cometBump + scallopLobe;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      uvs[vIdx * 2 + 0] = uCoord;
      uvs[vIdx * 2 + 1] = 1.0 - vCoord;

      aSpeed[vIdx] = speedVal;
      aAO[vIdx] = THREE.MathUtils.lerp(0.55, 1.0, Math.pow(Math.abs(xNorm), 0.5));
      aCurvature[vIdx] = 0.48 + cometBump * 1.8;

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = (j + 1) * (segX + 1) + i;
      const c = (j + 1) * (segX + 1) + (i + 1);
      const d = j * (segX + 1) + (i + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * 6. WATER-091: Dispersed Ethereal Vapor Curtain (~ 14.0 x 18.0 x 6.0)
 * Wide billowing spray curtain with fluttering wave displacement.
 * Represents the 120m-wide translucent mist plume buffeted by canyon crosswinds.
 */
export function createWater091DispersedEtherealVaporCurtain(width = 14.0, height = 18.0, depth = 6.0, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 14.0;
    height = options.height ?? 18.0;
    depth = options.depth ?? 6.0;
  }

  const segX = options.segX ?? 64;
  const segY = options.segY ?? 130;

  const vCount = (segX + 1) * (segY + 1);
  const triCount = segX * segY * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let j = 0; j <= segY; j++) {
    const vCoord = j / segY;

    const y = height * 0.5 - vCoord * height;
    const zBase = -depth * 0.40 + Math.sin(vCoord * Math.PI * 0.65) * depth * 0.75;

    // Width expands from 5.5m at top to 14.0m at bottom
    const curWidth = THREE.MathUtils.lerp(width * 0.40, width, Math.pow(vCoord, 0.70));
    const speedVal = 1.3 + 1.9 * vCoord;

    for (let i = 0; i <= segX; i++) {
      const uCoord = i / segX;
      const xNorm = (uCoord - 0.5) * 2.0;

      // Multi-frequency billowing curtain folds (canyon drafts & updrafts)
      const drapeFolds = (Math.sin(uCoord * Math.PI * 6.0 + vCoord * 3.5) * 0.55 +
                          Math.cos(uCoord * Math.PI * 10.0 - vCoord * 4.5) * 0.28) *
                          Math.pow(vCoord, 0.65) * (depth * 0.45);

      // Lateral fluttering drift
      const flutterX = Math.sin(vCoord * 5.0 + uCoord * 2.0) * 0.45 * vCoord;
      const x = (xNorm * curWidth * 0.5) + flutterX;

      // Feathered outer wings curling forward
      const outerWisp = Math.pow(Math.abs(xNorm), 2.5) * 0.65 * vCoord;
      const z = zBase + drapeFolds + outerWisp;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      uvs[vIdx * 2 + 0] = uCoord;
      uvs[vIdx * 2 + 1] = 1.0 - vCoord;

      aSpeed[vIdx] = speedVal;
      aAO[vIdx] = THREE.MathUtils.lerp(0.60, 1.0, Math.abs(xNorm));
      aCurvature[vIdx] = 0.46 + drapeFolds * 0.5;

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = (j + 1) * (segX + 1) + i;
      const c = (j + 1) * (segX + 1) + (i + 1);
      const d = j * (segX + 1) + (i + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * 7. WATER-092: Side Trickle Threadlet Chute Left (~ 0.8 x 12.0 x 1.2)
 * Delicate fine stream dripping from lateral rock crevice at x approx -2.2.
 * Sinuous path with Rayleigh-Plateau capillary instability pinch-and-swell beads.
 */
export function createWater092SideTrickleThreadletChuteLeft(width = 0.8, height = 12.0, depth = 1.2, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 0.8;
    height = options.height ?? 12.0;
    depth = options.depth ?? 1.2;
  }

  const segX = options.segX ?? 14;
  const segY = options.segY ?? 96;

  const vCount = (segX + 1) * (segY + 1);
  const triCount = segX * segY * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let j = 0; j <= segY; j++) {
    const vCoord = j / segY;

    const y = height * 0.5 - vCoord * height;
    // Sinuous adherence path conforming to rock clefts:
    const pathX = Math.sin(vCoord * 8.0) * 0.22 + Math.cos(vCoord * 16.0) * 0.08;
    const pathZ = Math.cos(vCoord * 6.5) * 0.16 - 0.25 * vCoord;

    // Rayleigh-Plateau capillary pinch-and-swell beads:
    const beadScale = 0.65 + 0.35 * Math.cos(vCoord * Math.PI * 24.0);
    const curWidth = width * beadScale;
    const speedVal = 1.1 + 1.6 * vCoord;

    for (let i = 0; i <= segX; i++) {
      const uCoord = i / segX;
      const xNorm = (uCoord - 0.5) * 2.0;

      const x = pathX + xNorm * curWidth * 0.5;
      const z = pathZ + (1.0 - xNorm * xNorm) * 0.08;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      uvs[vIdx * 2 + 0] = uCoord;
      uvs[vIdx * 2 + 1] = 1.0 - vCoord;

      aSpeed[vIdx] = speedVal;
      aAO[vIdx] = 0.85;
      aCurvature[vIdx] = 0.65;

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = (j + 1) * (segX + 1) + i;
      const c = (j + 1) * (segX + 1) + (i + 1);
      const d = j * (segX + 1) + (i + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * 8. WATER-093: Side Trickle Threadlet Chute Right (~ 0.6 x 10.0 x 1.0)
 * Thin capillary stream on right wall fading into mist halfway down.
 * Tapers in thickness and breaks into spray droplets in the lower section.
 */
export function createWater093SideTrickleThreadletChuteRight(width = 0.6, height = 10.0, depth = 1.0, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 0.6;
    height = options.height ?? 10.0;
    depth = options.depth ?? 1.0;
  }

  const segX = options.segX ?? 12;
  const segY = options.segY ?? 80;

  const vCount = (segX + 1) * (segY + 1);
  const triCount = segX * segY * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let j = 0; j <= segY; j++) {
    const vCoord = j / segY;

    const y = height * 0.5 - vCoord * height;
    const pathX = Math.cos(vCoord * 9.5) * 0.18 + Math.sin(vCoord * 18.0) * 0.06;
    const pathZ = Math.sin(vCoord * 7.5) * 0.12 - 0.20 * vCoord;

    // Tapering into mist droplets in lower half:
    const mistFade = vCoord > 0.55 ? 1.0 + (vCoord - 0.55) * 1.4 : 1.0 - vCoord * 0.4;
    const curWidth = width * mistFade;
    const speedVal = 1.0 + 1.5 * vCoord;

    for (let i = 0; i <= segX; i++) {
      const uCoord = i / segX;
      const xNorm = (uCoord - 0.5) * 2.0;

      const x = pathX + xNorm * curWidth * 0.5;
      const z = pathZ + (1.0 - xNorm * xNorm) * 0.06;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      uvs[vIdx * 2 + 0] = uCoord;
      uvs[vIdx * 2 + 1] = 1.0 - vCoord;

      aSpeed[vIdx] = speedVal;
      aAO[vIdx] = 0.90;
      aCurvature[vIdx] = 0.60;

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = (j + 1) * (segX + 1) + i;
      const c = (j + 1) * (segX + 1) + (i + 1);
      const d = j * (segX + 1) + (i + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * 9. WATER-094: Cauldron Impact Boil Ring (~ 16.0 x 4.0 x 16.0, radius = 8.0)
 * Concentric circular turbulent foam surge ring where plunging water collides with talus basin.
 * Central impact crater depression surrounded by standing hydraulic jump surge ring,
 * secondary ripples, and radial rooster splash lobes.
 */
export function createWater094CauldronImpactBoilRing(radius = 8.0, height = 4.0, options = {}) {
  if (typeof radius === 'object' && radius !== null) {
    options = radius;
    radius = options.radius ?? 8.0;
    height = options.height ?? 4.0;
  }

  const radialSegs = options.radialSegs ?? 64;
  const ringSegs = options.ringSegs ?? 36;

  // Watertight polar grid:
  const vCount = (radialSegs + 1) * (ringSegs + 1);
  const triCount = radialSegs * ringSegs * 2;

  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const aSpeed = new Float32Array(vCount);
  const aAO = new Float32Array(vCount);
  const aCurvature = new Float32Array(vCount);
  const aPartType = new Float32Array(vCount).fill(1.0);
  const indices = new Uint32Array(triCount * 3);

  let vIdx = 0;
  for (let r = 0; r <= ringSegs; r++) {
    const rNorm = r / ringSegs; // 0.0 at center, 1.0 at outer rim
    // Tiny safe offset to eradicate 0-area center degenerate triangles:
    const rDist = Math.max(0.12, rNorm * radius);

    // Hydraulic Radial Profile:
    // rNorm in [0, 0.22]: Central impact crater depression
    // rNorm in [0.22, 0.58]: Primary standing surge ring (hydraulic jump)
    // rNorm in [0.58, 0.85]: Secondary concentric surge wave
    // rNorm in [0.85, 1.0]: Foaming wash thinning out over talus rocks
    let yProfile = 0;
    if (rNorm < 0.22) {
      const tIn = rNorm / 0.22;
      yProfile = -height * 0.45 * (1.0 - tIn * tIn);
    } else if (rNorm < 0.58) {
      const tJump = (rNorm - 0.22) / 0.36;
      yProfile = Math.sin(tJump * Math.PI) * (height * 0.65);
    } else if (rNorm < 0.85) {
      const tSec = (rNorm - 0.58) / 0.27;
      yProfile = Math.sin(tSec * Math.PI) * (height * 0.28);
    } else {
      const tOut = (rNorm - 0.85) / 0.15;
      yProfile = (1.0 - tOut) * (height * 0.08);
    }

    const speedVal = 3.2 / Math.sqrt(rNorm + 0.15);

    for (let s = 0; s <= radialSegs; s++) {
      const thetaNorm = s / radialSegs; // 0.0 to 1.0
      const theta = thetaNorm * Math.PI * 2.0;

      // Natural circular hydraulic surge and gentle wave chop (no giant cardboard teeth)
      const jumpMask = smoothstep(0.15, 0.35, rNorm) * (1.0 - smoothstep(0.55, 0.75, rNorm));
      const roosterSplash = (Math.cos(theta * 5.0) * 0.06 + Math.sin(theta * 7.0) * 0.05) * jumpMask * height;
      const foamChop = (Math.sin(theta * 12.0 + rNorm * 8.0) + Math.cos(theta * 18.0)) * 0.04;

      const x = Math.cos(theta) * rDist;
      const z = Math.sin(theta) * rDist;
      const y = yProfile + roosterSplash + foamChop;

      positions[vIdx * 3 + 0] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = z;

      // Polar UV coordinates:
      uvs[vIdx * 2 + 0] = thetaNorm; // u wraps seamlessly around azimuth
      uvs[vIdx * 2 + 1] = rNorm;     // v flows outward from center to rim

      aSpeed[vIdx] = speedVal;
      aAO[vIdx] = THREE.MathUtils.lerp(0.35, 1.0, clamp((y + height * 0.45) / (height * 1.1), 0.0, 1.0));
      aCurvature[vIdx] = clamp(0.48 + (yProfile / height) * 0.65, 0.22, 0.95);

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let r = 0; r < ringSegs; r++) {
    for (let s = 0; s < radialSegs; s++) {
      const a = r * (radialSegs + 1) + s;
      const b = (r + 1) * (radialSegs + 1) + s;
      const c = (r + 1) * (radialSegs + 1) + (s + 1);
      const d = r * (radialSegs + 1) + (s + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * Convenience helper to create a paired ShaderMaterial for waterfall emergence and core ribbons.
 */
export function createWaterChuteMaterial(sharedUniforms = {}, options = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: waterfallVert,
    fragmentShader: waterfallFrag,
    uniforms: {
      ...sharedUniforms,
      uTime: { value: 0 },
      uFlowSpeed: { value: options.flowSpeed ?? 2.3 },
      uWindStrength: { value: options.windStrength ?? 0.75 },
      uMistAmount: { value: options.mistAmount ?? 0.95 },
      uStreamWidth: { value: options.streamWidth ?? 1.0 },
      uOpacity: { value: options.opacity ?? 1.0 }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

/**
 * Convenience helper to create a paired ShaderMaterial for the cauldron boil ring and whitewater surges.
 */
export function createRapidsBoilMaterial(sharedUniforms = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: rapidsVert,
    fragmentShader: rapidsFrag,
    uniforms: {
      ...sharedUniforms,
      uTime: { value: 0 }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

export const HYDROLOGICAL_CHUTE_MODULES = {
  'WATER-086': {
    name: 'Primary Cascade Emergence Chute',
    create: createWater086PrimaryCascadeEmergenceChute,
    dims: [3.5, 8.0, 4.0]
  },
  'WATER-087': {
    name: 'Secondary Cascade Emergence Chute',
    create: createWater087SecondaryCascadeEmergenceChute,
    dims: [2.0, 7.0, 3.5]
  },
  'WATER-088': {
    name: 'Upper Compact Core Ribbon (Main)',
    create: createWater088UpperCompactCoreRibbon,
    dims: [4.0, 14.0, 2.5]
  },
  'WATER-089': {
    name: 'Upper Compact Core Ribbon (Sec)',
    create: createWater089UpperCompactCoreRibbonSec,
    dims: [2.2, 13.0, 2.0]
  },
  'WATER-090': {
    name: 'Atomized Cometary Pulse Veil',
    create: createWater090AtomizedCometaryPulseVeil,
    dims: [8.0, 16.0, 4.5]
  },
  'WATER-091': {
    name: 'Dispersed Ethereal Vapor Curtain',
    create: createWater091DispersedEtherealVaporCurtain,
    dims: [14.0, 18.0, 6.0]
  },
  'WATER-092': {
    name: 'Side Trickle Threadlet Chute Left',
    create: createWater092SideTrickleThreadletChuteLeft,
    dims: [0.8, 12.0, 1.2]
  },
  'WATER-093': {
    name: 'Side Trickle Threadlet Chute Right',
    create: createWater093SideTrickleThreadletChuteRight,
    dims: [0.6, 10.0, 1.0]
  },
  'WATER-094': {
    name: 'Cauldron Impact Boil Ring',
    create: createWater094CauldronImpactBoilRing,
    dims: [16.0, 4.0, 16.0]
  }
};
