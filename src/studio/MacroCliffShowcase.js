import * as THREE from 'three';
import { MILESTONE_1_CLIFF_MODULES } from '../assets/MacroCliffModules.js';
import { createTepuiRockMaterial } from '../assets/TepuiRockAssets.js';

/**
 * Creates a floating typography nameplate badge for an asset module.
 */
function createAssetLabel(code, name) {
  if (typeof document === 'undefined') {
    return new THREE.Group();
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  // Badge background with gold accent rim
  ctx.fillStyle = 'rgba(18, 22, 30, 0.92)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 144, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230, 126, 34, 0.75)';
    ctx.lineWidth = 5;
    ctx.stroke();
  } else {
    ctx.fillRect(8, 8, 496, 144);
  }

  // BOM Asset Code
  ctx.fillStyle = '#ff9f43';
  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(code, 256, 62);

  // Asset Descriptive Title
  ctx.fillStyle = '#f1f2f6';
  ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const displayTitle = name.length > 28 ? name.slice(0, 26) + '...' : name;
  ctx.fillText(displayTitle, 256, 114);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const geom = new THREE.PlaneGeometry(4.8, 1.5);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -0.32; // Tilted slightly upwards toward camera
  return mesh;
}

/**
 * 1. 5-Tier Grand Exhibition Gallery: All 35 Macro Cliff Modules Together
 * Laid out in 5 curated depth tiers (7 columns each) on individual exhibition pedestals
 * so every single module is clearly visible, well-lit, and unoccluded.
 */
export function createAllCliffsShowcase(sharedUniforms) {
  const group = new THREE.Group();
  group.name = 'All35MacroCliffsShowcase';

  const rockMat = createTepuiRockMaterial(sharedUniforms);

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x161a20,
    roughness: 0.75,
    metalness: 0.25
  });

  const plinthRimMat = new THREE.MeshBasicMaterial({
    color: 0x8a5422
  });

  // 5 Rows x 7 Columns = 35 Modules
  const rows = [
    {
      z: -36, baseY: +8.0,
      ids: ['CLIFF-002', 'CLIFF-003', 'CLIFF-007', 'CLIFF-004', 'CLIFF-013', 'CLIFF-014', 'CLIFF-035']
    },
    {
      z: -18, baseY: +4.0,
      ids: ['CLIFF-015', 'CLIFF-027', 'CLIFF-026', 'CLIFF-031', 'CLIFF-018', 'CLIFF-019', 'CLIFF-006']
    },
    {
      z: 0, baseY: 0.0,
      ids: ['CLIFF-001', 'CLIFF-020', 'CLIFF-021', 'CLIFF-005', 'CLIFF-028', 'CLIFF-029', 'CLIFF-025']
    },
    {
      z: +18, baseY: -4.0,
      ids: ['CLIFF-016', 'CLIFF-017', 'CLIFF-032', 'CLIFF-033', 'CLIFF-022', 'CLIFF-024', 'CLIFF-010']
    },
    {
      z: +36, baseY: -8.0,
      ids: ['CLIFF-008', 'CLIFF-009', 'CLIFF-023', 'CLIFF-030', 'CLIFF-034', 'CLIFF-011', 'CLIFF-012']
    }
  ];

  const colX = [-45, -30, -15, 0, 15, 30, 45];

  // Global Ground Plane for the Grand Gallery
  const floorGeom = new THREE.PlaneGeometry(125, 105);
  floorGeom.rotateX(-Math.PI * 0.5);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0f1217,
    roughness: 0.88,
    metalness: 0.15
  });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.position.set(0, -8.3, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // Build each module and its pedestal
  rows.forEach((row) => {
    row.ids.forEach((id, colIdx) => {
      const def = MILESTONE_1_CLIFF_MODULES[id];
      if (!def) return;

      const x = colX[colIdx];
      const z = row.z;
      const baseY = row.baseY;

      const geom = def.create();
      geom.computeBoundingBox();
      const bb = geom.boundingBox;
      const bottomY = bb.min.y;
      const maxDim = Math.max(def.dims[0], def.dims[1], def.dims[2]);
      const scale = Math.min(0.55, 9.5 / maxDim);

      const mesh = new THREE.Mesh(geom, rockMat);
      mesh.scale.set(scale, scale, scale);
      mesh.position.set(x, baseY - bottomY * scale, z);
      group.add(mesh);

      // Pedestal Plinth sized to module
      const pW = Math.max(8.0, def.dims[0] * scale + 2.0);
      const pD = Math.max(8.0, def.dims[2] * scale + 2.0);
      const plinthGeom = new THREE.BoxGeometry(pW, 0.45, pD);
      const plinthMesh = new THREE.Mesh(plinthGeom, plinthMat);
      plinthMesh.position.set(x, baseY - 0.22, z);
      group.add(plinthMesh);

      // Subtle golden rim around plinth top
      const rimGeom = new THREE.BoxGeometry(pW + 0.12, 0.06, pD + 0.12);
      const rimMesh = new THREE.Mesh(rimGeom, plinthRimMat);
      rimMesh.position.set(x, baseY - 0.02, z);
      group.add(rimMesh);

      // Plaque Nameplate Badge in front of pedestal
      const plaque = createAssetLabel(id, def.name);
      plaque.position.set(x, baseY + 0.6, z + pD * 0.5 + 1.2);
      group.add(plaque);
    });
  });

  return {
    mesh: group,
    update: (time, cameraPos) => {
      rockMat.uniforms.uTime.value = time;
      if (rockMat.uniforms.uCameraPos) {
        rockMat.uniforms.uCameraPos.value.copy(cameraPos);
      }
    }
  };
}

