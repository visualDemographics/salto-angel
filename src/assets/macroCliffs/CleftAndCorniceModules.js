import * as THREE from 'three';
import { bakeVertexAO } from '../geometryUtils.js';
import tepuiVert from '../../shaders/tepui.vert';
import tepuiFrag from '../../shaders/tepui.frag';

/**
 * Salto Angel Macro-Cliff Modules Pack: Cleft & Cornice Modules
 * BOM Milestone 1 Assets:
 * 1. CLIFF-001: Emergence Cleft Arch (~ 8 x 12 x 10)
 * 2. CLIFF-010: Overhang Cornice Block (~ 14 x 4 x 8)
 * 3. CLIFF-024: Subterranean Cave Conduit Egress (~ 6 x 6 x 8)
 * 4. CLIFF-025: Secondary Stream Fracture Notch (~ 4 x 10 x 6)
 *
 * All modules provide standard Three.js attributes:
 * - position (Float32BufferAttribute, 3)
 * - normal (Float32BufferAttribute, 3)
 * - uv (Float32BufferAttribute, 2)
 * - aAO (Float32BufferAttribute, 1) - baked ambient occlusion (0.12 - 1.0)
 * - aCurvature (Float32BufferAttribute, 1) - surface curvature (0.18 - 0.96)
 * - aPartType (Float32BufferAttribute, 1) - 0.0 (rock)
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
 * CLIFF-001: Emergence Cleft Arch
 * Dimensions: ~ 8 (width) x 12 (height) x 10 (depth)
 * Monumental parabolic notch carved into the cliff edge beneath an overhanging rock roof;
 * twin subterranean eruption conduits at the base where the underground river erupts.
 */
