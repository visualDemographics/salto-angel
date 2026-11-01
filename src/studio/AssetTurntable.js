import * as THREE from 'three';
import { createRainforestTreeGeometry, createCliffShrubGeometry, createFoliageAssetMaterial } from '../assets/TropicalFloraAssets.js';
import { createStratifiedBoulderGeometry, createBoulderAssetMaterial } from '../assets/CanyonBoulderAssets.js';
import { createVolumetricCliffModule, createTepuiRockMaterial } from '../assets/TepuiRockAssets.js';
import { createWaterfallChuteMesh } from '../assets/WaterfallFluidAssets.js';
import {
  createCliff001EmergenceCleftArch,
  createCliff002LeftAmphitheaterConcaveWallA,
  createCliff004RightButtressMainProw,
  createCliff008SummitCastellatedSpireA,
  createCliff011PlateauTabletopPavementSlabA,
  createCliff013ColumnarRibBastionTriplePillar,
  MILESTONE_1_CLIFF_MODULES
} from '../assets/MacroCliffModules.js';
import {
  HYDROLOGICAL_CHUTE_MODULES,
  createWaterChuteMaterial,
  createRapidsBoilMaterial
} from '../assets/macroCliffs/HydrologicalChuteModules.js';
import { createAllCliffsShowcase, createCliffAssembly } from './MacroCliffShowcase.js';
import { createDiagnosticMaterial } from './DiagnosticMaterials.js';

