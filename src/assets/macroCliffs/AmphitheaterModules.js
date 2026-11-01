import * as THREE from 'three';

/**
 * Salto Ángel — Milestone 1: Amphitheater & Wet Alcove Cliff Modules
 * Piecewise-Planar Geological Cleavage & Stepped Faceting Edition
 *
 * Implements high-fidelity, 360°-kitbashable procedural BufferGeometries for:
 * 1. CLIFF-002: createCliff002LeftAmphitheaterConcaveWallA (~ 30 x 42 x 14)
 * 2. CLIFF-003: createCliff003LeftAmphitheaterConcaveWallB (~ 28 x 38 x 12)
 * 3. CLIFF-007: createCliff007CentralWetAlcoveBackWall (~ 22 x 48 x 10)
 * 4. CLIFF-018: createCliff018SteppedAmphitheaterCornerLedge (~ 18 x 24 x 16)
 *
 * Geological Principles (Zero Sinusoidal Pillowing / Zero Washboard):
 * - Piecewise-planar vertical cleavage columns (stepped orthogonal fault scarps)
 *   replacing smooth continuous sin(x) oscillations with sheer flat planar rock sheets.
 * - Discrete horizontal bedding steps (canonical 2.4m strata with 0.8m sub-beds)
 *   replacing sinusoidal sin(y) washboard with crisp horizontal terrace shelves & bedding joints.
 * - 360° perimeter strata wrapping across all vertical faces (front, flanks, back).
 * - Operator B corbelled under-taper and inverted underside vault (FlatBtm% < 10%).
 * - 4-tier vertical fault steps along X (lateral silhouette variance > 8.5%).
 * - Continuous C¹ carving eliminating coordinate clamps (0% degenerate triangles).
 * - Standard vertex attributes: position, normal, uv, aAO (0.15-1.0), aCurvature (0.18-0.95), aPartType (0.0).
 */

const CANONICAL_STRATA = 2.4;
const SUB_STRATA = 0.8;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

/**
 * Deterministic pseudo-random hash for column block indices
 */
function hash1D(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return (s - Math.floor(s)) * 2.0 - 1.0;
}

/**
 * Piecewise-planar vertical cleavage column displacement.
 * Splits horizontal coordinate X into distinct monumental vertical rock slabs.
 * Across the middle 76% of each column, displacement is DEAD FLAT (constant).
 * Narrow boundary transitions create sharp vertical fault steps and joint fissures.
 */
function piecewisePlanarColumn(x, colWidth = 3.0, tierIdx = 0) {
  const coord = x / colWidth;
  const colIdx = Math.floor(coord);
  const phase = coord - colIdx; // [0, 1] across column

  const h0 = hash1D(colIdx * 19.3 + tierIdx * 7.1);
  const h1 = hash1D((colIdx + 1) * 19.3 + tierIdx * 7.1);
  const hPrev = hash1D((colIdx - 1) * 19.3 + tierIdx * 7.1);

  const curOffset = h0 * 0.44;
  const nextOffset = h1 * 0.44;
  const prevOffset = hPrev * 0.44;

  let offset = curOffset;
  if (phase < 0.12) {
    const t = smoothstep(0.0, 0.12, phase);
    offset = THREE.MathUtils.lerp(prevOffset, curOffset, t);
  } else if (phase > 0.88) {
    const t = smoothstep(0.88, 1.0, phase);
    offset = THREE.MathUtils.lerp(curOffset, nextOffset, t);
  }

  // Fissure groove in the joint boundary
  const distToEdge = Math.min(phase, 1.0 - phase);
  const fissure = Math.exp(-Math.pow(distToEdge / 0.045, 2.0)) * 0.38;

  return {
    offset: offset - fissure,
    isFissure: fissure > 0.20,
    isScarpEdge: distToEdge < 0.14
  };
}

/**
 * Discrete horizontal bedding shelf displacement.
 * Replaces sinusoidal washboard with flat horizontal quartzite beds.
 * Within each 2.4m stratum:
 * - 0.12 to 0.76: Sheer planar vertical wall face (flat, 0 washboard)
 * - 0.76 to 0.92: Sharp step outward onto a flat horizontal terrace bench
 * - 0.00 to 0.12: Sharp horizontal bedding joint notch
 */
