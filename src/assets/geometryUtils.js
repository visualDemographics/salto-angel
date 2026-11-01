import * as THREE from 'three';

/**
 * Procedural Geometry Toolkit for geometry-specialist
 */

/**
 * Merges multiple BufferGeometries into a single indexed BufferGeometry,
 * preserving custom attributes: position, normal, uv, aAO, aCurvature, aPartType.
 */
export function mergeGeometriesWithAttributes(geometries) {
  if (!geometries || geometries.length === 0) return null;

  let totalVertices = 0;
  let totalIndices = 0;

  // First pass: count elements and ensure index / attributes exist
  const standardized = geometries.map((geom) => {
    let g = geom.index ? geom : geom.clone();
    if (!g.index) {
      const count = g.attributes.position.count;
      const indices = new Uint32Array(count);
      for (let i = 0; i < count; i++) indices[i] = i;
      g.setIndex(new THREE.BufferAttribute(indices, 1));
    }
    totalVertices += g.attributes.position.count;
    totalIndices += g.index.count;
    return g;
  });

  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);
  const aAO = new Float32Array(totalVertices);
  const aCurvature = new Float32Array(totalVertices);
  const aPartType = new Float32Array(totalVertices);
  const indices = new Uint32Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;

  for (const g of standardized) {
    const vCount = g.attributes.position.count;
    const pos = g.attributes.position.array;
    const norm = g.attributes.normal ? g.attributes.normal.array : null;
    const uv = g.attributes.uv ? g.attributes.uv.array : null;
    const ao = g.attributes.aAO ? g.attributes.aAO.array : null;
    const curv = g.attributes.aCurvature ? g.attributes.aCurvature.array : null;
    const part = g.attributes.aPartType ? g.attributes.aPartType.array : null;
    const idx = g.index.array;

    for (let i = 0; i < vCount; i++) {
      const dstIdx = vertexOffset + i;

      // Position
      positions[dstIdx * 3 + 0] = pos[i * 3 + 0];
      positions[dstIdx * 3 + 1] = pos[i * 3 + 1];
      positions[dstIdx * 3 + 2] = pos[i * 3 + 2];

      // Normal
      if (norm) {
        normals[dstIdx * 3 + 0] = norm[i * 3 + 0];
        normals[dstIdx * 3 + 1] = norm[i * 3 + 1];
        normals[dstIdx * 3 + 2] = norm[i * 3 + 2];
      } else {
        normals[dstIdx * 3 + 1] = 1.0;
      }

      // UV
      if (uv) {
        uvs[dstIdx * 2 + 0] = uv[i * 2 + 0];
        uvs[dstIdx * 2 + 1] = uv[i * 2 + 1];
      }

      // aAO (default 1.0 = fully unoccluded)
      aAO[dstIdx] = ao ? ao[i] : 1.0;

      // aCurvature (default 0.5 = flat, >0.5 convex ridge, <0.5 concave joint)
      aCurvature[dstIdx] = curv ? curv[i] : 0.5;

      // aPartType (0.0 = trunk/rock, 1.0 = foliage/water)
      aPartType[dstIdx] = part ? part[i] : 0.0;
    }

    // Indices
    for (let i = 0; i < idx.length; i++) {
      indices[indexOffset + i] = idx[i] + vertexOffset;
    }

    vertexOffset += vCount;
    indexOffset += idx.length;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  merged.setAttribute('aCurvature', new THREE.BufferAttribute(aCurvature, 1));
  merged.setAttribute('aPartType', new THREE.BufferAttribute(aPartType, 1));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));

  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

/**
 * Bakes vertex Ambient Occlusion (aAO) based on proximity to occluder centers
 * (e.g. trunk center for tree canopy, or cliff back-wall for rock crevices).
 */
export function bakeVertexAO(geometry, occluderCenters, maxDist = 2.5, minAO = 0.15) {
  const posAttr = geometry.attributes.position;
  const count = posAttr.count;
  const aAO = new Float32Array(count);
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(posAttr, i);
    let occlusion = 0.0;

    for (const occluder of occluderCenters) {
      const dist = v.distanceTo(occluder);
      if (dist < maxDist) {
        const factor = 1.0 - (dist / maxDist);
        occlusion = Math.max(occlusion, Math.pow(factor, 1.6));
      }
    }

    aAO[i] = THREE.MathUtils.lerp(1.0, minAO, occlusion);
  }

  geometry.setAttribute('aAO', new THREE.BufferAttribute(aAO, 1));
  return geometry;
}

/**
 * Carves flat, sharp geological cleavage facets by projecting vertices
 * against random slicing planes (Voronoi rock fracturing).
 */
export function sliceGeometryWithPlanes(geometry, planeCount = 6, radius = 1.0) {
  const posAttr = geometry.attributes.position;
  const count = posAttr.count;
  const v = new THREE.Vector3();

  const planes = [];
  for (let p = 0; p < planeCount; p++) {
    const normal = new THREE.Vector3(
      (Math.random() - 0.5) * 2.0,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 2.0
    ).normalize();
    const offset = radius * (0.65 + Math.random() * 0.35);
    planes.push({ normal, offset });
  }

  const aCurv = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(posAttr, i);
    let wasClipped = false;

    for (const plane of planes) {
      const dist = v.dot(plane.normal) - plane.offset;
      if (dist > 0.0) {
        // Project onto the slicing plane
        v.sub(plane.normal.clone().multiplyScalar(dist));
        wasClipped = true;
      }
    }

    posAttr.setXYZ(i, v.x, v.y, v.z);
    // Mark clipped fracture edges with high curvature (convex edge wear)
    aCurv[i] = wasClipped ? 0.85 : 0.45;
  }

  geometry.setAttribute('aCurvature', new THREE.BufferAttribute(aCurv, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

