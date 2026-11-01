import * as THREE from 'three';
import tepuiVert from '../../shaders/tepui.vert';
import tepuiFrag from '../../shaders/tepui.frag';

/**
 * Salto Angel — Milestone 1 Macro Cliffs: Pinnacles, Hoodoos, Arches & Crests Family
 *
 * Implements high-fidelity, geologically accurate procedural BufferGeometries for:
 * 1. CLIFF-022: createCliff022WeatheredQuartziteCorniceArch (10 x 6 x 6)
 * 2. CLIFF-023: createCliff023MushroomRockPinnacleHoodoo (4 x 8 x 4)
 * 3. CLIFF-030: createCliff030HangingOverhangCeilingWedge (12 x 6 x 10)
 * 4. CLIFF-034: createCliff034PlateauRimSkylineNotchedCrest (24 x 6 x 8)
 *
 * Geological Upgrade Operators Applied (src/assets/SELF_IMPROVEMENT_LOOP.md):
 * - Operator A: 360° Perimeter Strata & 4-Corner Chamfering (Relief > 0.08 on all faces)
 * - Operator B: Corbelled Under-Tapers & Vaulted Undersides (FlatBtm% < 5%, 0% flat box bottoms)
 * - Operator C: Smooth C^1 Continuous Carving without Coordinate Clamping (0.00% degenerate tris)
 * - Operator D: Canonical 2.4m Sedimentary Bedding Grid with 0.8m Sub-Bedding
 * - Topological Discrete Laplacian Curvature (aCurvature stdDev > 0.14)
 * - Physically Motivated Baked Vertex AO (aAO stdDev > 0.16)
 */

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function parseParams(w, h, d, defW, defH, defD, opt) {
  if (typeof w === 'object' && w !== null) {
    return {
      width: w.width ?? defW,
      height: w.height ?? defH,
      depth: w.depth ?? defD,
      options: w
    };
  }
  return {
    width: w ?? defW,
    height: h ?? defH,
    depth: d ?? defD,
    options: opt ?? {}
  };
}

/**
 * Computes discrete Laplacian curvature from topological mesh neighbors.
 * Convex ridges/corners: 0.78 - 0.95
 * Planar rock facets: 0.45 - 0.48
 * Concave crevices/flutes/undercuts: 0.20 - 0.32
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
      const c = 0.48 - meanD * 1.6;
      aCurv[i] = clamp(c, minCurv, maxCurv);
    } else {
      aCurv[i] = 0.48;
    }
  }

  return aCurv;
}

/**
 * Computes physically motivated baked vertex Ambient Occlusion (aAO).
 * Combines vertical canyon height gradient, downward under-shelf orientation,
 * concave crevice self-shadowing, and spatial occluders.
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

    // 1. Vertical height gradient (canyon floor to summit exposure)
    const normY = clamp((v.y - bb.min.y) / sizeY, 0.0, 1.0);
    const heightAO = THREE.MathUtils.lerp(0.35, 1.0, Math.pow(normY, 0.65));

    // 2. Downward orientation shadowing (under-ledges and corbels)
    const downwardOcc = Math.max(0.0, -n.y) * 0.44;

    // 3. Crevice occlusion from concave curvature (c < 0.45)
    const creviceOcc = Math.max(0.0, 0.45 - c) * 1.65;

    // 4. Proximity to occluders
    let occFactor = 0.0;
    if (occluders && occluders.length > 0) {
      for (const occ of occluders) {
        const d = v.distanceTo(occ);
        const maxD = 3.0;
        if (d < maxD) {
          occFactor = Math.max(occFactor, Math.pow(1.0 - d / maxD, 1.6));
        }
      }
    }

    const ao = (heightAO - downwardOcc - creviceOcc) * (1.0 - occFactor * 0.55);
    aAO[i] = clamp(ao, minAO, maxAO);
  }

  return aAO;
}

// =============================================================================
// 1. CLIFF-022: Weathered Quartzite Cornice Arch (10m x 6m x 6m)
// =============================================================================
/**
 * Creates CLIFF-022 Weathered Quartzite Cornice Arch.
 * Weathered natural stone bridge / lintel spanning a vertical grieta near the rim;
 * hollowed underside parabolic opening with dished vault ceiling and rugged top surface.
 *
 * @param {number} [w=10] - Width (10m)
 * @param {number} [h=6]  - Height (6m)
 * @param {number} [d=6]  - Depth (6m)
 * @param {Object} [opt]  - Configuration options
 * @returns {THREE.BufferGeometry}
 */