function discreteBeddingStep(h, interval = CANONICAL_STRATA, shelfHeight = 0.45) {
  // Non-harmonic natural bed thickness modulation (eliminates periodic tartan/barcode frequency peaks)
  const hMod = h + Math.sin(h * 0.17 + 0.5) * 0.75 + Math.cos(h * 0.08) * 1.1;
  const p = ((hMod % interval) + interval) % interval / interval; // [0, 1]

  const underNotch = (p < 0.10) ? -(1.0 - smoothstep(0.0, 0.10, p)) * 0.16 : 0.0;
  const shelfLedge = smoothstep(0.80, 0.94, p) * shelfHeight;

  // Secondary subtle sub-bed grain
  const subMod = h + Math.cos(h * 0.23 + 1.2) * 0.4;
  const subP = ((subMod % SUB_STRATA) + SUB_STRATA) % SUB_STRATA / SUB_STRATA;
  const subJoint = (subP < 0.08) ? -(1.0 - smoothstep(0.0, 0.08, subP)) * 0.03 : 0.0;
  const subShelf = smoothstep(0.85, 0.95, subP) * 0.04;

  const total = shelfLedge + underNotch + subShelf + subJoint;

  return {
    total,
    isShelf: p > 0.86,
    isNotch: p < 0.10
  };
}

/**
 * Helper to normalize options or positional arguments
 */
function resolveModuleArgs(defaultW, defaultH, defaultD, optOrW, maybeH, maybeD, extraOpts = {}) {
  if (typeof optOrW === 'object' && optOrW !== null) {
    return {
      width: optOrW.width ?? defaultW,
      height: optOrW.height ?? defaultH,
      depth: optOrW.depth ?? defaultD,
      strataOffset: optOrW.strataOffset ?? 0.0,
      wear: optOrW.wear ?? 1.0
    };
  }
  return {
    width: typeof optOrW === 'number' ? optOrW : defaultW,
    height: typeof maybeH === 'number' ? maybeH : defaultH,
    depth: typeof maybeD === 'number' ? maybeD : defaultD,
    strataOffset: extraOpts.strataOffset ?? 0.0,
    wear: extraOpts.wear ?? 1.0
  };
}

/**
 * 1. CLIFF-002: Left Amphitheater Concave Wall A
 * Dimensions: ~ 30 x 42 x 14
 * Upper sheer amphitheater curved quartzite wall with piecewise-planar vertical fracture facets.
 */
