import * as THREE from 'three';
import { mergeGeometriesWithAttributes, bakeVertexAO } from './geometryUtils.js';
import foliageVert from '../shaders/foliage.vert';
import foliageFrag from '../shaders/foliage.frag';

/**
 * Procedural Botanical Assets for Salto Angel
 * Eliminates crude single-ball icosahedrons in favor of multi-part organic trees
 * with multi-octave botanical noise, curled leaf bunches, and broken Amazonian silhouettes.
 */

/**
 * Computes multi-octave botanical leaf noise displacement for tree foliage lobes.
 * Sculptures organic, curled leaf bunches, billowy parasols, and ruffled perimeters.
 */
function computeCanopyDisplacement(v, seed = 0) {
  const len = v.length();
  if (len < 0.0001) return { disp: 0, curv: 0.5 };

  const nx = v.x / len;
  const ny = v.y / len;
  const nz = v.z / len;

  const theta = Math.atan2(nz, nx);
  const phi = Math.acos(Math.max(-1.0, Math.min(1.0, ny)));
  const rHoriz = Math.sqrt(nx * nx + nz * nz);

  // Octave 1: Macro vegetative lobes (3-5 asymmetrical billows around perimeter)
  const macroWarp = Math.sin(theta * 4.0 + seed * 1.7) * Math.sin(phi * 2.2) * 0.16
                  + Math.cos(theta * 2.0 - seed * 0.8) * 0.09;

  // Octave 2: Mid-frequency leaf clusters (nodal gyroid-like spherical harmonics)
  const qx = nx * 5.2 + seed * 0.9;
  const qy = ny * 4.8 + seed * 1.3;
  const qz = nz * 5.2 + seed * 0.5;
  const bunchNoise = (Math.sin(qx) * Math.cos(qy) + Math.sin(qy) * Math.cos(qz) + Math.sin(qz) * Math.cos(qx)) * 0.13;

  // Octave 3: High-frequency leaf edge ruffling / curled leaf tips
  const microNoise = Math.sin(nx * 11.0 + seed * 2.1) * Math.sin(nz * 11.0 - seed * 1.4) * Math.cos(ny * 9.0) * 0.07;

  // Octave 4: Peripheral droop and corbelled underside
  // Umbrella leaves gently droop toward the outer edge, and tuck inward at the lower underside
  const rimEffect = Math.pow(rHoriz, 1.8) * -0.14;
  const undersideTuck = (ny < 0.0) ? (ny * 0.14 * (1.0 - rHoriz)) : 0.0;

  const totalDisp = macroWarp + bunchNoise + microNoise + rimEffect + undersideTuck;
  
  // Calculate curvature: ridges & crests (> 0.5) vs valleys & crevices (< 0.5)
  const curv = Math.max(0.2, Math.min(0.9, 0.5 + (bunchNoise + microNoise) * 2.2));

  return { disp: totalDisp, curv };
}

/**
 * Computes botanical cushion noise displacement for cliff-ledge shrub mounds.
 * Produces saxicolous bromeliad rosette cushions and rock-hugging mats.
 */
function computeCushionDisplacement(v, seed = 0) {
  const len = v.length();
  if (len < 0.0001) return { disp: 0, curv: 0.5 };

  const nx = v.x / len;
  const ny = v.y / len;
  const nz = v.z / len;

  const theta = Math.atan2(nz, nx);
  const rH = Math.sqrt(nx * nx + nz * nz);

  // Radial rosette ridges (5 to 7 ripples radiating from top center)
  const rosette = Math.sin(theta * 6.0 + seed * 1.5) * Math.sin(rH * Math.PI) * 0.14;
  // High-frequency cushion pebble nodules
  const nodules = (Math.sin(nx * 7.5 + seed) * Math.cos(nz * 7.5) + Math.sin(ny * 6.0)) * 0.09;
  // Soft dome center crest
  const dome = Math.cos(Math.min(rH * 1.4, Math.PI * 0.5)) * 0.10;

  const totalDisp = rosette + nodules + dome;
  const curv = Math.max(0.25, Math.min(0.85, 0.5 + nodules * 2.5));

  return { disp: totalDisp, curv };
}