export function createCliff001EmergenceCleftArch(w = 8, h = 12, d = 10, opt = {}) {
  const { width, height, depth, options } = parseParams(w, h, d, 8, 12, 10, opt);

  const widthSeg = options.widthSeg ?? 56;
  const heightSeg = options.heightSeg ?? 72;
  const depthSeg = options.depthSeg ?? 48;
  const strataOffset = options.strataOffset ?? 0.0;

  const geom = new THREE.BoxGeometry(width, height, depth, widthSeg, heightSeg, depthSeg);
  const pos = geom.attributes.position;
  const count = pos.count;

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  const aAO = new Float32Array(count);
  const aCurv = new Float32Array(count);
  const aPart = new Float32Array(count).fill(0.0);

  const v = new THREE.Vector3();

  // Conduit centers inside cleft backwall
  const c1x = -1.45;
  const c1y = -halfH * 0.35;
  const c2x = 1.45;
  const c2y = -halfH * 0.35;

  // Cleft Arch geometry parameters
  const cleftSpan = halfW * 0.65; // ~2.6m half-span (5.2m wide chute)
  const archApex = halfH * 0.38;   // ~2.28m apex

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    let x = v.x;
    let y = v.y;
    let z = v.z;

    const yRel = y + halfH;
    const normY = yRel / height;
    const uX = clamp(Math.abs(x) / halfW, 0.0, 1.0);
    const uZ = clamp(Math.abs(z) / halfD, 0.0, 1.0);

    // 1. LATERAL SILHOUETTE VARIANCE & FLANK STEPPING (Operator A)
    const tierIdx = Math.floor(yRel / 2.4);
    const flankTierOffset = Math.sin(tierIdx * 1.9 + (x > 0 ? 0.8 : -0.8)) * 0.45;
    if (Math.abs(x) > halfW * 0.65) {
      const flankWeight = (Math.abs(x) - halfW * 0.65) / (halfW * 0.35);
      x += Math.sign(x) * flankTierOffset * flankWeight;
    }

    // Outer corner chamfering
    const cornerFactor = Math.max(0.0, (uX + uZ - 1.28) / 0.72);
    if (cornerFactor > 0.0) {
      const chamfer = cornerFactor * 0.38;
      x -= Math.sign(x) * chamfer * halfW * 0.30;
      z -= Math.sign(z) * chamfer * halfD * 0.30;
    }

    // 2. CANONICAL 2.4m WORLD-SPACE STRATA (Operator D)
    const stratumHeight = 2.4;
    const stratumPhase = ((yRel + strataOffset) % stratumHeight + stratumHeight) % stratumHeight / stratumHeight;
    const shelfOffset = Math.pow(stratumPhase, 3.5) * 0.30;
    const strataNotch = (stratumPhase < 0.12) ? -Math.sin((stratumPhase / 0.12) * Math.PI) * 0.18 : 0.0;
    const strataDisplace = shelfOffset + strataNotch;

    // Apply strata to all 4 vertical faces for 360° kitbash relief
    if (z > halfD * 0.25) z += strataDisplace * 0.75;
    if (z < -halfD * 0.45) z -= strataDisplace * 0.65;
    if (Math.abs(x) > halfW * 0.5) x += Math.sign(x) * strataDisplace * 0.65;

    // Back wall vertical joint relief
    if (z < -halfD * 0.5) {
      const backJoint = Math.sin(x * 2.2 + tierIdx * 1.4) * 0.18;
      z -= backJoint;
    }

    // 3. CENTRAL CHUTE CORRIDOR & PARABOLIC ARCH (Smooth C1 carving, NO hard clamps!)
    const archApexY = archApex;
    const archBaseY = -halfH * 1.05; // extends through bottom
    const steepness = (archApexY - archBaseY) / (cleftSpan * cleftSpan);
    const archTopY = archApexY - steepness * (x * x);

    let inChuteCavity = 0.0;
    let minConduitDist = 999.0;
    let isRoofLip = false;
    let isArchRim = false;

    if (Math.abs(x) < cleftSpan && y < archTopY) {
      const xNorm = Math.abs(x) / cleftSpan;
      const xCurve = Math.cos(xNorm * Math.PI * 0.5);
      const yBelowApex = clamp((archTopY - y) / (archApexY - archBaseY), 0.0, 1.0);
      const yCurve = Math.sin(yBelowApex * Math.PI * 0.5);
      const cavityWeight = Math.pow(xCurve, 1.3) * Math.pow(yCurve, 0.6);

      inChuteCavity = cavityWeight;

      // Deep cave recess carving
      if (z > -halfD * 0.75) {
        const zWeight = clamp((z + halfD * 0.75) / (halfD * 1.75), 0.0, 1.0);
        const caveDepth = cavityWeight * Math.pow(zWeight, 1.2) * (depth * 0.70);
        z -= caveDepth;

        // Open bottom chute passageway smoothly without horizontal bottom shelf
        const bottomDrop = cavityWeight * Math.max(0.0, (-y) / halfH) * (depth * 0.18);
        z -= bottomDrop;
      }

      // Twin subterranean eruption conduits on backwall
      const d1 = Math.hypot((x - c1x) / 1.15, (y - c1y) / 1.45);
      const d2 = Math.hypot((x - c2x) / 1.15, (y - c2y) / 1.45);
      minConduitDist = Math.min(d1, d2);

      if (minConduitDist < 1.0 && z < -halfD * 0.15) {
        const conduitPush = Math.pow(Math.cos(minConduitDist * Math.PI * 0.5), 2.0) * (depth * 0.24);
        z -= conduitPush;
      }

      if (Math.abs(y - archTopY) < 0.6) {
        isArchRim = true;
      }
    }

    // Overhanging rock roof / lintel above arch apex
    if (y >= archTopY && y < halfH * 0.92 && Math.abs(x) < halfW * 0.92 && z > halfD * 0.1) {
      const roofT = clamp((y - archTopY) / Math.max(0.1, halfH * 0.92 - archTopY), 0.0, 1.0);
      const overhang = Math.sin(roofT * Math.PI) * (1.0 - Math.min(1.0, Math.abs(x) / halfW)) * (depth * 0.22);
      z += overhang * Math.pow(clamp((z - halfD * 0.1) / (halfD * 0.9), 0.0, 1.0), 1.2);
      if (y > archApexY && z > halfD * 0.4) {
        isRoofLip = true;
      }
    }

    // 4. WORM'S-EYE UNDER-SURFACE INTEGRITY (Operator B)
    if (y < -halfH + height * 0.16) {
      const underT = clamp((y - (-halfH)) / (height * 0.16), 0.0, 1.0);
      const corbelFactor = (1.0 - underT) * (1.0 - underT);
      x *= (1.0 - corbelFactor * 0.18);
      z *= (1.0 - corbelFactor * 0.22);
    }
    // Break flat bottom slab
    if (v.y <= -halfH + 0.02) {
      const rDist = Math.hypot(x / halfW, z / halfD);
      const bottomSculpt = (1.0 - clamp(rDist, 0.0, 1.0)) * 0.65;
      const bottomRipple = Math.sin(x * 2.2) * Math.cos(z * 2.2) * 0.14;
      y += bottomSculpt + bottomRipple + 0.12;
    }

    pos.setXYZ(i, x, y, z);

    // 5. ATTRIBUTE DYNAMIC RANGE (aAO & aCurvature)
    let ao = 0.92;
    if (minConduitDist < 1.4) {
      const conduitOcc = 1.0 - (minConduitDist / 1.4);
      ao = THREE.MathUtils.lerp(0.85, 0.15, Math.pow(conduitOcc, 1.2));
    } else if (inChuteCavity > 0.2) {
      const cavityDepthNorm = clamp((-z + halfD * 0.2) / (halfD * 1.1), 0.0, 1.0);
      ao = THREE.MathUtils.lerp(0.75, 0.18, Math.pow(cavityDepthNorm, 1.1) * inChuteCavity);
    } else if (y >= archTopY && y < archTopY + 1.2 && z < halfD * 0.3) {
      ao = 0.40; // Underside roof shadow
    } else if (stratumPhase < 0.14 && z > 0.0) {
      ao = 0.45; // Bedding notch crevice
    } else if (y > halfH * 0.85 || Math.abs(x) > cleftSpan * 1.2) {
      ao = 0.98; // Exposed outer pillar crest
    } else {
      ao = THREE.MathUtils.lerp(0.68, 0.95, normY);
    }
    aAO[i] = clamp(ao, 0.15, 1.0);

    let curv = 0.44;
    const isBeddingEdge = stratumPhase > 0.85;
    const isPillarCorner = (uX > 0.82 && uZ > 0.82);

    if (isRoofLip || isArchRim) {
      curv = 0.92;
    } else if (isPillarCorner) {
      curv = 0.86;
    } else if (isBeddingEdge) {
      curv = 0.76;
    } else if (minConduitDist < 1.0) {
      curv = 0.22; // Smooth water-worn pipe
    } else if (inChuteCavity > 0.5) {
      curv = 0.35;
    }
    aCurv[i] = clamp(curv, 0.18, 0.95);
  }

  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurv, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPart, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

