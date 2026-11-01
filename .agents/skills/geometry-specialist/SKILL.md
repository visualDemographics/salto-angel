---
name: geometry-specialist
description: Design and build standalone 3D procedural BufferGeometry assets in src/assets/ (cliff monoliths, multi-lobe rainforest trees, angular boulders, waterfall chutes) with baked vertex AO. Trigger with /geometry-specialist.
---

# Procedural 3D Geometry Specialist

When this skill is invoked via `/geometry-specialist`, delegate the 3D procedural geometry synthesis, vertex attribute baking (`aAO`, `aCurvature`), or Asset Studio turntable task directly to the `geometry-specialist` subagent using `invoke_subagent`.

## Closed-Loop Self-Improvement Protocol

All geometry modules must adhere to [`src/assets/SELF_IMPROVEMENT_LOOP.md`](file:///Users/selle/Documents/GitHub/salto-angel/src/assets/SELF_IMPROVEMENT_LOOP.md) while keeping [`src/assets/BOM.md`](file:///Users/selle/Documents/GitHub/salto-angel/src/assets/BOM.md) intact:
1. **Deterministic Math & Topology Gate**: Run `npm run audit:geometry -- --id=<ID>` (`scripts/audit-geometry.js`) to score Topology (`20`), Anti-Boxiness Silhouette (`25`), 360° Multi-Face Relief (`20`), Worm's-Eye Underside (`20`), and Attribute Contrast (`15`). Target score: **`>= 85/100`**.
2. **6-Panel Multi-Channel Contact Sheet**: Run `npm run inspect:module -- --asset=<ID>` (`scripts/inspect-module.js`) to capture Beauty, Clay Matcap, World Normal RGB, `aAO + aCurvature + 2.4m Strata`, Worm's-Eye Upward (`+42°`), and Binary Silhouette panels.
3. **4 Geological Upgrade Operators**:
   - **360° Perimeter Strata & Corner Chamfering** (no flat `-Z` or `±X` box walls)
   - **Corbelled Under-Taper** (no flat `-Y` horizontal bottom slabs visible from the canyon floor)
   - **Smooth $C^1$ Carving** (zero degenerate triangles from hard coordinate clamping)
   - **Canonical `2.4m` World-Space Strata & Seeded Factory Signature**


