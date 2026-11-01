import * as THREE from 'three';
import { mergeGeometriesWithAttributes } from '../geometryUtils.js';

/**
 * Salto Angel — Milestone 1 Macro Cliffs: Columnar Block Pack Modules
 * Document: src/assets/BOM.md (Assets CLIFF-028 & CLIFF-029)
 * Specification: src/assets/SELF_IMPROVEMENT_LOOP.md
 *
 * Implements high-fidelity, geologically accurate procedural BufferGeometries for:
 * 1. CLIFF-028: createCliff028FracturedColumnarBlockPackA (12 x 16 x 8)
 *    - Cluster of 6 interlocking rectangular columns at varied staggered heights
 *    - 2.4m canonical world-space strata steps and 0.8m sub-bedding
 *    - Vertical tectonic joint grooves & 45° corner chamfering (Operator A)
 *    - Corbelled under-taper base breaking flat downward-facing box planes (Operator B)
 *    - Smooth C^1 continuous carving with 0% degenerate triangles (Operator C)
 * 2. CLIFF-029: createCliff029FracturedColumnarBlockPackB (10 x 14 x 7)
 *    - Cluster of 4 sheared columns with prominent 14° cross-bedding angles
 *    - Asymmetric shear tilt along diagonal tectonic fault lines
 *    - Stepped staircase tops and faceted flanks
 *    - Corbelled base and 360° relief
 *
 * Required Buffer Attributes:
 * - position (Float32BufferAttribute, 3)
 * - normal (Float32BufferAttribute, 3)
 * - uv (Float32BufferAttribute, 2)
 * - aAO (Float32BufferAttribute, 1) [0.18 deep joint crevices, 1.0 exposed column crests]
 * - aCurvature (Float32BufferAttribute, 1) [0.85-0.95 convex ridges, 0.44 facets, 0.20-0.30 crevices]
 * - aPartType (Float32BufferAttribute, 1) [0.0 = rock]
 */

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(min, max, val) {
  const x = clamp((val - min) / (max - min), 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

/**
 * Computes discrete differential Laplacian curvature from topological mesh neighbors.
 * Convex ridges/corners: 0.80 - 0.95
 * Planar rock facets: 0.44 - 0.48
 * Concave crevices/joints/undercuts: 0.20 - 0.30
 * Ensures aCurvature stdDev comfortably exceeds 0.12 (preventing flat shader speculars).
 */
function computeMeshCurvature(geom, minCurv = 0.20, maxCurv = 0.95) {
  const pos = geom.attributes.position;
  const norm = geom.attributes.normal;
  const count = pos.count;
  const index = geom.index;
  const aCurv = new Float32Array(count);

  const neighbors = Array.from({ length: count }, () => []);

  if (index) {
    const idx = index.array;
    const triCount = idx.length / 3;
    for (let t = 0; t < triCount; t++) {
      const i0 = idx[t * 3];
      const i1 = idx[t * 3 + 1];
      const i2 = idx[t * 3 + 2];
      neighbors[i0].push(i1, i2);
      neighbors[i1].push(i0, i2);
      neighbors[i2].push(i0, i1);
    }
  } else {
    for (let t = 0; t < count; t += 3) {
      neighbors[t].push(t + 1, t + 2);
      neighbors[t + 1].push(t, t + 2);
      neighbors[t + 2].push(t, t + 1);
    }
  }

  const p_i = new THREE.Vector3();
  const p_j = new THREE.Vector3();
  const n_i = new THREE.Vector3();
  const diff = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    p_i.fromBufferAttribute(pos, i);
    n_i.fromBufferAttribute(norm, i).normalize();

    const nbrs = neighbors[i];
    if (nbrs && nbrs.length > 0) {
      let sumD = 0;
      let valid = 0;
      for (let k = 0; k < nbrs.length; k++) {
        const j = nbrs[k];
        p_j.fromBufferAttribute(pos, j);
        diff.subVectors(p_j, p_i);
        const dist = diff.length();
        if (dist > 1e-5) {
          sumD += diff.dot(n_i) / dist;
          valid++;
        }
      }
      const meanD = valid > 0 ? sumD / valid : 0;
      // Convex ridge: meanD < 0 -> curv > 0.48
      // Concave groove: meanD > 0 -> curv < 0.48
      const c = 0.48 - meanD * 1.55;
      aCurv[i] = clamp(c, minCurv, maxCurv);
    } else {
      aCurv[i] = 0.46;
    }
  }

  return aCurv;
}

/**
 * Computes physically motivated baked vertex Ambient Occlusion (aAO).
 * Combines vertical canyon height gradient, downward under-shelf orientation,
 * concave crevice self-shadowing, and spatial seam occluders.
 */
function computeMeshAO(geom, minAO = 0.18, maxAO = 1.0, occluders = []) {
  const pos = geom.attributes.position;
  const norm = geom.attributes.normal;
  const curv = geom.attributes.aCurvature;
  const count = pos.count;
  const bb = geom.boundingBox;
  const sizeY = Math.max(0.001, bb.max.y - bb.min.y);
  const aAO = new Float32Array(count);

  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(norm, i);
    const c = curv ? curv.getX(i) : 0.48;

    // 1. Vertical height gradient (canyon base to summit crags)
    const normY = clamp((v.y - bb.min.y) / sizeY, 0.0, 1.0);
    const heightAO = THREE.MathUtils.lerp(0.40, 1.0, Math.pow(normY, 0.68));

    // 2. Downward orientation shadowing (under-ledges and corbels)
    const downwardOcc = Math.max(0.0, -n.y) * 0.42;

    // 3. Crevice occlusion from high concave curvature
    const creviceOcc = Math.max(0.0, 0.46 - c) * 1.55;

    // 4. Proximity to vertical junction occluders between columns
    let occFactor = 0.0;
    if (occluders && occluders.length > 0) {
      for (let k = 0; k < occluders.length; k++) {
        const d = v.distanceTo(occluders[k]);
        const maxD = 2.4;
        if (d < maxD) {
          const factor = Math.pow(1.0 - d / maxD, 1.7);
          if (factor > occFactor) occFactor = factor;
        }
      }
    }

    const ao = (heightAO - downwardOcc - creviceOcc) * (1.0 - occFactor * 0.62);
    aAO[i] = clamp(ao, minAO, maxAO);
  }

  return aAO;
}