/**
 * CLIFF-010: Overhang Cornice Block
 * Dimensions: ~ 14 (width) x 4 (height) x 8 (depth)
 * Cantilevered quartzite roof projecting 3-5m out over the abyss above the waterfall chute.
 */
export function createCliff010OverhangCorniceBlock(w = 14, h = 4, d = 8, opt = {}) {
  const { width, height, depth, options } = parseParams(w, h, d, 14, 4, 8, opt);

  const widthSeg = options.widthSeg ?? 70;
  const heightSeg = options.heightSeg ?? 32;
  const depthSeg = options.depthSeg ?? 48;
  const strataOffset = options.strataOffset ?? 0.0;

  const geom = new THREE.BoxGeometry(width, height, depth, widthSeg, heightSeg, depthSeg);
  const pos = geom.attributes.position;
  const count = pos.count;

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  const aAO = new Float32Array(count);
  const aCurv = new Float32Array(count);
  const aPart = new Float32Array(count).fill(0.0);

  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    let x = v.x;
    let y = v.y;
    let z = v.z;

    const yRel = y + halfH;
    const normY = yRel / height;
    const uX = clamp(Math.abs(x) / halfW, 0.0, 1.0);
    const uZ = clamp(Math.abs(z) / halfD, 0.0, 1.0);

    // 1. FLANK SILHOUETTE BREAKUP & TIER STEPPING (Operator A)
    const flankTier = Math.floor(yRel / 1.2);
    const flankStep = Math.sin(flankTier * 2.2 + (x > 0 ? 0.9 : -0.9)) * 0.55;
    if (Math.abs(x) > halfW * 0.65) {
      const flankWeight = (Math.abs(x) - halfW * 0.65) / (halfW * 0.35);
      x += Math.sign(x) * flankStep * flankWeight;
    }

    // Outer corner chamfer
    if (uX + uZ > 1.35) {
      const chamfer = (uX + uZ - 1.35) * 0.40;
      x -= Math.sign(x) * chamfer * halfW * 0.25;
      z -= Math.sign(z) * chamfer * halfD * 0.25;
    }

    // 2. 360° STRATA LEDGES & BACK RELIEF
    const stratumHeight = 1.2;
    const stratumPhase = ((yRel + strataOffset) % stratumHeight + stratumHeight) % stratumHeight / stratumHeight;
    const shelfOffset = Math.pow(stratumPhase, 3.2) * 0.25;
    const jointOffset = Math.sin(x * 1.8 + flankTier * 1.4) * 0.15;
    const strataDisplace = shelfOffset + jointOffset;

    // Apply strata to back face and flanks
    if (z < -halfD * 0.3) {
      z -= strataDisplace * 0.75;
    }
    if (Math.abs(x) > halfW * 0.6) {
      x += Math.sign(x) * strataDisplace * 0.55;
    }

    // 3. FRONT CANTILEVER OVERHANG, TEETH & JOINT NOTCHES
    let isProwLip = false;
    let isJointNotch = false;
    let isUndersideFracture = false;

    if (z > -halfD * 0.35) {
      const frontWeight = clamp((z + halfD * 0.35) / (halfD * 1.35), 0.0, 1.0);

      // (a) Cantilever shelf (y > -0.2) projecting 3.4m forward
      const heightFactor = clamp((y + halfH * 0.35) / (halfH * 1.35), 0.0, 1.0);
      const forwardCantilever = Math.pow(frontWeight, 1.35) * heightFactor * 3.4;

      // Central arched brow above waterfall chute
      const centerArch = Math.cos(uX * Math.PI * 0.5) * 0.85 * heightFactor;

      // (b) Irregular cantilevered stone teeth along front margin
      const blockWidth = 2.2;
      const blockIndex = Math.floor((x + halfW) / blockWidth);
      const stoneTooth = (Math.sin(blockIndex * 3.7 + 0.8) * 0.55 + (blockIndex % 2 === 0 ? 0.35 : -0.25)) * heightFactor;

      // (c) Vertical joint notches cutting into cornice edge
      const colDist = Math.abs(((x + halfW) % blockWidth) - blockWidth * 0.5);
      const jointNotchCut = Math.exp(-Math.pow(colDist / 0.22, 2.0)) * 0.65 * heightFactor;
      if (jointNotchCut > 0.3) isJointNotch = true;

      z += (forwardCantilever + centerArch + stoneTooth - jointNotchCut) * Math.pow(frontWeight, 1.1);

      if (frontWeight > 0.85 && y > 0.0) {
        isProwLip = true;
      }

      // (d) Underside rock brow corbelling & severe undercutting (y < 0)
      if (y < 0.0) {
        const undercutProg = (Math.abs(y) / halfH);
        const undercut = undercutProg * 2.4 * Math.pow(frontWeight, 1.2);
        z -= undercut;

        // Calved block tension steps on underside ceiling
        const stepCeiling = Math.floor(frontWeight * 5.0) * 0.22;
        y += stepCeiling * 0.30;
        isUndersideFracture = true;
      }
    }

    // 4. SUMMIT KARREN RUNNELS & PAVEMENT (y near top)
    if (y > halfH * 0.72) {
      const karrenGrike = Math.sin(x * 3.2) * 0.12 * Math.cos(z * 1.8);
      const microStep = Math.pow(((x + halfW) % 2.5) / 2.5, 3.0) * 0.15;
      y += karrenGrike + microStep;
    }

    // 5. WORM'S-EYE UNDER-SURFACE INTEGRITY (Operator B)
    if (y < -halfH + height * 0.18) {
      const underT = clamp((y - (-halfH)) / (height * 0.18), 0.0, 1.0);
      const corbelFactor = (1.0 - underT) * (1.0 - underT);
      x *= (1.0 - corbelFactor * 0.16);
      z *= (1.0 - corbelFactor * 0.24);
    }
    // Break flat bottom slab
    if (v.y <= -halfH + 0.02) {
      const rDist = Math.hypot(x / halfW, z / halfD);
      const bottomSculpt = (1.0 - clamp(rDist, 0.0, 1.0)) * 0.55;
      const bottomRipple = Math.sin(x * 2.5) * Math.cos(z * 2.5) * 0.12;
      y += bottomSculpt + bottomRipple + 0.10;
    }

    pos.setXYZ(i, x, y, z);

    // 6. ATTRIBUTES (aAO & aCurvature)
    let ao = 0.88;
    if (y < 0.05 && z > -halfD * 0.2) {
      const underNorm = clamp((z + halfD * 0.2) / (depth * 0.8), 0.0, 1.0);
      ao = THREE.MathUtils.lerp(0.55, 0.16, Math.pow(underNorm, 0.9));
    } else if (isJointNotch) {
      ao = 0.25;
    } else if (y > halfH * 0.75) {
      ao = 1.0;
    } else if (z < -halfD * 0.6) {
      ao = 0.52;
    } else {
      ao = THREE.MathUtils.lerp(0.62, 0.92, normY);
    }
    aAO[i] = clamp(ao, 0.16, 1.0);

    let curv = 0.44;
    if (isProwLip) {
      curv = 0.94;
    } else if (isUndersideFracture) {
      curv = 0.82;
    } else if (isJointNotch) {
      curv = 0.22;
    } else if (y > halfH * 0.8) {
      curv = 0.42;
    } else if (stratumPhase > 0.85) {
      curv = 0.76;
    }
    aCurv[i] = clamp(curv, 0.18, 0.96);
  }

  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurv, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPart, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