export function createCliff022WeatheredQuartziteCorniceArch(w = 10, h = 6, d = 6, opt = {}) {
  const { width, height, depth, options } = parseParams(w, h, d, 10, 6, 6, opt);

  const widthSeg = options.widthSeg ?? 48;
  const heightSeg = options.heightSeg ?? 36;
  const depthSeg = options.depthSeg ?? 36;
  const strataOffset = options.strataOffset ?? 0.0;
  const wear = options.wear ?? 1.0;

  const geom = new THREE.BoxGeometry(width, height, depth, widthSeg, heightSeg, depthSeg);
  const pos = geom.attributes.position;
  const count = pos.count;

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;
  const v = new THREE.Vector3();

  // Arch span and apex configuration
  const archSpanX = halfW * 0.62; // 6.2m wide opening between piers

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    let curX = v.x;
    let curY = v.y;
    let curZ = v.z;

    const yRel = curY + halfH;
    const normY = yRel / height;
    const signX = Math.sign(curX) || 1.0;
    const signZ = Math.sign(curZ) || 1.0;
    const uX = Math.abs(curX) / halfW;
    const uZ = Math.abs(curZ) / halfD;

    // 1. Cornice Overhang & Abutment Flank Taper (Silhouette Profile)
    if (normY > 0.78) {
      const uTop = (normY - 0.78) / 0.22;
      const flare = Math.sin(uTop * Math.PI * 0.5) * 0.16;
      curX *= (1.0 + flare);
      curZ *= (1.0 + flare * 1.2);
    } else if (normY >= 0.25 && normY <= 0.70) {
      const uMid = Math.sin(((normY - 0.25) / 0.45) * Math.PI);
      curX *= (1.0 - uMid * 0.08);
      curZ *= (1.0 - uMid * 0.09);
    } else if (normY < 0.22) {
      const uBot = (0.22 - normY) / 0.22;
      curX *= (1.0 + uBot * 0.05);
      curZ *= (1.0 + uBot * 0.06);
    }

    // 2. Corner Chamfering (Operator A)
    const cornerFactor = Math.max(0.0, (uX + uZ - 1.25) / 0.75);
    if (cornerFactor > 0.0) {
      const chamfer = cornerFactor * 0.35;
      curX -= signX * chamfer * halfW * 0.40;
      curZ -= signZ * chamfer * halfD * 0.40;
    }

    // 3. Smooth Parabolic Arch Undertunnel Vaulting (Dished Ceiling, Operator C)
    const tx = clamp(Math.abs(curX) / archSpanX, 0.0, 1.0);
    const archX = 0.5 * (1.0 + Math.cos(Math.PI * tx)); // C1 smooth cosine bell
    const tz = clamp(Math.abs(curZ) / halfD, 0.0, 1.0);
    const dishedZ = 1.0 - 0.18 * (tz * tz);
    const uVault = 0.56 * archX * dishedZ;

    // Strictly monotonic vertical upward diffeomorphism (du'/du >= 0.44 > 0)
    const uy = (curY + halfH) / height;
    const uyNew = uVault + (1.0 - uVault) * uy;
    curY = -halfH + height * uyNew;

    // Arch vault ceiling horizontal strata ribbing
    if (archX > 0.05) {
      const rib = Math.sin(curY * 4.0 + curZ * 1.5) * 0.06 * archX;
      curY += rib;
    }

    // 4. Pier Footing Underside Faceting & Corbels (Operator B - Worm's-Eye Integrity)
    if (normY < 0.20 && Math.abs(curX) >= archSpanX * 0.85) {
      const uBase = (0.20 - normY) / 0.20;
      curX *= (1.0 - 0.18 * uBase * uBase);
      curZ *= (1.0 - 0.18 * uBase * uBase);
      if (v.y < -halfH + 0.15) {
        const deltaYBot = (Math.sin(curX * 2.5) * Math.cos(curZ * 2.5) * 0.35 + 0.38) * uBase;
        curY += deltaYBot;
      }
    }

    // 5. Canonical 2.4m Strata Steps across 360° Perimeter (Operator D & A)
    const yStrata = curY + halfH + strataOffset;
    const stepProg = (((yStrata % 2.4) + 2.4) % 2.4) / 2.4;
    const shelf = Math.pow(stepProg, 3.4) * 0.28 * wear;
    const notch = (stepProg < 0.14) ? -Math.sin((stepProg / 0.14) * Math.PI) * 0.16 * wear : 0.0;
    const subBed = Math.sin(yStrata * (Math.PI * 2.0 / 0.8)) * 0.04;
    const strataRelief = shelf + notch + subBed;

    if (curZ > halfD * 0.30) {
      curZ += strataRelief * 0.75;
    }
    if (curZ < -halfD * 0.30) {
      curZ -= strataRelief * 0.70;
      const backJoint = Math.sin(curX * 2.4) * 0.15 * THREE.MathUtils.smoothstep(-curZ / halfD, 0.4, 0.9);
      curZ -= backJoint;
    }
    if (Math.abs(curX) > halfW * 0.50) {
      curX += signX * strataRelief * 0.65;
      const flankJoint = Math.sin(curZ * 2.4) * 0.14;
      curX += signX * flankJoint;
    }

    // 6. Summit Lintel Roadway Weathering (Rugged Top Surface)
    if (curY > halfH - 0.50) {
      const uTopSurf = clamp((curY - (halfH - 0.50)) / 0.50, 0.0, 1.0);
      const dPan = Math.hypot(curX / 2.2, curZ / 1.6);
      if (dPan < 1.0) {
        const panCurve = 0.5 * (1.0 + Math.cos(Math.PI * dPan));
        curY -= panCurve * 0.32 * uTopSurf;
      }
      curY += (Math.sin(curX * 3.5 + 1.2) * Math.cos(curZ * 3.5)) * 0.08 * uTopSurf;
    }

    pos.setXYZ(i, curX, curY, curZ);
  }

  geom.computeVertexNormals();
  geom.computeBoundingBox();

  const aCurvature = computeMeshCurvature(geom, 0.20, 0.95);
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));

  const archCenterOccluder = new THREE.Vector3(0, 0.5, 0);
  const aAO = computeMeshAO(geom, 0.18, 1.0, [archCenterOccluder]);
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(count).fill(0.0), 1));

  geom.computeBoundingSphere();
  return geom;
}

