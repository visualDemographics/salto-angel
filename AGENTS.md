# Salto Angel — Three.js & WebGL Multi-Agent Architecture

This workspace is a high-performance **Three.js + GLSL + Vite** creative coding and 3D visual engineering environment using an **Asset-First Divide & Conquer Pipeline** and automated Playwright WebGL QA verification.

---

## 1. Lead & Subagent Topology (Asset-First Divide & Conquer)

```
                        ┌──────────────────────────────────┐
                        │      lead-creative-director      │
                        │ (Root Orchestrator & 3D Lead)    │
                        └────────────────┬─────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
┌─────────────────────┐         ┌───────────────────┐           ┌───────────────────┐
│ geometry-specialist │◄───────►│ shader-specialist │           │  scene-architect  │
│ (Phase 1: Standalone│         │  (GLSL .vert/.frag│           │ (Phase 2: Assembly│
│  3D Assets, Vertex  │         │   Noise, SDFs,    │           │  Instancing, Cam, │
│  AO, Turntable Lab) │         │   PBR/Custom Mat) │           │  Lights, lil-gui) │
└──────────┬──────────┘         └─────────┬─────────┘           └─────────┬─────────┘
           └──────────────────────────────┼───────────────────────────────┘
                                          ▼
                             ┌──────────────────────────┐
                             │   performance-profiler   │
                             │ (Draw Calls, Memory,     │
                             │  60 FPS, Disposal)       │
                             └────────────┬─────────────┘
                                          ▼
                             ┌──────────────────────────┐
                             │    qa-visual-verifier    │
                             │ (Playwright ANGLE WebGL, │
                             │  Asset & Scene QA Gate)  │
                             └──────────────────────────┘
```

### Agent Roster & Delegation Matrix

| Agent Name | Slash Command | Role | Primary Scope & Files | When to Invoke |
| :--- | :--- | :--- | :--- | :--- |
| **`lead-creative-director`** | `/lead-creative-director` | Lead Creative Technologist & 3D Architect | Whole repository, Asset-First pipeline coordination | Orchestrating multi-stage 3D builds: Phase 1 (Asset Studio creation & QA) followed by Phase 2 (Scene composition & QA). |
| **`geometry-specialist`** | `/geometry-specialist` | Procedural 3D Geometry & Volumetric Asset Artist | `src/assets/*.js`, `BufferGeometry`, vertex attributes (`aAO`, `aCurvature`) | Designing standalone 3D assets (fractured quartzite monoliths, multi-lobe rainforest trees, plane-clipped boulders, fluid chutes) and inspecting them on the Asset Turntable (`?asset=<name>`). |
| **`shader-specialist`** | `/shader-specialist` | GLSL Shader & Procedural Material Engineer | `src/shaders/*.vert`, `src/shaders/*.frag`, `src/shaders/*.glsl` | Writing or debugging vertex/fragment shaders, procedural noise (Simplex/Ridged FBM/Voronoi), derivative micro-normals, and atmospheric effects. |
| **`scene-architect`** | `/scene-architect` | Three.js Scene Graph, Layout & Camera Architect | `src/main.js`, `src/scene/*.js`, `OrbitControls`, `lil-gui` | Assembling approved Phase 1 assets into the full 3D environment, configuring `InstancedMesh` distributions, lighting rigs, and camera choreography. |
| **`performance-profiler`** | `/performance-profiler` | WebGL Performance, Draw-Call & Memory Auditor | `src/`, `renderer.info`, `window.__SCENE_METRICS__` | Auditing frame pacing, removing per-frame GC allocations inside `requestAnimationFrame`, batching draw calls, and verifying `.dispose()` lifecycles. |
| **`qa-visual-verifier`** | `/qa-visual-verifier` | Automated WebGL QA & Visual Regression Engineer | `qa-smoke-test.js`, `qa-screenshot.png`, `package.json` | Running `npm run test:qa` in both **Asset Studio mode** (`?asset=...`) and **Full Scene mode**, verifying zero WebGL errors and visually inspecting screenshots. |

> **Session Registration**: If starting a fresh conversation where custom subagent types are not yet registered in runtime memory, register them via `define_subagent` using their definitions in `.agents/agents/<name>.md`.

