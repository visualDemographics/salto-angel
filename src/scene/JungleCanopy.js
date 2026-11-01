import * as THREE from 'three';
import {
  createRainforestTreeGeometry,
  createCliffShrubGeometry,
  createFoliageAssetMaterial
} from '../assets/TropicalFloraAssets.js';
import {
  createStratifiedBoulderGeometry,
  createBoulderAssetMaterial
} from '../assets/CanyonBoulderAssets.js';
import { createTepuiRockMaterial } from '../assets/TepuiRockAssets.js';

export function createJungleCanopy(sharedUniforms) {
  const group = new THREE.Group();
  group.name = 'JungleCanopy';

  const dummy = new THREE.Object3D();

  // 0. Continuous Forested Valley Bedrock Floor (Sealing the entire canyon floor and valley foothills)
  // Spanning X in [-70, +70], Z in [-32, +52]
  const terrainWidth = 140;
  const terrainDepth = 85;
  const terrainSegX = 64;
  const terrainSegZ = 48;
  const terrainGeom = new THREE.PlaneGeometry(terrainWidth, terrainDepth, terrainSegX, terrainSegZ);
  terrainGeom.rotateX(-Math.PI * 0.5);

  const tPos = terrainGeom.attributes.position;
  const tV = new THREE.Vector3();
  for (let i = 0; i < tPos.count; i++) {
    tV.fromBufferAttribute(tPos, i);
    const z = tV.z;
    const x = tV.x;
    const absX = Math.abs(x);

    // River gorge center elevation slopes down toward foreground (z = 40)
    const zNorm = (z + 10.0) / 45.0;
    const baseElevation = -9.8 - zNorm * 6.5;

    // Lateral valley ridge elevation: gently rises upward into foothills, capped at +2.2 so it never obstructs the horizon or plunge pool
    const ridgeElevation = Math.min(2.2, Math.pow(absX / 18.0, 1.25) * 2.2);

    // Talus slope ramp near cliff base (z < 2.0)
    let talusRamp = 0.0;
    if (z < 2.0) {
      talusRamp = Math.max(0.0, (2.0 - z) / 14.0) * (2.2 + Math.min(absX * 0.08, 1.8));
    }

    // Natural undulating topography
    const hillWarp = Math.sin(x * 0.08) * 0.55 + Math.cos(z * 0.07) * 0.45;

    tV.y = baseElevation + ridgeElevation + talusRamp + hillWarp;
    tPos.setXYZ(i, tV.x, tV.y, tV.z);
  }

  terrainGeom.computeVertexNormals();
  terrainGeom.setAttribute('aAO', new THREE.BufferAttribute(new Float32Array(tPos.count).fill(0.92), 1));
  terrainGeom.setAttribute('aCurvature', new THREE.BufferAttribute(new Float32Array(tPos.count).fill(0.50), 1));
  terrainGeom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(tPos.count).fill(0.0), 1));

  const terrainMat = createTepuiRockMaterial(sharedUniforms);
  const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
  terrainMesh.name = 'ForestedValleyFloorBedrock';
  terrainMesh.position.set(0, 0, 10.0);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 1. Multi-Lobe Emergent Rainforest Trees (1,500 instances)
  const treeCount = 1500;
  const treeGeom = createRainforestTreeGeometry();
  const treeMat = createFoliageAssetMaterial(sharedUniforms, 0x276326);
  const treeInstanced = new THREE.InstancedMesh(treeGeom, treeMat, treeCount);
  treeInstanced.name = 'RainforestCanopyInstances';

  const canopyGreens = [
    new THREE.Color(0x133816), // Deep Amazonian emerald
    new THREE.Color(0x1b4b1e), // Dense rainforest canopy
    new THREE.Color(0x276326), // Vibrant highland moss
    new THREE.Color(0x35782d), // Sun-drenched foliage
    new THREE.Color(0x4c9438), // Bright lime canopy crowns
    new THREE.Color(0x224d25)  // Shaded understory green
  ];

  for (let i = 0; i < treeCount; i++) {
    const isLeft = Math.random() > 0.48;
    const sideSign = isLeft ? -1.0 : 1.0;

    // Longitudinal progress along the valley from cliff base (z = -3.5) to foreground (z = 24.0)
    const zProgress = Math.random();
    const z = -3.5 + zProgress * 27.5;

    // Clear central sightline corridor for plunge pool and rapids
    // Widens progressively toward foreground (z > 14.0) to frame the river corridor authentically
    const minClearDist = z < 5.0 ? 7.0 : (z < 15.0 ? 7.5 : 8.5 + (z - 15.0) * 0.42);
    const xDist = minClearDist + Math.pow(Math.random(), 0.85) * 24.0;
    const x = sideSign * xDist;

    // Valley ridge elevation: keep low near foreground (z > 14.0) so it frames rather than blocks canyon sky
    const ridgeElevation = z > 14.0 ? Math.min(0.8, Math.pow(xDist / 18.0, 1.25) * 0.8) : Math.min(2.8, Math.pow(xDist / 14.0, 1.25) * 2.8);
    const y = -9.2 - zProgress * 6.5 + ridgeElevation + (Math.random() - 0.5) * 0.4;

    // Natural scale variation: smaller near camera (z > 14.0) to preserve low framing sill and V-canyon sky
    const sMax = z > 14.0 ? 0.32 : 0.85;
    const s = 0.25 + Math.random() * sMax;
    const sY = s * (0.80 + Math.random() * 0.30);

    dummy.position.set(x, y, z);
    dummy.rotation.set(
      (Math.random() - 0.5) * 0.15,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.15
    );
    dummy.scale.set(s, sY, s);
    dummy.updateMatrix();

    treeInstanced.setMatrixAt(i, dummy.matrix);
    const col = canopyGreens[Math.floor(Math.random() * canopyGreens.length)];
    treeInstanced.setColorAt(i, col);
  }

  treeInstanced.instanceMatrix.needsUpdate = true;
  if (treeInstanced.instanceColor) treeInstanced.instanceColor.needsUpdate = true;
  group.add(treeInstanced);

  // 2. Cliff-Ledge, Talus & Summit Endemic Flora (1,800 instances)
  const shrubCount = 1800;
  const shrubGeom = createCliffShrubGeometry();
  const shrubMat = createFoliageAssetMaterial(sharedUniforms, 0x367a2e);
  const shrubInstanced = new THREE.InstancedMesh(shrubGeom, shrubMat, shrubCount);
  shrubInstanced.name = 'CliffShrubInstances';

  const shrubColors = [
    new THREE.Color(0x276326), // Highland moss
    new THREE.Color(0x387d2b), // Vibrant ledge cushion
    new THREE.Color(0x4d9435), // Sunlit rim scrub
    new THREE.Color(0x215422), // Shadowed crevice moss
    new THREE.Color(0x56a33c), // Bright bromeliad patch
    new THREE.Color(0x8ebc28), // Brocchinia golden-green rosette (vivid endemic)
    new THREE.Color(0x9ec630), // Stegolepis highland turf (vivid endemic)
    new THREE.Color(0x7da822)  // Heliamphora pitcher cushion (vivid endemic)
  ];

  let placedShrubs = 0;

  // Zone 1: Valley Talus Boulder Margins (300 instances on ground talus along riverbed y in [-14.0, -7.5])
  for (let i = 0; i < 300 && placedShrubs < shrubCount; i++) {
    const isLeft = Math.random() > 0.48;
    const sideSign = isLeft ? -1.0 : 1.0;
    const x = sideSign * (3.6 + Math.random() * 18.0);
    const z = -3.0 + Math.random() * 18.0;
    const y = -8.2 - Math.random() * 5.5 + (Math.abs(x) / 18.0) * 3.5;

    const s = 0.32 + Math.random() * 0.40;
    dummy.position.set(x, y, z);
    dummy.rotation.set(
      (Math.random() - 0.5) * 0.15,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.15
    );
    dummy.scale.set(s, s * 0.65, s);
    dummy.updateMatrix();

    shrubInstanced.setMatrixAt(placedShrubs, dummy.matrix);
    shrubInstanced.setColorAt(placedShrubs, shrubColors[Math.floor(Math.random() * shrubColors.length)]);
    placedShrubs++;
  }

  // Zone 2: Summit Plateau Tabletop Labyrinth & Endemic Mats (1,500 instances, Photo #01 match)
  // Covers the summit plateau pavement across X in [-30.0, 30.0], Z in [-36.0, -5.5], Y in [14.75, 15.15]
  let plateauAttempts = 0;
  while (placedShrubs < shrubCount && plateauAttempts < 2600) {
    plateauAttempts++;
    const x = (Math.random() - 0.5) * 60.0;
    const z = -5.5 - Math.random() * 30.0;
    // Keep central river channel slot (|x| < 4.8 for z near inflow) relatively clear
    if (Math.abs(x) < 4.8 && z > -22.0) continue;

    const y = 14.75 + Math.random() * 0.40;
    const s = 0.75 + Math.random() * 0.75;
    dummy.position.set(x, y, z);
    dummy.rotation.set(
      (Math.random() - 0.5) * 0.15,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.15
    );
    dummy.scale.set(s, s * 0.75, s);
    dummy.updateMatrix();

    shrubInstanced.setMatrixAt(placedShrubs, dummy.matrix);
    shrubInstanced.setColorAt(placedShrubs, shrubColors[Math.floor(Math.random() * shrubColors.length)]);
    placedShrubs++;
  }

  shrubInstanced.count = placedShrubs;
  shrubInstanced.instanceMatrix.needsUpdate = true;
  if (shrubInstanced.instanceColor) shrubInstanced.instanceColor.needsUpdate = true;
  group.add(shrubInstanced);

  // 3. Stratified Sandstone Talus Boulders (320 instances)
  const boulderCount = 320;
  const boulderGeom = createStratifiedBoulderGeometry(1.4, 7);
  const boulderMat = createBoulderAssetMaterial();
  const boulderInstanced = new THREE.InstancedMesh(boulderGeom, boulderMat, boulderCount);
  boulderInstanced.name = 'RapidsTalusBoulders';

  const boulderColors = [
    new THREE.Color(0x6e6358), // Weathered Roraima quartzite
    new THREE.Color(0x554b43), // Oxidized sandstone
    new THREE.Color(0x38322c), // Shadowed rock
    new THREE.Color(0x181a1d), // Wet obsidian near churning foam
    new THREE.Color(0x22262c), // Spray-drenched basalt
    new THREE.Color(0x233122)  // Mossy wet scree
  ];

  let placedBoulders = 0;

  // Sub-zone A: Flanking the rapids gorge (200 instances)
  for (let i = 0; i < 200 && placedBoulders < boulderCount; i++) {
    const isLeft = Math.random() > 0.5;
    const side = isLeft ? -1.0 : 1.0;
    const progress = Math.random(); // 0 = downstream foreground, 1 = plunge foot

    const curveX = Math.sin((1.0 - progress) * Math.PI * 1.5) * 1.3;
    const x = curveX + side * (1.7 + Math.random() * 2.4);
    const y = -9.2 - (1.0 - progress) * 5.8 + (Math.random() - 0.5) * 0.35;
    const z = -3.5 + (1.0 - progress) * 19.0 + (Math.random() - 0.5) * 1.0;

    const s = 0.55 + Math.random() * 0.85;
    const sY = s * (0.65 + Math.random() * 0.45);

    dummy.position.set(x, y + sY * 0.3, z);
    dummy.rotation.set(
      (Math.random() - 0.5) * 0.35,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.35
    );
    dummy.scale.set(s, sY, s);
    dummy.updateMatrix();

    boulderInstanced.setMatrixAt(placedBoulders, dummy.matrix);
    boulderInstanced.setColorAt(placedBoulders, boulderColors[Math.floor(Math.random() * boulderColors.length)]);
    placedBoulders++;
  }

  // Sub-zone B: Talus scree slope base below cliff face (120 instances, framing lateral scree aprons)
  for (let i = 0; i < 120 && placedBoulders < boulderCount; i++) {
    const isLeft = Math.random() > 0.5;
    const side = isLeft ? -1.0 : 1.0;
    const x = side * (2.8 + Math.random() * 10.0);
    const z = -4.5 + Math.random() * 4.5;
    const y = -8.2 - Math.random() * 2.5;

    const s = 0.7 + Math.random() * 1.1;
    const sY = s * (0.7 + Math.random() * 0.4);

    dummy.position.set(x, y + sY * 0.3, z);
    dummy.rotation.set(
      (Math.random() - 0.5) * 0.4,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.4
    );
    dummy.scale.set(s, sY, s);
    dummy.updateMatrix();

    boulderInstanced.setMatrixAt(placedBoulders, dummy.matrix);
    boulderInstanced.setColorAt(placedBoulders, boulderColors[Math.floor(Math.random() * boulderColors.length)]);
    placedBoulders++;
  }

  boulderInstanced.count = placedBoulders;
  boulderInstanced.instanceMatrix.needsUpdate = true;
  if (boulderInstanced.instanceColor) boulderInstanced.instanceColor.needsUpdate = true;
  group.add(boulderInstanced);

  return {
    group,
    update(time, cameraPos) {
      treeMat.uniforms.uTime.value = time;
      shrubMat.uniforms.uTime.value = time;
      terrainMat.uniforms.uTime.value = time;
      if (treeMat.uniforms.uCameraPos) treeMat.uniforms.uCameraPos.value.copy(cameraPos);
      if (shrubMat.uniforms.uCameraPos) shrubMat.uniforms.uCameraPos.value.copy(cameraPos);
      if (terrainMat.uniforms.uCameraPos) terrainMat.uniforms.uCameraPos.value.copy(cameraPos);
    },
    dispose() {
      terrainGeom.dispose();
      terrainMat.dispose();
      treeGeom.dispose();
      treeMat.dispose();
      shrubGeom.dispose();
      shrubMat.dispose();
      boulderGeom.dispose();
      boulderMat.dispose();
    }
  };
}