// =============================================================================
// 2. CLIFF-023: Mushroom Rock Pinnacle Hoodoo -> Tabular Columnar Pilaster / Hoodoo (4m x 8m x 4m)
// =============================================================================
/**
 * Creates CLIFF-023 Mushroom Rock Pinnacle Hoodoo (Re-sculpted as Flat-Topped Tabular Pilaster Hoodoo).
 * Replaces the hourglass goblet waist pinch (R=0.52) and summit dome bump with a monumental
 * squared jointed tabular pilaster sitting strictly flush with the flat Auyán-tepui plateau rim.
 * Features 2-tier stepped tabular architecture, canonical 2.4m strata ledges, and zero skyline bumps.
 *
 * @param {number} [w=4] - Width (4m)
 * @param {number} [h=8] - Height (8m)
 * @param {number} [d=4] - Depth (4m)
 * @param {Object} [opt] - Configuration options
 * @returns {THREE.BufferGeometry}
 */
export function createCliff023MushroomRockPinnacleHoodoo(w = 4, h = 8, d = 4, opt = {}) {
  const { width, height, depth, options } = parseParams(w, h, d, 4, 8, 4, opt);

  const widthSeg = options.widthSeg ?? 36;
  const heightSeg = options.heightSeg ?? 56;
  const depthSeg = options.depthSeg ?? 36;
  const strataOffset = options.strataOffset ?? 0.0;
  const wear = options.wear ?? 1.0;

  const geom = new THREE.BoxGeometry(width, height, depth, widthSeg, heightSeg, depthSeg);
  const pos = geom.attributes.position;
  const count = pos.count;

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    let curX = v.x;
    let curY = v.y;
    let curZ = v.z;

    const yRel = curY + halfH;
    const normY = yRel / height;
    const signX = Math.sign(curX) || 1.0;
    const signZ = Math.sign(curZ) || 1.0;
    const radDist = Math.hypot(curX, curZ);
    const theta = Math.atan2(curZ, curX);

    // 1. Tabular Stepped Pilaster Profile (NO goblet waist pinch, NO mushroom flare)
    // Tier 1 (normY < 0.18): Base corbel under-taper (0.78x)
    // Tier 2 (0.18 <= normY < 0.52): Lower squared pilaster body (1.02x)
    // Tier 3 (0.52 <= normY <= 1.0): Upper tabular pilaster flush with plateau tabletop (0.92x)
    let tierScale;
    if (normY < 0.18) {
      const uBot = (0.18 - normY) / 0.18;
      tierScale = 1.0 - 0.22 * Math.pow(uBot, 1.5);

      // Vault underside upward to eliminate flat bottom slab
      if (v.y < -halfH + 0.15) {
        const rNorm = clamp(radDist / (halfW * 0.9), 0.0, 1.0);
        curY += (1.0 - rNorm * rNorm) * 0.52 * uBot + Math.sin(theta * 4.0) * 0.08 * uBot;
      }
    } else if (normY < 0.52) {
      tierScale = 1.02;
    } else {
      tierScale = 0.92;
    }

    curX *= tierScale;
    curZ *= tierScale;

    // 2. Polygonal Columnar Flutes & 4-Corner Chamfers (Operator A)
    const flute = Math.cos(theta * 4.0) * 0.08;
    curX += Math.cos(theta) * flute * tierScale;
    curZ += Math.sin(theta) * flute * tierScale;

    const corner = Math.max(0.0, (Math.abs(curX) / (halfW * tierScale) + Math.abs(curZ) / (halfD * tierScale) - 1.25) / 0.75);
    curX -= signX * corner * 0.18;
    curZ -= signZ * corner * 0.18;

    // 3. Canonical 2.4m Strata Steps across 360° Perimeter (Operator D)
    const yStrata = curY + halfH + strataOffset;
    const stepProg = (((yStrata % 2.4) + 2.4) % 2.4) / 2.4;
    const strataRelief = (Math.pow(stepProg, 3.4) * 0.22 - ((stepProg < 0.14) ? Math.sin((stepProg / 0.14) * Math.PI) * 0.12 : 0.0)) * wear;
    curX += Math.cos(theta) * strataRelief * 0.65;
    curZ += Math.sin(theta) * strataRelief * 0.65;

    // 4. Strictly Flat Tabular Tabletop (NO dome protrusion, NO skyline turret bumps)
    // Top surface sits strictly flush at curY <= halfH with subtle downward solution etching
    if (curY >= halfH - 0.05) {
      curY = halfH; // Strictly flush with the horizontal plateau tabletop
      const rTop = clamp(radDist / (halfW * 0.9), 0.0, 1.0);
      if (rTop < 0.55) {
        // Downward solution pan etching only (never upward!)
        curY -= 0.5 * (1.0 + Math.cos(Math.PI * (rTop / 0.55))) * 0.04;
      }
    }

    pos.setXYZ(i, curX, curY, curZ);
  }

  geom.computeVertexNormals();
  geom.computeBoundingBox();

  const aCurvature = computeMeshCurvature(geom, 0.20, 0.95);
  geom.setAttribute("aCurvature", new THREE.BufferAttribute(aCurvature, 1));

  const hoodooNeckOccluder = new THREE.Vector3(0, halfH * 0.20, 0);
  const aAO = computeMeshAO(geom, 0.16, 1.0, [hoodooNeckOccluder]);
  geom.setAttribute("aAO", new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute("aPartType", new THREE.BufferAttribute(new Float32Array(count).fill(0.0), 1));

  geom.computeBoundingSphere();
  return geom;
}

