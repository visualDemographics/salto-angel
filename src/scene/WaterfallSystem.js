import * as THREE from 'three';
import {
  createWater086PrimaryCascadeEmergenceChute,
  createWater087SecondaryCascadeEmergenceChute,
  createWater088UpperCompactCoreRibbon,
  createWater089UpperCompactCoreRibbonSec,
  createWater090AtomizedCometaryPulseVeil,
  createWater091DispersedEtherealVaporCurtain,
  createWater092SideTrickleThreadletChuteLeft,
  createWater093SideTrickleThreadletChuteRight,
  createWater094CauldronImpactBoilRing,
  createWaterChuteMaterial,
  createRapidsBoilMaterial
} from '../assets/macroCliffs/HydrologicalChuteModules.js';
import rapidsVert from '../shaders/rapids.vert';
import rapidsFrag from '../shaders/rapids.frag';
import cauldronBoilFrag from '../shaders/cauldronBoil.frag';
import mistVert from '../shaders/mist.vert';
import mistFrag from '../shaders/mist.frag';

/**
 * Salto Ángel — Authentic Top-Rim Hydrological Waterfall System.
 * In accordance with reference photographs (Photos #02, #09, #15), the cataract
 * erupts visibly from the very top skyline rim (Y = +14.2) and drops 22.7m
 * unimpeded in front of the recessed cliff wall down to the plunge cauldron (Y = -8.5):
 * 1. WATER-086: Primary Cascade Emergence Chute (Top lip Y = +14.2, X = -0.45)
 * 2. WATER-087: Secondary Cascade Emergence Chute (Parallel right torrent Y = +14.1, X = +0.75)
 * 3. WATER-088: Upper Compact Core Ribbon Main (Continuous drop Y = +14.1 -> -8.5, X = -0.45)
 * 4. WATER-089: Upper Compact Core Ribbon Sec (Parallel drop Y = +14.0 -> -8.5, X = +0.75)
 * 5. WATER-090: Atomized Cometary Pulse Veil (Mid-to-lower free-fall Y = +11.5 -> -8.5)
 * 6. WATER-091: Dispersed Ethereal Vapor Curtain (Billowing lower spray Y = +6.2 -> -8.8)
 * 7. WATER-092: Side Trickle Threadlet Chute Left (Crevice drip Y = +14.0 -> +1.0, X = -1.6)
 * 8. WATER-093: Side Trickle Threadlet Chute Right (Crevice drip Y = +14.0 -> +2.0, X = +1.8)
 * 9. WATER-094: Cauldron Impact Boil Ring (Standing hydraulic jump surge at Y = -8.5)
 * 10. Lower Whitewater Rapids Gorge Chute (S-curve gorge descending Y = -8.5 -> -14.8)
 * 11. 3-Zone Stratified GPU Mist & Cloud Particle System (1,150 billowed particles)
 */