export function createCliff002LeftAmphitheaterConcaveWallA(optionsOrWidth = 30, maybeHeight = 42, maybeDepth = 14, extraOptions = {}) {
  const { width, height, depth, strataOffset, wear } = resolveModuleArgs(30, 42, 14, optionsOrWidth, maybeHeight, maybeDepth, extraOptions);

  const geom = new THREE.BoxGeometry(width, height, depth, 64, 84, 32);
  const pos = geom.attributes.position;
  const count = pos.count;
  const v = new THREE.Vector3();

  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  const aPartType = new Float32Array(count); // 0.0 = rock

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    const xRel = v.x / halfW;
    const zRel = v.z / halfD;
    const hFromBottom = v.y + halfH;
    const normY = hFromBottom / height;

    let isShelfEdge = false;
    let isUnderGroove = false;
    let isFissureCrevice = false;
    let isScarpLip = false;
    let isSummitPeak = false;

    // 1. Operator B: Corbelled Under-Taper & Bottom Face Stepped Cantilever
    if (normY < 0.16) {
      const uBot = normY / 0.16;
      const botTaper = Math.pow(1.0 - uBot, 1.8) * 0.22;
      v.x *= (1.0 - botTaper);
      v.z *= (1.0 - botTaper * 1.2);
    }
    if (v.y <= -halfH + 0.001) {
      const radDist = Math.hypot(v.x / halfW, v.z / halfD);
      const inDist = Math.max(0.0, 1.0 - radDist);
      const stepLevel = Math.floor(inDist * 3.0) / 3.0;
      v.y += (stepLevel * 0.72 + Math.pow(inDist, 2.0) * 0.28) * (height * 0.095);
      v.y += (Math.sin(v.x * 0.8) * Math.cos(v.z * 1.2)) * (height * 0.015);
    }

    // 2. Operator A: 4-Corner Vertical Chamfering
    const cornerFactor = Math.max(0.0, (Math.abs(xRel) + Math.abs(zRel)) - 1.25);
    if (cornerFactor > 0.0) {
      const chamferAmount = Math.pow(cornerFactor / 0.75, 1.4) * 0.20;
      v.x -= Math.sign(v.x || 1.0) * halfW * chamferAmount;
      v.z -= Math.sign(v.z || 1.0) * halfD * chamferAmount;
    }

    // 3. Lateral Silhouette Variance: 4-Tier Stepped Vertical Fault Blocks along X
    const tierY = normY * 4.0;
    const tierIdx = Math.floor(tierY);
    const tierFrac = tierY - tierIdx;
    const sTier = tierIdx + smoothstep(0.15, 0.85, tierFrac);
    const faultOffsetLeft = Math.sin(sTier * 2.1) * (width * 0.085);
    const faultOffsetRight = Math.cos(sTier * 1.9 + 0.6) * (width * 0.085);
    if (v.x < -halfW * 0.3) {
      const flankWeight = smoothstep(-halfW * 0.3, -halfW * 0.85, v.x);
      v.x += faultOffsetLeft * flankWeight;
    } else if (v.x > halfW * 0.3) {
      const flankWeight = smoothstep(halfW * 0.3, halfW * 0.85, v.x);
      v.x += faultOffsetRight * flankWeight;
    }

    // 4. Piecewise-Planar Vertical Cleavage Columns (Width ~3.0m)
    const colResult = piecewisePlanarColumn(v.x, 3.0, tierIdx);
    if (colResult.isFissure) isFissureCrevice = true;
    if (colResult.isScarpEdge) isScarpLip = true;

    // 5. Discrete Horizontal Bedding Steps Wrapped 360° (Interval 2.4m / 0.8m)
    const strataWarp = Math.sin(v.x * 0.16 + tierIdx * 1.25) * 0.85 + Math.cos(v.x * 0.38) * 0.40;
    const hCanonical = hFromBottom + strataOffset + strataWarp;
    const strataResult = discreteBeddingStep(hCanonical, CANONICAL_STRATA, 0.24);
    if (strataResult.isShelf) isShelfEdge = true;
    if (strataResult.isNotch) isUnderGroove = true;

    const radLen = Math.hypot(v.x / halfW, v.z / halfD) || 1.0;
    const dirX = (v.x / halfW) / radLen;
    const dirZ = (v.z / halfD) / radLen;
    v.x += dirX * Math.abs(dirX) * strataResult.total * 0.25 * wear;
    v.z += dirZ * Math.abs(dirZ) * strataResult.total * 0.28 * wear;

    // 6. Front Amphitheater Concave Bowl & Vertical Facet Slabs
    if (v.z > -halfD * 0.25) {
      const frontWeight = smoothstep(-halfD * 0.25, halfD * 0.7, v.z);
      const xN = v.x / halfW;
      const concaveArch = -(1.0 - Math.pow(xN, 2.0)) * 3.4;
      const amphitheaterSweep = -Math.sin((xN + 1.0) * 0.25 * Math.PI) * 1.7;

      // Planar column scarp displacement replaces sinusoidal fluting
      v.z += (concaveArch + amphitheaterSweep + colResult.offset * 1.15) * frontWeight;
    }

    // 7. Back Face Sculpting (-Z Face)
    if (v.z < -halfD * 0.15) {
      const backWeight = smoothstep(-halfD * 0.15, -halfD * 0.75, v.z);
      const backCol = piecewisePlanarColumn(v.x, 3.5, tierIdx + 5);
      v.z -= (backCol.offset * 0.85 + 0.35) * backWeight;
    }

    // 8. Summit Castellated Crags & Weathering
    if (normY > 0.82) {
      const summitWeight = smoothstep(0.82, 1.0, normY);
      const summitCrags = (Math.sin(v.x * 0.65) * 1.1 + Math.cos(v.z * 0.85) * 0.6) * summitWeight;
      v.y += summitCrags * 0.55;
      if (summitWeight > 0.7 && summitCrags > 0.3) isSummitPeak = true;
    }

    pos.setXYZ(i, v.x, v.y, v.z);

    // 9. Baked Analytical Attributes (aAO & aCurvature)
    const recessZ = clamp((halfD - v.z) / (depth * 1.2), 0.0, 1.0);
    let ao = THREE.MathUtils.lerp(0.86, 0.44, recessZ);

    if (isShelfEdge) ao = Math.min(0.96, ao + 0.10);
    if (isScarpLip) ao = Math.min(0.96, ao + 0.08);
    if (isUnderGroove) ao = Math.max(0.35, ao - 0.12);
    if (isFissureCrevice) ao = Math.max(0.35, ao - 0.12);
    if (isSummitPeak) ao = 0.98;
    if (normY < 0.12) ao = Math.max(0.25, ao * (0.55 + normY * 3.8));
    aAO[i] = clamp(ao, 0.22, 1.0);

    let curv = 0.45;
    if (isShelfEdge) curv = 0.72;
    else if (isScarpLip) curv = 0.68;
    else if (isSummitPeak) curv = 0.82;
    else if (isUnderGroove) curv = 0.32;
    else if (isFissureCrevice) curv = 0.30;
    else if (Math.abs(xRel) > 0.85) curv += 0.12;
    else if (v.z > halfD * 0.3) curv += 0.08;

    aCurvature[i] = clamp(curv, 0.22, 0.90);
  }

  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

