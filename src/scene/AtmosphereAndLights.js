import * as THREE from 'three';
import skyVert from '../shaders/sky.vert';
import skyFrag from '../shaders/sky.frag';

export const TIME_PRESETS = {
  'Canaima Crisp Daylight': {
    sunDir: new THREE.Vector3(-0.45, 0.68, 0.58).normalize(),
    sunColor: new THREE.Color(0xfff6ec),
    sunIntensity: 2.8,
    ambientColor: new THREE.Color(0x384a5e),
    hemiSky: new THREE.Color(0x82b8ec),
    hemiGround: new THREE.Color(0x223624),
    fogColor: new THREE.Color(0xa8cbe8),
    fogDensity: 0.011,
    fogHeightFalloff: 0.065,
    skyZenith: new THREE.Color(0x194b8e),
    skyHorizon: new THREE.Color(0xb0d4f0)
  },
  'Golden Hour': {
    sunDir: new THREE.Vector3(0.62, 0.38, 0.68).normalize(),
    sunColor: new THREE.Color(0xffa260),
    sunIntensity: 2.5,
    ambientColor: new THREE.Color(0x3e3238),
    hemiSky: new THREE.Color(0x94b4e8),
    hemiGround: new THREE.Color(0x38281e),
    fogColor: new THREE.Color(0xd59b78),
    fogDensity: 0.014,
    fogHeightFalloff: 0.075,
    skyZenith: new THREE.Color(0x2a436a),
    skyHorizon: new THREE.Color(0xeda378)
  },
  'Misty Cloud Forest': {
    sunDir: new THREE.Vector3(0.15, 0.85, 0.50).normalize(),
    sunColor: new THREE.Color(0xdce6f0),
    sunIntensity: 1.6,
    ambientColor: new THREE.Color(0x3c4450),
    hemiSky: new THREE.Color(0x90a8c4),
    hemiGround: new THREE.Color(0x28302c),
    fogColor: new THREE.Color(0x889eb8),
    fogDensity: 0.024,
    fogHeightFalloff: 0.11,
    skyZenith: new THREE.Color(0x324458),
    skyHorizon: new THREE.Color(0x8ba2bc)
  },
  'Dramatic Twilight': {
    sunDir: new THREE.Vector3(-0.5, 0.08, 0.85).normalize(),
    sunColor: new THREE.Color(0x7c92b8),
    sunIntensity: 1.1,
    ambientColor: new THREE.Color(0x1a2232),
    hemiSky: new THREE.Color(0x364a6c),
    hemiGround: new THREE.Color(0x141820),
    fogColor: new THREE.Color(0x202b3c),
    fogDensity: 0.018,
    fogHeightFalloff: 0.085,
    skyZenith: new THREE.Color(0x0c1626),
    skyHorizon: new THREE.Color(0x283a54)
  }
};

export function createAtmosphereAndLights() {
  const group = new THREE.Group();
  group.name = 'AtmosphereAndLights';

  // 1. Shared Uniforms across all Custom Shaders
  const sharedUniforms = {
    uSunDirection: { value: new THREE.Vector3() },
    uSunColor: { value: new THREE.Vector3() },
    uAmbientColor: { value: new THREE.Vector3() },
    uFogColor: { value: new THREE.Vector3() },
    uFogDensity: { value: 0.011 },
    uFogHeightFalloff: { value: 0.065 },
    uCameraPos: { value: new THREE.Vector3() }
  };

  // 2. Direct Sun Light & Ambient Fill Rig
  const dirLight = new THREE.DirectionalLight(0xfff6ec, 2.8);
  dirLight.name = 'SunLight';
  group.add(dirLight);

  const bounceLight = new THREE.DirectionalLight(0x7bb4ec, 0.8);
  bounceLight.name = 'CanyonWallBounce';
  bounceLight.position.set(8, -2, 6);
  group.add(bounceLight);

  const hemiLight = new THREE.HemisphereLight(0x82b8ec, 0x223624, 0.95);
  hemiLight.name = 'HemisphereAtmosphere';
  group.add(hemiLight);

  // 3. Realistic Sky Dome with Rayleigh Scattering & Cumulus Clouds
  const skyGeom = new THREE.SphereGeometry(140, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSunDirection: sharedUniforms.uSunDirection,
      uSunColor: sharedUniforms.uSunColor,
      uSkyZenith: { value: new THREE.Color() },
      uSkyHorizon: { value: new THREE.Color() },
      uTime: { value: 0 }
    }
  });

  const skyMesh = new THREE.Mesh(skyGeom, skyMat);
  skyMesh.name = 'ProceduralSkyDome';
  group.add(skyMesh);

  function applyPreset(presetName) {
    const p = TIME_PRESETS[presetName] || TIME_PRESETS['Canaima Crisp Daylight'];

    sharedUniforms.uSunDirection.value.copy(p.sunDir);
    sharedUniforms.uSunColor.value.set(p.sunColor.r, p.sunColor.g, p.sunColor.b);
    sharedUniforms.uAmbientColor.value.set(p.ambientColor.r, p.ambientColor.g, p.ambientColor.b);
    sharedUniforms.uFogColor.value.set(p.fogColor.r, p.fogColor.g, p.fogColor.b);
    sharedUniforms.uFogDensity.value = p.fogDensity;
    sharedUniforms.uFogHeightFalloff.value = p.fogHeightFalloff;

    dirLight.color.copy(p.sunColor);
    dirLight.intensity = p.sunIntensity;
    dirLight.position.copy(p.sunDir).multiplyScalar(50);

    hemiLight.color.copy(p.hemiSky);
    hemiLight.groundColor.copy(p.hemiGround);

    skyMat.uniforms.uSkyZenith.value.copy(p.skyZenith);
    skyMat.uniforms.uSkyHorizon.value.copy(p.skyHorizon);
  }

  // Set default Canaima Daylight
  applyPreset('Canaima Crisp Daylight');

  return {
    group,
    sharedUniforms,
    applyPreset,
    update(time) {
      skyMat.uniforms.uTime.value = time;
    }
  };
}
