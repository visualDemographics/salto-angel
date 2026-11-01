import * as THREE from 'three';
import waterfallVert from '../shaders/waterfall.vert';
import waterfallFrag from '../shaders/waterfall.frag';

/**
 * 3D Hydrological Asset Pack:
 * Summit spillway trough + twin free-fall ribbon cores + volumetric spray shell.
 */

export function createWaterfallChuteMesh(sharedUniforms, height = 24, topWidth = 2.4, bottomWidth = 5.2) {
  const group = new THREE.Group();
  group.name = 'WaterfallChuteAsset';

  // 1. Inner Core Stream
  const geom = new THREE.PlaneGeometry(topWidth, height, 24, 120);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const progressY = (v.y + height * 0.5) / height; // 0 = bottom, 1 = top

    // Natural ballistic parabola curve
    let forward = Math.sin((1.0 - progressY) * Math.PI * 0.5) * 2.2;
    let z = -2.5 + forward;

    // Curved crest at summit brink
    if (progressY > 0.88) {
      const lipP = (progressY - 0.88) / 0.12;
      z -= Math.pow(lipP, 1.6) * 3.0;
      v.y -= Math.pow(lipP, 2.0) * 0.35;
    }

    // Downward lateral expansion & fraying
    const widthScale = 1.0 + (1.0 - progressY) * ((bottomWidth / topWidth) - 1.0);
    v.x *= widthScale;
    v.z = z;

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();

  const mat = new THREE.ShaderMaterial({
    vertexShader: waterfallVert,
    fragmentShader: waterfallFrag,
    uniforms: {
      ...sharedUniforms,
      uTime: { value: 0 },
      uFlowSpeed: { value: 2.3 },
      uWindStrength: { value: 0.75 },
      uMistAmount: { value: 0.95 },
      uStreamWidth: { value: 1.0 }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'ChuteCoreStream';
  group.add(mesh);

  // 2. Outer Volumetric Spray Shell
  const sprayGeom = geom.clone();
  sprayGeom.scale(1.25, 1.0, 1.25);
  sprayGeom.translate(0, 0, 0.25);

  const sprayMat = new THREE.ShaderMaterial({
    vertexShader: waterfallVert,
    fragmentShader: waterfallFrag,
    uniforms: {
      ...sharedUniforms,
      uTime: { value: 0 },
      uFlowSpeed: { value: 1.7 },
      uWindStrength: { value: 1.2 },
      uMistAmount: { value: 1.5 },
      uStreamWidth: { value: 1.4 }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const sprayMesh = new THREE.Mesh(sprayGeom, sprayMat);
  sprayMesh.name = 'ChuteSprayShell';
  group.add(sprayMesh);

  return {
    group,
    update(time, cameraPos) {
      mat.uniforms.uTime.value = time;
      sprayMat.uniforms.uTime.value = time;
      if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cameraPos);
      if (sprayMat.uniforms.uCameraPos) sprayMat.uniforms.uCameraPos.value.copy(cameraPos);
    }
  };
}

