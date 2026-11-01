import * as THREE from 'three';
import { sliceGeometryWithPlanes, bakeVertexAO } from './geometryUtils.js';

/**
 * Stratified, plane-cleaved Roraima sandstone talus boulders.
 * Category B — BOM.md:
 * - ROCK-036: Giant Cauldron Impact Monolith (8 x 6 x 7)
 * - ROCK-037: Tabular Sandstone Bedding Slab (6 x 2.2 x 5)
 * - ROCK-038: Angular Voronoi Cleavage Boulder A (4 x 3.5 x 3.5)
 * - ROCK-039: Angular Voronoi Cleavage Boulder B (3.5 x 3 x 4)
 */

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(min, max, val) {
  const x = clamp((val - min) / (max - min), 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

/**
 * ROCK-036: Giant Cauldron Impact Monolith (~ 8 x 6 x 7)
 * Colossal rectangular sandstone block at the plunge foot; water-polished top, fractured sides, deep ground AO.
 */
export function createRock036GiantCauldronImpactMonolith(w = 8, h = 6, d = 7, options = {}) {
  const geom = new THREE.BoxGeometry(w, h, d, 28, 20, 24);
  const pos = geom.attributes.position;
  const count = pos.count;
  const halfW = w * 0.5;
  const halfH = h * 0.5;
  const halfD = d * 0.5;
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    // Water-polished convex crown on top surface
    if (v.y > halfH * 0.4) {
      const topWeight = smoothstep(halfH * 0.4, halfH, v.y);
      const dome = Math.cos((v.x / halfW) * Math.PI * 0.5) * Math.cos((v.z / halfD) * Math.PI * 0.5) * 0.85;
      v.y += dome * topWeight;
    }
    // Basal taper so it nests firmly into riverbed gravel
    if (v.y < -halfH * 0.4) {
      const botWeight = smoothstep(-halfH * 0.4, -halfH, v.y);
      v.x *= (1.0 - botWeight * 0.14);
      v.z *= (1.0 - botWeight * 0.14);
      v.y += (Math.sin(v.x * 1.5) * Math.cos(v.z * 1.5)) * 0.25 * botWeight;
    }
    // Horizontal bedding relief
    const strataPhase = ((v.y + halfH) % 1.6) / 1.6;
    const strataNotch = (strataPhase < 0.12) ? -(1.0 - smoothstep(0.0, 0.12, strataPhase)) * 0.18 : 0.0;
    v.x += Math.sign(v.x || 1.0) * strataNotch;
    v.z += Math.sign(v.z || 1.0) * strataNotch;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  sliceGeometryWithPlanes(geom, 8, Math.max(w, h, d) * 0.55);

  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    const heightNorm = clamp((v.y + halfH) / h, 0.0, 1.0);
    aAO[i] = THREE.MathUtils.lerp(0.18, 0.95, Math.pow(heightNorm, 0.75));
    aCurvature[i] = heightNorm > 0.85 ? 0.78 : 0.48;
  }
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(count).fill(0.0), 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * ROCK-037: Tabular Sandstone Bedding Slab (~ 6 x 2.2 x 5)
 * Flat, wide rectangular slab with clear horizontal sedimentary layer lines and edge chips.
 */
export function createRock037TabularSandstoneBeddingSlab(w = 6, h = 2.2, d = 5, options = {}) {
  const geom = new THREE.BoxGeometry(w, h, d, 24, 14, 20);
  const pos = geom.attributes.position;
  const count = pos.count;
  const halfH = h * 0.5;
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    // Subtle surface ripple
    if (v.y > halfH * 0.5) {
      v.y += (Math.sin(v.x * 2.1) * Math.cos(v.z * 1.8)) * 0.12;
    }
    // Basal corbel
    if (v.y < -halfH * 0.5) {
      v.x *= 0.92;
      v.z *= 0.92;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  sliceGeometryWithPlanes(geom, 6, Math.max(w, h, d) * 0.52);

  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    const heightNorm = clamp((v.y + halfH) / h, 0.0, 1.0);
    aAO[i] = THREE.MathUtils.lerp(0.20, 0.92, heightNorm);
    aCurvature[i] = 0.50;
  }
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(count).fill(0.0), 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * ROCK-038: Angular Voronoi Cleavage Boulder A (~ 4 x 3.5 x 3.5)
 * 8-plane sliced boulder with sharp cleavage facets and terracotta weathering tint.
 */
export function createRock038AngularVoronoiCleavageBoulderA(w = 4, h = 3.5, d = 3.5, options = {}) {
  const geom = new THREE.IcosahedronGeometry(Math.max(w, h, d) * 0.5, 3);
  const pos = geom.attributes.position;
  const count = pos.count;
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    v.x *= (w / 3.5);
    v.y *= (h / 3.5);
    v.z *= (d / 3.5);
    if (v.y < 0) v.y *= 0.70;
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  sliceGeometryWithPlanes(geom, 8, Math.max(w, h, d) * 0.55);

  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    const heightNorm = clamp((v.y + h * 0.5) / h, 0.0, 1.0);
    aAO[i] = THREE.MathUtils.lerp(0.18, 0.95, heightNorm);
    aCurvature[i] = 0.55;
  }
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(count).fill(0.0), 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * ROCK-039: Angular Voronoi Cleavage Boulder B (~ 3.5 x 3 x 4)
 * Pyramidal cleaved rock block with dark wet base and lichen-encrusted apex.
 */
export function createRock039AngularVoronoiCleavageBoulderB(w = 3.5, h = 3, d = 4, options = {}) {
  const geom = new THREE.IcosahedronGeometry(Math.max(w, h, d) * 0.5, 3);
  const pos = geom.attributes.position;
  const count = pos.count;
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    v.x *= (w / 3.5);
    v.y *= (h / 3.5);
    v.z *= (d / 3.5);
    if (v.y < 0) v.y *= 0.65;
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  sliceGeometryWithPlanes(geom, 9, Math.max(w, h, d) * 0.55);

  const aAO = new Float32Array(count);
  const aCurvature = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i);
    const heightNorm = clamp((v.y + h * 0.5) / h, 0.0, 1.0);
    aAO[i] = THREE.MathUtils.lerp(0.18, 0.95, heightNorm);
    aCurvature[i] = 0.58;
  }
  geom.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(count).fill(0.0), 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

export function createStratifiedBoulderGeometry(radius = 1.0, planeCount = 7) {
  return createRock038AngularVoronoiCleavageBoulderA(radius * 2, radius * 1.8, radius * 1.8);
}

export function createBoulderAssetMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x766a5e, // Weathered Roraima quartzite sandstone
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true
  });
}

