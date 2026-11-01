#include "./chunks/noise.glsl"

uniform float uTime;
uniform float uFlowSpeed;
uniform float uMistAmount;
uniform float uStreamWidth;
uniform float uOpacity;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFogHeightFalloff;
uniform vec3 uCameraPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFallProgress;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDirection);
    vec3 V = normalize(uCameraPos - vWorldPosition);

    float t = uTime * uFlowSpeed;

    // 1. High-Frequency Anisotropic Water Filaments (16:1 vertical stretch, flowing downward)
    vec2 uv1 = vec2(vUv.x * 16.0, vUv.y * 1.2 + t * 1.8);
    vec2 uv2 = vec2(vUv.x * 28.0 + 0.4, vUv.y * 2.0 + t * 2.6);
    vec2 uv3 = vec2(vUv.x * 45.0 - 0.7, vUv.y * 3.5 + t * 3.9);

    float f1 = snoise2D(uv1) * 0.5 + 0.5;
    float f2 = snoise2D(uv2) * 0.5 + 0.5;
    float f3 = snoise2D(uv3) * 0.5 + 0.5;

    float filaments = f1 * 0.5 + f2 * 0.35 + f3 * 0.15;

    // 2. Downward Aerodynamic Pulse Waves ("Water Comets" / Free-Fall Bursts)
    // Downward-traveling V-shaped pulses accelerating with gravity
    float pulseCoord = vUv.y * 7.5 + t * 2.4;
    float pulseV = abs(vUv.x - 0.5) * 1.8; // V-shaped downward comet head
    float pulseWave = sin(pulseCoord + pulseV);
    pulseWave = smoothstep(0.1, 0.9, pulseWave * 0.5 + 0.5);

    // Combine fine filaments with free-fall bursts
    float waterDensity = mix(filaments, filaments * 0.7 + pulseWave * 0.5, 0.55);

    // 3. High-Albedo Pure White & Glacier Blue Spray
    // Core aerated torrent is brilliant white (#ffffff), spray edges are cool glacier blue (#d4eaf7)
    vec3 colFoamWhite = vec3(0.98, 0.99, 1.0);
    vec3 colSprayBlue = vec3(0.78, 0.88, 0.96);
    vec3 colDeepChute = vec3(0.62, 0.78, 0.88);

    float coreMask = smoothstep(0.28, 0.72, waterDensity);
    vec3 waterAlbedo = mix(colSprayBlue, colFoamWhite, coreMask);
    waterAlbedo = mix(colDeepChute, waterAlbedo, smoothstep(0.1, 0.4, waterDensity));

    // 4. Mid-Air Atomization into Mist
    // In Angel Falls, the drop is so tall that water partly atomizes into spray before reaching bottom
    float atomization = smoothstep(0.35, 0.95, vFallProgress) * uMistAmount;
    vec3 mistTint = mix(colFoamWhite, vec3(0.94, 0.96, 0.98), 0.5);
    waterAlbedo = mix(waterAlbedo, mistTint, atomization * 0.65);

    // 5. Sunlit Scattering & Specular Rim
    // Forward scattering when backlit by sun through the spray
    float backScatter = pow(max(dot(V, -L), 0.0), 3.5) * 0.75;
    float sunDiff = max(dot(N, L), 0.0) * 0.75 + 0.35;
    vec3 ambientLight = mix(vec3(0.48, 0.56, 0.65), vec3(0.75, 0.84, 0.92), N.y * 0.5 + 0.5);
    vec3 litColor = waterAlbedo * (sunDiff * uSunColor * 0.65 + ambientLight * 0.65) + uSunColor * backScatter;

    // 6. Natural Lateral Stream Profile & Smooth Emergence / Plunge Fades
    float edgeProfile = smoothstep(0.0, 0.24, vUv.x) * smoothstep(1.0, 0.76, vUv.x);
    // Solid, opaque emergence at the summit notch (vFallProgress = 0 at top lip)
    float lipFade = smoothstep(-0.01, 0.02, vFallProgress);
    // Soft fade into the lower mist and rapids (vFallProgress = 1 at base)
    float bottomFade = 1.0 - smoothstep(0.88, 1.0, vFallProgress) * 0.35;

    // Alpha: dense at upper chute, softly feathering into mist veil at bottom
    float alpha = edgeProfile * lipFade * bottomFade * mix(0.95, 0.42, atomization) * uOpacity;

    // 7. Atmospheric Height Fog
    litColor = applyAtmosphericFog(litColor, vWorldPosition, uCameraPos, uFogColor, uFogDensity, uFogHeightFalloff, L, uSunColor);

    gl_FragColor = vec4(litColor, alpha);
}