// =============================================================================
// 3. CLIFF-030: Hanging Overhang Ceiling Wedge (12m x 6m x 10m)
// =============================================================================
/**
 * Creates CLIFF-030 Hanging Overhang Ceiling Wedge.
 * Inverted pyramid / wedge ceiling module for deep chasm shadow cavities with faceted corbels
 * and downward-pointing stalactitic stone teeth.
 *
 * @param {number} [w=12] - Width (12m)
 * @param {number} [h=6]  - Height (6m)
 * @param {number} [d=10] - Depth (10m)
 * @param {Object} [opt]  - Configuration options
 * @returns {THREE.BufferGeometry}
 */
export function createCliff030HangingOverhangCeilingWedge(w = 12, h = 6, d = 10, opt = {}) {
  const { width, height, depth, options } = parseParams(w, h, d, 12, 6, 10, opt);

  const widthSeg = options.widthSeg ?? 52;
  const heightSeg = options.heightSeg ?? 36;
  const depthSeg = options.depthSeg ?? 44;
  const strataOffset = options.strataOffset ?? 0.0;
  const wear = options.wear ?? 1.0;

  const geom = new THREE.BoxGeometry(width, height, depth, widthSeg, heightSeg, depthSeg);
  const pos = geom.attributes.position;
  const count = pos.count;

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    let curX = v.x;
    let curY = v.y;
    let curZ = v.z;

    const yRel = curY + halfH;
    const normY = yRel / height;
    const signX = Math.sign(curX) || 1.0;
    const signZ = Math.sign(curZ) || 1.0;

    // 1. Blocky Cantilever Ceiling Wedge Profile (Recessed Under-Vault)
    const uWedge = Math.pow(normY, 0.65);
    const scaleX = THREE.MathUtils.lerp(0.68, 1.0, uWedge);
    const scaleZ = THREE.MathUtils.lerp(0.70, 1.0, uWedge);
    curX *= scaleX;
    curZ *= scaleZ;

    // 2. Faceted Diagonal Ridge Keels & Corner Chamfers (Operator A)
    const uX = Math.abs(curX) / (halfW * scaleX);
    const uZ = Math.abs(curZ) / (halfD * scaleZ);
    const corner = Math.max(0.0, (uX + uZ - 1.22) / 0.78);
    curX -= signX * corner * halfW * 0.22 * scaleX;
    curZ -= signZ * corner * halfD * 0.22 * scaleZ;

    // 3. Stepped Horizontal Quartzite Under-Corbels (NO hanging carrot/stalactite teeth)
    if (normY < 0.35) {
      const uBot = (0.35 - normY) / 0.35;
      const stepCorbel = Math.floor(uBot * 3.0) / 3.0;
      curZ -= stepCorbel * (depth * 0.18);
      curX *= (1.0 - stepCorbel * 0.15);
    }

    // Underside faceting (FlatBtm% < 1%)
    if (v.y < -halfH + 0.15) {
      curY += (Math.sin(curX * 3.0) * Math.sin(curZ * 3.0) - 0.35) * 0.32;
    }

    // 4. Faceted Corbels & Sedimentary Strata on Wedge Flanks (Operator D & A)
    const yStrata = curY + halfH + strataOffset;
    const stepProg = (((yStrata % 2.4) + 2.4) % 2.4) / 2.4;
    const strataRelief = (Math.pow(stepProg, 3.4) * 0.32 - ((stepProg < 0.14) ? Math.sin((stepProg / 0.14) * Math.PI) * 0.16 : 0.0)) * wear;
    curX += signX * strataRelief * 0.60;
    curZ += signZ * strataRelief * 0.60;

    // Vertical cleavage joint facets
    curX += Math.sin(curZ * 2.2 + curY * 1.2) * 0.15;
    curZ += Math.cos(curX * 2.2 + curY * 1.2) * 0.15;

    // 5. Ceiling Attachment Anchor Top
    if (normY > 0.88) {
      const uTop = (normY - 0.88) / 0.12;
      curY += (Math.sin(curX * 2.0) * Math.cos(curZ * 2.0)) * 0.08 * uTop;
    }

    pos.setXYZ(i, curX, curY, curZ);
  }

  geom.computeVertexNormals();
  geom.computeBoundingBox();

  const aCurvature = computeMeshCurvature(geom, 0.20, 0.95);
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));

  const ceilingOccluder = new THREE.Vector3(0, halfH * 0.80, 0);
  const aAO = computeMeshAO(geom, 0.18, 1.0, [ceilingOccluder]);
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(count).fill(0.0), 1));

  geom.computeBoundingSphere();
  return geom;
}

