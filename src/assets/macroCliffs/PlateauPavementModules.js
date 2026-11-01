import * as THREE from 'three';
import { bakeVertexAO } from '../geometryUtils.js';
import tepuiVert from '../../shaders/tepui.vert';
import tepuiFrag from '../../shaders/tepui.frag';

/**
 * PlateauPavementModules.js
 *
 * Salto Angel Milestone 1 - Modular Cliff Library
 * Subagent: geometry-specialist Agent 5 (Self-Improvement Sweep)
 *
 * Implements high-fidelity, geologically accurate procedural BufferGeometries
 * for the Auyán-tepui summit tabletop:
 * - CLIFF-011: Plateau Tabletop Pavement Slab A (Orthogonal Grietas & Tinajitas)
 * - CLIFF-012: Plateau Tabletop Pavement Slab B (Peat Depression, Ridges & Quebrada Drainage)
 */

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// -----------------------------------------------------------------------------
// CLIFF-011: Plateau Tabletop Pavement Slab A
// -----------------------------------------------------------------------------
/**
 * Creates CLIFF-011 Plateau Tabletop Pavement Slab A.
 *
 * Features:
 * - Dimensions: 24m x 3m x 24m
 * - Fractured polygonal perimeter edges with 45° corner chamfering & joint cleft indentations
 * - Flat summit quartzite pavement with ancient sedimentary megaripples & macro-swells
 * - Deep orthogonal grietas (fissure cracks) running N-S and E-W with talus rubble floors
 * - 5 circular/elliptical tinajitas (solution weathering pans) with flat dissolution floors
 *   and raised silica-cemented rims
 * - Corbelled stepped under-taper base breaking flat downward-facing box bottom planes
 * - Canonical sedimentary strata steps & vertical columnar jointing on side perimeter walls
 * - Watertight boundary stitching between top pavement and vertical side faces
 * - Precomputed vertex attributes: position, normal, uv, aAO (0.16-1.0), aCurvature (0.20-0.92), aPartType (0.0)
 *
 * @param {number} [width=24] - Slab width along X
 * @param {number} [height=3] - Slab thickness along Y
 * @param {number} [depth=24] - Slab depth along Z
 * @param {number} [widthSegments=96] - Segment resolution along X
 * @param {number} [heightSegments=16] - Segment resolution along Y
 * @param {number} [depthSegments=96] - Segment resolution along Z
 * @returns {THREE.BufferGeometry}
 */
