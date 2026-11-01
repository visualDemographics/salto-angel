#include "./chunks/noise.glsl"

uniform float uTime;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFogHeightFalloff;
uniform vec3 uCameraPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDirection);
    vec3 V = normalize(uCameraPos - vWorldPosition);

    float t = uTime * 3.2;

    // Polar coordinates: vUv.x is azimuth angle (0..1), vUv.y is normalized radius (0..1)
    // 1. Omnidirectional radial surge boiling outward from plunge collision point
    vec2 flowUv1 = vec2(vUv.x * 14.0, vUv.y * 12.0 - t * 2.4);
    vec2 flowUv2 = vec2(vUv.x * 24.0 + 0.5, vUv.y * 22.0 - t * 3.6);

    float n1 = snoise2D(flowUv1) * 0.5 + 0.5;
    float n2 = snoise2D(flowUv2) * 0.5 + 0.5;
    float foamPattern = n1 * 0.6 + n2 * 0.4;

    // 2. Colossal Hydraulic Jump Surge & Aerated Foam
    float rNorm = clamp(vUv.y, 0.0, 1.0);
    // Center plunge basin is ultra-dense foam; outer rim transitions into aerated river water
    float centralBoil = 1.0 - smoothstep(0.18, 0.95, rNorm);
    float standingWave = sin(clamp((rNorm - 0.12) / 0.60, 0.0, 1.0) * 3.14159) * 0.40;
    float totalFoam = clamp(foamPattern * 0.65 + centralBoil * 0.90 + standingWave, 0.0, 1.0);

    // Micro-bubble cellular froth texture (prevents flat blown-out white cutout)
    float microFroth1 = snoise2D(vec2(vUv.x * 128.0, vUv.y * 116.0 - t * 3.8)) * 0.5 + 0.5;
    float microFroth2 = snoise2D(vec2(vUv.x * 256.0 + 0.5, vUv.y * 220.0 - t * 5.2)) * 0.5 + 0.5;
    float microFroth = microFroth1 * 0.55 + microFroth2 * 0.45;
    float foamLuma = mix(0.72, 1.08, microFroth);

    vec3 colFoam = vec3(foamLuma, foamLuma * 0.98, foamLuma * 0.96);
    vec3 colTealSpray = vec3(0.82, 0.91, 0.96) * foamLuma;
    vec3 colAmberRiver = vec3(0.68, 0.78, 0.85);

    vec3 waterColor = mix(colAmberRiver, colTealSpray, smoothstep(0.08, 0.35, totalFoam));
    waterColor = mix(waterColor, colFoam, smoothstep(0.25, 0.65, totalFoam));

    // 3. Radiant Daylight Scattering in Aerated Foam
    float NdotL = max(dot(N, L), 0.0);
    vec3 ambientFoam = mix(vec3(0.78, 0.85, 0.92), vec3(0.96, 0.98, 1.0), totalFoam);
    vec3 directLit = waterColor * (NdotL * uSunColor * 0.60 + ambientFoam * 0.80);

    // Specular highlight on turbulent chop
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 32.0) * 0.85;
    directLit += (uSunColor + vec3(0.20)) * spec;

    // 4. Soft Radial Noise Edge Falloff into Plunge Pool Margin (eradicates sharp cardboard cutout jumps)
    float edgeNoise = snoise2D(vec2(vUv.x * 16.0, uTime * 0.9)) * 0.06;
    float rWarp = rNorm + edgeNoise;
    float alpha = (1.0 - smoothstep(0.78, 0.98, rWarp)) * 0.95;

    // 5. Atmospheric Height Fog
    directLit = applyAtmosphericFog(directLit, vWorldPosition, uCameraPos, uFogColor, uFogDensity, uFogHeightFalloff, L, uSunColor);

    gl_FragColor = vec4(directLit, alpha);
}
