#include "./chunks/noise.glsl"

uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vec3 pos = position;

    // Subtle turbulent wave perturbation on the rapids surface
    float wave = snoise2D(pos.xz * 1.5 + vec2(uTime * 1.2, uTime * 0.8)) * 0.12;
    pos.y += wave;

    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}

