---
name: glsl-shader-pipeline
description: >-
  Procedure and patterns for authoring modular GLSL vertex (.vert) and fragment
  (.frag) shaders with vite-plugin-glsl, binding uniforms in Three.js
  ShaderMaterial, and connecting interactive parameters to lil-gui.
---

# GLSL Shader Authoring Pipeline

Use this skill when creating or modifying custom shaders in `src/shaders/`.

## 1. File Organization

Place shaders in `src/shaders/`:
- `src/shaders/<name>.vert` — Vertex shader
- `src/shaders/<name>.frag` — Fragment shader
- `src/shaders/chunks/<chunk>.glsl` — Reusable GLSL functions (noise, SDFs, color utilities) imported via `#include "./chunks/<chunk>.glsl"`

## 2. Standard Vertex Shader Template (`.vert`)

```glsl
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
```

## 3. Standard Fragment Shader Template (`.frag`)

```glsl
uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.7));
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 color = uColor * (diff * 0.7 + 0.3);
    gl_FragColor = vec4(color, 1.0);
}
```

## 4. Binding to Three.js & `lil-gui`

1. Import shaders directly in JS/TS:
   ```js
   import vertexShader from './shaders/custom.vert';
   import fragmentShader from './shaders/custom.frag';
   ```
2. Create `THREE.ShaderMaterial` with explicit uniforms.
3. Update `uTime.value = timer.getElapsed()` inside the `THREE.Timer` animation loop.
4. Bind uniform controls to `lil-gui` using `.onChange()` callbacks without allocating new objects inside the render loop.

