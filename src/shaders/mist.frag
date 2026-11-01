#include "./chunks/noise.glsl"

uniform float uTime;
uniform float uMistDensity;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFogHeightFalloff;
uniform vec3 uCameraPos;

varying float vProgress;
varying vec3 vWorldPosition;
varying float vZone;

void main() {
    vec2 pt = gl_PointCoord - vec2(0.5);
    float dist = length(pt);
    if (dist > 0.5) discard;

    // 1. Soft feathered disc falloff
    float disc = smoothstep(0.5, 0.08, dist);

    // 2. Domain-Warped 2D FBM Wispy Cloud Texture
    vec2 uv = gl_PointCoord * 3.2;
    float warp = snoise2D(uv + vec2(uTime * 0.08, vProgress)) * 0.4;
    float cloudWisp = fbm2D(uv + warp + vec2(uTime * 0.04));
    cloudWisp = smoothstep(0.18, 0.82, cloudWisp * 0.5 + 0.5);

    // 3. Smooth fade-in, sustain, and disperse
    float lifeCurve = sin(vProgress * 3.14159);
    float alpha = disc * cloudWisp * lifeCurve * (uMistDensity * 0.20);

    // 4. Pure Atmospheric Cloud Scattering (Sunlit white vs cool shadow)
    vec3 L = normalize(uSunDirection);
    vec3 V = normalize(uCameraPos - vWorldPosition);

    // Forward Mie scattering makes clouds illuminate warmly when looking toward the sun
    float forwardScatter = pow(max(dot(V, -L), 0.0), 3.0) * 0.55;
    
    vec3 colSunlitCloud = mix(vec3(0.96, 0.98, 1.0), uSunColor, 0.35);
    vec3 colShadowCloud = vec3(0.72, 0.80, 0.88);
    vec3 cloudColor = mix(colShadowCloud, colSunlitCloud, 0.65 + forwardScatter * 0.35);

    // 5. Atmospheric Height Fog
    cloudColor = applyAtmosphericFog(cloudColor, vWorldPosition, uCameraPos, uFogColor, uFogDensity, uFogHeightFalloff, L, uSunColor);

    gl_FragColor = vec4(cloudColor, alpha);
}