export function createCliff011PlateauTabletopPavementSlabA(
  width = 24,
  height = 3,
  depth = 24,
  widthSegments = 96,
  heightSegments = 16,
  depthSegments = 96
) {
  const geom = new THREE.BoxGeometry(
    width,
    height,
    depth,
    widthSegments,
    heightSegments,
    depthSegments
  );

  const posAttr = geom.attributes.position;
  const count = posAttr.count;
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  // 1. Definition of Orthogonal Grietas (Tectonic joint fissures)
  const longGrietas = [
    {
      center: (z) => -4.8 + 0.35 * Math.sin(0.42 * z) + 0.15 * Math.cos(1.15 * z),
      width: 1.15,
      depth: 2.15
    },
    {
      center: (z) => 3.6 + 0.45 * Math.cos(0.38 * z) - 0.20 * Math.sin(0.95 * z),
      width: 1.30,
      depth: 2.25
    },
    {
      center: (z) => -9.4 + 0.30 * Math.sin(0.55 * z),
      width: 0.85,
      depth: 1.70
    },
    {
      center: (z) => 9.2 + 0.35 * Math.cos(0.48 * z),
      width: 0.90,
      depth: 1.80
    }
  ];

  const transGrietas = [
    {
      center: (x) => -4.2 + 0.40 * Math.sin(0.40 * x) + 0.18 * Math.cos(1.05 * x),
      width: 1.20,
      depth: 2.10
    },
    {
      center: (x) => 4.5 + 0.42 * Math.cos(0.35 * x) - 0.22 * Math.sin(0.88 * x),
      width: 1.35,
      depth: 2.30
    },
    {
      center: (x) => -8.8 + 0.32 * Math.cos(0.52 * x),
      width: 0.85,
      depth: 1.65
    },
    {
      center: (x) => 8.9 + 0.36 * Math.sin(0.46 * x),
      width: 0.90,
      depth: 1.75
    }
  ];

  // 2. Definition of Circular Weathering Pans (Tinajitas)
  const tinajitas = [
    { x: -0.6, z: 0.2, rx: 2.3, rz: 2.1, depth: 0.65 },
    { x: 6.6, z: -0.4, rx: 1.8, rz: 1.7, depth: 0.55 },
    { x: -6.9, z: 1.4, rx: 1.6, rz: 1.5, depth: 0.50 },
    { x: -3.8, z: 6.8, rx: 1.9, rz: 2.0, depth: 0.58 },
    { x: 5.2, z: 6.4, rx: 1.5, rz: 1.6, depth: 0.48 }
  ];

  // Evaluates top pavement elevation displacement and geological feature metadata
  function evaluatePavementTop(x, z) {
    let maxFissureCut = 0.0;
    let fissureLip = 0.0;

    // Longitudinal fissures
    for (let j = 0; j < longGrietas.length; j++) {
      const g = longGrietas[j];
      const cx = g.center(z);
      const dist = Math.abs(x - cx);
      const halfWidth = g.width * 0.5;
      const u = dist / halfWidth;

      if (u < 1.0) {
        const depthProfile = g.depth * (1.0 - Math.pow(u, 4.0));
        const talus = Math.sin(x * 5.5) * Math.cos(z * 5.2) * 0.12;
        const cut = Math.max(0.0, depthProfile + talus);
        if (cut > maxFissureCut) maxFissureCut = cut;
      } else if (u < 1.35) {
        const lip = 0.08 * Math.exp(-Math.pow((u - 1.0) / 0.16, 2.0));
        if (lip > fissureLip) fissureLip = lip;
      }
    }

    // Transverse fissures
    for (let j = 0; j < transGrietas.length; j++) {
      const g = transGrietas[j];
      const cz = g.center(x);
      const dist = Math.abs(z - cz);
      const halfWidth = g.width * 0.5;
      const u = dist / halfWidth;

      if (u < 1.0) {
        const depthProfile = g.depth * (1.0 - Math.pow(u, 4.0));
        const talus = Math.cos(x * 5.0) * Math.sin(z * 5.8) * 0.12;
        const cut = Math.max(0.0, depthProfile + talus);
        if (cut > maxFissureCut) maxFissureCut = cut;
      } else if (u < 1.35) {
        const lip = 0.08 * Math.exp(-Math.pow((u - 1.0) / 0.16, 2.0));
        if (lip > fissureLip) fissureLip = lip;
      }
    }

    // Weathering pans (Tinajitas)
    let maxPanCut = 0.0;
    let panLip = 0.0;

    for (let j = 0; j < tinajitas.length; j++) {
      const pan = tinajitas[j];
      const dx = (x - pan.x) / pan.rx;
      const dz = (z - pan.z) / pan.rz;
      const r = Math.sqrt(dx * dx + dz * dz);

      if (r < 1.0) {
        const panProfile = pan.depth * Math.pow(1.0 - Math.pow(r, 6.0), 1.25);
        if (panProfile > maxPanCut) maxPanCut = panProfile;
      } else if (r < 1.35) {
        const lip = 0.09 * Math.exp(-Math.pow((r - 1.0) / 0.14, 2.0));
        if (lip > panLip) panLip = lip;
      }
    }

    // Subtle ancient Precambrian sedimentary ripple bedding & macro-swell
    const ripple =
      0.11 * Math.sin(x * 0.70 + z * 0.28) +
      0.06 * Math.cos(x * 1.55 - z * 1.15) +
      0.03 * Math.sin(x * 3.4) * Math.cos(z * 3.2);
    const macroSwell = 0.14 * Math.sin(x * 0.22) * Math.cos(z * 0.24);

    const deltaY = ripple + macroSwell - maxFissureCut - maxPanCut + Math.max(fissureLip, panLip);

    return {
      deltaY,
      fissureCut: maxFissureCut,
      fissureLip,
      panCut: maxPanCut,
      panLip
    };
  }

  // Evaluates underside corbelled base elevation displacement (Operator B)
  function evaluatePavementBottom(x, z) {
    const uX = x / halfW;
    const uZ = z / halfD;
    const rBottom = Math.sqrt(uX * uX + uZ * uZ);

    // Stepped corbelled terraces ascending toward the perimeter
    const corbelStep = 0.85 * Math.pow(clamp((rBottom - 0.20) / 0.80, 0.0, 1.0), 1.5);
    // Organic bedrock joint roughness
    const bedrockRoughness =
      0.14 * Math.sin(x * 1.5) * Math.cos(z * 1.5) +
      0.06 * Math.sin(x * 3.2 + z * 2.8);

    const deltaY = corbelStep + bedrockRoughness;
    return { deltaY, corbelStep, rBottom };
  }

  // Evaluates horizontal perimeter fracture, corner chamfering, and strata offset (Operator A & B)
  function getPerimeterOffset(x, y, z) {
    const uX = x / halfW;
    const uZ = z / halfD;
    const signX = Math.sign(x) || 1.0;
    const signZ = Math.sign(z) || 1.0;
    const absUX = Math.abs(uX);
    const absUZ = Math.abs(uZ);
    const normY = clamp((y + halfH) / height, 0.0, 1.0);

    // 1. Corner chamfering (breaks rectangular 90° box corners)
    const cornerFactor =
      clamp((absUX - 0.50) / 0.50, 0.0, 1.0) *
      clamp((absUZ - 0.50) / 0.50, 0.0, 1.0);
    const chamfer = cornerFactor * 2.2;
    let dx = -signX * chamfer * 0.707;
    let dz = -signZ * chamfer * 0.707;

    // 2. Grieta border cleft indentations
    // Longitudinal grieta exits on North / South perimeter
    if (absUZ > 0.75) {
      let cleft = 0.0;
      for (let j = 0; j < longGrietas.length; j++) {
        const g = longGrietas[j];
        const cx = g.center(z);
        const dist = Math.abs(x - cx);
        if (dist < g.width * 1.1) {
          const u = dist / (g.width * 1.1);
          cleft = Math.max(cleft, (1.0 - Math.pow(u, 2.0)) * 1.75);
        }
      }
      dz -= signZ * cleft * Math.pow((absUZ - 0.75) / 0.25, 1.5);
    }

    // Transverse grieta exits on East / West perimeter
    if (absUX > 0.75) {
      let cleft = 0.0;
      for (let j = 0; j < transGrietas.length; j++) {
        const g = transGrietas[j];
        const cz = g.center(x);
        const dist = Math.abs(z - cz);
        if (dist < g.width * 1.1) {
          const u = dist / (g.width * 1.1);
          cleft = Math.max(cleft, (1.0 - Math.pow(u, 2.0)) * 1.75);
        }
      }
      dx -= signX * cleft * Math.pow((absUX - 0.75) / 0.25, 1.5);
    }

    // 3. Perimeter fracture ribs (breaks ruler edges)
    const ribX =
      (0.38 * Math.sin(z * 0.75 + 0.6) + 0.22 * Math.cos(z * 1.5)) *
      Math.pow(absUX, 2.5);
    const ribZ =
      (0.38 * Math.sin(x * 0.75 + 0.6) + 0.22 * Math.cos(x * 1.5)) *
      Math.pow(absUZ, 2.5);
    dx += signX * ribX;
    dz += signZ * ribZ;

    // 4. Horizontal sedimentary strata steps & bedding seams (1.2m interval)
    const stepInterval = 1.2;
    const layerProgress =
      (((y + halfH) % stepInterval) + stepInterval) % stepInterval / stepInterval;
    const beddingSeam = -0.08 * Math.exp(-Math.pow((layerProgress - 0.5) / 0.12, 2.0));
    const beddingShelf = Math.pow(layerProgress, 3.2) * 0.22;
    const strataDisp = beddingSeam + beddingShelf;

    dx += signX * strataDisp * Math.pow(absUX, 3.0);
    dz += signZ * strataDisp * Math.pow(absUZ, 3.0);

    // 5. Underside base inward corbel-taper (bottom 38% of height)
    if (normY < 0.38) {
      const underProg = (0.38 - normY) / 0.38;
      const taper = Math.pow(underProg, 1.5) * 2.1;
      dx -= uX * taper;
      dz -= uZ * taper;
    }

    return { dx, dz, strataDisp, beddingSeam, beddingShelf };
  }

  // Pre-allocate custom vertex attributes
  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  const aPartType = new Float32Array(count);

  const v0 = new THREE.Vector3();
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v0.fromBufferAttribute(posAttr, i);
    v.copy(v0);

    const isTop = v0.y >= halfH - 0.001;
    const isBottom = v0.y <= -halfH + 0.001;
    const normY = clamp((v0.y + halfH) / height, 0.0, 1.0);

    const topEval = evaluatePavementTop(v0.x, v0.z);
    const btmEval = evaluatePavementBottom(v0.x, v0.z);
    const perim = getPerimeterOffset(v0.x, v0.y, v0.z);

    // 1. Vertical displacement with C^1 continuous boundary stitching
    if (isTop) {
      v.y = halfH + topEval.deltaY;
    } else if (isBottom) {
      v.y = -halfH + btmEval.deltaY;
    } else {
      v.y +=
        Math.pow(normY, 2.0) * topEval.deltaY +
        Math.pow(1.0 - normY, 2.0) * btmEval.deltaY;
    }

    // 2. Horizontal perimeter displacement (breaks rectangular outline)
    v.x += perim.dx;
    v.z += perim.dz;

    // 3. Custom attributes synthesis
    if (isTop) {
      // aAO: 0.16 in deepest grietas, 0.48 in tinajitas, 0.98 on exposed pavement
      if (topEval.fissureCut > 0.05) {
        const t = clamp(topEval.fissureCut / 2.25, 0.0, 1.0);
        aAO[i] = THREE.MathUtils.lerp(0.95, 0.16, t);
        aCurvature[i] = topEval.fissureCut > 0.8 ? 0.20 : 0.32;
      } else if (topEval.panCut > 0.02) {
        const t = clamp(topEval.panCut / 0.65, 0.0, 1.0);
        aAO[i] = THREE.MathUtils.lerp(0.95, 0.48, t);
        aCurvature[i] = 0.30;
      } else if (topEval.fissureLip > 0.02 || topEval.panLip > 0.02) {
        aAO[i] = 1.0;
        aCurvature[i] = 0.92;
      } else {
        aAO[i] = 0.98;
        aCurvature[i] = 0.42;
      }
    } else if (isBottom) {
      aAO[i] = clamp(0.20 + btmEval.corbelStep * 0.25, 0.18, 0.45);
      aCurvature[i] = btmEval.rBottom > 0.4 ? 0.78 : 0.40;
    } else {
      // Side vertical perimeter
      if (perim.beddingShelf > 0.08) {
        aCurvature[i] = 0.86;
        aAO[i] = clamp(0.65 + normY * 0.30, 0.45, 0.95);
      } else if (perim.beddingSeam < -0.02) {
        aCurvature[i] = 0.22;
        aAO[i] = 0.22;
      } else {
        aCurvature[i] = 0.48;
        aAO[i] = clamp(0.35 + normY * 0.50, 0.25, 0.90);
      }
    }

    aPartType[i] = 0.0; // Quartzite rock
    posAttr.setXYZ(i, v.x, v.y, v.z);
  }

  geom.setAttribute('aAO', new THREE.Float32BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.Float32BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.Float32BufferAttribute(aPartType, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

// -----------------------------------------------------------------------------
// CLIFF-012: Plateau Tabletop Pavement Slab B
// -----------------------------------------------------------------------------
/**
 * Creates CLIFF-012 Plateau Tabletop Pavement Slab B.
 *
 * Features:
 * - Dimensions: 20m x 3m x 20m
 * - Fractured polygonal perimeter with corner chamfers and West-face drainage spillway throat
 * - Central peat-filled summit depression with organic peat hummocks
 * - Quartzite hogback ridges flanking East (+0.68m) and Northwest (+0.58m)
 * - Meandering drainage channel (Quebrada) with stepped cascade thresholds
 * - West-face carved drainage spillway notch where the stream exits the plateau edge
 * - 4 deep pseudokarst pothole crevice pockets (depths up to 2.25m, aAO down to 0.16)
 * - Corbelled underside base breaking flat downward-facing box bottom planes
 * - Precomputed vertex attributes: position, normal, uv, aAO (0.16-1.0), aCurvature (0.20-0.94), aPartType (0.0)
 *
 * @param {number} [width=20] - Slab width along X
 * @param {number} [height=3] - Slab thickness along Y
 * @param {number} [depth=20] - Slab depth along Z
 * @param {number} [widthSegments=80] - Segment resolution along X
 * @param {number} [heightSegments=16] - Segment resolution along Y
 * @param {number} [depthSegments=80] - Segment resolution along Z
 * @returns {THREE.BufferGeometry}
 */
export function createCliff012PlateauTabletopPavementSlabB(
  width = 20,
  height = 3,
  depth = 20,
  widthSegments = 80,
  heightSegments = 16,
  depthSegments = 80
) {
  const geom = new THREE.BoxGeometry(
    width,
    height,
    depth,
    widthSegments,
    heightSegments,
    depthSegments
  );

  const posAttr = geom.attributes.position;
  const count = posAttr.count;
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  // 1. Definition of Deep Crevice Pockets / Pseudokarst Potholes
  const crevicePockets = [
    { x: -2.6, z: -4.0, radius: 0.95, depth: 2.10 },
    { x: 2.8, z: 3.4, radius: 1.15, depth: 2.25 },
    { x: -5.4, z: 2.6, radius: 0.85, depth: 1.80 },
    { x: 1.2, z: -5.6, radius: 1.05, depth: 1.90 }
  ];

  // Evaluates top surface depression, ridges, drainage channels, and crevice pockets
  function evaluateDepressionSlab(x, z) {
    // A. Broad Central Peat Depression Basin
    const depDx = (x + 0.8) / 7.2;
    const depDz = (z - 0.4) / 7.5;
    const rDep = Math.sqrt(depDx * depDx + depDz * depDz);
    let depDrop = 0.0;
    if (rDep < 1.0) {
      depDrop = 1.15 * Math.pow(1.0 - Math.pow(rDep, 2.5), 1.2);
    }

    // Peat soil hummocks inside the wetland basin
    const hummocks =
      (0.12 * Math.sin(x * 1.35 + 0.6) * Math.cos(z * 1.45) +
        0.07 * Math.cos(x * 2.7 - z * 2.1)) *
      clamp(1.0 - rDep * 0.8, 0.0, 1.0);

    // B. Elevated Quartzite Bedrock Hogback Ridges
    // East ridge
    const ridgeEast =
      Math.exp(-Math.pow((x - 6.2) / 2.1, 2.0)) * 0.68 * (1.0 + 0.22 * Math.sin(z * 0.65));
    // Northwest spur ridge
    const ridgeNW =
      Math.exp(-Math.pow((x + 5.8) / 2.3, 2.0)) *
      Math.exp(-Math.pow((z - 5.5) / 2.6, 2.0)) *
      0.58;

    // C. Meandering Drainage Channel (Quebrada)
    // Continuous centerline trajectory leading water to West margin
    const xChan = -2.2 + 2.4 * Math.cos(0.36 * z + 0.7) - 1.1 * Math.sin(0.75 * z) - 0.45 * z;
    const dChan = Math.abs(x - xChan);
    const halfChanWidth = 0.95;
    const uChan = dChan / halfChanWidth;

    let chanCut = 0.0;
    let chanBankLip = 0.0;
    if (uChan < 1.0) {
      const trough = 0.65 * (1.0 - Math.pow(uChan, 3.0));
      // Hydraulic cascade drops over quartzite thresholds
      const cascade = z > 2.0 ? 0.15 : z < -2.0 ? -0.15 : 0.0;
      chanCut = Math.max(0.0, trough + cascade);
    } else if (uChan < 1.4) {
      chanBankLip = 0.07 * Math.exp(-Math.pow((uChan - 1.0) / 0.18, 2.0));
    }

    // D. Deep Crevice Pockets / Pseudokarst Potholes
    let maxPocketCut = 0.0;
    let pocketLip = 0.0;
    for (let j = 0; j < crevicePockets.length; j++) {
      const p = crevicePockets[j];
      const dist = Math.sqrt((x - p.x) * (x - p.x) + (z - p.z) * (z - p.z));
      const u = dist / p.radius;

      if (u < 1.0) {
        const pocketProfile = p.depth * (1.0 - Math.pow(u, 4.0));
        const talus = Math.sin(x * 6.0) * Math.cos(z * 6.0) * 0.10;
        const cut = Math.max(0.0, pocketProfile + talus);
        if (cut > maxPocketCut) maxPocketCut = cut;
      } else if (u < 1.35) {
        const lip = 0.08 * Math.exp(-Math.pow((u - 1.0) / 0.16, 2.0));
        if (lip > pocketLip) pocketLip = lip;
      }
    }

    const deltaY =
      -depDrop +
      hummocks +
      ridgeEast +
      ridgeNW -
      chanCut +
      chanBankLip -
      maxPocketCut +
      pocketLip;

    return {
      deltaY,
      depDrop,
      ridgeVal: Math.max(ridgeEast, ridgeNW),
      chanCut,
      chanBankLip,
      pocketCut: maxPocketCut,
      pocketLip
    };
  }

  // Evaluates underside corbelled base elevation displacement (Operator B)
  function evaluateBottomB(x, z) {
    const uX = x / halfW;
    const uZ = z / halfD;
    const rBottom = Math.sqrt(uX * uX + uZ * uZ);

    // Stepped corbelled terraces ascending toward perimeter
    const corbelStep = 0.85 * Math.pow(clamp((rBottom - 0.20) / 0.80, 0.0, 1.0), 1.5);
    // Bedrock relief
    const bedrockRoughness =
      0.12 * Math.cos(x * 1.6) * Math.sin(z * 1.6) +
      0.06 * Math.cos(x * 3.0 - z * 2.5);

    const deltaY = corbelStep + bedrockRoughness;
    return { deltaY, corbelStep, rBottom };
  }

  // Evaluates horizontal perimeter fracture, corner chamfers, and West spillway throat (Operator A & B)
  function getPerimeterOffsetB(x, y, z) {
    const uX = x / halfW;
    const uZ = z / halfD;
    const signX = Math.sign(x) || 1.0;
    const signZ = Math.sign(z) || 1.0;
    const absUX = Math.abs(uX);
    const absUZ = Math.abs(uZ);
    const normY = clamp((y + halfH) / height, 0.0, 1.0);

    // 1. Corner chamfering (breaks rectangular 20x20m box footprint)
    const cornerFactor =
      clamp((absUX - 0.50) / 0.50, 0.0, 1.0) *
      clamp((absUZ - 0.50) / 0.50, 0.0, 1.0);
    const chamfer = cornerFactor * 2.0;
    let dx = -signX * chamfer * 0.707;
    let dz = -signZ * chamfer * 0.707;

    // 2. West margin Quebrada drainage spillway notch throat indentation
    if (x < -halfW * 0.70) {
      const spillwayThroat =
        Math.exp(-Math.pow((z + 3.5) / 1.6, 2.0)) * 1.8 * Math.pow(absUX, 2.5);
      dx += spillwayThroat; // indents West face inward (+X direction)
    }

    // 3. Perimeter tectonic fracture harmonics & ribs
    const ribX =
      (0.42 * Math.sin(z * 0.85 + 1.1) + 0.24 * Math.cos(z * 1.7)) *
      Math.pow(absUX, 2.5);
    const ribZ =
      (0.42 * Math.sin(x * 0.85 + 1.1) + 0.24 * Math.cos(x * 1.7)) *
      Math.pow(absUZ, 2.5);
    dx += signX * ribX;
    dz += signZ * ribZ;

    // 4. Horizontal sedimentary strata steps & bedding seams (1.0m interval)
    const stepInterval = 1.0;
    const layerProgress =
      (((y + halfH) % stepInterval) + stepInterval) % stepInterval / stepInterval;
    const beddingSeam = -0.07 * Math.exp(-Math.pow((layerProgress - 0.5) / 0.12, 2.0));
    const beddingShelf = Math.pow(layerProgress, 3.2) * 0.20;
    const strataDisp = beddingSeam + beddingShelf;

    dx += signX * strataDisp * Math.pow(absUX, 3.0);
    dz += signZ * strataDisp * Math.pow(absUZ, 3.0);

    // 5. Underside base inward corbel-taper (bottom 38% of height)
    if (normY < 0.38) {
      const underProg = (0.38 - normY) / 0.38;
      const taper = Math.pow(underProg, 1.5) * 2.0;
      dx -= uX * taper;
      dz -= uZ * taper;
    }

    return { dx, dz, strataDisp, beddingSeam, beddingShelf };
  }

  // Pre-allocate custom vertex attributes
  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  const aPartType = new Float32Array(count);

  const v0 = new THREE.Vector3();
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v0.fromBufferAttribute(posAttr, i);
    v.copy(v0);

    const isTop = v0.y >= halfH - 0.001;
    const isBottom = v0.y <= -halfH + 0.001;
    const normY = clamp((v0.y + halfH) / height, 0.0, 1.0);

    const topEval = evaluateDepressionSlab(v0.x, v0.z);
    const btmEval = evaluateBottomB(v0.x, v0.z);
    const perim = getPerimeterOffsetB(v0.x, v0.y, v0.z);

    // 1. Vertical displacement with C^1 continuous boundary stitching
    if (isTop) {
      v.y = halfH + topEval.deltaY;
    } else if (isBottom) {
      v.y = -halfH + btmEval.deltaY;
    } else {
      v.y +=
        Math.pow(normY, 2.0) * topEval.deltaY +
        Math.pow(1.0 - normY, 2.0) * btmEval.deltaY;

      // West wall spillway notch where the drainage channel exits
      if (v0.x < -halfW + 0.001) {
        const notchDrop =
          0.65 *
          Math.exp(-Math.pow((v0.z + 3.5) / 1.6, 2.0)) *
          Math.pow(normY, 1.8);
        v.y -= notchDrop;
      }
    }

    // 2. Horizontal perimeter displacement (breaks rectangular outline)
    v.x += perim.dx;
    v.z += perim.dz;

    // 3. Custom attributes synthesis
    if (isTop) {
      // aAO: 0.16 in deep crevice pockets, 0.35 in stream channel, 0.78 in peat bog, 1.0 on exposed ridges
      if (topEval.pocketCut > 0.05) {
        const t = clamp(topEval.pocketCut / 2.25, 0.0, 1.0);
        aAO[i] = THREE.MathUtils.lerp(0.85, 0.16, t);
        aCurvature[i] = topEval.pocketCut > 0.6 ? 0.20 : 0.32;
      } else if (topEval.chanCut > 0.05) {
        const t = clamp(topEval.chanCut / 0.65, 0.0, 1.0);
        aAO[i] = THREE.MathUtils.lerp(0.85, 0.35, t);
        aCurvature[i] = 0.24;
      } else if (topEval.ridgeVal > 0.15) {
        aAO[i] = 1.0;
        aCurvature[i] = 0.90;
      } else if (topEval.chanBankLip > 0.02 || topEval.pocketLip > 0.02) {
        aAO[i] = 0.98;
        aCurvature[i] = 0.84;
      } else if (topEval.depDrop > 0.1) {
        aAO[i] = 0.78;
        aCurvature[i] = 0.40;
      } else {
        aAO[i] = 0.95;
        aCurvature[i] = 0.44;
      }
    } else if (isBottom) {
      aAO[i] = clamp(0.20 + btmEval.corbelStep * 0.25, 0.18, 0.45);
      aCurvature[i] = btmEval.rBottom > 0.4 ? 0.76 : 0.40;
    } else {
      // Side vertical perimeter
      if (perim.beddingShelf > 0.08) {
        aCurvature[i] = 0.85;
        aAO[i] = clamp(0.65 + normY * 0.30, 0.45, 0.95);
      } else if (perim.beddingSeam < -0.02) {
        aCurvature[i] = 0.22;
        aAO[i] = 0.22;
      } else {
        aCurvature[i] = 0.48;
        aAO[i] = clamp(0.35 + normY * 0.50, 0.25, 0.90);
      }
    }

    aPartType[i] = 0.0; // Quartzite rock
    posAttr.setXYZ(i, v.x, v.y, v.z);
  }

  geom.setAttribute('aAO', new THREE.Float32BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.Float32BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.Float32BufferAttribute(aPartType, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

// -----------------------------------------------------------------------------
// Plateau Rock Material Helper (Tepui Rock Shader Pipeline)
// -----------------------------------------------------------------------------
export function createPlateauRockMaterial(sharedUniforms = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: tepuiVert,
    fragmentShader: tepuiFrag,
    uniforms: {
      ...sharedUniforms,
      uTime: { value: 0 }
    }
  });
}