---

## 2. Mandatory Engine & Architectural Invariants

1. **Asset-First Divide & Conquer Workflow**:
   - Never build complex 3D scenes out of raw unstyled primitives (`DodecahedronGeometry`, flat sine-wave planes).
   - **Phase 1 (Asset Creation & Isolated QA)**: Build and shader-pair each hero asset in `src/assets/` and verify it up close in the **Asset Studio Turntable** (`http://127.0.0.1:5173/?asset=<name>`).
   - **Phase 2 (Scene Composition)**: Assemble the verified assets in `src/scene/` only after individual assets pass visual inspection.
2. **Renderer & Color Management (`src/main.js`)**:
   - Initialize `THREE.WebGLRenderer` with `{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }`.
   - Set `renderer.outputColorSpace = THREE.SRGBColorSpace` and `renderer.toneMapping = THREE.ACESFilmicToneMapping`.
   - Cap pixel ratio on init and window `resize`: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
3. **Frame Timing & Zero Per-Frame Allocations**:
   - Always use `THREE.Timer` (never deprecated `THREE.Clock`).
   - Never instantiate `new THREE.Vector3()`, `new THREE.Color()`, or `new THREE.Matrix4()` inside `requestAnimationFrame`.
4. **Telemetry Contract (`window.__SCENE_METRICS__`)**:
   - Always expose and update `window.__SCENE_METRICS__` with `{ activeMeshes: number, fps: number, glErrors: boolean }`.
5. **Mandatory QA Gate (`npm run test:qa`)**:
   - Every asset and scene milestone must be verified by running `npm run test:qa` and visually inspecting the captured PNG screenshots.

---

## 3. Autonomous Visual Quality Loop, Dynamic Audit Evolution & Mandatory 3-Pass Protocol

1. **Full Back-Propagation & Base Geometry Evolution Rights**:
   - Agents are explicitly granted full rights to modify base geometry generators in `src/assets/*.js` and `src/assets/macroCliffs/*.js` during visual evaluation.
   - When existing module topologies cannot achieve photographic parity with reference photos (`salto-angel-photos/`), agents have full rights to **create new procedural geometry modules** in `src/assets/` or retire/merge unblended kitbash fragments.

2. **Dynamic Audit Evolution Rights ("Ponder & Modify `audit-visual-match.js` On The Go")**:
   - **Zero Artificial / Hardcoded Scores**: `scripts/audit-visual-match.js` must never award hardcoded baseline points. Every point out of 100 must be earned from live WebGL pixel/silhouette/gradient measurements.
   - **Mandatory Visual Ponder & Test Self-Modification**: During every Re-Sculpt phase, the agent must visually inspect the rendered diagnostic sheets (`qa-visual-comparison.png`, `qa-fullscene-clay.png`, `qa-fullscene-silhouette.png`, `qa-screenshot.png`) against `salto-angel-photos/`. If the human-perceivable visual quality is lower than the numeric score (e.g., visible tartan/plaid shader banding, clay waffle quilting, floating hotdog ledges, hovering module bottoms, oversized foreground trees blocking the plunge pool, or clipped sky headroom), the agent **must modify `scripts/audit-visual-match.js` on the go** to add or tighten pixel detectors before claiming progress.

3. **Mandatory 3-Pass Iterative Re-Sculpt Loop (Forced 3 Passes Every Run)**:
   - Every execution of the Full-Scene Visual Self-Improvement Loop **MUST run 3 full sequential passes** (`Pass 1 -> Pass 2 -> Pass 3`):
     - **Step A (Multi-Angle Capture & Visual Ponder)**: Render all 6 camera angles across Beauty, Pure-Cliff Clay (`hideFoliage: true`), Normals, and Silhouette passes. Compare directly against `salto-angel-photos/`.
     - **Step B (On-the-Go Audit Calibration)**: Ponder whether `scripts/audit-visual-match.js` honestly reflects the visual flaws observed in Step A; tighten or add detectors in `audit-visual-match.js` if any visible artifact escaped penalty.
     - **Step C (Parallel Subagent Re-Sculpt & Coalescence)**: Concurrently dispatch parallel `geometry-specialist`, `shader-specialist`, and `scene-architect` tasks to fix base geometries, eliminate waffle/plaid periodicities, coalesce floating modules into unified rock massifs, and calibrate framing/canopy scale.
     - **Step D (Multi-Angle Re-Audit Gate)**: Re-run `npm run audit:geometry`, `npm run test:visual`, and `npm run test:sheet` to log the progression from Pass $k$ to Pass $k+1$.

