import * as THREE from 'three';
import { bakeVertexAO } from './geometryUtils.js';
import tepuiVert from '../shaders/tepui.vert';
import tepuiFrag from '../shaders/tepui.frag';

/**
 * 3D Volumetric Quartzite Cliff Buttress & Monolith Asset Pack.
 * Features rectangular stepped terrace shelves, vertical columnar fault cracks,
 * and precomputed vertex AO / curvature.
 */

export function createVolumetricCliffModule(width = 16, height = 24, depth = 8) {
  const geom = new THREE.BoxGeometry(width, height, depth, 64, 96, 32);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  const occluders = [
    new THREE.Vector3(0, height * 0.2, -depth * 0.4),
    new THREE.Vector3(0, -height * 0.3, -depth * 0.4)
  ];

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Front-face architectural sculpting (z > 0)
    if (v.z > 0.1) {
      // 1. Quantized horizontal sedimentary terrace shelves
      const stepInterval = 2.4;
      const stepIndex = Math.floor((v.y + height * 0.5) / stepInterval);
      const stepProgress = ((v.y + height * 0.5) % stepInterval) / stepInterval;
      const shelfOutward = Math.pow(stepProgress, 3.5) * 0.85;

      // 2. Vertical columnar fault cracks
      const columnFault = Math.sin(v.x * 1.5 + stepIndex * 0.7) * 0.35;

      // 3. Overhang ledge at mid-height
      let overhang = 0.0;
      if (v.y > 2.0 && v.y < 8.0) {
        overhang = Math.sin(((v.y - 2.0) / 6.0) * Math.PI) * 1.2;
      }

      v.z += shelfOutward + columnFault + overhang;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();

  // Precomputed vertex curvature & AO
  const aCurv = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Convex outer shelves have high curvature
    aCurv[i] = (v.z > depth * 0.5) ? 0.75 : 0.45;
  }
  geom.setAttribute('aCurvature', new THREE.BufferAttribute(aCurv, 1));
  geom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(pos.count).fill(0.0), 1));

  bakeVertexAO(geom, occluders, 6.0, 0.25);
  return geom;
}

export function createTepuiRockMaterial(sharedUniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: tepuiVert,
    fragmentShader: tepuiFrag,
    uniforms: {
      ...sharedUniforms,
      uTime: { value: 0 }
    }
  });
}

