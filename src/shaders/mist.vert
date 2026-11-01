uniform float uTime;
uniform float uMistDensity;

attribute float aPhase;
attribute float aSpeed;
attribute vec3 aDrift;
attribute float aSize;
attribute float aZone; // 0 = Rim clouds, 1 = Mid-cliff buttress clouds, 2 = Base plunge mist

varying float vProgress;
varying vec3 vWorldPosition;
varying float vZone;

void main() {
    float progress = fract(aPhase + uTime * aSpeed * 0.05);
    vProgress = progress;
    vZone = aZone;

    vec3 pos = position;

    if (aZone < 0.5) {
        // Zone 0: Orographic Rim Clouds drifting slowly across the Tepui skyline
        pos.x += progress * 14.0 + sin(uTime * 0.3 + aPhase * 6.28) * 1.5;
        pos.y += sin(progress * 3.14159) * 0.8;
        pos.z += cos(uTime * 0.2 + aPhase * 6.28) * 1.2;
    } else if (aZone < 1.5) {
        // Zone 1: Mid-Cliff Buttress Clouds wrapping around the rock shoulders (Photo 1)
        pos.x += aDrift.x * progress * 8.0 + sin(uTime * 0.4 + aPhase * 6.28) * 1.8;
        pos.y += progress * 4.5 + sin(uTime * 0.3) * 0.5;
        pos.z += aDrift.z * progress * 6.0;
    } else {
        // Zone 2: Base Plunge Spray Plume ascending from the river basin
        pos.y += progress * 15.0;
        pos.x += aDrift.x * progress * 9.0 + sin(uTime * 0.6 + aPhase * 6.28) * 1.5;
        pos.z += aDrift.z * progress * 8.0 + cos(uTime * 0.5 + aPhase * 6.28) * 1.5;
    }

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Dynamic puff expansion with life cycle
    float expansion = 1.0 + progress * 2.2;
    float pointSize = aSize * expansion * (380.0 / -mvPosition.z);
    gl_PointSize = clamp(pointSize, 2.0, 180.0);

    gl_Position = projectionMatrix * mvPosition;
}