4. **6 Mandatory Camera Angles × 4 Diagnostic Passes (`scripts/audit-visual-match.js`)**:
   - **Angles**:
     1. `Angle 1 (classic)`: Classic Canyon Overview (`Photo #02` framing — checks 20%–35% sky headroom, skyline mesa flatness, waterfall aspect, and canopy proportion).
     2. `Angle 2 (alcove)`: Telephoto Alcove & Plunge Basin (`Photo #15` framing — checks top-rim emergence, wet obsidian cavity contrast, and unobstructed plunge pool).
     3. `Angle 3 (panorama)`: Wide Tepui Panorama (`Photo #02 Wide` — checks 30%–45% sky headroom, full mesa horizon continuity, and flank grounding).
     4. `Angle 4 (leftOblique)`: Left 45° Cross-Wall Inspection (exposes Z-depth gaps, floating horizontal shelves, and lateral sky-leaks).
     5. `Angle 5 (rightOblique)`: Right 45° Citadel Prow Inspection (exposes right bastion vertical seams, hovering bottom faces, and orthogonal plaid repetition).
     6. `Angle 6 (wormsEye)`: Worm's-Eye Upward Pitch (`+35°` — exposes uncorbelled flat undersides and hanging stalactite/cone artifacts).
   - **Diagnostic Passes**: `beauty`, `clay` (with `hideFoliage: true` to expose raw cliff assembly), `normals`, and `silhouette` (`hideFoliage: true`).

5. **8-Dimension Honest Quantitative Visual Match Rubric (100 Points Total)**:
   - **1. Sky Headroom & Framing Proportion (15 pts)**: Requires `20%–35%` sky in Classic view, `30%–45%` in Panorama, and `0%` columns clipping the top viewport edge.
   - **2. Skyline Mesa Continuity & Zero Protruding Slabs (15 pts)**: Penalizes backing slabs (`CentralAlcoveSealingBackdrop`) or buttress tops rising above the horizontal plateau rim ($Y = 14.35$), step jumps (`dy > 7px`), and excessive vertical rim span (`> 10%` of screen height).
   - **3. Multi-Angle Zero Sky-Leak Guarantee (10 pts)**: Evaluates pure-cliff silhouettes (`hideFoliage: true`) across Front, Left-45°, and Right-45° angles for zero internal holes.
   - **4. Anti-Plaid Shader & Anti-Waffle Clay Relief Entropy (15 pts)**: Penalizes axis-aligned horizontal/vertical tartan stripe energy in Beauty pass (`rowStripeEnergy`, `colStripeEnergy`) and periodic `sin(x)*sin(y)` waffle quilting in the Clay pass (`clayWaffleOscillations`).
   - **5. Module Coalescence & Anti-Floating-Ledge Inspection (15 pts)**: Penalizes isolated "floating hotdog shelves", hovering module bottoms, and vertical ruler seams (`verticalSeamJumps`) in front and oblique Clay passes.
   - **6. Canopy-to-Cliff Scale & Plunge Pool Visibility (10 pts)**: Requires foreground foliage coverage within `18%–32%` (preventing giant foreground polygons from dwarfing the cliff) and clear sightline visibility to the waterfall plunge basin.
   - **7. Cataract Top-Rim Emergence & 1:20 Slenderness (10 pts)**: Verifies waterfall pixels start within `14px` of the highest local skyline rim and maintain a `14:1 to 24:1` vertical slenderness profile.
   - **8. Zonal Lithological & Alcove Shadow Contrast (10 pts)**: Verifies warm salmon/terracotta West wall (`R - B >= 18`), dark wet obsidian central alcove (`luma ratio <= 0.75`), and distinct East citadel tonal separation.