export function createRainforestTreeGeometry() {
  const subGeometries = [];
  const trunkOccluders = [];

  // 1. Buttressed Trunk & Ascending Boughs (aPartType = 0.0)
  const trunkHeight = 3.2;
  const trunkRadiusBottom = 0.44;
  const trunkRadiusTop = 0.22;
  const trunkGeom = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusBottom, trunkHeight, 12, 8);
  trunkGeom.translate(0, trunkHeight * 0.5, 0);

  // Add buttress flaring to root base
  const tPos = trunkGeom.attributes.position;
  const tv = new THREE.Vector3();
  const trunkCurv = new Float32Array(tPos.count).fill(0.5);
  for (let i = 0; i < tPos.count; i++) {
    tv.fromBufferAttribute(tPos, i);
    if (tv.y < 0.9) {
      const flare = Math.pow((0.9 - tv.y) / 0.9, 1.8) * 0.38;
      const angle = Math.atan2(tv.z, tv.x);
      const buttress = Math.sin(angle * 4.0) * 0.5 + 0.5;
      tv.x += Math.cos(angle) * flare * (0.8 + buttress * 0.6);
      tv.z += Math.sin(angle) * flare * (0.8 + buttress * 0.6);
      tPos.setXYZ(i, tv.x, tv.y, tv.z);
      trunkCurv[i] = 0.45 + buttress * 0.35;
    }
  }
  trunkGeom.setAttribute('aCurvature', new THREE.BufferAttribute(trunkCurv, 1));
  trunkGeom.computeVertexNormals();

  const trunkPart = new Float32Array(tPos.count).fill(0.0);
  trunkGeom.setAttribute('aPartType', new THREE.BufferAttribute(trunkPart, 1));
  subGeometries.push(trunkGeom);

  trunkOccluders.push(new THREE.Vector3(0, 0.4, 0));
  trunkOccluders.push(new THREE.Vector3(0, trunkHeight * 0.5, 0));
  trunkOccluders.push(new THREE.Vector3(0, trunkHeight * 0.85, 0));

  // 4 Primary Ascending Boughs + Secondary Forking Branchlets
  const branchCount = 4;
  for (let b = 0; b < branchCount; b++) {
    const angle = (b / branchCount) * Math.PI * 2 + (b % 2 === 0 ? 0.15 : -0.15);
    const bLen = 1.9;
    const branchGeom = new THREE.CylinderGeometry(0.11, 0.18, bLen, 8, 4);
    branchGeom.translate(0, bLen * 0.5, 0);

    const pitch = 0.62 + (b % 2) * 0.12;
    branchGeom.rotateZ(pitch);
    branchGeom.rotateY(angle);
    branchGeom.translate(0, trunkHeight * 0.85, 0);

    const bPos = branchGeom.attributes.position;
    branchGeom.setAttribute('aCurvature', new THREE.BufferAttribute(new Float32Array(bPos.count).fill(0.50), 1));
    branchGeom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(bPos.count).fill(0.0), 1));
    branchGeom.computeVertexNormals();
    subGeometries.push(branchGeom);

    const sinP = Math.sin(pitch);
    const cosP = Math.cos(pitch);
    const bTip = new THREE.Vector3(
      Math.sin(angle) * sinP * bLen,
      trunkHeight * 0.85 + cosP * bLen,
      Math.cos(angle) * sinP * bLen
    );
    trunkOccluders.push(bTip);

    // Secondary ascending branchlet extending outwards to support outer parasols
    const secLen = 1.15;
    const secGeom = new THREE.CylinderGeometry(0.06, 0.10, secLen, 6, 3);
    secGeom.translate(0, secLen * 0.5, 0);

    const secPitch = pitch + 0.28;
    const secAngle = angle + (b % 2 === 0 ? 0.35 : -0.35);
    secGeom.rotateZ(secPitch);
    secGeom.rotateY(secAngle);

    const midFork = new THREE.Vector3(
      Math.sin(angle) * sinP * bLen * 0.65,
      trunkHeight * 0.85 + cosP * bLen * 0.65,
      Math.cos(angle) * sinP * bLen * 0.65
    );
    secGeom.translate(midFork.x, midFork.y, midFork.z);

    const sPos = secGeom.attributes.position;
    secGeom.setAttribute('aCurvature', new THREE.BufferAttribute(new Float32Array(sPos.count).fill(0.50), 1));
    secGeom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(sPos.count).fill(0.0), 1));
    secGeom.computeVertexNormals();
    subGeometries.push(secGeom);

    trunkOccluders.push(new THREE.Vector3(
      midFork.x + Math.sin(secAngle) * Math.sin(secPitch) * secLen,
      midFork.y + Math.cos(secPitch) * secLen,
      midFork.z + Math.cos(secAngle) * Math.sin(secPitch) * secLen
    ));
  }

  // 2. Multi-Lobe Umbrella Foliage Crown (aPartType = 1.0)
  // 20 overlapping, organic leaf sub-clusters in a golden-angle phyllotaxis spiral
  // Uses IcosahedronGeometry(1.0, 2) (162 vertices each) with multi-octave 3D botanical noise
  const lobeCount = 20;
  const crownCenterY = trunkHeight + 1.25;
  trunkOccluders.push(new THREE.Vector3(0, crownCenterY, 0));

  for (let l = 0; l < lobeCount; l++) {
    const theta = l * 2.39996; // Golden angle
    const rNorm = Math.sqrt(l / lobeCount);
    const radius = 0.35 + rNorm * 1.95;
    const lx = Math.cos(theta) * radius;
    const lz = Math.sin(theta) * radius;

    // Layered umbrella canopy dome: apex at top center, tiered parasols cascading outwards
    const ly = crownCenterY + Math.pow(1.0 - rNorm, 1.25) * 1.35 + Math.sin(l * 1.7) * 0.18;

    // Organic scale: center apical lobes are rounder, outer lobes are wider flattened parasols
    const sx = 0.90 + (1.0 - rNorm * 0.3) * 0.45 + Math.sin(l * 2.1) * 0.12;
    const sy = 0.45 + (1.0 - rNorm) * 0.25 + Math.cos(l * 1.5) * 0.08;
    const sz = 0.90 + (1.0 - rNorm * 0.3) * 0.45 + Math.cos(l * 2.3) * 0.12;

    // Detail 2 icosahedron (162 vertices, 320 smooth triangles) eliminates all low-poly facets
    const lobeGeom = new THREE.IcosahedronGeometry(1.0, 2);

    // Apply 3D multi-octave botanical leaf noise displacement
    const pos = lobeGeom.attributes.position;
    const v = new THREE.Vector3();
    const curvArray = new Float32Array(pos.count);

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const { disp, curv } = computeCanopyDisplacement(v, l * 1.37);

      // Displace along unit normal
      const n = v.clone().normalize();
      v.addScaledVector(n, disp);

      // Apply anisotropic parasol scaling
      v.x *= sx;
      v.y *= sy;
      v.z *= sz;

      // Outer margin droop: subtle downward sag toward outer rim of each lobe
      const rDist = Math.sqrt(v.x * v.x + v.z * v.z);
      v.y -= Math.pow(rDist / (Math.max(sx, sz) + 0.001), 2.0) * (0.22 * sy);

      pos.setXYZ(i, v.x, v.y, v.z);
      curvArray[i] = curv;
    }

    lobeGeom.setAttribute('aCurvature', new THREE.BufferAttribute(curvArray, 1));

    // Tilt outward away from trunk axis for natural parasol orientation
    const tiltAmount = 0.12 + rNorm * 0.16;
    const tiltDirX = radius > 0.001 ? lx / radius : 0;
    const tiltDirZ = radius > 0.001 ? lz / radius : 0;
    lobeGeom.rotateX(tiltDirZ * tiltAmount);
    lobeGeom.rotateZ(-tiltDirX * tiltAmount);

    // Subtle individual azimuthal wobble
    lobeGeom.rotateY(theta + Math.sin(l * 3.1) * 0.25);
    lobeGeom.translate(lx, ly, lz);

    lobeGeom.computeVertexNormals();

    const lPos = lobeGeom.attributes.position;
    lobeGeom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(lPos.count).fill(1.0), 1));
    subGeometries.push(lobeGeom);

    // Add inner lobe positions as occluders for vertex AO
    if (rNorm < 0.65) {
      trunkOccluders.push(new THREE.Vector3(lx, ly, lz));
    }
  }

  // Merge into single indexed BufferGeometry (1 draw call per tree!)
  const merged = mergeGeometriesWithAttributes(subGeometries);

  // Bake vertex AO: interior canopy lobes and under-branch regions receive deep ambient occlusion
  bakeVertexAO(merged, trunkOccluders, 2.7, 0.18);

  return merged;
}