export const ASSET_REGISTRY = {
  all_cliffs: {
    name: 'Milestone 1: All 35 Macro Cliff Modules Exhibition',
    create: (sharedUniforms) => createAllCliffsShowcase(sharedUniforms),
    cameraDistance: 105,
    cameraPosition: new THREE.Vector3(0, 48, 105),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    hidePlinth: true,
    disableAutoSpin: true
  },
  cliff_assembly: {
    name: 'Milestone 1: Assembled Salto Ángel Cliff Facade',
    create: (sharedUniforms) => {
      const assembly = createCliffAssembly(sharedUniforms);
      assembly.mesh.scale.set(0.34, 0.34, 0.34);
      assembly.mesh.position.y = -3.0;
      return assembly;
    },
    cameraDistance: 40,
    cameraPosition: new THREE.Vector3(0, 5, 40),
    cameraTarget: new THREE.Vector3(0, 2, 0),
    hidePlinth: true
  },
  tree: {
    name: 'Emergent Guiana Rainforest Tree',
    create: (sharedUniforms) => {
      const geom = createRainforestTreeGeometry();
      const mat = createFoliageAssetMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(1.4, 1.4, 1.4);
      mesh.position.y = -3.7;
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 15.5
  },
  shrub: {
    name: 'Tepui Ledge Shrub Mat',
    create: (sharedUniforms) => {
      const geom = createCliffShrubGeometry();
      const mat = createFoliageAssetMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(2.0, 2.0, 2.0);
      mesh.position.y = -0.5;
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 6
  },
  boulder: {
    name: 'Stratified Roraima Sandstone Boulder',
    create: () => {
      const geom = createStratifiedBoulderGeometry(2.0, 8);
      const mat = createBoulderAssetMaterial();
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = 0.2;
      return { mesh, update: () => {} };
    },
    cameraDistance: 7
  },
  cliff: {
    name: 'Volumetric Quartzite Cliff Buttress',
    create: (sharedUniforms) => {
      const geom = createVolumetricCliffModule(14, 20, 7);
      const mat = createTepuiRockMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(0.65, 0.65, 0.65);
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 18
  },
  waterfall: {
    name: '3D Waterfall Chute & Spray Shell',
    create: (sharedUniforms) => {
      const chute = createWaterfallChuteMesh(sharedUniforms, 16, 1.8, 4.0);
      chute.group.position.y = -1.0;
      return { mesh: chute.group, update: chute.update };
    },
    cameraDistance: 16
  },
  cleft: {
    name: 'CLIFF-001: Emergence Cleft Arch',
    create: (sharedUniforms) => {
      const geom = createCliff001EmergenceCleftArch(16, 20, 12);
      const mat = createTepuiRockMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(0.32, 0.32, 0.32);
      mesh.position.y = 0.0;
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 14
  },
  amphitheater: {
    name: 'CLIFF-002: Left Amphitheater Concave Wall',
    create: (sharedUniforms) => {
      const geom = createCliff002LeftAmphitheaterConcaveWallA(18, 24, 10);
      const mat = createTepuiRockMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(0.28, 0.28, 0.28);
      mesh.position.y = 0.0;
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 14
  },
  buttress: {
    name: 'CLIFF-004: Right Buttress Main Prow',
    create: (sharedUniforms) => {
      const geom = createCliff004RightButtressMainProw();
      const mat = createTepuiRockMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(0.18, 0.18, 0.18);
      mesh.position.y = -0.5;
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 16
  },
  spire: {
    name: 'CLIFF-008: Summit Castellated Spire',
    create: (sharedUniforms) => {
      const geom = createCliff008SummitCastellatedSpireA(6, 10, 6);
      const mat = createTepuiRockMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(0.5, 0.5, 0.5);
      mesh.position.y = 0.0;
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 10
  },
  pavement: {
    name: 'CLIFF-011: Plateau Grieta Pavement Slab',
    create: (sharedUniforms) => {
      const geom = createCliff011PlateauTabletopPavementSlabA(18, 3, 18, 64, 16, 64);
      const mat = createTepuiRockMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(0.35, 0.35, 0.35);
      mesh.position.y = 0.0;
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 12
  },
  pillars: {
    name: 'CLIFF-013: Columnar Rib Bastion Triple Pillar',
    create: (sharedUniforms) => {
      const geom = createCliff013ColumnarRibBastionTriplePillar();
      const mat = createTepuiRockMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(0.28, 0.28, 0.28);
      mesh.position.y = 0.0;
      return { mesh, update: (t, cp) => { mat.uniforms.uTime.value = t; if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp); } };
    },
    cameraDistance: 14
  }
};

// Dynamically register all 18 Milestone 1 BOM IDs (e.g., CLIFF-001..CLIFF-025) for targeted diagnostic inspection
for (const [id, def] of Object.entries(MILESTONE_1_CLIFF_MODULES)) {
  const maxDim = Math.max(...def.dims);
  const targetSize = 7.5;
  const scale = targetSize / maxDim;
  ASSET_REGISTRY[id] = {
    name: `${id}: ${def.name}`,
    create: (sharedUniforms) => {
      const geom = def.create();
      const mat = createTepuiRockMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(scale, scale, scale);
      mesh.position.y = 0.0;
      return {
        mesh,
        update: (t, cp) => {
          mat.uniforms.uTime.value = t;
          if (mat.uniforms.uCameraPos) mat.uniforms.uCameraPos.value.copy(cp);
        }
      };
    },
    cameraDistance: 13.5
  };
}

// Dynamically register all 9 Milestone 1 Hydrological Chute IDs (WATER-086..WATER-094)
for (const [id, def] of Object.entries(HYDROLOGICAL_CHUTE_MODULES)) {
  const maxDim = Math.max(...def.dims);
  const targetSize = 7.5;
  const scale = targetSize / maxDim;
  ASSET_REGISTRY[id] = {
    name: `${id}: ${def.name}`,
    create: (sharedUniforms) => {
      const geom = def.create();
      const mat = id === 'WATER-094'
        ? createRapidsBoilMaterial(sharedUniforms)
        : createWaterChuteMaterial(sharedUniforms);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(scale, scale, scale);
      mesh.position.y = 0.0;
      return {
        mesh,
        update: (t) => {
          if (mat.uniforms && mat.uniforms.uTime) mat.uniforms.uTime.value = t;
        }
      };
    },
    cameraDistance: 13.5
  };
}

export function createAssetTurntableStage(sharedUniforms) {
  const stageGroup = new THREE.Group();
  stageGroup.name = 'AssetStudioStage';

  // 1. Studio Lighting Rig
  const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.4);
  keyLight.position.set(6, 10, 8);
  stageGroup.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8ec5fc, 1.0);
  fillLight.position.set(-8, 4, -4);
  stageGroup.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffe0b2, 1.2);
  rimLight.position.set(0, 8, -10);
  stageGroup.add(rimLight);

  // Wide top fill for wide exhibitions
  const wideTopLight = new THREE.DirectionalLight(0xfffaed, 1.8);
  wideTopLight.position.set(0, 32, 24);
  stageGroup.add(wideTopLight);

  const wideFillLeft = new THREE.DirectionalLight(0x90b8f0, 1.2);
  wideFillLeft.position.set(-35, 15, 15);
  stageGroup.add(wideFillLeft);

  const wideFillRight = new THREE.DirectionalLight(0xffd8b0, 1.2);
  wideFillRight.position.set(35, 15, 15);
  stageGroup.add(wideFillRight);

  const ambient = new THREE.AmbientLight(0x2a3342, 1.5);
  stageGroup.add(ambient);

  // 2. Pedestal Plinth
  const plinthGeom = new THREE.CylinderGeometry(4.5, 5.0, 0.4, 48);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    roughness: 0.8,
    metalness: 0.2
  });
  const plinth = new THREE.Mesh(plinthGeom, plinthMat);
  plinth.position.y = -3.7;
  stageGroup.add(plinth);

  // Turntable rotating mount
  const mount = new THREE.Group();
  mount.name = 'TurntableMount';
  stageGroup.add(mount);

  let currentAssetHandle = null;
  let currentAssetEntry = null;
  let currentDiagMode = 'beauty';
  const originalMaterials = new WeakMap();

  function applyDiagnosticMaterial(mode) {
    currentDiagMode = mode;
    const diagMat = createDiagnosticMaterial(mode);

    if (currentAssetEntry) {
      plinth.visible = !currentAssetEntry.hidePlinth && mode !== 'silhouette';
    }

    mount.traverse((obj) => {
      if (obj.isMesh) {
        if (!originalMaterials.has(obj)) {
          originalMaterials.set(obj, obj.material);
        }
        obj.material = diagMat ? diagMat : originalMaterials.get(obj);
      }
    });
  }

  function loadAsset(assetKey) {
    // Clear previous asset
    while (mount.children.length > 0) {
      mount.remove(mount.children[0]);
    }
    currentAssetHandle = null;

    const entry = ASSET_REGISTRY[assetKey] || ASSET_REGISTRY['tree'];
    currentAssetEntry = entry;
    plinth.visible = !entry.hidePlinth && currentDiagMode !== 'silhouette';

    const handle = entry.create(sharedUniforms);
    mount.add(handle.mesh);
    currentAssetHandle = handle;

    if (currentDiagMode !== 'beauty') {
      applyDiagnosticMaterial(currentDiagMode);
    }
    return entry;
  }

  return {
    stageGroup,
    mount,
    loadAsset,
    setDiagnosticMode: applyDiagnosticMaterial,
    update(time, cameraPos, autoRotate = true) {
      if (autoRotate && !(currentAssetEntry && currentAssetEntry.disableAutoSpin)) {
        mount.rotation.y = time * 0.4;
      } else if (currentAssetEntry && currentAssetEntry.disableAutoSpin) {
        mount.rotation.y = 0;
      }
      if (currentAssetHandle && currentAssetHandle.update) {
        currentAssetHandle.update(time, cameraPos);
      }
    }
  };
}