// =============================================================================
// 4. CLIFF-034: Plateau Rim Skyline Notched Crest (24m x 6m x 8m)
// =============================================================================
/**
 * Creates CLIFF-034 Plateau Rim Skyline Notched Crest.
 * Modular repeating skyline rim piece with irregular crenellations, weathered notch saddles,
 * and 360° sedimentary strata wrapping.
 *
 * @param {number} [w=24] - Width (24m)
 * @param {number} [h=6]  - Height (6m)
 * @param {number} [d=8]  - Depth (8m)
 * @param {Object} [opt]  - Configuration options
 * @returns {THREE.BufferGeometry}
 */
export function createCliff034PlateauRimSkylineNotchedCrest(w = 24, h = 6, d = 8, opt = {}) {
  const { width, height, depth, options } = parseParams(w, h, d, 24, 6, 8, opt);

  const widthSeg = options.widthSeg ?? 80;
  const heightSeg = options.heightSeg ?? 36;
  const depthSeg = options.depthSeg ?? 36;
  const strataOffset = options.strataOffset ?? 0.0;
  const wear = options.wear ?? 1.0;

  const geom = new THREE.BoxGeometry(width, height, depth, widthSeg, heightSeg, depthSeg);
  const pos = geom.attributes.position;
  const count = pos.count;

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    let curX = v.x;
    let curY = v.y;
    let curZ = v.z;

    const yRel = curY + halfH;
    const normY = yRel / height;
    const signX = Math.sign(curX) || 1.0;
    const signZ = Math.sign(curZ) || 1.0;
    const uX = Math.abs(curX) / halfW;
    const uZ = Math.abs(curZ) / halfD;

    // 1. Skyline Crenellations & Weathered Notch Saddles (Top Rim)
    const kx = curX / 3.0; // 6m repeating battlement/saddle cycle
    const Wsky = Math.cos(kx * Math.PI);

    if (normY > 0.55) {
      const uSky = (normY - 0.55) / 0.45;
      if (Wsky < 0.0) {
        // Weathered notch saddle dip (smooth natural mesa undulation)
        curY -= Math.pow(-Wsky, 1.4) * 0.55 * uSky;
      } else {
        // Battlement tower peak
        curY += Math.pow(Wsky, 1.6) * 0.22 * uSky;
      }
    }

    // Cornice flare on battlement towers
    if (Wsky > 0.20 && normY > 0.80) {
      const flare = Math.pow((normY - 0.80) / 0.20, 1.5) * 0.35 * Wsky;
      curZ += signZ * flare * halfD * 0.35;
    }

    // 2. Inward Basal Under-Taper (Operator B - Worm's-Eye Integrity)
    if (normY < 0.20) {
      const uBase = (0.20 - normY) / 0.20;
      curZ *= (1.0 - 0.24 * uBase * uBase);
      if (uX > 0.85) {
        curX -= signX * 0.15 * uBase * halfW;
      }
      if (v.y < -halfH + 0.15) {
        curY += (0.35 * (1.0 - uZ) + 0.20 * Math.sin(curX * 1.5) * Math.cos(curZ * 2.5)) * uBase;
      }
    }

    // 3. Corner Chamfers (Operator A)
    if (uX + uZ > 1.25) {
      const corner = (uX + uZ - 1.25) / 0.75;
      curX -= signX * corner * halfW * 0.12;
      curZ -= signZ * corner * halfD * 0.28;
    }

    // 4. 360° Canonical 2.4m Sedimentary Strata Wrapping (Operator D & A)
    const yStrata = curY + halfH + strataOffset;
    const stepProg = (((yStrata % 2.4) + 2.4) % 2.4) / 2.4;
    const strataRelief = (Math.pow(stepProg, 3.4) * 0.30 - ((stepProg < 0.14) ? Math.sin((stepProg / 0.14) * Math.PI) * 0.16 : 0.0) + Math.sin(yStrata * (Math.PI * 2.0 / 0.8)) * 0.035) * wear;

    // Front face (+Z)
    curZ += strataRelief * 0.75 * THREE.MathUtils.smoothstep(curZ / halfD, -0.2, 0.8);
    const fluteX = (((curX + 1.5) % 3.0) + 3.0) % 3.0 - 1.5;
    const deltaZFlute = -Math.exp(-(fluteX * fluteX) / 0.25) * 0.32;
    curZ += deltaZFlute * THREE.MathUtils.smoothstep(curZ / halfD, 0.3, 0.9);

    // Back face (-Z)
    curZ -= strataRelief * 0.70 * THREE.MathUtils.smoothstep(-curZ / halfD, -0.2, 0.8);
    const backFluteX = ((curX % 3.0) + 3.0) % 3.0 - 1.5;
    const deltaZBackFlute = Math.exp(-(backFluteX * backFluteX) / 0.25) * 0.30;
    curZ -= deltaZBackFlute * THREE.MathUtils.smoothstep(-curZ / halfD, 0.3, 0.9);

    // Side flanks (±X)
    curX += signX * strataRelief * 0.65 * THREE.MathUtils.smoothstep(uX, 0.5, 0.95);
    curX += signX * Math.sin(curZ * 2.2) * 0.12 * THREE.MathUtils.smoothstep(uX, 0.6, 0.95);

    // 5. Tower Cap Weathering & Micro-Relief
    if (curY > halfH - 0.40) {
      const uCap = clamp((curY - (halfH - 0.40)) / 0.40, 0.0, 1.0);
      curY += (Math.sin(curX * 3.0) * Math.cos(curZ * 3.0)) * 0.06 * uCap;
    }

    pos.setXYZ(i, curX, curY, curZ);
  }

  geom.computeVertexNormals();
  geom.computeBoundingBox();

  const aCurvature = computeMeshCurvature(geom, 0.20, 0.95);
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));

  const basalOccluder = new THREE.Vector3(0, -halfH, 0);
  const aAO = computeMeshAO(geom, 0.18, 1.0, [basalOccluder]);
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(count).fill(0.0), 1));

  geom.computeBoundingSphere();
  return geom;
}