/**
 * 2. Assembled Salto Ángel Tepui Facade
 * Composes macro cliff modules into their authentic geological positions
 * forming the complete Auyán-tepui canyon face.
 */
export function createCliffAssembly(sharedUniforms) {
  const group = new THREE.Group();
  group.name = 'SaltoAngelCliffAssembly';

  const rockMat = createTepuiRockMaterial(sharedUniforms);

  function addModule(id, pos, rot = [0, 0, 0], scale = [1, 1, 1]) {
    const def = MILESTONE_1_CLIFF_MODULES[id];
    if (!def) return null;
    const geom = def.create();
    const mesh = new THREE.Mesh(geom, rockMat);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.position.set(pos[0], pos[1], pos[2]);
    group.add(mesh);
    return mesh;
  }

  // 1. Plateau Tabletop Pavement Slabs & Rim Skyline (Summit Y = 13.5 to 15.3)
  addModule('CLIFF-011', [-14.0, 13.5, -14.0], [0, 0, 0], [0.85, 0.55, 0.85]);
  addModule('CLIFF-012', [14.0, 13.5, -14.0], [0, 0, 0], [0.85, 0.55, 0.85]);
  addModule('CLIFF-034', [0.0, 14.6, -7.0], [0, 0, 0], [0.42, 0.45, 0.40]);

  // 2. Overhang Cornice Block, Spires & Hoodoos
  addModule('CLIFF-010', [-0.2, 14.8, -7.6], [0, 0, 0], [0.42, 0.40, 0.32]);
  addModule('CLIFF-022', [-6.5, 14.2, -6.2], [0, 0.15, 0], [0.45, 0.45, 0.45]);
  addModule('CLIFF-008', [-14.5, 14.8, -6.0], [0, 0.2, 0], [0.45, 0.55, 0.45]);
  addModule('CLIFF-009', [-20.0, 14.2, -6.5], [0, -0.15, 0], [0.45, 0.55, 0.45]);
  addModule('CLIFF-009', [15.5, 15.2, -5.5], [0, -0.25, 0], [0.45, 0.60, 0.45]);
  addModule('CLIFF-008', [21.5, 14.4, -6.2], [0, 0.18, 0], [0.45, 0.50, 0.45]);
  addModule('CLIFF-023', [-24.0, 13.8, -5.8], [0, 0.35, 0], [0.55, 0.55, 0.55]);
  addModule('CLIFF-030', [-0.2, 13.2, -7.2], [0, 0, 0], [0.40, 0.35, 0.35]);

  // 3. Emergence Notch & Conduits (Recessed to Z = -7.2 .. -6.0)
  addModule('CLIFF-001', [-0.3, 12.6, -7.2], [0, 0, 0], [0.42, 0.38, 0.32]);
  addModule('CLIFF-024', [-0.3, 12.0, -8.6], [0, 0, 0], [0.45, 0.45, 0.45]);
  addModule('CLIFF-025', [1.4, 12.5, -6.8], [0, -0.12, 0], [0.42, 0.38, 0.32]);
  addModule('CLIFF-015', [-5.2, 10.5, -6.2], [0, 0.15, 0], [0.40, 0.40, 0.38]);

  // 4. Central Wet Alcove Back Wall & Tectonic Slabs
  addModule('CLIFF-007', [0.0, 2.5, -7.8], [0, 0, 0], [0.45, 0.45, 0.40]);
  addModule('CLIFF-027', [1.2, -3.8, -7.2], [0, -0.06, 0], [0.45, 0.45, 0.40]);
  addModule('CLIFF-026', [-2.4, 5.5, -6.8], [0, 0.08, 0], [0.45, 0.45, 0.40]);
  addModule('CLIFF-031', [2.8, 4.5, -6.6], [0, -0.10, 0], [0.45, 0.45, 0.40]);

  // 5. Left Amphitheater (Curving Concave Wall & Corner Ledge)
  addModule('CLIFF-002', [-10.5, 4.5, -5.2], [0, 0.25, 0], [0.40, 0.42, 0.38]);
  addModule('CLIFF-003', [-12.5, -4.2, -4.5], [0, 0.35, 0], [0.40, 0.40, 0.38]);
  addModule('CLIFF-018', [-17.5, -9.5, -2.5], [0, 0.42, 0], [0.42, 0.42, 0.40]);
  addModule('CLIFF-032', [-9.0, 0.8, -3.8], [0, 0.20, 0], [0.45, 0.45, 0.42]);
  addModule('CLIFF-033', [-14.5, 7.5, -4.5], [0, 0.28, 0], [0.42, 0.42, 0.40]);

  // 6. Right Buttress (Massive Asymmetric Prow, Mid Shelf, Lower Step, Bastions)
  addModule('CLIFF-004', [10.2, 3.8, -3.8], [0, -0.22, 0], [0.38, 0.42, 0.30]);
  addModule('CLIFF-005', [8.8, 0.2, -1.8], [0, -0.15, 0], [0.42, 0.42, 0.38]);
  addModule('CLIFF-006', [10.5, -7.5, 0.5], [0, -0.10, 0], [0.40, 0.40, 0.35]);
  addModule('CLIFF-019', [16.5, -1.2, -1.5], [0, -0.30, 0], [0.40, 0.40, 0.35]);
  addModule('CLIFF-016', [9.5, 6.8, -2.2], [0, -0.18, 0], [0.42, 0.42, 0.38]);
  addModule('CLIFF-017', [14.8, 2.8, -0.8], [0, -0.22, 0], [0.42, 0.42, 0.38]);
  addModule('CLIFF-013', [4.8, 2.8, -6.0], [0, -0.15, 0], [0.42, 0.42, 0.40]);
  addModule('CLIFF-014', [18.5, 5.5, -2.5], [0, -0.25, 0], [0.42, 0.42, 0.40]);
  addModule('CLIFF-028', [13.2, -2.5, 0.2], [0, -0.18, 0], [0.42, 0.42, 0.38]);
  addModule('CLIFF-029', [15.5, -6.0, 1.2], [0, -0.20, 0], [0.42, 0.42, 0.38]);

  // 7. Basal Talus & Gorge Flank Walls (Ground Transition)
  addModule('CLIFF-020', [-16.5, -9.5, 0.5], [0, 0.32, 0], [0.72, 0.70, 0.55]);
  addModule('CLIFF-021', [17.5, -9.5, 2.8], [0, -0.25, 0], [0.72, 0.70, 0.55]);
  addModule('CLIFF-027', [-23.0, 5.8, -5.8], [0, 0.35, 0], [0.65, 0.60, 0.50]);
  addModule('CLIFF-035', [-25.0, -9.5, -3.5], [0, 0.40, 0], [0.85, 0.75, 0.60]);
  addModule('CLIFF-004', [24.0, 5.6, -4.5], [0, -0.32, 0], [0.60, 0.58, 0.45]);
  addModule('CLIFF-035', [26.0, -9.5, -2.5], [0, -0.38, 0], [0.85, 0.75, 0.60]);
  addModule('CLIFF-027', [0.0, 2.5, -8.6], [0, 0, 0], [0.90, 0.65, 0.50]);
  addModule('CLIFF-027', [0.0, -12.0, -7.5], [0, 0, 0], [0.85, 0.60, 0.50]);

  return {
    mesh: group,
    update: (time, cameraPos) => {
      rockMat.uniforms.uTime.value = time;
      if (rockMat.uniforms.uCameraPos) {
        rockMat.uniforms.uCameraPos.value.copy(cameraPos);
      }
    }
  };
}