/**
 * CLIFF-024: Subterranean Cave Conduit Egress
 * Dimensions: ~ 6 (width) x 6 (height) x 8 (depth)
 * Dark elliptical conduit tunnel mouth inside the cleft where pressurized water erupts.
 */
export function createCliff024SubterraneanCaveConduitEgress(w = 6, h = 6, d = 8, opt = {}) {
  const { width, height, depth, options } = parseParams(w, h, d, 6, 6, 8, opt);

  const widthSeg = options.widthSeg ?? 64;
  const heightSeg = options.heightSeg ?? 64;
  const depthSeg = options.depthSeg ?? 48;
  const strataOffset = options.strataOffset ?? 0.0;

  const geom = new THREE.BoxGeometry(width, height, depth, widthSeg, heightSeg, depthSeg);
  const pos = geom.attributes.position;
  const count = pos.count;

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  const aAO = new Float32Array(count);
  const aCurv = new Float32Array(count);
  const aPart = new Float32Array(count).fill(0.0);

  const v = new THREE.Vector3();

  // Elliptical conduit dimensions
  const rx = halfW * 0.52; // ~1.56m
  const ry = halfH * 0.45; // ~1.35m

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    let x = v.x;
    let y = v.y;
    let z = v.z;

    const yRel = y + halfH;
    const normY = yRel / height;
    const uX = clamp(Math.abs(x) / halfW, 0.0, 1.0);
    const uZ = clamp(Math.abs(z) / halfD, 0.0, 1.0);

    // 1. LATERAL SILHOUETTE VARIANCE & FLANK STEPPING (Operator A)
    const tierIdx = Math.floor(yRel / 2.0);
    const flankStep = Math.sin(tierIdx * 2.3 + (x > 0 ? 0.8 : -0.8)) * 0.38;
    if (Math.abs(x) > halfW * 0.62) {
      const flankWeight = (Math.abs(x) - halfW * 0.62) / (halfW * 0.38);
      x += Math.sign(x) * flankStep * flankWeight;
    }

    // Outer corner chamfering
    if (uX + uZ > 1.32) {
      const chamfer = (uX + uZ - 1.32) * 0.38;
      x -= Math.sign(x) * chamfer * halfW * 0.28;
      z -= Math.sign(z) * chamfer * halfD * 0.28;
    }

    // 2. CANONICAL 2.4m STRATA & 360° RELIEF (Operator D)
    const stratumHeight = 2.4;
    const stratumPhase = ((yRel + strataOffset) % stratumHeight + stratumHeight) % stratumHeight / stratumHeight;
    const shelfOffset = Math.pow(stratumPhase, 3.2) * 0.26;
    const jointOffset = Math.sin(x * 2.4 + tierIdx * 1.5) * 0.14;
    const strataDisplace = shelfOffset + jointOffset;

    // Apply strata to back face and flanks
    if (z < -halfD * 0.4) {
      z -= strataDisplace * 0.70;
    }
    if (Math.abs(x) > halfW * 0.55) {
      x += Math.sign(x) * strataDisplace * 0.60;
    }

    // 3. 3D CONDUIT TUNNEL SCULPTING
    const angle = Math.atan2(y, x);
    const distToPortal = Math.hypot(x / rx, y / ry);

    let isPortalRim = false;
    let isConduitInterior = false;

    // Front portal and deep tunnel mouth
    if (z > -halfD * 0.5) {
      const zProg = clamp((z + halfD * 0.5) / (halfD * 1.5), 0.0, 1.0);

      if (distToPortal < 1.0) {
        isConduitInterior = true;
        // Deep tunnel penetration
        const tunnelDepth = (1.0 - Math.pow(distToPortal, 2.0)) * (depth * 0.80);
        z -= tunnelDepth * Math.pow(zProg, 1.1);

        // Turbulent water hydraulic scalloping & rock ribs
        const waveZ = Math.sin(z * 4.2 + angle * 3.0) * 0.12 + Math.cos(z * 8.5) * 0.05;
        x += Math.cos(angle) * waveZ;
        y += Math.sin(angle) * waveZ;

        // Tapered ceiling and eroded conduit floor
        if (y < 0.0) {
          y -= (1.0 - distToPortal) * 0.28;
        } else {
          y -= (1.0 - distToPortal) * 0.15 * (1.0 - zProg);
        }
      } else if (distToPortal < 1.4 && z > halfD * 0.2) {
        // Flared cave portal mouth rim
        const rimT = (distToPortal - 1.0) / 0.4;
        const rimFlare = Math.sin(rimT * Math.PI) * 0.35;
        z += rimFlare;

        // Chiseled rock jamb fracture notches
        const jambFracture = Math.sin(angle * 6.0) * 0.14;
        x += Math.cos(angle) * jambFracture;
        y += Math.sin(angle) * jambFracture;

        if (distToPortal < 1.25) {
          isPortalRim = true;
        }
      }
    }

    // 4. WORM'S-EYE UNDER-SURFACE INTEGRITY (Operator B)
    if (y < -halfH + height * 0.18) {
      const underT = clamp((y - (-halfH)) / (height * 0.18), 0.0, 1.0);
      const corbelFactor = (1.0 - underT) * (1.0 - underT);
      x *= (1.0 - corbelFactor * 0.18);
      z *= (1.0 - corbelFactor * 0.24);
    }
    // Break flat bottom slab
    if (v.y <= -halfH + 0.02) {
      const rDist = Math.hypot(x / halfW, z / halfD);
      const bottomSculpt = (1.0 - clamp(rDist, 0.0, 1.0)) * 0.55;
      const bottomRipple = Math.sin(x * 2.8) * Math.cos(z * 2.8) * 0.12;
      y += bottomSculpt + bottomRipple + 0.12;
    }

    pos.setXYZ(i, x, y, z);

    // 5. ATTRIBUTES (aAO & aCurvature)
    let ao = 0.90;
    if (isConduitInterior) {
      const depthProgress = clamp((-z + halfD * 0.3) / (depth * 0.85), 0.0, 1.0);
      ao = THREE.MathUtils.lerp(0.52, 0.12, Math.pow(depthProgress, 1.2));
    } else if (isPortalRim) {
      ao = 0.72;
    } else if (z < -halfD * 0.5) {
      ao = 0.54;
    } else if (stratumPhase < 0.14) {
      ao = 0.45;
    } else {
      ao = THREE.MathUtils.lerp(0.70, 0.98, normY);
    }
    aAO[i] = clamp(ao, 0.12, 1.0);

    let curv = 0.44;
    if (isPortalRim) {
      curv = 0.90;
    } else if (isConduitInterior) {
      curv = 0.32;
    } else if (stratumPhase > 0.85) {
      curv = 0.76;
    } else if (uX > 0.8 && uZ > 0.8) {
      curv = 0.84;
    }
    aCurv[i] = clamp(curv, 0.18, 0.95);
  }

  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurv, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPart, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

