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

    float t = uTime * 2.8;

    // 1. High-velocity downhill whitewater turbulence (stretching along Y, flowing downstream)
    vec2 flowUv1 = vec2(vUv.x * 6.0, vUv.y * 18.0 + t * 1.6);
    vec2 flowUv2 = vec2(vUv.x * 12.0 + 0.3, vUv.y * 32.0 + t * 2.5);

    float n1 = snoise2D(flowUv1) * 0.5 + 0.5;
    float n2 = snoise2D(flowUv2) * 0.5 + 0.5;
    float foamPattern = n1 * 0.6 + n2 * 0.4;

    // 2. Churning Whitewater vs Rocky Outcrops
    // Center channel is raging white foam; edges reveal wet black river stones
    float edgeDist = abs(vUv.x - 0.5) * 2.0;
    float rockMask = smoothstep(0.45, 0.95, edgeDist + snoise2D(vec2(vUv.y * 10.0, vUv.x * 3.0)) * 0.35);

    vec3 colFoam = vec3(0.96, 0.98, 1.0);
    vec3 colTealShallows = vec3(0.12, 0.38, 0.44);
    vec3 colWetRock = vec3(0.08, 0.09, 0.11);

    vec3 waterColor = mix(colTealShallows, colFoam, smoothstep(0.20, 0.60, foamPattern));
    vec3 finalAlbedo = mix(waterColor, colWetRock, rockMask * 0.75);

    // 3. Direct Sun & Radiant Daylight Scattering in Aerated Foam
    float NdotL = max(dot(N, L), 0.0);
    float foamLuminance = smoothstep(0.25, 0.70, foamPattern) * (1.0 - rockMask);
    vec3 ambientFoam = mix(vec3(0.55, 0.62, 0.70), vec3(0.92, 0.95, 0.98), foamLuminance);
    vec3 directLit = finalAlbedo * (NdotL * uSunColor + ambientFoam);

    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 28.0) * (1.0 - rockMask * 0.4) * 0.85;
    directLit += (uSunColor + vec3(0.25)) * spec;

    // 4. Edge Fade into Valley Terrain
    float alpha = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.y));

    // 5. Atmospheric Height Fog
    directLit = applyAtmosphericFog(directLit, vWorldPosition, uCameraPos, uFogColor, uFogDensity, uFogHeightFalloff, L, uSunColor);

    gl_FragColor = vec4(directLit, alpha * 0.96);
}

