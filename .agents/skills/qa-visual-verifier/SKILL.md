---
name: qa-visual-verifier
description: Run automated Playwright WebGL smoke tests (npm run test:qa), inspect window.__SCENE_METRICS__, and visually inspect screenshots. Trigger with /qa-visual-verifier.
---

# Automated WebGL QA Verifier

When this skill is invoked via `/qa-visual-verifier`, delegate the automated Playwright smoke testing, WebGL console verification, and visual screenshot evaluation directly to the `qa-visual-verifier` subagent using `invoke_subagent`.