/**
 * CLIFF-025: Secondary Stream Fracture Notch
 * Dimensions: ~ 4 (width) x 10 (height) x 6 (depth)
 * Narrow vertical fracture slot 8m to the right of the main cleft where the secondary stream cascades.
 */
export function createCliff025SecondaryStreamFractureNotch(w = 4, h = 10, d = 6, opt = {}) {
  const { width, height, depth, options } = parseParams(w, h, d, 4, 10, 6, opt);

  const widthSeg = options.widthSeg ?? 40;
  const heightSeg = options.heightSeg ?? 84;
  const depthSeg = options.depthSeg ?? 48;
  const strataOffset = options.strataOffset ?? 0.0;

  const geom = new THREE.BoxGeometry(width, height, depth, widthSeg, heightSeg, depthSeg);
  const pos = geom.attributes.position;
  const count = pos.count;

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  const aAO = new Float32Array(count);
  const aCurv = new Float32Array(count);
  const aPart = new Float32Array(count).fill(0.0);

  const v = new THREE.Vector3();

  // Fracture slot half-width
  const slotHalfWidth = halfW * 0.42; // ~0.84m half-width (1.68m total fissure)
  const slotMaxDepth = depth * 0.72;  // ~4.3m deep vertical notch

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);

    let x = v.x;
    let y = v.y;
    let z = v.z;

    const yRel = y + halfH;
    const normY = yRel / height;
    const uX = clamp(Math.abs(x) / halfW, 0.0, 1.0);
    const uZ = clamp(Math.abs(z) / halfD, 0.0, 1.0);

    // 1. LATERAL SILHOUETTE VARIANCE & FLANK STEPPING (Operator A)
    const tierIdx = Math.floor(yRel / 2.4);
    const flankStep = Math.sin(tierIdx * 2.1 + (x > 0 ? 0.75 : -0.75)) * 0.34;
    if (Math.abs(x) > halfW * 0.58) {
      const flankWeight = (Math.abs(x) - halfW * 0.58) / (halfW * 0.42);
      x += Math.sign(x) * flankStep * flankWeight;
    }

    // Outer corner chamfering
    if (uX + uZ > 1.30) {
      const chamfer = (uX + uZ - 1.30) * 0.35;
      x -= Math.sign(x) * chamfer * halfW * 0.28;
      z -= Math.sign(z) * chamfer * halfD * 0.28;
    }

    // 2. CANONICAL 2.4m STRATA & 360° RELIEF (Operator D)
    const stratumHeight = 2.4;
    const stratumPhase = ((yRel + strataOffset) % stratumHeight + stratumHeight) % stratumHeight / stratumHeight;
    const shelfOffset = Math.pow(stratumPhase, 3.4) * 0.28;
    const jointOffset = Math.sin(x * 3.0 + tierIdx * 1.6) * 0.12;
    const strataDisplace = shelfOffset + jointOffset;

    // Apply strata to back face and flanks
    if (z < -halfD * 0.35) {
      z -= strataDisplace * 0.70;
    }
    if (Math.abs(x) > halfW * 0.5) {
      x += Math.sign(x) * strataDisplace * 0.60;
    }

    // 3. V-SHAPED FRACTURE NOTCH SCULPTING
    const fissureCenter = Math.sin(y * 0.65) * 0.22 + Math.sin(y * 1.6) * 0.10;
    const dx = x - fissureCenter;

    let isSlotInterior = false;
    let isSlotRim = false;

    // Front face fracture notch
    if (z > -halfD * 0.4) {
      const zProg = clamp((z + halfD * 0.4) / (halfD * 1.4), 0.0, 1.0);

      if (Math.abs(dx) < slotHalfWidth) {
        isSlotInterior = true;
        const slotCurve = Math.cos((Math.abs(dx) / slotHalfWidth) * Math.PI * 0.5);
        const recess = Math.pow(slotCurve, 0.75) * slotMaxDepth;
        z -= recess * Math.pow(zProg, 1.15);

        // Cascade hydraulic drop-off steps down back floor
        const cascadeInterval = 2.4;
        const cascadePhase = (yRel % cascadeInterval) / cascadeInterval;
        const dropStep = Math.pow(cascadePhase, 3.5) * 0.35;
        z += dropStep;

        // Water trickle channel groove
        x += Math.sin(y * 4.5) * 0.05;
      } else if (Math.abs(dx) < slotHalfWidth * 1.35) {
        isSlotRim = true;
        const rimT = (Math.abs(dx) - slotHalfWidth) / (slotHalfWidth * 0.35);
        const rimProjection = Math.sin(rimT * Math.PI) * 0.18;
        z += rimProjection;
      }
    }

    // Matching back-face fracture notch
    if (z < -halfD * 0.5) {
      if (Math.abs(dx) < slotHalfWidth * 0.85) {
        const backCurve = Math.cos((Math.abs(dx) / (slotHalfWidth * 0.85)) * Math.PI * 0.5);
        const backRecess = Math.pow(backCurve, 1.3) * (depth * 0.28);
        z += backRecess;
      }
    }

    // 4. WORM'S-EYE UNDER-SURFACE INTEGRITY (Operator B)
    if (y < -halfH + height * 0.18) {
      const underT = clamp((y - (-halfH)) / (height * 0.18), 0.0, 1.0);
      const corbelFactor = (1.0 - underT) * (1.0 - underT);
      x *= (1.0 - corbelFactor * 0.18);
      z *= (1.0 - corbelFactor * 0.24);
    }
    // Break flat bottom slab
    if (v.y <= -halfH + 0.02) {
      const rDist = Math.hypot(x / halfW, z / halfD);
      const bottomSculpt = (1.0 - clamp(rDist, 0.0, 1.0)) * 0.50;
      const bottomRipple = Math.sin(x * 3.2) * Math.cos(z * 3.2) * 0.12;
      y += bottomSculpt + bottomRipple + 0.10;
    }

    pos.setXYZ(i, x, y, z);

    // 5. ATTRIBUTES (aAO & aCurvature)
    let ao = 0.90;
    if (isSlotInterior) {
      const depthFactor = clamp((-z + halfD * 0.2) / (halfD * 1.1), 0.0, 1.0);
      ao = THREE.MathUtils.lerp(0.55, 0.14, Math.pow(depthFactor, 1.1));
    } else if (isSlotRim) {
      ao = 0.65;
    } else if (z < -halfD * 0.6) {
      ao = 0.52;
    } else if (stratumPhase < 0.14) {
      ao = 0.45;
    } else {
      ao = THREE.MathUtils.lerp(0.72, 0.98, normY);
    }
    aAO[i] = clamp(ao, 0.14, 1.0);

    let curv = 0.44;
    if (isSlotRim) {
      curv = 0.92;
    } else if (isSlotInterior) {
      curv = 0.34;
    } else if (stratumPhase > 0.85) {
      curv = 0.78;
    } else if (uX > 0.8 && uZ > 0.8) {
      curv = 0.85;
    }
    aCurv[i] = clamp(curv, 0.18, 0.95);
  }

  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurv, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(aPart, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

/**
 * Shared PBR / GLSL Rock Material Factory for Macro-Cliff Modules
 */
export function createCliffRockMaterial(sharedUniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: tepuiVert,
    fragmentShader: tepuiFrag,
    uniforms: {
      ...sharedUniforms,
      uTime: { value: 0 }
    }
  });
}
