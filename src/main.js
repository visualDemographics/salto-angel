import * as THREE from 'three';
import GUI from 'lil-gui';
import { createAtmosphereAndLights, TIME_PRESETS } from './scene/AtmosphereAndLights.js';
import { createCameraRig, CAMERA_PRESETS } from './scene/CameraRig.js';
import { createTepuiCliff } from './scene/TepuiCliff.js';
import { createWaterfallSystem } from './scene/WaterfallSystem.js';
import { createJungleCanopy } from './scene/JungleCanopy.js';
import { createAssetTurntableStage, ASSET_REGISTRY } from './studio/AssetTurntable.js';
import { DIAGNOSTIC_MODES, DIAGNOSTIC_VIEWS, getDiagnosticCameraPose, createDiagnosticMaterial } from './studio/DiagnosticMaterials.js';

// 1. Canvas & WebGL Renderer Configuration
const canvas = document.getElementById('webgl-canvas');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const glContext = renderer.getContext();
let glErrorDetected = false;

function checkGlErrors() {
  if (glContext && !glErrorDetected) {
    const err = glContext.getError();
    if (err !== glContext.NO_ERROR) {
      glErrorDetected = true;
      console.error(`[WebGL Error]: code ${err}`);
    }
  }
  return glErrorDetected;
}

// 2. Scene Graph
const scene = new THREE.Scene();

// 3. Shared Uniforms & Lights
const atmosphere = createAtmosphereAndLights();

// 4. Camera Rig
const cameraRig = createCameraRig(canvas);

// 5. Full Canyon Scene Hierarchy
const canyonGroup = new THREE.Group();
canyonGroup.name = 'FullCanyonEnvironment';
canyonGroup.add(atmosphere.group);

const cliff = createTepuiCliff(atmosphere.sharedUniforms);
canyonGroup.add(cliff.mesh);

const waterfall = createWaterfallSystem(atmosphere.sharedUniforms);
waterfall.setMistDensity(0.75);
canyonGroup.add(waterfall.group);

const jungle = createJungleCanopy(atmosphere.sharedUniforms);
canyonGroup.add(jungle.group);

scene.add(canyonGroup);

// 6. Asset Studio Turntable Hierarchy (Phase 0/1 Divide & Conquer)
const turntableStage = createAssetTurntableStage(atmosphere.sharedUniforms);
scene.add(turntableStage.stageGroup);
turntableStage.stageGroup.visible = false;

// Check URL query param: ?asset=tree | boulder | cliff | waterfall | shrub & ?diag=clay|normals|ao_curv & ?view=wormseye
const urlParams = new URLSearchParams(window.location.search);
const requestedAsset = urlParams.get('asset');
const requestedDiag = urlParams.get('diag');
const requestedView = urlParams.get('view');
const isAssetStudioDefault = requestedAsset && ASSET_REGISTRY[requestedAsset];

const params = {
  workspaceMode: isAssetStudioDefault ? 'Asset Studio Turntable' : 'Full Canyon Scene',
  selectedAsset: isAssetStudioDefault ? requestedAsset : 'tree',
  diagnosticMode: DIAGNOSTIC_MODES.includes(requestedDiag) ? requestedDiag : 'beauty',
  diagnosticView: DIAGNOSTIC_VIEWS.includes(requestedView) ? requestedView : 'default',
  cameraPreset: 'Photo 1 — Classic Canyon Frame',
  timeOfDay: 'Canaima Crisp Daylight',
  flowSpeed: 2.3,
  windStrength: 0.75,
  mistDensity: 0.75,
  fogDensity: 0.011,
  turntableSpin: !(requestedView && requestedView !== 'default')
};

function frameStudioCamera(entry, viewMode) {
  if (viewMode && viewMode !== 'default') {
    const pose = getDiagnosticCameraPose(viewMode, entry.cameraDistance || 14);
    cameraRig.camera.position.copy(pose.position);
    cameraRig.controls.target.copy(pose.target);
  } else {
    if (entry.cameraPosition) {
      cameraRig.camera.position.copy(entry.cameraPosition);
    } else {
      cameraRig.camera.position.set(0, 1.5, entry.cameraDistance);
    }
    if (entry.cameraTarget) {
      cameraRig.controls.target.copy(entry.cameraTarget);
    } else {
      cameraRig.controls.target.set(0, 0, 0);
    }
  }
  cameraRig.controls.update();
}