/**
 * Low-lying spreading cliff-ledge shrub mat (12 overlapping botanical cushion mounds)
 * Models saxicolous bromeliad rosettes and alpine cushion scrub on sandstone shelves.
 */
export function createCliffShrubGeometry() {
  const subGeometries = [];
  const moundCount = 12;
  const occluders = [new THREE.Vector3(0, 0, 0)];

  for (let i = 0; i < moundCount; i++) {
    const angle = (i / moundCount) * Math.PI * 2 + Math.sin(i * 2.3) * 0.35;
    const r = Math.pow(i / moundCount, 0.65) * 1.45;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = (1.0 - r / 1.45) * 0.35 + Math.cos(i * 1.9) * 0.08;

    const sx = 0.52 + Math.sin(i * 1.7) * 0.18;
    const sy = 0.26 + Math.cos(i * 2.1) * 0.08;
    const sz = 0.52 + Math.cos(i * 1.3) * 0.18;

    // Detail 2 icosahedron (162 vertices, 320 smooth triangles) eliminates all facet artifacts
    const mound = new THREE.IcosahedronGeometry(1.0, 2);

    const pos = mound.attributes.position;
    const v = new THREE.Vector3();
    const curvArray = new Float32Array(pos.count);

    for (let j = 0; j < pos.count; j++) {
      v.fromBufferAttribute(pos, j);
      const { disp, curv } = computeCushionDisplacement(v, i * 1.73);

      const n = v.clone().normalize();
      v.addScaledVector(n, disp);

      v.x *= sx;
      v.y *= sy;
      v.z *= sz;

      // Flatten base adhering to rock ledge: pull bottom vertices upward
      if (v.y < -0.05 * sy) {
        v.y = Math.max(v.y, -0.15 * sy);
      }

      pos.setXYZ(j, v.x, v.y, v.z);
      curvArray[j] = curv;
    }

    mound.setAttribute('aCurvature', new THREE.BufferAttribute(curvArray, 1));
    mound.rotateY(angle + Math.sin(i * 3.0) * 0.4);
    mound.translate(x, y, z);
    mound.computeVertexNormals();

    const mPos = mound.attributes.position;
    mound.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(mPos.count).fill(1.0), 1));
    subGeometries.push(mound);

    occluders.push(new THREE.Vector3(x, y * 0.5, z));
  }

  const merged = mergeGeometriesWithAttributes(subGeometries);
  bakeVertexAO(merged, occluders, 1.8, 0.22);
  return merged;
}

export function createFoliageAssetMaterial(sharedUniforms, baseColor = 0x276326) {
  const colorObj = baseColor instanceof THREE.Color ? baseColor : new THREE.Color(baseColor);
  const uniforms = {
    ...sharedUniforms,
    uTime: { value: 0 },
    uBaseColor: { value: colorObj }
  };

  return new THREE.ShaderMaterial({
    vertexShader: foliageVert,
    fragmentShader: foliageFrag,
    uniforms
  });
}