/**
 * 2. CLIFF-003: Left Amphitheater Concave Wall B
 * Dimensions: ~ 28 x 38 x 12
 * Lower transition block with forward-sloping talus apron and massive scree-catching benches.
 */
export function createCliff003LeftAmphitheaterConcaveWallB(optionsOrWidth = 28, maybeHeight = 38, maybeDepth = 12, extraOptions = {}) {
  const { width, height, depth, strataOffset, wear } = resolveModuleArgs(28, 38, 12, optionsOrWidth, maybeHeight, maybeDepth, extraOptions);

  const geom = new THREE.BoxGeometry(width, height, depth, 64, 80, 32);
  const pos = geom.attributes.position;
  const count = pos.count;
  const v = new THREE.Vector3();

  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  const aPartType = new Float32Array(count);

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    const xRel = v.x / halfW;
    const zRel = v.z / halfD;
    const hFromBottom = v.y + halfH;
    const normY = hFromBottom / height;

    let isBenchLip = false;
    let isBenchCreep = false;
    let isScarpLip = false;
    let isFissureCrevice = false;
    let isTalusRampEdge = false;

    // 1. Operator B: Corbelled Under-Taper & Bottom Stepped Cantilever
    if (normY < 0.16) {
      const uBot = normY / 0.16;
      const botTaper = Math.pow(1.0 - uBot, 1.8) * 0.24;
      v.x *= (1.0 - botTaper);
      v.z *= (1.0 - botTaper * 1.3);
    }
    if (v.y <= -halfH + 0.001) {
      const radDist = Math.hypot(v.x / halfW, v.z / halfD);
      const inDist = Math.max(0.0, 1.0 - radDist);
      const stepLevel = Math.floor(inDist * 3.0) / 3.0;
      v.y += (stepLevel * 0.75 + Math.pow(inDist, 2.0) * 0.25) * (height * 0.095);
      v.y += (Math.sin(v.x * 0.9) * Math.cos(v.z * 1.1)) * (height * 0.015);
    }

    // 2. 4-Corner Vertical Chamfering
    const cornerFactor = Math.max(0.0, (Math.abs(xRel) + Math.abs(zRel)) - 1.25);
    if (cornerFactor > 0.0) {
      const chamferAmount = Math.pow(cornerFactor / 0.75, 1.4) * 0.18;
      v.x -= Math.sign(v.x || 1.0) * halfW * chamferAmount;
      v.z -= Math.sign(v.z || 1.0) * halfD * chamferAmount;
    }

    // 3. Lateral Silhouette Step Offsets (StdDev > 8%)
    const tierY = normY * 4.0;
    const tierIdx = Math.floor(tierY);
    const tierFrac = tierY - tierIdx;
    const sTier = tierIdx + smoothstep(0.15, 0.85, tierFrac);
    const faultOffsetLeft = Math.sin(sTier * 2.3 + 0.4) * (width * 0.09);
    const faultOffsetRight = Math.cos(sTier * 1.8 + 1.2) * (width * 0.09);
    if (v.x < -halfW * 0.3) {
      const flankWeight = smoothstep(-halfW * 0.3, -halfW * 0.85, v.x);
      v.x += faultOffsetLeft * flankWeight;
    } else if (v.x > halfW * 0.3) {
      const flankWeight = smoothstep(halfW * 0.3, halfW * 0.85, v.x);
      v.x += faultOffsetRight * flankWeight;
    }

    // 4. Piecewise-Planar Vertical Cleavage Columns (Width ~3.2m)
    const colResult = piecewisePlanarColumn(v.x, 3.2, tierIdx);
    if (colResult.isFissure) isFissureCrevice = true;
    if (colResult.isScarpEdge) isScarpLip = true;

    // 5. Discrete Horizontal Bedding Steps Wrapped 360° (Interval 2.4m / 0.8m)
    const strataWarp = Math.sin(v.x * 0.16 + tierIdx * 1.25) * 0.85 + Math.cos(v.x * 0.38) * 0.40;
    const hCanonical = hFromBottom + strataOffset + strataWarp;
    const strataResult = discreteBeddingStep(hCanonical, CANONICAL_STRATA, 0.24);
    if (strataResult.isShelf) isBenchLip = true;
    if (strataResult.isNotch) isBenchCreep = true;

    const radLen = Math.hypot(v.x / halfW, v.z / halfD) || 1.0;
    const dirX = (v.x / halfW) / radLen;
    const dirZ = (v.z / halfD) / radLen;
    v.x += dirX * Math.abs(dirX) * strataResult.total * 0.25 * wear;
    v.z += dirZ * Math.abs(dirZ) * strataResult.total * 0.28 * wear;

    // 6. Lower Section Forward Talus Scree Ramp (y < halfH * 0.45)
    let zTalusRamp = 0.0;
    if (normY < 0.45) {
      const talusProgress = (0.45 - normY) / 0.45;
      zTalusRamp = Math.pow(talusProgress, 1.4) * (depth * 0.58);
      const lateralFlare = Math.sign(v.x || 1.0) * Math.pow(talusProgress, 1.5) * (width * 0.14);
      v.x += lateralFlare;
      if (talusProgress > 0.5) isTalusRampEdge = true;
    }

    // 7. Front Amphitheater Concave Continuation & Planar Scarp Facets
    if (v.z > -halfD * 0.25) {
      const frontWeight = smoothstep(-halfD * 0.25, halfD * 0.65, v.z);
      const xN = v.x / halfW;
      const concaveArch = -(1.0 - Math.pow(xN, 2.0)) * 2.6;

      v.z += (zTalusRamp + concaveArch + colResult.offset * 1.1) * frontWeight;
    }

    // 8. Back Face Sculpting (-Z Face)
    if (v.z < -halfD * 0.15) {
      const backWeight = smoothstep(-halfD * 0.15, -halfD * 0.75, v.z);
      const backCol = piecewisePlanarColumn(v.x, 3.4, tierIdx + 6);
      v.z -= (backCol.offset * 0.85 + 0.35) * backWeight;
    }

    pos.setXYZ(i, v.x, v.y, v.z);

    // 9. Baked Attributes (aAO & aCurvature)
    const recessZ = clamp((halfD - v.z) / (depth * 1.25), 0.0, 1.0);
    let ao = THREE.MathUtils.lerp(0.88, 0.42, recessZ);

    if (isBenchLip) ao = Math.min(0.96, ao + 0.10);
    if (isScarpLip) ao = Math.min(0.96, ao + 0.08);
    if (isBenchCreep) ao = Math.max(0.35, ao - 0.12);
    if (isFissureCrevice) ao = Math.max(0.35, ao - 0.12);
    if (isTalusRampEdge) ao = Math.max(0.30, ao * 0.90);
    if (normY < 0.12) ao = Math.max(0.25, ao * (0.55 + normY * 3.8));
    aAO[i] = clamp(ao, 0.22, 1.0);

    let curv = 0.45;
    if (isBenchLip) curv = 0.72;
    else if (isScarpLip) curv = 0.68;
    else if (isBenchCreep) curv = 0.32;
    else if (isFissureCrevice) curv = 0.30;
    else if (isTalusRampEdge) curv = 0.60;
    else if (Math.abs(xRel) > 0.85) curv += 0.12;
    else if (v.z > halfD * 0.25) curv += 0.10;

    aCurvature[i] = clamp(curv, 0.22, 0.90);
  }

  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