// =============================================================================
// Shared PBR / GLSL Rock Material Factory
// =============================================================================
export function createPinnacleRockMaterial(sharedUniforms = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: tepuiVert,
    fragmentShader: tepuiFrag,
    uniforms: {
      ...sharedUniforms,
      uTime: { value: 0 }
    }
  });
}

// =============================================================================
// Pinnacle and Arch Modules Catalog Mapping
// =============================================================================
export const PINNACLE_AND_ARCH_MODULES = {
  'CLIFF-022': {
    name: 'Weathered Quartzite Cornice Arch',
    create: (opt) => createCliff022WeatheredQuartziteCorniceArch(10, 6, 6, opt),
    dims: [10, 6, 6]
  },
  'CLIFF-023': {
    name: 'Mushroom Rock Pinnacle Hoodoo',
    create: (opt) => createCliff023MushroomRockPinnacleHoodoo(4, 8, 4, opt),
    dims: [4, 8, 4]
  },
  'CLIFF-030': {
    name: 'Hanging Overhang Ceiling Wedge',
    create: (opt) => createCliff030HangingOverhangCeilingWedge(12, 6, 10, opt),
    dims: [12, 6, 10]
  },
  'CLIFF-034': {
    name: 'Plateau Rim Skyline Notched Crest',
    create: (opt) => createCliff034PlateauRimSkylineNotchedCrest(24, 6, 8, opt),
    dims: [24, 6, 8]
  }
};
