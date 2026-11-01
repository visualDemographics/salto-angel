import * as THREE from 'three';

/**
 * Multi-Channel Diagnostic Shader Materials for Geometry Self-Improvement QA.
 * Strips away procedural noise camouflage to expose raw 3D form, normal topology,
 * vertex attribute dynamic range (aAO, aCurvature), and silhouette breakup.
 */

export const DIAGNOSTIC_MODES = [
  'beauty',      // Full procedural tepui/asset shader
  'clay',        // Pure neutral matte sculpting clay + baked aAO + grazing light
  'normals',     // World-space RGB normals (exposes flat box faces & pinched creases)
  'ao_curv',     // Vertex attribute heatmap: R = aCurvature, G = aAO, B = World Strata
  'wireframe',   // Clay + high-contrast topology wireframe overlay
  'silhouette'   // Binary high-contrast silhouette mask (white on black)
];

export const DIAGNOSTIC_VIEWS = [
  'default',       // Standard turntable camera
  'front',         // Orthographic-like dead-on frontal elevation
  'threequarter',  // 45-degree 3/4 oblique perspective (checks side-wall transition)
  'wormseye',      // Canyon-floor upward pitch (+42°, checks flat box undersides)
  'side',          // 90-degree lateral profile (checks overhang cantilever & depth)
  'top'            // Bird's-eye summit plan view (checks footprint boxiness)
];

const diagnosticVert = /* glsl */ `
  attribute float aAO;
  attribute float aCurvature;
  attribute float aPartType;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying float vAO;
  varying float vCurvature;
  varying float vPartType;

  void main() {
    vAO = aAO > 0.0 ? aAO : 1.0;
    vCurvature = aCurvature;
    vPartType = aPartType;

    #ifdef USE_INSTANCING
      mat4 instModel = modelMatrix * instanceMatrix;
    #else
      mat4 instModel = modelMatrix;
    #endif

    vec4 worldPosition = instModel * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vWorldNormal = normalize(mat3(instModel) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const clayFrag = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying float vAO;
  varying float vCurvature;

  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 keyDir = normalize(vec3(0.55, 0.72, 0.42));
    vec3 fillDir = normalize(vec3(-0.65, 0.25, -0.45));
    vec3 rimDir = normalize(vec3(0.0, 0.4, -0.9));

    float key = max(0.0, dot(n, keyDir));
    float fill = max(0.0, dot(n, fillDir)) * 0.35;
    float rim = pow(max(0.0, dot(n, rimDir)), 2.5) * 0.30;

    // Warm sculpting clay base modulated by baked vertex AO and ridge curvature
    vec3 clayBase = vec3(0.74, 0.71, 0.67);
    vec3 ridgeTint = mix(clayBase, vec3(0.92, 0.88, 0.82), smoothstep(0.55, 0.9, vCurvature) * 0.45);
    float lighting = (0.22 + key * 0.68 + fill + rim) * mix(0.25, 1.0, vAO);

    gl_FragColor = vec4(ridgeTint * lighting, 1.0);
  }
`;

const normalsFrag = /* glsl */ `
  varying vec3 vWorldNormal;

  void main() {
    vec3 n = normalize(vWorldNormal);
    // Map [-1, 1] normal components to [0, 1] RGB
    vec3 rgb = n * 0.5 + 0.5;
    gl_FragColor = vec4(rgb, 1.0);
  }
`;

const aoCurvFrag = /* glsl */ `
  varying vec3 vWorldPos;
  varying float vAO;
  varying float vCurvature;

  void main() {
    // R = Curvature (convex edges glow red/orange)
    // G = Ambient Occlusion (crevices dark, exposed surfaces green)
    // B = Canonical 2.4m world-space horizontal strata alignment lines
    float strataLine = smoothstep(0.92, 1.0, sin(vWorldPos.y * (6.283185 / 2.4)));
    vec3 col = vec3(vCurvature, vAO, strataLine * 0.85);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const silhouetteFrag = /* glsl */ `
  void main() {
    gl_FragColor = vec4(0.96, 0.97, 0.99, 1.0);
  }
`;

export function createDiagnosticMaterial(mode) {
  switch (mode) {
    case 'clay':
      return new THREE.ShaderMaterial({
        vertexShader: diagnosticVert,
        fragmentShader: clayFrag,
        side: THREE.DoubleSide
      });
    case 'normals':
      return new THREE.ShaderMaterial({
        vertexShader: diagnosticVert,
        fragmentShader: normalsFrag,
        side: THREE.DoubleSide
      });
    case 'ao_curv':
      return new THREE.ShaderMaterial({
        vertexShader: diagnosticVert,
        fragmentShader: aoCurvFrag,
        side: THREE.DoubleSide
      });
    case 'wireframe':
      return new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        side: THREE.DoubleSide
      });
    case 'silhouette':
      return new THREE.ShaderMaterial({
        vertexShader: diagnosticVert,
        fragmentShader: silhouetteFrag,
        side: THREE.DoubleSide
      });
    default:
      return null;
  }
}

/**
 * Computes camera position and target for a given diagnostic view angle and base distance.
 */
export function getDiagnosticCameraPose(viewMode, baseDistance = 15) {
  const dist = baseDistance;
  switch (viewMode) {
    case 'front':
      return {
        position: new THREE.Vector3(0, 0.5, dist),
        target: new THREE.Vector3(0, 0, 0)
      };
    case 'threequarter':
      return {
        position: new THREE.Vector3(dist * 0.72, dist * 0.35, dist * 0.72),
        target: new THREE.Vector3(0, 0, 0)
      };
    case 'wormseye':
      // Low canyon floor angle looking sharply upward at overhangs & bottom face
      return {
        position: new THREE.Vector3(dist * 0.25, -dist * 0.58, dist * 0.72),
        target: new THREE.Vector3(0, dist * 0.08, 0)
      };
    case 'side':
      return {
        position: new THREE.Vector3(dist, 0.5, 0.01),
        target: new THREE.Vector3(0, 0, 0)
      };
    case 'top':
      return {
        position: new THREE.Vector3(0, dist * 1.15, 0.01),
        target: new THREE.Vector3(0, 0, 0)
      };
    default:
      return {
        position: new THREE.Vector3(0, 1.5, dist),
        target: new THREE.Vector3(0, 0, 0)
      };
  }
}

