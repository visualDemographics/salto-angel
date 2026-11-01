#include "./chunks/noise.glsl"

uniform float uTime;
uniform vec3 uBaseColor;

attribute float aPartType; // 0.0 for wood/trunk/branches, 1.0 for foliage lobes
attribute float aAO;        // baked ambient occlusion

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vInstanceColor;
varying vec3 vLocalPos;
varying float vPartType;
varying float vAO;

void main() {
    vPartType = aPartType;
    vAO = (aAO > 0.001) ? aAO : 1.0;
    vLocalPos = position;

    // Foliage mask: 1.0 for leaves/canopy, 0.0 for wood/trunk/branches
    float isFoliage = step(0.5, aPartType);

    // 1. Organic canopy crown displacement: turn geometric icosahedrons into bumpy foliage clusters
    // ONLY applied to foliage lobes (aPartType > 0.5), NEVER to trunk or branches
    vec3 localDisplaced = position;
    if (isFoliage > 0.5) {
        float crownNoise = snoise(position * 2.5) * 0.18;
        vec3 normDir = length(position) > 0.0001 ? normalize(position) : vec3(0.0, 1.0, 0.0);
        localDisplaced += normDir * crownNoise;
    }

    // 2. Instanced vs Standalone Non-Instanced Geometry
    #ifdef USE_INSTANCING
        vec4 instancePos = instanceMatrix * vec4(localDisplaced, 1.0);

        // Wind sway only on foliage leaves (aPartType > 0.5)
        float windSway = sin(uTime * 1.6 + instancePos.x * 0.3 + instancePos.z * 0.4) * 0.08 * max(position.y, 0.0) * isFoliage;
        instancePos.x += windSway;

        mat3 m = mat3(instanceMatrix);
        vec3 transformedNormal = m * normal;

        #if defined( USE_INSTANCING_COLOR ) || defined( INSTANCED_COLOR )
            vInstanceColor = instanceColor;
        #else
            vInstanceColor = (length(uBaseColor) > 0.001) ? uBaseColor : vec3(0.18, 0.42, 0.20);
        #endif
    #else
        vec4 instancePos = vec4(localDisplaced, 1.0);

        // Wind sway only on foliage leaves (aPartType > 0.5)
        float windSway = sin(uTime * 1.6 + position.x * 0.3 + position.z * 0.4) * 0.08 * max(position.y, 0.0) * isFoliage;
        instancePos.x += windSway;

        vec3 transformedNormal = normal;

        vInstanceColor = (length(uBaseColor) > 0.001) ? uBaseColor : vec3(0.18, 0.42, 0.20);
    #endif

    // Normal transformation
    vNormal = normalize(normalMatrix * transformedNormal);

    vec4 worldPos = modelMatrix * instancePos;
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
