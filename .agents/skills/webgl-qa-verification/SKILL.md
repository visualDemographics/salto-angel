---
name: webgl-qa-verification
description: >-
  Runbook for executing automated Playwright WebGL smoke tests, inspecting
  window.__SCENE_METRICS__, verifying zero shader/console errors, and visually
  validating qa-screenshot.png. Use whenever verifying 3D scene or shader
  changes.
---

# WebGL QA & Visual Verification Runbook

Follow this procedure after modifying any Three.js scene, geometry, lighting, or GLSL shader file.

## Step 1: Verify Production Bundle & GLSL Imports

Run a fast Vite production build to confirm all ES modules and `vite-plugin-glsl` shader imports resolve without syntax errors:

```bash
node ./node_modules/vite/bin/vite.js build
```

## Step 2: Ensure Vite Dev Server is Active

Verify that the local Vite development server is listening at `http://127.0.0.1:5173`. If it is not running, start it as a background daemon:

```bash
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
```

## Step 3: Execute Playwright WebGL Smoke Test

Run [`qa-smoke-test.js`](../../../qa-smoke-test.js) via `npm run test:qa`:

```bash
node qa-smoke-test.js
```

### Required Pass Criteria:
1. `window.__SCENE_METRICS__.activeMeshes >= 1`
2. `window.__SCENE_METRICS__.fps > 0`
3. `window.__SCENE_METRICS__.glErrors === false`
4. Sampled WebGL canvas pixels (`gl.readPixels`) contain non-blank colored pixels (`coloredPixels > 0`).
5. Zero `console.error`, `pageerror`, or `THREE.WebGLProgram` compilation warnings.

## Step 4: Multimodal Screenshot Inspection

Use `read_file` on [`qa-screenshot.png`](../../../qa-screenshot.png) to visually inspect the rendered 3D frame and confirm:
- Geometry is centered and framed within the camera frustum.
- Lighting highlights and shading gradients are visible.
- `lil-gui` controls render cleanly in the top-right corner without obstructing the primary subject.

