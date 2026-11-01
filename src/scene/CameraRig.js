import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

export const CAMERA_PRESETS = {
  'Photo 1 — Classic Canyon Frame': {
    position: new THREE.Vector3(1.0, -1.5, 42.0),
    target: new THREE.Vector3(0.0, 3.2, -4.5),
    fov: 46
  },
  'Photo 2 — Dramatic Alcove & Rapids': {
    position: new THREE.Vector3(0.5, -9.0, 16.0),
    target: new THREE.Vector3(0.0, 3.2, -4.0),
    fov: 48
  },
  'Photo 3 — Wide Tepui Panorama': {
    position: new THREE.Vector3(7.5, 3.5, 46.0),
    target: new THREE.Vector3(0.0, 3.5, -4.5),
    fov: 58
  },
  'Photo 4 — Cañón del Diablo River Gorge': {
    position: new THREE.Vector3(0.5, -12.5, 28.0),
    target: new THREE.Vector3(0.0, -3.0, -3.5),
    fov: 54
  },
  'Photo 5 — Summit Brink Abyss (Looking Down)': {
    position: new THREE.Vector3(0.0, 16.8, 4.5),
    target: new THREE.Vector3(0.0, 3.5, -4.5),
    fov: 55
  },
  'Photo 6 — High Aerial Tabletop Horizon': {
    position: new THREE.Vector3(8.0, 18.0, 38.0),
    target: new THREE.Vector3(0.0, 0.5, -8.0),
    fov: 52
  },
  'Photo 7 — Left Amphitheater Moss Terraces': {
    position: new THREE.Vector3(-22.0, 14.0, 22.0),
    target: new THREE.Vector3(-6.0, 2.0, -6.0),
    fov: 48
  },
  'Photo 8 — Right Citadel Bastion Shoulder': {
    position: new THREE.Vector3(16.0, 5.0, 14.0),
    target: new THREE.Vector3(10.0, 3.5, -4.0),
    fov: 44
  },
  'Photo 9 — Ground Cauldron Impact & Spray': {
    position: new THREE.Vector3(1.8, -9.0, 6.5),
    target: new THREE.Vector3(0.0, 5.0, -3.5),
    fov: 58
  },
  'Worm’s-Eye Upward Pitch (+35°)': {
    position: new THREE.Vector3(0.0, -11.5, 19.0),
    target: new THREE.Vector3(0.0, 8.5, -6.0),
    fov: 52
  },
  'Left Oblique 45° Cross-Wall': {
    position: new THREE.Vector3(-24.0, 1.5, 22.0),
    target: new THREE.Vector3(-2.0, 1.5, -5.0),
    fov: 48
  },
  'Right Oblique 45° Citadel Prow': {
    position: new THREE.Vector3(24.0, 1.5, 22.0),
    target: new THREE.Vector3(2.0, 1.5, -5.0),
    fov: 48
  }
};

export function createCameraRig(canvas) {
  const initial = CAMERA_PRESETS['Photo 1 — Classic Canyon Frame'];

  const camera = new THREE.PerspectiveCamera(
    initial.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    600
  );
  camera.position.copy(initial.position);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 75;
  controls.minDistance = 2.5;
  controls.maxPolarAngle = Math.PI * 0.5 + 0.12;
  controls.target.copy(initial.target);

  let isTransitioning = false;
  const targetCamPos = new THREE.Vector3().copy(initial.position);
  const targetLookAt = new THREE.Vector3().copy(initial.target);
  let targetFov = initial.fov;

  controls.addEventListener('start', () => {
    isTransitioning = false;
  });

  function setPreset(presetName, instant = false) {
    const p = CAMERA_PRESETS[presetName];
    if (!p) return;
    targetCamPos.copy(p.position);
    targetLookAt.copy(p.target);
    targetFov = p.fov;
    if (instant) {
      camera.position.copy(targetCamPos);
      controls.target.copy(targetLookAt);
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
      controls.update();
      isTransitioning = false;
    } else {
      isTransitioning = true;
    }
  }

  function update(delta) {
    if (isTransitioning) {
      const lerpSpeed = Math.min(1.0, delta * 4.5);
      camera.position.lerp(targetCamPos, lerpSpeed);
      controls.target.lerp(targetLookAt, lerpSpeed);

      if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, lerpSpeed);
        camera.updateProjectionMatrix();
      }

      if (
        camera.position.distanceTo(targetCamPos) < 0.05 &&
        controls.target.distanceTo(targetLookAt) < 0.05 &&
        Math.abs(camera.fov - targetFov) <= 0.1
      ) {
        camera.position.copy(targetCamPos);
        controls.target.copy(targetLookAt);
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
        isTransitioning = false;
      }
    }
    controls.update();
  }

  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  return {
    camera,
    controls,
    setPreset,
    update,
    handleResize
  };
}