const originalCanyonMaterials = new Map();

function setCanyonDiagnosticMode(mode, opts = {}) {
  params.diagnosticMode = mode;
  const diagMat = createDiagnosticMaterial(mode);
  const hideFoliage = Boolean(opts.hideFoliage);

  // Hide fluid/mist cards in non-beauty diagnostic modes so translucent planes don't render as solid clay/white boxes
  waterfall.group.visible = mode === 'beauty';
  jungle.group.visible = !hideFoliage;

  canyonGroup.traverse((obj) => {
    if (obj.isMesh && !waterfall.group.getObjectById(obj.id)) {
      if (!originalCanyonMaterials.has(obj)) {
        originalCanyonMaterials.set(obj, obj.material);
      }
      obj.material = diagMat ? diagMat : originalCanyonMaterials.get(obj);
    }
  });

  if (mode === 'silhouette') {
    scene.background = new THREE.Color(0x000000);
    atmosphere.group.visible = false;
  } else if (mode === 'clay' || mode === 'normals' || mode === 'ao_curv') {
    scene.background = new THREE.Color(0x141820);
    atmosphere.group.visible = false;
  } else {
    scene.background = null;
    atmosphere.group.visible = true;
  }
}

function setCustomCameraPose(pos, target, fov = 46) {
  cameraRig.camera.position.set(pos[0], pos[1], pos[2]);
  cameraRig.controls.target.set(target[0], target[1], target[2]);
  cameraRig.camera.fov = fov;
  cameraRig.camera.updateProjectionMatrix();
  cameraRig.controls.update();
}

function applyWorkspaceMode(mode) {
  if (mode === 'Asset Studio Turntable') {
    canyonGroup.visible = false;
    turntableStage.stageGroup.visible = true;
    scene.background = new THREE.Color(params.diagnosticMode === 'silhouette' ? 0x050608 : 0x141820);
    const entry = turntableStage.loadAsset(params.selectedAsset);
    turntableStage.setDiagnosticMode(params.diagnosticMode);
    frameStudioCamera(entry, params.diagnosticView);
  } else {
    turntableStage.stageGroup.visible = false;
    canyonGroup.visible = true;
    setCanyonDiagnosticMode(params.diagnosticMode);
    cameraRig.setPreset(params.cameraPreset);
  }
}

// Initialise starting mode
applyWorkspaceMode(params.workspaceMode);

// 7. Interactive lil-gui Parameter Controls
const gui = new GUI({ title: 'Salto Angel Controls' });

const modeFolder = gui.addFolder('Workspace Mode (Divide & Conquer)');
modeFolder
  .add(params, 'workspaceMode', ['Full Canyon Scene', 'Asset Studio Turntable'])
  .name('Mode')
  .onChange((mode) => {
    applyWorkspaceMode(mode);
  });

modeFolder
  .add(params, 'selectedAsset', Object.keys(ASSET_REGISTRY))
  .name('Studio Asset')
  .onChange((assetKey) => {
    if (params.workspaceMode === 'Asset Studio Turntable') {
      const entry = turntableStage.loadAsset(assetKey);
      turntableStage.setDiagnosticMode(params.diagnosticMode);
      frameStudioCamera(entry, params.diagnosticView);
    }
  });

modeFolder
  .add(params, 'diagnosticMode', DIAGNOSTIC_MODES)
  .name('Diagnostic Pass')
  .listen()
  .onChange((diagMode) => {
    if (params.workspaceMode === 'Asset Studio Turntable') {
      scene.background = new THREE.Color(diagMode === 'silhouette' ? 0x050608 : 0x141820);
      turntableStage.setDiagnosticMode(diagMode);
    } else {
      setCanyonDiagnosticMode(diagMode);
    }
  });

modeFolder
  .add(params, 'diagnosticView', DIAGNOSTIC_VIEWS)
  .name('Studio View')
  .onChange((viewMode) => {
    if (params.workspaceMode === 'Asset Studio Turntable') {
      const entry = ASSET_REGISTRY[params.selectedAsset] || ASSET_REGISTRY['tree'];
      if (viewMode !== 'default') params.turntableSpin = false;
      frameStudioCamera(entry, viewMode);
    }
  });