export function createWaterfallSystem(sharedUniforms) {
  const group = new THREE.Group();
  group.name = 'HydrologicalWaterfallSystem';

  const geometries = [];
  const materials = [];

  function addFluidMesh(name, geom, mat, pos, rot = [0, 0, 0], scale = [1, 1, 1]) {
    geometries.push(geom);
    materials.push(mat);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    group.add(mesh);
    return mesh;
  }

  // =========================================================================
  // 0. WATER-085: SUMMIT TABLETOP TRIBUTARY INFLOW CHANNEL (Rio Churún Plateau Inflow)
  // =========================================================================
  // In accordance with Photo #01, the river flows across the Auyán-tepui sandstone
  // plateau from Z = -26.0 to Z = -4.3, feeding directly into the emergence cleft notch.
  const inflowWidth = 14.5;
  const inflowLength = 30.0;
  const inflowSegX = 36;
  const inflowSegY = 64;
  const inflowGeom = new THREE.PlaneGeometry(inflowWidth, inflowLength, inflowSegX, inflowSegY);
  inflowGeom.rotateX(-Math.PI * 0.5);

  const ifPos = inflowGeom.attributes.position;
  const ifCount = ifPos.count;
  const ifHalfL = inflowLength * 0.5;
  const ifSpeed = new Float32Array(ifCount);
  const ifAO = new Float32Array(ifCount);
  const ifCurvature = new Float32Array(ifCount);
  const ifPartType = new Float32Array(ifCount).fill(1.0);

  for (let i = 0; i < ifCount; i++) {
    const z = ifPos.getZ(i);
    const x = ifPos.getX(i);
    const t = (z + ifHalfL) / inflowLength; // 0.0 at far plateau (z=-26), 1.0 at notch lip (z=-3)

    // Gentle natural meander channel
    const meanderX = Math.sin(t * Math.PI * 2.2) * 1.15;
    ifPos.setX(i, x + meanderX);

    // Bedrock trough depression along center
    const xNorm = Math.abs(x) / (inflowWidth * 0.5);
    const trough = (1.0 - Math.min(1.0, xNorm * xNorm)) * 0.32;
    ifPos.setY(i, trough);

    ifSpeed[i] = 1.6 + t * 2.8;
    ifAO[i] = 0.98;
    ifCurvature[i] = 0.88;
  }
  inflowGeom.setAttribute('aSpeed', new THREE.BufferAttribute(ifSpeed, 1));
  inflowGeom.setAttribute('aAO', new THREE.BufferAttribute(ifAO, 1));
  inflowGeom.setAttribute('aCurvature', new THREE.BufferAttribute(ifCurvature, 1));
  inflowGeom.setAttribute('aPartType', new THREE.BufferAttribute(ifPartType, 1));
  inflowGeom.computeVertexNormals();

  const inflowMat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 2.6,
    windStrength: 0.35,
    mistAmount: 0.85,
    streamWidth: 1.5,
    opacity: 0.98
  });
  addFluidMesh('WATER-085_SummitInflowChannel', inflowGeom, inflowMat, [0.0, 14.65, -16.5]);

  // =========================================================================
  // 1. WATER-086 & WATER-087: TWIN CASCADE EMERGENCE CHUTES (Top Skyline Rim)
  // =========================================================================
  // Primary Emergence Chute erupting from the top rim notch at Y = +14.2
  const water086Geom = createWater086PrimaryCascadeEmergenceChute(2.6, 5.2, 3.2);
  const water086Mat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 2.6,
    windStrength: 0.45,
    mistAmount: 0.65,
    streamWidth: 1.1,
    opacity: 0.96
  });
  // Emergence crest lip arches forward over the brink lip (Z = -4.20)
  addFluidMesh('WATER-086_PrimaryEmergenceChute', water086Geom, water086Mat, [-0.22, 13.18, -4.20]);

  // Secondary Emergence Chute erupting from parallel fissure notch at Y = +14.6
  const water087Geom = createWater087SecondaryCascadeEmergenceChute(1.9, 4.8, 2.8);
  const water087Mat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 2.4,
    windStrength: 0.55,
    mistAmount: 0.75,
    streamWidth: 0.9,
    opacity: 0.92
  });
  addFluidMesh('WATER-087_SecondaryEmergenceChute', water087Geom, water087Mat, [0.42, 13.14, -4.18]);

  // =========================================================================
  // 2. WATER-088 & WATER-089: FULL-DROP COMPACT CORE LIQUID RIBBONS
  // =========================================================================
  // Primary continuous white core ribbon plummeting from Y = +14.7 to Y = -8.5 (height = 23.2)
  const water088Geom = createWater088UpperCompactCoreRibbon(1.36, 23.6, 2.0);
  const water088Mat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 2.5,
    windStrength: 0.55,
    mistAmount: 0.75,
    streamWidth: 1.0,
    opacity: 0.95
  });
  addFluidMesh('WATER-088_UpperCompactCoreMain', water088Geom, water088Mat, [-0.22, 3.25, -4.0]);

  // Secondary continuous liquid ribbon from Y = +14.5 to Y = -8.5 (height = 23.0)
  const water089Geom = createWater089UpperCompactCoreRibbonSec(0.98, 23.4, 1.8);
  const water089Mat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 2.3,
    windStrength: 0.65,
    mistAmount: 0.85,
    streamWidth: 0.8,
    opacity: 0.90
  });
  addFluidMesh('WATER-089_UpperCompactCoreSec', water089Geom, water089Mat, [0.34, 3.15, -3.9]);

  // =========================================================================
  // 3. WATER-090 & WATER-091: ATOMIZED COMETARY VEIL & VAPOR CURTAIN
  // =========================================================================
  // Mid-to-lower aerodynamic atomization: V-shaped water comets from Y = +11.5 to Y = -8.5
  const water090Geom = createWater090AtomizedCometaryPulseVeil(3.8, 20.0, 3.2);
  const water090Mat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 1.8,
    windStrength: 0.95,
    mistAmount: 1.25,
    streamWidth: 1.2,
    opacity: 0.65
  });
  addFluidMesh('WATER-090_AtomizedCometaryPulseVeil', water090Geom, water090Mat, [0.05, 1.5, -3.6]);

  // Wide, billowing vapor curtain expanding across lower amphitheater (Y = +6.2 to -8.8)
  const water091Geom = createWater091DispersedEtherealVaporCurtain(5.2, 16.0, 3.8);
  const water091Mat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 1.4,
    windStrength: 1.25,
    mistAmount: 1.4,
    streamWidth: 1.0,
    opacity: 0.75
  });
  addFluidMesh('WATER-091_DispersedVaporCurtain', water091Geom, water091Mat, [0.05, -1.8, -3.2]);

  // =========================================================================
  // 4. WATER-092 & WATER-093: SIDE TRICKLE THREADLET CHUTES (From Top Rim)
  // =========================================================================
  // Fine western rock crevice stream dripping from Y = +14.0 down to Y = +1.0
  const water092Geom = createWater092SideTrickleThreadletChuteLeft(0.18, 13.0, 0.6);
  const water092Mat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 1.6,
    windStrength: 0.35,
    mistAmount: 0.50,
    streamWidth: 0.25,
    opacity: 0.55
  });
  addFluidMesh('WATER-092_SideTrickleLeft', water092Geom, water092Mat, [-0.75, 7.5, -4.3]);

  // Fine eastern buttress crevice stream dripping from Y = +14.0 down to Y = +2.0
  const water093Geom = createWater093SideTrickleThreadletChuteRight(0.15, 12.0, 0.5);
  const water093Mat = createWaterChuteMaterial(sharedUniforms, {
    flowSpeed: 1.5,
    windStrength: 0.40,
    mistAmount: 0.55,
    streamWidth: 0.22,
    opacity: 0.50
  });
  addFluidMesh('WATER-093_SideTrickleRight', water093Geom, water093Mat, [0.85, 8.0, -4.2]);

  // =========================================================================
  // 5. WATER-094: CAULDRON IMPACT BOIL RING (Plunge Foot Hydraulic Jump)
  // =========================================================================
  // Colossal boiling circular foam surge where the 807m free-fall collides with the scree basin
  const water094Geom = createWater094CauldronImpactBoilRing(13.5, 3.2);
  const boilRingUniforms = {
    ...sharedUniforms,
    uTime: { value: 0 }
  };
  const water094Mat = new THREE.ShaderMaterial({
    vertexShader: rapidsVert,
    fragmentShader: cauldronBoilFrag,
    uniforms: boilRingUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  addFluidMesh('WATER-094_CauldronImpactBoilRing', water094Geom, water094Mat, [0.0, -8.1, -3.6]);

  // =========================================================================
  // 6. LOWER WHITEWATER RAPIDS GORGE CHUTE (Roaring River through Talus)
  // =========================================================================
  const rapidsSegmentsY = 96;
  const rapidsSegmentsX = 32;
  const rapidsWidth = 14.2;
  const rapidsLength = 36.0;
  const rapidsGeom = new THREE.PlaneGeometry(rapidsWidth, rapidsLength, rapidsSegmentsX, rapidsSegmentsY);

  const rPos = rapidsGeom.attributes.position;
  const rv = new THREE.Vector3();

  for (let i = 0; i < rPos.count; i++) {
    rv.fromBufferAttribute(rPos, i);
    const progressY = (rv.y + rapidsLength * 0.5) / rapidsLength;

    // S-curve gorge winding down through talus boulders toward foreground (z = 30)
    const curveX = Math.sin((1.0 - progressY) * Math.PI * 1.5) * 1.8;
    const slopeY = -8.2 - (1.0 - progressY) * 6.8;
    const slopeZ = -3.0 + (1.0 - progressY) * 31.0;
    const widthFactor = 0.95 + (1.0 - progressY) * 0.85;

    rv.x = rv.x * widthFactor + curveX;
    rv.y = slopeY;
    rv.z = slopeZ;

    rPos.setXYZ(i, rv.x, rv.y, rv.z);
  }
  rapidsGeom.computeVertexNormals();

  const rapidsUniforms = {
    ...sharedUniforms,
    uTime: { value: 0 }
  };

  const rapidsMat = new THREE.ShaderMaterial({
    vertexShader: rapidsVert,
    fragmentShader: rapidsFrag,
    uniforms: rapidsUniforms,
    transparent: true
  });
  addFluidMesh('WhitewaterRapidsChute', rapidsGeom, rapidsMat, [0, 0, 0]);

  // =========================================================================
  // 7. 3-ZONE STRATIFIED GPU CLOUD & MIST PARTICLE SYSTEM (1,150 Sprites)
  // =========================================================================
  const particleCount = 1150;
  const positions = new Float32Array(particleCount * 3);
  const aPhase = new Float32Array(particleCount);
  const aSpeed = new Float32Array(particleCount);
  const aDrift = new Float32Array(particleCount * 3);
  const aSize = new Float32Array(particleCount);
  const aZone = new Float32Array(particleCount);

  let pIndex = 0;

  // Zone 0: Top Emergence Rim Mist (250 particles skimming the summit lip Y = 13.5 to 15.5)
  for (let i = 0; i < 250; i++) {
    positions[pIndex * 3 + 0] = (Math.random() - 0.5) * 28.0;
    positions[pIndex * 3 + 1] = 13.5 + Math.random() * 2.2;
    positions[pIndex * 3 + 2] = -4.5 + (Math.random() - 0.5) * 4.0;

    aPhase[pIndex] = Math.random();
    aSpeed[pIndex] = 0.3 + Math.random() * 0.4;
    aDrift[pIndex * 3 + 0] = 0.6 + Math.random() * 0.5;
    aDrift[pIndex * 3 + 1] = 0.08;
    aDrift[pIndex * 3 + 2] = (Math.random() - 0.5) * 0.3;
    aSize[pIndex] = 28.0 + Math.random() * 22.0;
    aZone[pIndex] = 0.0;
    pIndex++;
  }

  // Zone 1: Mid-Cliff Mountain Mist Clouds (400 particles flanking shoulders and buttress)
  for (let i = 0; i < 400; i++) {
    const isRight = Math.random() > 0.48;
    const xPos = isRight ? (2.8 + Math.random() * 9.5) : (-2.8 - Math.random() * 9.5);
    const yPos = -1.0 + Math.random() * 8.5;
    const zPos = -3.5 + Math.random() * 4.5;

    positions[pIndex * 3 + 0] = xPos;
    positions[pIndex * 3 + 1] = yPos;
    positions[pIndex * 3 + 2] = zPos;

    aPhase[pIndex] = Math.random();
    aSpeed[pIndex] = 0.35 + Math.random() * 0.45;
    aDrift[pIndex * 3 + 0] = isRight ? 0.35 : -0.35;
    aDrift[pIndex * 3 + 1] = 0.12;
    aDrift[pIndex * 3 + 2] = 0.15;
    aSize[pIndex] = 36.0 + Math.random() * 26.0;
    aZone[pIndex] = 1.0;
    pIndex++;
  }

  // Zone 2: Plunge Basin Cauldron Spray (500 particles billowing upward from boil ring)
  for (let i = 0; i < 500; i++) {
    const angle = Math.random() * Math.PI * 2.0;
    const radius = Math.random() * 5.5;

    positions[pIndex * 3 + 0] = Math.cos(angle) * radius;
    positions[pIndex * 3 + 1] = -8.2 + Math.random() * 4.2;
    positions[pIndex * 3 + 2] = -3.2 + Math.sin(angle) * radius;

    aPhase[pIndex] = Math.random();
    aSpeed[pIndex] = 0.55 + Math.random() * 0.65;
    aDrift[pIndex * 3 + 0] = Math.cos(angle) * 0.3;
    aDrift[pIndex * 3 + 1] = 0.5 + Math.random() * 0.4;
    aDrift[pIndex * 3 + 2] = Math.sin(angle) * 0.3 + 0.12;
    aSize[pIndex] = 24.0 + Math.random() * 20.0;
    aZone[pIndex] = 2.0;
    pIndex++;
  }

  const particleGeom = new THREE.BufferGeometry();
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeom.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  particleGeom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  particleGeom.setAttribute('aDrift', new THREE.BufferAttribute(aDrift, 3));
  particleGeom.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  particleGeom.setAttribute('aZone', new THREE.BufferAttribute(aZone, 1));
  geometries.push(particleGeom);

  const mistUniforms = {
    ...sharedUniforms,
    uTime: { value: 0 },
    uBaseSize: { value: 34.0 },
    uOpacity: { value: 0.85 },
    uWindDirection: { value: new THREE.Vector3(0.6, 0.1, 0.15) }
  };

  const mistMat = new THREE.ShaderMaterial({
    vertexShader: mistVert,
    fragmentShader: mistFrag,
    uniforms: mistUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
  materials.push(mistMat);

  const mistPoints = new THREE.Points(particleGeom, mistMat);
  mistPoints.name = 'StratifiedMistPoints';
  group.add(mistPoints);

  return {
    group,
    mesh: group,
    setMistDensity(val) {
      if (mistMat.uniforms && mistMat.uniforms.uOpacity) {
        mistMat.uniforms.uOpacity.value = val;
      }
      for (const mat of materials) {
        if (mat.uniforms && mat.uniforms.uMistAmount) {
          mat.uniforms.uMistAmount.value = val * 1.4;
        }
      }
    },
    setFlowSpeed(val) {
      for (const mat of materials) {
        if (mat.uniforms && mat.uniforms.uFlowSpeed) {
          mat.uniforms.uFlowSpeed.value = val;
        }
      }
    },
    setWindStrength(val) {
      for (const mat of materials) {
        if (mat.uniforms && mat.uniforms.uWindStrength) {
          mat.uniforms.uWindStrength.value = val;
        }
      }
    },
    update(time, cameraPos) {
      for (const mat of materials) {
        if (mat.uniforms && mat.uniforms.uTime) {
          mat.uniforms.uTime.value = time;
        }
        if (mat.uniforms && mat.uniforms.uCameraPos) {
          mat.uniforms.uCameraPos.value.copy(cameraPos);
        }
      }
    },
    dispose() {
      for (const geom of geometries) {
        geom.dispose();
      }
      for (const mat of materials) {
        mat.dispose();
      }
    }
  };
}
