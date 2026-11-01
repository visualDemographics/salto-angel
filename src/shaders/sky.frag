#include "./chunks/noise.glsl"

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform float uTime;

varying vec3 vWorldPosition;

void main() {
    vec3 dir = normalize(vWorldPosition);
    float h = clamp(dir.y, 0.0, 1.0);

    // 1. Rayleigh Sky Gradient
    vec3 skyBase = mix(uSkyHorizon, uSkyZenith, pow(h, 0.65));

    // Sun disc & glow
    vec3 L = normalize(uSunDirection);
    float sunDot = max(dot(dir, L), 0.0);
    float sunGlow = pow(sunDot, 12.0) * 0.45;
    float sunDisc = smoothstep(0.9985, 0.9995, sunDot) * 2.0;

    skyBase += uSunColor * (sunGlow + sunDisc);

    // 2. Procedural Drifting Cumulus Clouds in the Upper Sky (Matching Photo 3)
    if (h > 0.08) {
        vec2 skyUv = dir.xz / (dir.y + 0.12) * 0.35 + vec2(uTime * 0.006, uTime * 0.003);
        float cloudNoise = fbm2D(skyUv * 3.0);
        float cloudCoverage = smoothstep(0.42, 0.78, cloudNoise);

        vec3 colCloudWhite = vec3(0.98, 0.99, 1.0);
        vec3 colCloudShade = vec3(0.74, 0.82, 0.90);
        vec3 cloudLit = mix(colCloudShade, colCloudWhite, sunDot * 0.4 + 0.6);

        skyBase = mix(skyBase, cloudLit, cloudCoverage * 0.85 * smoothstep(0.08, 0.35, h));
    }

    gl_FragColor = vec4(skyBase, 1.0);
}