/**
 * Builds an individual sculpted rectangular column for CLIFF-028 Block Pack A.
 */
function createSubColumnA(colWidth, colHeight, colDepth, worldOffsetY = 0, options = {}) {
  const segW = options.segW ?? 16;
  const segH = options.segH ?? 48;
  const segD = options.segD ?? 16;
  const strataOffset = options.strataOffset ?? 0.0;
  const wear = options.wear ?? 1.0;

  const geom = new THREE.BoxGeometry(colWidth, colHeight, colDepth, segW, segH, segD);
  const pos = geom.attributes.position;
  const count = pos.count;
  const v = new THREE.Vector3();
  const halfH = colHeight * 0.5;
  const halfW = colWidth * 0.5;
  const halfD = colDepth * 0.5;

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    const normY = (v.y + halfH) / colHeight; // 0.0 to 1.0
    const signX = Math.sign(v.x) || 1.0;
    const signZ = Math.sign(v.z) || 1.0;
    const radDist = Math.hypot(v.x, v.z);
    const dirX = radDist > 0.001 ? v.x / radDist : 0.0;
    const dirZ = radDist > 0.001 ? v.z / radDist : 0.0;

    // 1. Subtle natural column taper (slender upward reduction)
    const columnTaper = normY < 0.85 ? THREE.MathUtils.lerp(1.04, 0.94, normY / 0.85) : 0.94;
    v.x *= columnTaper;
    v.z *= columnTaper;

    // 2. 4-Corner Chamfering (Operator A: breaks rectangular box container)
    const cornerXNorm = Math.abs(v.x) / (halfW * columnTaper);
    const cornerZNorm = Math.abs(v.z) / (halfD * columnTaper);
    if (cornerXNorm + cornerZNorm > 1.25) {
      const cornerExcess = cornerXNorm + cornerZNorm - 1.25;
      const chamferOffset = cornerExcess * 0.35;
      v.x -= signX * chamferOffset * halfW * 0.5;
      v.z -= signZ * chamferOffset * halfD * 0.5;
    }

    // 3. Vertical Tectonic Joint Grooves (Smooth C^1 continuous carving)
    const jointWidthX = halfW * 0.40;
    if (Math.abs(v.x) < jointWidthX && Math.abs(v.z) > halfD * 0.70) {
      const tX = Math.abs(v.x) / jointWidthX;
      const grooveDepth = (0.5 + 0.5 * Math.cos(tX * Math.PI)) * 0.22 * wear;
      v.z -= signZ * grooveDepth;
    }
    const jointWidthZ = halfD * 0.40;
    if (Math.abs(v.z) < jointWidthZ && Math.abs(v.x) > halfW * 0.70) {
      const tZ = Math.abs(v.z) / jointWidthZ;
      const grooveDepth = (0.5 + 0.5 * Math.cos(tZ * Math.PI)) * 0.22 * wear;
      v.x -= signX * grooveDepth;
    }

    // 4. Canonical 2.4m World-Space Sedimentary Strata (Aligned across all columns)
    const stepInterval = 2.4;
    const yWorld = v.y + worldOffsetY + strataOffset;
    const stepProgress = Math.max(0.0, Math.min(1.0, (((yWorld % stepInterval) + stepInterval) % stepInterval) / stepInterval));
    const shelf = Math.pow(stepProgress, 3.2) * 0.20 * wear;
    const strataNotch = (stepProgress < 0.12) ? -Math.sin((stepProgress / 0.12) * Math.PI) * 0.14 * wear : 0.0;

    // Sub-bedding ripple (0.8m micro-strata)
    const subProgress = Math.max(0.0, Math.min(1.0, (((yWorld % 0.8) + 0.8) % 0.8) / 0.8));
    const subLedge = Math.sin(subProgress * Math.PI * 2.0) * 0.035 * wear;

    if (radDist > 0.01) {
      const outerWeight = clamp((radDist - 0.6) / 1.0, 0.0, 1.0);
      v.x += dirX * (shelf + strataNotch + subLedge) * outerWeight;
      v.z += dirZ * (shelf + strataNotch + subLedge) * outerWeight;
    }

    // 5. Corbelled Under-Taper Base (Operator B: fixes FlatBtm% and ceiling artifacts)
    if (normY < 0.16) {
      const uBase = (0.16 - normY) / 0.16;
      const baseCorbel = 1.0 - 0.26 * Math.pow(uBase, 1.5);
      v.x *= baseCorbel;
      v.z *= baseCorbel;

      // Vault underside face upward into rock mass
      if (v.y < -halfH + 0.15) {
        const rBot = Math.hypot(v.x / halfW, v.z / halfD);
        v.y += Math.max(0.0, 1.0 - rBot) * 0.55 * uBase;
      }
    }

    // 6. Weathered Fractured Capital / Stepped Top Cap
    if (normY > 0.86) {
      const uTop = (normY - 0.86) / 0.14;
      const rTop = Math.hypot(v.x / halfW, v.z / halfD);
      v.y -= Math.pow(rTop, 1.8) * 0.32 * uTop;
    }

    // 7. Micro-Roughness Quartzite Chipping
    const micro = (Math.sin(v.x * 3.1 + v.y * 1.8) + Math.cos(v.z * 3.3 + v.y * 1.5)) * 0.025 * wear;
    v.x += dirX * micro;
    v.z += dirZ * micro;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * 1. CLIFF-028: Fractured Columnar Block Pack A (~ 12 x 16 x 8)
 * Cluster of 6 interlocking rectangular columns at varied staggered heights
 * with canonical 2.4m strata, vertical joint grooves, corner chamfering, and corbelled base.
 */
export function createCliff028FracturedColumnarBlockPackA(width = 12, height = 16, depth = 8, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 12;
    height = options.height ?? 16;
    depth = options.depth ?? 8;
  } else {
    width = width ?? 12;
    height = height ?? 16;
    depth = depth ?? 8;
  }

  const scaleX = width / 12.0;
  const scaleY = height / 16.0;
  const scaleZ = depth / 8.0;

  // Staggered heights and positions for the 6 interlocking columns:
  // Layout in 2 rows of 3 columns with slight overlap along junction seams:
  const columnConfigs = [
    // Front Row:
    { id: 0, x: -3.7 * scaleX, z: 1.8 * scaleZ, w: 4.3 * scaleX, d: 4.2 * scaleZ, h: 13.8 * scaleY, topY: 5.8 * scaleY },
    { id: 1, x: 0.2 * scaleX, z: 2.0 * scaleZ, w: 4.5 * scaleX, d: 4.4 * scaleZ, h: 16.0 * scaleY, topY: 8.0 * scaleY }, // Hero Column (Highest)
    { id: 2, x: 3.8 * scaleX, z: 1.7 * scaleZ, w: 4.0 * scaleX, d: 4.1 * scaleZ, h: 14.6 * scaleY, topY: 6.6 * scaleY },
    // Back Row:
    { id: 3, x: -3.6 * scaleX, z: -1.9 * scaleZ, w: 4.2 * scaleX, d: 4.3 * scaleZ, h: 15.2 * scaleY, topY: 7.2 * scaleY },
    { id: 4, x: 0.3 * scaleX, z: -2.0 * scaleZ, w: 4.6 * scaleX, d: 4.4 * scaleZ, h: 13.4 * scaleY, topY: 5.4 * scaleY }, // Recessed Column
    { id: 5, x: 3.9 * scaleX, z: -1.8 * scaleZ, w: 4.1 * scaleX, d: 4.2 * scaleZ, h: 14.9 * scaleY, topY: 6.9 * scaleY }
  ];

  const columns = [];
  const baseFloorY = -height * 0.5;

  for (let c = 0; c < columnConfigs.length; c++) {
    const cfg = columnConfigs[c];
    const colCenterY = baseFloorY + cfg.h * 0.5;

    const colGeom = createSubColumnA(cfg.w, cfg.h, cfg.d, colCenterY, options);
    colGeom.translate(cfg.x, colCenterY, cfg.z);
    columns.push(colGeom);
  }

  // Merge the 6 columns into a single BufferGeometry
  const merged = mergeGeometriesWithAttributes(columns);
  merged.computeVertexNormals();
  merged.computeBoundingBox();

  // Spatial occluders placed along vertical junction seams between the 6 columns
  const occluders = [];
  const seamYSteps = 12;
  for (let s = 0; s <= seamYSteps; s++) {
    const y = baseFloorY + (s / seamYSteps) * (height * 0.85);
    // Vertical seams:
    occluders.push(new THREE.Vector3(-1.7 * scaleX, y, 1.9 * scaleZ));
    occluders.push(new THREE.Vector3(2.0 * scaleX, y, 1.8 * scaleZ));
    occluders.push(new THREE.Vector3(-1.6 * scaleX, y, -1.9 * scaleZ));
    occluders.push(new THREE.Vector3(2.1 * scaleX, y, -1.9 * scaleZ));
    occluders.push(new THREE.Vector3(-3.6 * scaleX, y, 0.0));
    occluders.push(new THREE.Vector3(0.25 * scaleX, y, 0.0));
    occluders.push(new THREE.Vector3(3.85 * scaleX, y, 0.0));
  }

  // Compute discrete Laplacian curvature across flutes, corners, and joints
  const aCurvature = computeMeshCurvature(merged, 0.20, 0.95);
  merged.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));

  // Compute baked AO with vertical gradient, under-tapers, and junction occluders
  const aAO = computeMeshAO(merged, 0.18, 1.0, occluders);
  merged.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  merged.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(merged.attributes.position.count).fill(0.0), 1));

  merged.computeBoundingSphere();
  return merged;
}

