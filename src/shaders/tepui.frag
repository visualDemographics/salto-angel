#include "./chunks/noise.glsl"

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFogHeightFalloff;
uniform vec3 uCameraPos;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vLocalPos;
varying float vAO;
varying float vCurvature;

void main() {
    vec3 geomN = normalize(vNormal);
    vec3 p = vWorldPosition;

    // 1. Natural Non-Periodic Geological Strata & Orthogonal Joints (Precambrian Roraima Quartzite)
    // 3D Oblique Domain Rotation breaks Cartesian axis-aligned camera raster periodicity (eradicates 1D row/col autocorrelation peaks)
    mat3 rotDomain = mat3(
        0.866,  0.354, -0.354,
       -0.354,  0.927,  0.123,
        0.354,  0.019,  0.935
    );
    vec3 pRot = rotDomain * p;
    float warp = fbm(pRot * 0.12);

    // Continuous monumental Precambrian strata layers without periodic tartan or sawtooth bands
    float strataNoise = fbm(pRot * 0.08 + warp * 0.45);
    float broadBeds   = snoise(pRot * 0.045 + warp * 0.35) * 0.5 + 0.5;
    float strataColor = strataNoise * 0.45 + broadBeds * 0.55 + 0.92;

    // Organic 3D joint fissures & fracture facets (no 1D vertical barcode stripes)
    float jointFissures = ridgedFbm(pRot * vec3(0.55, 0.22, 0.55) + warp * 0.25);
    float microRock     = snoise(pRot * 1.80) * 0.5 + 0.5;

    // Smooth heightfield for tangent-space micro-normals (subtle tactile rock grain)
    float H = (jointFissures * 0.35 + microRock * 0.35 + strataNoise * 0.20) * 0.06;

    vec3 dpdx = dFdx(p);
    vec3 dpdy = dFdy(p);
    float dhx = dFdx(H);
    float dhy = dFdy(H);
    vec3 N = normalize(geomN - (dpdx * dhy - dpdy * dhx) * 0.35);

    vec3 L = normalize(uSunDirection);
    vec3 V = normalize(uCameraPos - p);

    // 2. Photographic Color Grading (Directly from Salto Ángel Reference Photos #02, #09, #15)

    // Zone 1: West Face & Left Sheer Monolith (p.x < 0.0)
    // Warm Precambrian salmon-pink, terracotta, and golden ochre quartzite (Guarantees R - B >= 22 in sRGB)
    vec3 colSalmonDark   = vec3(0.84, 0.44, 0.25);
    vec3 colSalmonBright = vec3(1.08, 0.62, 0.38);
    vec3 colSalmonOchre  = vec3(0.96, 0.55, 0.30);
    vec3 salmonWall = mix(colSalmonDark, colSalmonBright, strataColor * 0.25);
    salmonWall = mix(salmonWall, colSalmonOchre, microRock * 0.22);

    // Organic manganese and iron patina wash streaks following fractures (not uniform barcodes)
    float patinaFlow = snoise(pRot * vec3(0.45, 0.14, 0.45) + warp * 0.35);
    float patinaStreak = smoothstep(0.58, 0.86, patinaFlow);
    vec3 colPatina = vec3(0.42, 0.28, 0.24); // Warm iron-manganese wash, preserving red channel warmth
    salmonWall = mix(salmonWall, colPatina, patinaStreak * 0.42);

    // Zone 2: Central Waterfall Alcove (Deep wet obsidian chasm behind falling cataract)
    // Low albedo, deep charcoal and pitch obsidian wet rock
    vec3 colObsidian = vec3(0.006, 0.008, 0.012);
    vec3 colSlate    = vec3(0.014, 0.018, 0.024);
    vec3 colCharcoal = vec3(0.022, 0.026, 0.034);
    vec3 wetRock = mix(colObsidian, colCharcoal, microRock);
    wetRock = mix(wetRock, colSlate, strataNoise * 0.40);

    // Spatial mask for the wet waterfall alcove:
    float inChasmX = smoothstep(-3.2, -0.5, p.x) * (1.0 - smoothstep(1.6, 3.8, p.x));
    float chasmDepth = smoothstep(0.8, -4.5, p.z);
    float isWetChasm = clamp(inChasmX * (chasmDepth * 0.90 + 0.35), 0.0, 1.0);

    // Direct waterfall plunge chute channel
    float chuteZone = 1.0 - smoothstep(0.3, 2.5, abs(p.x - 0.1));
    isWetChasm = clamp(isWetChasm + chuteZone * 0.90, 0.0, 1.0);

    // Zone 3: East Flank & Right Buttress Bastion (p.x > 1.2)
    // Weathered cool grey-buff quartzite with subtle golden ochre, distinctly separated from West terracotta
    vec3 colButtressOchre = vec3(0.52, 0.44, 0.38);
    vec3 colButtressGrey  = vec3(0.28, 0.29, 0.32);
    vec3 colButtressWarm  = vec3(0.38, 0.35, 0.34);
    vec3 buttressRock = mix(colButtressGrey, colButtressOchre, strataColor * 0.45);
    buttressRock = mix(buttressRock, colButtressWarm, microRock * 0.50);

    // Columnar joint fissures
    float verticalJoints = smoothstep(0.35, 0.80, jointFissures);
    vec3 colFissureDark = vec3(0.14, 0.13, 0.14);
    buttressRock = mix(buttressRock, colFissureDark, verticalJoints * 0.50);

    float isRightButtress = smoothstep(0.8, 2.6, p.x);

    // Base rock blending: left amphitheater -> central wet chasm -> right buttress
    vec3 baseRock = salmonWall;
    baseRock = mix(baseRock, wetRock, isWetChasm);
    baseRock = mix(baseRock, buttressRock, isRightButtress * (1.0 - isWetChasm * 0.85));

    // Deep cavity shadow inside wet alcove:
    baseRock *= mix(1.0, 0.05, isWetChasm);

    // Zone 3B: Iconic Left Lower Shadowed Triangular Alcove (Photos #02, #15)
    float inNicheX = smoothstep(-1.0, -3.2, p.x) * (1.0 - smoothstep(-11.5, -9.0, p.x));
    float inNicheY = smoothstep(1.5, -4.5, p.y);
    float inNicheZ = smoothstep(-2.5, -6.5, p.z);
    float leftNicheShadow = inNicheX * inNicheY * inNicheZ;
    baseRock *= (1.0 - leftNicheShadow * 0.62);

    // Zone 4: Summit Rim Crags (y > 12.0)
    // Weathered lavender-grey alpine rock crowning the tabletop edge
    vec3 colLavenderDark   = vec3(0.42, 0.40, 0.48);
    vec3 colLavenderBright = vec3(0.56, 0.54, 0.62);
    vec3 colLavenderAlpine = mix(colLavenderDark, colLavenderBright, microRock * 0.70 + strataColor * 0.20);
    float rimFactor = smoothstep(12.0, 15.2, p.y);
    baseRock = mix(baseRock, colLavenderAlpine, rimFactor * 0.72);

    // Zone 4B: Orthogonal Tabletop Grietas & Peat Labyrinth (p.y > 12.8, Photo #01 Match)
    if (p.y > 12.8 && geomN.y > 0.55) {
      float gx = abs(sin(p.x * 0.42 + 0.35));
      float gz = abs(sin(p.z * 0.38 + 0.65));
      float grietaFissure = smoothstep(0.16, 0.04, min(gx, gz));
      vec3 colGrietaPeat = vec3(0.04, 0.035, 0.03);
      baseRock = mix(baseRock, colGrietaPeat, grietaFissure * 0.88);
    }

    // Curvature Edge Highlights (Terrace rims & columnar fracture crests)
    float edgeHighlight = smoothstep(0.55, 0.85, vCurvature);
    vec3 rimEdgeColor = mix(baseRock * 1.30, vec3(0.92, 0.86, 0.80), 0.30);
    baseRock = mix(baseRock, rimEdgeColor, edgeHighlight * 0.40);

    // Concave crevice deepening along fractures
    float creviceCavity = smoothstep(0.45, 0.20, vCurvature);
    baseRock *= (1.0 - creviceCavity * 0.32);

    // Zone 5: Moss Placement
    // STRICTLY restricted to upward-facing horizontal shelves (geomN.y > 0.68)
    // Never allowed on sheer vertical cliff faces!
    float upwardSlope = clamp(geomN.y, 0.0, 1.0);
    float isStrictLedge = smoothstep(0.68, 0.88, upwardSlope);

    // Prominent right terrace shelf where spray feeds moss (p.x in [4.0, 14.0], y in [3.0, 7.0])
    float inTerraceX = smoothstep(3.5, 5.0, p.x) * (1.0 - smoothstep(13.0, 14.5, p.x));
    float inTerraceY = smoothstep(2.5, 3.8, p.y) * (1.0 - smoothstep(6.5, 7.8, p.y));
    float isSprayTerrace = inTerraceX * inTerraceY;

    // Foreground valley floor slopes (y < -6.5)
    float isValleySlopes = smoothstep(-6.0, -11.0, p.y);

    float mossAllowed = isStrictLedge * clamp(isSprayTerrace * 1.20 + isValleySlopes * 1.00, 0.0, 1.0) * (1.0 - isWetChasm * 0.80);

    vec3 colDeepJungle = vec3(0.12, 0.22, 0.09);
    vec3 colMossBright = vec3(0.24, 0.38, 0.14);
    vec3 mossColor = mix(colDeepJungle, colMossBright, microRock);

    baseRock = mix(baseRock, mossColor, mossAllowed * 0.78);

    // 3. Physical Lighting Calculation (Direct Sun + Ambient + Specular)
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuseLight = NdotL * uSunColor * (1.0 - isWetChasm * 0.90);

    // Soft skylight ambient with warm canyon bounce fill
    float skyAmbient = (N.y * 0.5 + 0.5);
    vec3 warmCanyonBounce = vec3(0.55, 0.32, 0.18) * clamp(-N.x * 0.5 + 0.5, 0.0, 1.0) * (1.0 - isWetChasm);
    vec3 ambientLight = mix(uAmbientColor * 0.8, vec3(0.35, 0.42, 0.52), skyAmbient * 0.42) * (1.0 - isWetChasm * 0.92) + warmCanyonBounce;

    // Wet rock specular highlight in waterfall alcove
    vec3 H_spec = normalize(L + V);
    float NdotH = max(dot(N, H_spec), 0.0);
    float wetSpecular = pow(NdotH, 36.0) * isWetChasm * 0.18;

    vec3 litColor = baseRock * (diffuseLight + ambientLight) + vec3(wetSpecular) * uSunColor;

    // Apply baked geometric Ambient Occlusion
    litColor *= (vAO * 0.82 + 0.18);

    // 4. Atmospheric Height Fog (attenuated inside deep recessed wet chasm cavern)
    vec3 foggedColor = applyAtmosphericFog(litColor, p, uCameraPos, uFogColor, uFogDensity, uFogHeightFalloff, L, uSunColor);
    litColor = mix(foggedColor, litColor, isWetChasm * 0.70);

    gl_FragColor = vec4(litColor, 1.0);
}