modeFolder.add(params, 'turntableSpin').name('Turntable Auto-Rotate').listen();
modeFolder.open();

const camFolder = gui.addFolder('Camera Framing (Reference Photos)');
camFolder
  .add(params, 'cameraPreset', Object.keys(CAMERA_PRESETS))
  .name('Viewpoint')
  .onChange((preset) => {
    if (params.workspaceMode === 'Full Canyon Scene') {
      cameraRig.setPreset(preset);
    }
  });
camFolder.open();

const envFolder = gui.addFolder('Atmosphere & Sun');
envFolder
  .add(params, 'timeOfDay', Object.keys(TIME_PRESETS))
  .name('Time of Day')
  .onChange((timePreset) => {
    atmosphere.applyPreset(timePreset);
    params.fogDensity = atmosphere.sharedUniforms.uFogDensity.value;
  });
envFolder
  .add(params, 'fogDensity', 0.002, 0.045, 0.001)
  .name('Canyon Fog')
  .listen()
  .onChange((val) => {
    atmosphere.sharedUniforms.uFogDensity.value = val;
  });

const waterFolder = gui.addFolder('Twin Cascades & Mist');
waterFolder
  .add(params, 'flowSpeed', 0.5, 4.5, 0.1)
  .name('Flow Speed')
  .onChange((val) => {
    waterfall.setFlowSpeed(val);
  });
waterFolder
  .add(params, 'windStrength', 0.0, 2.5, 0.1)
  .name('Wind Sway')
  .onChange((val) => {
    waterfall.setWindStrength(val);
  });
waterFolder
  .add(params, 'mistDensity', 0.1, 2.5, 0.05)
  .name('Mist Density')
  .onChange((val) => {
    waterfall.setMistDensity(val);
  });

// Apply initial mode
applyWorkspaceMode(params.workspaceMode);

// 8. Telemetry Contract (window.__SCENE_METRICS__)
function countActiveMeshes(root) {
  let count = 0;
  root.traverse((obj) => {
    if ((obj.isMesh || obj.isPoints) && obj.visible) {
      count++;
    }
  });
  return count;
}

let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 60;

function updateFps(now) {
  frameCount++;
  const elapsed = now - lastFpsTime;
  if (elapsed >= 500) {
    currentFps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastFpsTime = now;
  }
  return currentFps;
}

window.__SCENE_METRICS__ = {
  activeMeshes: countActiveMeshes(scene),
  fps: 60,
  glErrors: false
};
window.__CAMERA_RIG__ = cameraRig;
window.__SET_CAMERA_POSE__ = setCustomCameraPose;
window.__APP_PARAMS__ = params;
window.__ATMOSPHERE__ = atmosphere;
window.__TURNTABLE__ = turntableStage;
window.__FRAME_STUDIO__ = frameStudioCamera;
window.__SET_DIAGNOSTIC_MODE__ = setCanyonDiagnosticMode;
window.__GUI__ = gui;

// 9. Responsive Viewport
window.addEventListener('resize', () => {
  cameraRig.handleResize();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 10. Frame Timing & Animation Loop (Zero Per-Frame Allocations)
const timer = new THREE.Timer();

function animate(timestamp) {
  requestAnimationFrame(animate);

  timer.update(timestamp);
  const delta = timer.getDelta();
  const elapsedTime = timer.getElapsed();

  if (params.workspaceMode === 'Full Canyon Scene') {
    cameraRig.update(delta);
    atmosphere.update(elapsedTime);
    cliff.update(elapsedTime, cameraRig.camera.position);
    waterfall.update(elapsedTime, cameraRig.camera.position);
    jungle.update(elapsedTime, cameraRig.camera.position);
  } else {
    cameraRig.controls.update();
    turntableStage.update(elapsedTime, cameraRig.camera.position, params.turntableSpin);
  }

  renderer.render(scene, cameraRig.camera);

  const now = performance.now();
  window.__SCENE_METRICS__ = {
    activeMeshes: countActiveMeshes(scene),
    fps: updateFps(now),
    glErrors: checkGlErrors()
  };
}

requestAnimationFrame(animate);