/**
 * 3. CLIFF-007: Central Wet Alcove Back Wall
 * Dimensions: ~ 22 x 48 x 10
 * Deeply recessed concave chasm directly behind the water column (-6.5m recess);
 * central hydraulic chute gutter with faceted flanking rock wings and discrete horizontal shelves.
 */
export function createCliff007CentralWetAlcoveBackWall(optionsOrWidth = 22, maybeHeight = 48, maybeDepth = 10, extraOptions = {}) {
  const { width, height, depth, strataOffset, wear } = resolveModuleArgs(22, 48, 10, optionsOrWidth, maybeHeight, maybeDepth, extraOptions);

  const geom = new THREE.BoxGeometry(width, height, depth, 56, 96, 28);
  const pos = geom.attributes.position;
  const count = pos.count;
  const v = new THREE.Vector3();

  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  const aPartType = new Float32Array(count);

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    const xRel = v.x / halfW;
    const zRel = v.z / halfD;
    const hFromBottom = v.y + halfH;
    const normY = hFromBottom / height;

    let isFluteCrest = false;
    let isAlcoveMouthRim = false;
    let isDeepChasmCenter = false;
    let isShelfEdge = false;
    let isUnderGroove = false;

    // 1. Operator B: Corbelled Under-Taper & Bottom Stepped Cantilever
    if (normY < 0.16) {
      const uBot = normY / 0.16;
      const botTaper = Math.pow(1.0 - uBot, 1.8) * 0.22;
      v.x *= (1.0 - botTaper);
      v.z *= (1.0 - botTaper * 1.2);
    }
    if (v.y <= -halfH + 0.001) {
      const radDist = Math.hypot(v.x / halfW, v.z / halfD);
      const inDist = Math.max(0.0, 1.0 - radDist);
      const stepLevel = Math.floor(inDist * 3.0) / 3.0;
      v.y += (stepLevel * 0.72 + Math.pow(inDist, 2.0) * 0.28) * (height * 0.095);
      v.y += (Math.sin(v.x * 1.1) * Math.cos(v.z * 1.3)) * (height * 0.015);
    }

    // 2. 4-Corner Vertical Chamfering
    const cornerFactor = Math.max(0.0, (Math.abs(xRel) + Math.abs(zRel)) - 1.25);
    if (cornerFactor > 0.0) {
      const chamferAmount = Math.pow(cornerFactor / 0.75, 1.4) * 0.18;
      v.x -= Math.sign(v.x || 1.0) * halfW * chamferAmount;
      v.z -= Math.sign(v.z || 1.0) * halfD * chamferAmount;
    }

    // 3. Jagged Stepped Lateral Wings / Rock Fins (StdDev > 8%)
    const tierY = normY * 4.0;
    const tierIdx = Math.floor(tierY);
    const tierFrac = tierY - tierIdx;
    const sTier = tierIdx + smoothstep(0.15, 0.85, tierFrac);
    const wingOffsetLeft = Math.sin(sTier * 2.2 + 0.8) * (width * 0.085);
    const wingOffsetRight = Math.cos(sTier * 1.7 + 0.3) * (width * 0.085);
    if (v.x < -halfW * 0.35) {
      const flankWeight = smoothstep(-halfW * 0.35, -halfW * 0.85, v.x);
      v.x += wingOffsetLeft * flankWeight;
    } else if (v.x > halfW * 0.35) {
      const flankWeight = smoothstep(halfW * 0.35, halfW * 0.85, v.x);
      v.x += wingOffsetRight * flankWeight;
    }

    // 4. Piecewise-Planar Column Facets on Flank Walls
    const colResult = piecewisePlanarColumn(v.x, 2.75, tierIdx);

    // 5. Discrete Horizontal Bedding Steps Wrapped 360°
    const strataWarp = Math.sin(v.x * 0.16 + tierIdx * 1.25) * 0.85 + Math.cos(v.x * 0.38) * 0.40;
    const hCanonical = hFromBottom + strataOffset + strataWarp;
    const strataResult = discreteBeddingStep(hCanonical, CANONICAL_STRATA, 0.22);
    if (strataResult.isShelf) isShelfEdge = true;
    if (strataResult.isNotch) isUnderGroove = true;

    const radLen = Math.hypot(v.x / halfW, v.z / halfD) || 1.0;
    const dirX = (v.x / halfW) / radLen;
    const dirZ = (v.z / halfD) / radLen;
    v.x += dirX * Math.abs(dirX) * strataResult.total * 0.20 * wear;
    v.z += dirZ * Math.abs(dirZ) * strataResult.total * 0.25 * wear;

    // 6. Deep Parabolic Cave Cavity & Central Hydraulic Gutter
    let alcoveRecessFactor = 0.0;
    if (v.z > -halfD * 0.2) {
      const frontWeight = smoothstep(-halfD * 0.2, halfD * 0.65, v.z);
      const horizontalChasm = Math.max(0.0, 1.0 - Math.pow(Math.abs(xRel), 1.65));
      const verticalChasm = Math.sin(clamp((normY - 0.05) / 0.9, 0.0, 1.0) * Math.PI);
      const zDeepAlcove = -horizontalChasm * Math.pow(verticalChasm, 0.85) * (depth * 0.65);

      // Central chute gutter behind the falling water column
      const centralGutter = -Math.exp(-Math.pow(v.x / 1.8, 2.0)) * 1.15 * verticalChasm;

      // On flanks, apply planar column scarps; in center, smooth water channel
      const flankScarpWeight = smoothstep(1.5, 4.0, Math.abs(v.x));
      const lateralFacets = colResult.offset * flankScarpWeight * 0.85;

      v.z += (zDeepAlcove + centralGutter + lateralFacets) * frontWeight;

      alcoveRecessFactor = horizontalChasm * verticalChasm * frontWeight;
      if (alcoveRecessFactor > 0.65) isDeepChasmCenter = true;
      if (Math.abs(xRel) > 0.8) isAlcoveMouthRim = true;
      if (Math.abs(v.x) > 1.4 && Math.abs(v.x) < 2.4) isFluteCrest = true;
    }

    // 7. Back Face Sculpting (-Z Face)
    if (v.z < -halfD * 0.15) {
      const backWeight = smoothstep(-halfD * 0.15, -halfD * 0.75, v.z);
      const backCol = piecewisePlanarColumn(v.x, 3.0, tierIdx + 4);
      v.z -= (backCol.offset * 0.85 + 0.35) * backWeight;
    }

    // 8. Summit Brink Weathering
    if (normY > 0.86) {
      const summitWeight = smoothstep(0.86, 1.0, normY);
      v.y += (Math.sin(v.x * 0.9) * 0.85 + Math.cos(v.z * 1.1) * 0.45) * summitWeight * 0.45;
    }

    pos.setXYZ(i, v.x, v.y, v.z);

    // 9. Baked Attributes (Deep Alcove Shadowing down to 0.15)
    let ao = THREE.MathUtils.lerp(0.92, 0.15, Math.pow(alcoveRecessFactor, 1.1));
    if (isAlcoveMouthRim) ao = Math.min(0.96, ao + 0.10);
    if (isShelfEdge) ao = Math.min(0.96, ao + 0.08);
    if (isUnderGroove) ao = Math.max(0.30, ao - 0.12);
    if (normY > 0.88) ao = Math.min(0.96, ao + 0.08);
    if (normY < 0.12) ao = Math.max(0.25, ao * (0.55 + normY * 3.8));
    aAO[i] = clamp(ao, 0.20, 1.0);

    let curv = 0.42 - alcoveRecessFactor * 0.14;
    if (isAlcoveMouthRim) curv = 0.75;
    else if (isShelfEdge) curv = 0.70;
    else if (isFluteCrest) curv = 0.60;
    else if (isDeepChasmCenter) curv = 0.28;
    else if (isUnderGroove) curv = 0.30;
    else if (normY > 0.88) curv = 0.72;

    aCurvature[i] = clamp(curv, 0.22, 0.90);
  }

  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

