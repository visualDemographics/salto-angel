#include "./chunks/noise.glsl"

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFogHeightFalloff;
uniform vec3 uCameraPos;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vInstanceColor;
varying vec3 vLocalPos;
varying float vPartType;
varying float vAO;

void main() {
    float isFoliage = step(0.5, vPartType);
    float ao = clamp(vAO, 0.0, 1.0);

    vec3 geomN = normalize(vNormal);

    // Screen-space derivatives for geometric face normal
    vec3 dpdx = dFdx(vWorldPosition);
    vec3 dpdy = dFdy(vWorldPosition);
    vec3 cr = cross(dpdx, dpdy);
    float crLen = length(cr);
    if (crLen > 0.0001) {
        vec3 faceN = cr / crLen;
        if (dot(faceN, geomN) < 0.0) faceN = -faceN;
        geomN = faceN;
    }

    // 1. Surface Bump Mapping:
    // Foliage gets high-frequency leaf bump; wood/bark gets longitudinal fibrous grain bump
    float leafBump = snoise(vWorldPosition * 4.5) * 0.25;
    float barkBump = snoise(vec3(vWorldPosition.x * 12.0, vWorldPosition.y * 3.0, vWorldPosition.z * 12.0)) * 0.08;
    float surfaceBump = mix(barkBump, leafBump, isFoliage);

    float dhx = dFdx(surfaceBump);
    float dhy = dFdy(surfaceBump);
    float bumpStrength = mix(1.2, 2.2, isFoliage);
    vec3 N = normalize(geomN - (dpdx * dhy - dpdy * dhx) * bumpStrength);

    vec3 L = normalize(uSunDirection);
    vec3 V = normalize(uCameraPos - vWorldPosition);
    float NdotL = max(dot(N, L), 0.0);

    // Common hemispheric ambient sky lighting
    vec3 skyHemisphere = mix(uAmbientColor, vec3(0.18, 0.28, 0.38), clamp(N.y * 0.5 + 0.5, 0.0, 1.0));

    // 2. Trunk & Wood Branch Shading (vPartType < 0.5)
    // Natural rainforest bark: warm bark brown tones vec3(0.22, 0.16, 0.12), bark grain noise, high roughness
    float barkGrain1 = snoise(vec3(vLocalPos.x * 14.0, vLocalPos.y * 2.5, vLocalPos.z * 14.0)) * 0.5 + 0.5;
    float barkGrain2 = snoise(vec3(vLocalPos.x * 28.0, vLocalPos.y * 6.0, vLocalPos.z * 28.0)) * 0.5 + 0.5;
    float barkPattern = barkGrain1 * 0.65 + barkGrain2 * 0.35;

    vec3 barkBase = vec3(0.22, 0.16, 0.12);
    vec3 barkDark = vec3(0.13, 0.09, 0.07);
    vec3 barkLight = vec3(0.31, 0.23, 0.17);
    vec3 barkAlbedo = mix(barkDark, mix(barkBase, barkLight, barkPattern), 0.85);

    // Subtle moss wash near base of trunk (y < 1.2)
    float baseMossMask = clamp(1.2 - vLocalPos.y * 0.35, 0.0, 1.0);
    vec3 mossTint = vec3(0.16, 0.25, 0.11);
    barkAlbedo = mix(barkAlbedo, mossTint, baseMossMask * 0.3 * barkGrain1);

    // Wood high-roughness diffuse lighting modulated by vAO crevice shadow
    vec3 woodDirect = uSunColor * (NdotL * 0.85 + 0.08);
    vec3 woodLit = barkAlbedo * (skyHemisphere * ao + woodDirect) * ao;

    // 3. Tropical Foliage Canopy Shading (vPartType >= 0.5)
    // Base instance color modulated by crown height and sunlit highlights
    vec3 deepShadow = vec3(0.06, 0.15, 0.07);
    vec3 lushCanopy = vInstanceColor;
    vec3 sunlitLeaves = mix(vInstanceColor * 1.35, vec3(0.48, 0.75, 0.24), 0.5);

    // Crown vertical gradient: deep dark shadow at underside, bright vibrant green on top
    float crownHeight = clamp(vLocalPos.y * 0.7 + 0.4, 0.0, 1.0);
    vec3 foliageBase = mix(deepShadow, lushCanopy, crownHeight);

    // Foliage Translucency & Subsurface Sun Scattering
    float subSurface = pow(max(dot(V, -L), 0.0), 3.0) * 0.35 * crownHeight;
    vec3 litFoliage = mix(foliageBase, sunlitLeaves, NdotL * 0.8 + subSurface);

    vec3 foliageDirect = uSunColor * (NdotL + subSurface * 1.5);
    vec3 foliageLit = litFoliage * (skyHemisphere * ao + foliageDirect) * (ao * 0.75 + 0.25);

    // 4. Combine Wood and Foliage by Part Type
    vec3 finalColor = mix(woodLit, foliageLit, isFoliage);

    // 5. Atmospheric Height Fog
    finalColor = applyAtmosphericFog(finalColor, vWorldPosition, uCameraPos, uFogColor, uFogDensity, uFogHeightFalloff, L, uSunColor);

    gl_FragColor = vec4(finalColor, 1.0);
}
