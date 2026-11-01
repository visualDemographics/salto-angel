#include "./chunks/noise.glsl"

uniform float uTime;
uniform float uFlowSpeed;
uniform float uWindStrength;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFallProgress;

void main() {
    vUv = uv;
    vFallProgress = clamp(1.0 - uv.y, 0.0, 1.0);

    vec3 pos = position;

    // Free-fall aerodynamic plume expansion: as water drops below the emergence notch into free air
    float freeFallDrop = clamp((8.5 - pos.y) / 18.0, 0.0, 1.0);
    pos.x *= 1.0 + 0.60 * pow(freeFallDrop, 1.15);

    // Wind shear and aerodynamic drag increase downward along the 979m vertical drop
    float swayX = sin(uTime * 1.5 + pos.y * 0.3) * (uWindStrength * 0.8) * vFallProgress;
    float swayZ = cos(uTime * 1.1 + pos.y * 0.22) * (uWindStrength * 0.4) * vFallProgress;

    // Turbulent billow expansion as the water column atomizes into a plume
    float billow = snoise(vec3(pos.xy * 0.4, uTime * 0.6)) * 0.35 * vFallProgress;

    pos.x += swayX + billow;
    pos.z += swayZ;

    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