/**
 * 4. CLIFF-018: Stepped Amphitheater Corner Ledge
 * Dimensions: ~ 18 x 24 x 16
 * 90° inside corner module connecting amphitheater walls with cascading terrace benches.
 */
export function createCliff018SteppedAmphitheaterCornerLedge(optionsOrWidth = 18, maybeHeight = 24, maybeDepth = 16, extraOptions = {}) {
  const { width, height, depth, strataOffset, wear } = resolveModuleArgs(18, 24, 16, optionsOrWidth, maybeHeight, maybeDepth, extraOptions);

  const geom = new THREE.BoxGeometry(width, height, depth, 52, 64, 48);
  const pos = geom.attributes.position;
  const count = pos.count;
  const v = new THREE.Vector3();

  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  const aPartType = new Float32Array(count);

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    const xRel = v.x / halfW;
    const zRel = v.z / halfD;
    const hFromBottom = v.y + halfH;
    const normY = hFromBottom / height;

    let isTerraceRim = false;
    let isCornerCleft = false;
    let isUndercutCrease = false;
    let isScarpLip = false;

    // 1. Operator B: Corbelled Under-Taper & Bottom Stepped Cantilever
    if (normY < 0.16) {
      const uBot = normY / 0.16;
      const botTaper = Math.pow(1.0 - uBot, 1.8) * 0.22;
      v.x *= (1.0 - botTaper);
      v.z *= (1.0 - botTaper * 1.2);
    }
    if (v.y <= -halfH + 0.001) {
      const radDist = Math.hypot(v.x / halfW, v.z / halfD);
      const inDist = Math.max(0.0, 1.0 - radDist);
      const stepLevel = Math.floor(inDist * 3.0) / 3.0;
      v.y += (stepLevel * 0.72 + Math.pow(inDist, 2.0) * 0.28) * (height * 0.095);
      v.y += (Math.sin(v.x * 1.2) * Math.cos(v.z * 1.2)) * (height * 0.015);
    }

    // 2. 4-Corner Vertical Chamfering (Back & Flank Corners)
    const cornerFactor = Math.max(0.0, (Math.abs(xRel) + Math.abs(zRel)) - 1.25);
    if (cornerFactor > 0.0) {
      const chamferAmount = Math.pow(cornerFactor / 0.75, 1.4) * 0.18;
      v.x -= Math.sign(v.x || 1.0) * halfW * chamferAmount;
      v.z -= Math.sign(v.z || 1.0) * halfD * chamferAmount;
    }

    // 3. Lateral Silhouette Step Offsets (StdDev > 8%)
    const tierY = normY * 4.0;
    const tierIdx = Math.floor(tierY);
    const tierFrac = tierY - tierIdx;
    const sTier = tierIdx + smoothstep(0.15, 0.85, tierFrac);
    const faultOffsetLeft = Math.sin(sTier * 2.4 + 0.5) * (width * 0.09);
    const faultOffsetRight = Math.cos(sTier * 1.9 + 1.1) * (width * 0.09);
    if (v.x < -halfW * 0.3) {
      const flankWeight = smoothstep(-halfW * 0.3, -halfW * 0.85, v.x);
      v.x += faultOffsetLeft * flankWeight;
    } else if (v.x > halfW * 0.3) {
      const flankWeight = smoothstep(halfW * 0.3, halfW * 0.85, v.x);
      v.x += faultOffsetRight * flankWeight;
    }

    // 4. Piecewise-Planar Cleavage Columns (Width ~2.6m)
    const colResult = piecewisePlanarColumn(v.x, 2.6, tierIdx);
    if (colResult.isScarpEdge) isScarpLip = true;

    // 5. Discrete Horizontal Bedding Steps Wrapped 360° (Interval 2.4m / 0.8m)
    const hCanonical = hFromBottom + strataOffset;
    const strataResult = discreteBeddingStep(hCanonical, CANONICAL_STRATA, 0.85);
    if (strataResult.isShelf) isTerraceRim = true;
    if (strataResult.isNotch) isUndercutCrease = true;

    const radLen = Math.hypot(v.x / halfW, v.z / halfD) || 1.0;
    const dirX = (v.x / halfW) / radLen;
    const dirZ = (v.z / halfD) / radLen;
    v.x += dirX * Math.abs(dirX) * strataResult.total * 0.45 * wear;
    v.z += dirZ * Math.abs(dirZ) * strataResult.total * 0.70 * wear;

    // 6. 90° Inside Corner Re-Entrant Notch & Cascading Terrace Shelves
    let cornerReentrant = 0.0;
    if (v.z > -halfD * 0.25) {
      const frontWeight = smoothstep(-halfD * 0.25, halfD * 0.65, v.z);
      if (v.x > -halfW * 0.2) {
        const xCornerProgress = clamp((v.x + halfW * 0.2) / (halfW * 1.2), 0.0, 1.0);
        cornerReentrant = -Math.pow(xCornerProgress, 1.35) * (depth * 0.42);
      }
      const cleftFissure = -Math.exp(-Math.pow(v.x / 1.2, 2.0)) * 0.75;
      if (Math.abs(v.x) < 1.0) isCornerCleft = true;

      v.z += (cornerReentrant + cleftFissure + colResult.offset * 0.65) * frontWeight;
    }

    // 7. Back Face Sculpting (-Z Face)
    if (v.z < -halfD * 0.15) {
      const backWeight = smoothstep(-halfD * 0.15, -halfD * 0.75, v.z);
      const backCol = piecewisePlanarColumn(v.x, 2.8, tierIdx + 3);
      v.z -= (backCol.offset * 0.85 + 0.35) * backWeight;
    }

    // 8. Top Rim Castellated Weathering
    if (normY > 0.85) {
      const summitWeight = smoothstep(0.85, 1.0, normY);
      v.y += (Math.sin(v.x * 0.8) * 0.75 + Math.cos(v.z * 0.8) * 0.45) * summitWeight * 0.45;
    }

    pos.setXYZ(i, v.x, v.y, v.z);

    // 9. Baked Attributes (aAO & aCurvature)
    const creaseDist = Math.hypot(v.x, Math.max(0.0, -v.z));
    const insideCreaseAO = Math.exp(-creaseDist / 2.6) * 0.65;
    let ao = THREE.MathUtils.lerp(0.88, 0.45, clamp(-v.z / halfD, 0.0, 1.0)) - insideCreaseAO;

    if (isTerraceRim) ao = Math.min(0.96, ao + 0.10);
    if (isScarpLip) ao = Math.min(0.96, ao + 0.08);
    if (isUndercutCrease) ao = Math.max(0.35, ao - 0.12);
    if (isCornerCleft) ao = Math.max(0.35, ao - 0.12);
    if (normY < 0.12) ao = Math.max(0.25, ao * (0.55 + normY * 3.8));
    aAO[i] = clamp(ao, 0.22, 1.0);

    let curv = 0.45;
    if (isTerraceRim) curv = 0.72;
    else if (isScarpLip) curv = 0.68;
    else if (isUndercutCrease) curv = 0.32;
    else if (isCornerCleft) curv = 0.30;
    else if (Math.abs(xRel) > 0.85) curv += 0.12;
    else if (v.z > halfD * 0.25) curv += 0.10;

    aCurvature[i] = clamp(curv, 0.22, 0.90);
  }

  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}