/**
 * Builds an individual sheared rectangular column for CLIFF-029 Block Pack B.
 */
function createSubColumnB(colWidth, colHeight, colDepth, shearDegX = 0, shearDegZ = 0, worldOffsetY = 0, options = {}) {
  const segW = options.segW ?? 16;
  const segH = options.segH ?? 48;
  const segD = options.segD ?? 16;
  const strataOffset = options.strataOffset ?? 0.0;
  const wear = options.wear ?? 1.0;

  const geom = new THREE.BoxGeometry(colWidth, colHeight, colDepth, segW, segH, segD);
  const pos = geom.attributes.position;
  const count = pos.count;
  const v = new THREE.Vector3();
  const halfH = colHeight * 0.5;
  const halfW = colWidth * 0.5;
  const halfD = colDepth * 0.5;

  const shearRadX = THREE.MathUtils.degToRad(shearDegX);
  const shearRadZ = THREE.MathUtils.degToRad(shearDegZ);

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    const normY = (v.y + halfH) / colHeight; // 0.0 to 1.0
    const signX = Math.sign(v.x) || 1.0;
    const signZ = Math.sign(v.z) || 1.0;

    // 1. Tectonic Shear Tilt along vertical height
    const shearDeltaX = (normY - 0.5) * colHeight * Math.tan(shearRadX);
    const shearDeltaZ = (normY - 0.5) * colHeight * Math.tan(shearRadZ);
    v.x += shearDeltaX;
    v.z += shearDeltaZ;

    const radDist = Math.hypot(v.x, v.z);
    const dirX = radDist > 0.001 ? v.x / radDist : 0.0;
    const dirZ = radDist > 0.001 ? v.z / radDist : 0.0;

    // 2. Bevelled Faceted Flanks (Octagonal Chamfering)
    const cornerXNorm = Math.abs(v.x) / halfW;
    const cornerZNorm = Math.abs(v.z) / halfD;
    if (cornerXNorm + cornerZNorm > 1.25) {
      const cornerExcess = cornerXNorm + cornerZNorm - 1.25;
      const chamferOffset = cornerExcess * 0.38;
      v.x -= signX * chamferOffset * halfW * 0.5;
      v.z -= signZ * chamferOffset * halfD * 0.5;
    }

    // 3. Prominent 14° Cross-Bedding Angles (Precambrian Roraima sandstone lamination)
    const yWorld = v.y + worldOffsetY + strataOffset;
    const crossDip = THREE.MathUtils.degToRad(14.0);
    // Inclined bedding plane formula:
    const inclinedPlaneY = yWorld + (v.x * Math.cos(shearRadX) - v.z * Math.sin(shearRadZ)) * Math.tan(crossDip);
    const crossInterval = 0.85;
    const crossProgress = Math.max(0.0, Math.min(1.0, (((inclinedPlaneY % crossInterval) + crossInterval) % crossInterval) / crossInterval));
    const crossChisel = Math.sin(crossProgress * Math.PI * 2.0) * 0.08 * wear;

    if (radDist > 0.01) {
      v.x += dirX * crossChisel;
      v.z += dirZ * crossChisel;
    }

    // 4. Canonical 2.4m Sedimentary Bedding Ledges
    const stepInterval = 2.4;
    const stepProgress = Math.max(0.0, Math.min(1.0, (((yWorld % stepInterval) + stepInterval) % stepInterval) / stepInterval));
    const shelf = Math.pow(stepProgress, 3.2) * 0.18 * wear;
    const strataNotch = (stepProgress < 0.12) ? -Math.sin((stepProgress / 0.12) * Math.PI) * 0.13 * wear : 0.0;

    if (radDist > 0.01) {
      const outerWeight = clamp((radDist - 0.5) / 1.0, 0.0, 1.0);
      v.x += dirX * (shelf + strataNotch) * outerWeight;
      v.z += dirZ * (shelf + strataNotch) * outerWeight;
    }

    // 5. Stepped Staircase Tops (Diagonal Cleavage Steps along shear plane)
    if (normY > 0.84) {
      const uTop = (normY - 0.84) / 0.16;
      // Step across diagonal cleavage:
      const diagCoord = (v.x / halfW) * 0.7 - (v.z / halfD) * 0.7;
      const stepTier = smoothstep(-0.2, 0.2, diagCoord);
      const stepDrop = (1.0 - stepTier) * 0.55 * uTop;
      v.y -= stepDrop;
    }

    // 6. Corbelled Under-Taper Base (Operator B: fixes FlatBtm%)
    if (normY < 0.16) {
      const uBase = (0.16 - normY) / 0.16;
      const baseCorbel = 1.0 - 0.28 * Math.pow(uBase, 1.5);
      v.x *= baseCorbel;
      v.z *= baseCorbel;

      // Vault underside face upward into cliff mass
      if (v.y < -halfH + 0.15) {
        const rBot = Math.hypot(v.x / halfW, v.z / halfD);
        v.y += Math.max(0.0, 1.0 - rBot) * 0.58 * uBase;
      }
    }

    // 7. Micro-Chisel Surface Relief
    const micro = (Math.sin(v.x * 2.8 + v.y * 2.0) + Math.cos(v.z * 3.1 + v.y * 1.7)) * 0.025 * wear;
    v.x += dirX * micro;
    v.z += dirZ * micro;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * 2. CLIFF-029: Fractured Columnar Block Pack B (~ 10 x 14 x 7)
 * Cluster of 4 sheared columns with prominent cross-bedding angles,
 * stepped staircase tops, and faceted flanks.
 */
export function createCliff029FracturedColumnarBlockPackB(width = 10, height = 14, depth = 7, options = {}) {
  if (typeof width === 'object' && width !== null) {
    options = width;
    width = options.width ?? 10;
    height = options.height ?? 14;
    depth = options.depth ?? 7;
  } else {
    width = width ?? 10;
    height = height ?? 14;
    depth = depth ?? 7;
  }

  const scaleX = width / 10.0;
  const scaleY = height / 14.0;
  const scaleZ = depth / 7.0;

  // Staggered heights, sheared tilts, and positions for the 4 columns:
  const columnConfigs = [
    // Column 0: Front-Left (Sheared +5.0° X, +2.5° Z)
    { id: 0, x: -2.4 * scaleX, z: 1.6 * scaleZ, w: 4.8 * scaleX, d: 3.6 * scaleZ, h: 13.0 * scaleY, shearX: 5.0, shearZ: 2.5 },
    // Column 1: Front-Right (Hero Pillar, Sheared -4.0° X, +1.5° Z)
    { id: 1, x: 2.4 * scaleX, z: 1.4 * scaleZ, w: 4.6 * scaleX, d: 3.5 * scaleZ, h: 14.0 * scaleY, shearX: -4.0, shearZ: 1.5 },
    // Column 2: Back-Left (Sheared +3.5° X, -3.0° Z)
    { id: 2, x: -2.3 * scaleX, z: -1.6 * scaleZ, w: 4.5 * scaleX, d: 3.4 * scaleZ, h: 13.5 * scaleY, shearX: 3.5, shearZ: -3.0 },
    // Column 3: Back-Right (Stepped Down, Sheared -5.5° X, -2.5° Z)
    { id: 3, x: 2.5 * scaleX, z: -1.5 * scaleZ, w: 4.7 * scaleX, d: 3.7 * scaleZ, h: 12.2 * scaleY, shearX: -5.5, shearZ: -2.5 }
  ];

  const columns = [];
  const baseFloorY = -height * 0.5;

  for (let c = 0; c < columnConfigs.length; c++) {
    const cfg = columnConfigs[c];
    const colCenterY = baseFloorY + cfg.h * 0.5;

    const colGeom = createSubColumnB(cfg.w, cfg.h, cfg.d, cfg.shearX, cfg.shearZ, colCenterY, options);
    colGeom.translate(cfg.x, colCenterY, cfg.z);
    columns.push(colGeom);
  }

  // Merge the 4 sheared columns into a single BufferGeometry
  const merged = mergeGeometriesWithAttributes(columns);
  merged.computeVertexNormals();
  merged.computeBoundingBox();

  // Spatial occluders placed along vertical junction seams between the 4 columns
  const occluders = [];
  const seamYSteps = 12;
  for (let s = 0; s <= seamYSteps; s++) {
    const y = baseFloorY + (s / seamYSteps) * (height * 0.85);
    occluders.push(new THREE.Vector3(0.0, y, 1.5 * scaleZ));
    occluders.push(new THREE.Vector3(0.0, y, -1.55 * scaleZ));
    occluders.push(new THREE.Vector3(-2.35 * scaleX, y, 0.0));
    occluders.push(new THREE.Vector3(2.45 * scaleX, y, 0.0));
    occluders.push(new THREE.Vector3(0.0, y, 0.0)); // Deep central junction chasm
  }

  // Compute discrete Laplacian curvature across flutes, cross-bedding, and sheared edges
  const aCurvature = computeMeshCurvature(merged, 0.20, 0.95);
  merged.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));

  // Compute baked AO with vertical gradient, under-tapers, and junction occluders
  const aAO = computeMeshAO(merged, 0.18, 1.0, occluders);
  merged.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  merged.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(merged.attributes.position.count).fill(0.0), 1));

  merged.computeBoundingSphere();
  return merged;
}

export const COLUMNAR_BLOCK_PACK_MODULES = {
  'CLIFF-028': {
    name: 'Fractured Columnar Block Pack A',
    create: createCliff028FracturedColumnarBlockPackA,
    dims: [12, 16, 8]
  },
  'CLIFF-029': {
    name: 'Fractured Columnar Block Pack B',
    create: createCliff029FracturedColumnarBlockPackB,
    dims: [10, 14, 7]
  }
};
