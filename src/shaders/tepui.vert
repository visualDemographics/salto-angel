attribute float aAO;
attribute float aCurvature;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vLocalPos;
varying float vAO;
varying float vCurvature;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vLocalPos = position;

    // Graceful fallback for meshes where aAO or aCurvature are unassigned
    vAO = (aAO > 0.001) ? aAO : 1.0;
    vCurvature = (aCurvature > 0.001) ? aCurvature : 0.5;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
