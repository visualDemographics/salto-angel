import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';

// Register lightweight GLSL mock loader so Node can import asset files directly
const loaderCode = `
export async function load(url, context, nextLoad) {
  if (url.endsWith(".vert") || url.endsWith(".frag") || url.endsWith(".glsl")) {
    return {
      format: "module",
      shortCircuit: true,
      source: "export default \\"\\";"
    };
  }
  return nextLoad(url, context);
}
`;
register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const { MILESTONE_1_CLIFF_MODULES } = await import('../src/assets/MacroCliffModules.js');

/**
 * Evaluates a single THREE.BufferGeometry across 5 self-improvement dimensions:
 * 1. Topological & Attribute Integrity (20 pts)
 * 2. Anti-Boxiness / Silhouette Breakup (25 pts)
 * 3. 360-Degree Multi-Face Relief Balance (20 pts)
 * 4. Worm's-Eye Under-Surface Integrity (20 pts)
 * 5. Attribute Dynamic Range (aAO & aCurvature) (15 pts)
 */
export function auditGeometryModule(id, name, geom) {
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  const pos = geom.attributes.position;
  const norm = geom.attributes.normal;
  const uv = geom.attributes.uv;
  const ao = geom.attributes.aAO;
  const curv = geom.attributes.aCurvature;
  const part = geom.attributes.aPartType;

  const vCount = pos ? pos.count : 0;
  const bb = geom.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);

  const recommendations = [];
  const diagnostics = {};

  // =========================================================================
  // 1. TOPOLOGICAL & ATTRIBUTE INTEGRITY (20 pts)
  // =========================================================================
  let topoScore = 20;
  let nanCount = 0;
  const requiredAttrs = { position: pos, normal: norm, uv, aAO: ao, aCurvature: curv, aPartType: part };
  for (const [k, attr] of Object.entries(requiredAttrs)) {
    if (!attr) {
      topoScore -= 10;
      recommendations.push(`[CRITICAL] Missing buffer attribute '${k}'.`);
    } else {
      for (let i = 0; i < attr.array.length; i++) {
        if (!Number.isFinite(attr.array[i])) nanCount++;
      }
    }
  }
  if (nanCount > 0) {
    topoScore = 0;
    recommendations.push(`[CRITICAL] Found ${nanCount} NaN/Infinite values in vertex attributes.`);
  }

  // Check degenerate triangles & inverted/folded face normals
  const indexAttr = geom.index;
  const triCount = indexAttr ? indexAttr.count / 3 : vCount / 3;
  let degenerateTris = 0;
  let steepOverfoldTris = 0;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const nA = new THREE.Vector3();

  for (let t = 0; t < triCount; t++) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    vA.fromBufferAttribute(pos, i0);
    vB.fromBufferAttribute(pos, i1);
    vC.fromBufferAttribute(pos, i2);

    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    cb.cross(ab);
    const areaSq = cb.lengthSq();

    if (areaSq < 1e-10) {
      degenerateTris++;
    } else if (norm) {
      cb.normalize();
      nA.fromBufferAttribute(norm, i0).normalize();
      if (cb.dot(nA) < -0.35) {
        steepOverfoldTris++;
      }
    }
  }

  const degenRatio = degenerateTris / Math.max(1, triCount);
  const foldRatio = steepOverfoldTris / Math.max(1, triCount);
  diagnostics.degeneratePct = +(degenRatio * 100).toFixed(2);
  diagnostics.overfoldPct = +(foldRatio * 100).toFixed(2);

  if (degenRatio > 0.01) {
    const penalty = Math.min(10, Math.round(degenRatio * 200));
    topoScore -= penalty;
    recommendations.push(
      `[TOPOLOGY] ${diagnostics.degeneratePct}% degenerate zero-area triangles (${degenerateTris}/${Math.round(triCount)}) — avoid hard coordinate clamping (e.g. z = const) that collapses adjacent vertices onto the same point; use smooth exponential falloff instead.`
    );
  }
  if (foldRatio > 0.015) {
    const penalty = Math.min(8, Math.round(foldRatio * 150));
    topoScore -= penalty;
    recommendations.push(
      `[NORMALS] ${diagnostics.overfoldPct}% self-intersecting/folded triangles — high-frequency displacement amplitude exceeds local grid spacing.`
    );
  }
  topoScore = Math.max(0, topoScore);

  // =========================================================================
  // 2. ANTI-BOXINESS / SILHOUETTE BREAKUP SCORE (25 pts)
  // =========================================================================
  // Measure how many vertices cling closely to the 6 bounding box planes
  const epsX = size.x * 0.025;
  const epsY = size.y * 0.025;
  const epsZ = size.z * 0.025;

  let boxPlaneClingCount = 0;
  const v = new THREE.Vector3();

  // Also sample silhouette width/depth profile across 16 vertical slices
  const slices = 16;
  const sliceMinX = new Float32Array(slices).fill(Infinity);
  const sliceMaxX = new Float32Array(slices).fill(-Infinity);
  const sliceMinZ = new Float32Array(slices).fill(Infinity);
  const sliceMaxZ = new Float32Array(slices).fill(-Infinity);

  for (let i = 0; i < vCount; i++) {
    v.fromBufferAttribute(pos, i);
    const onMinX = Math.abs(v.x - bb.min.x) < epsX;
    const onMaxX = Math.abs(v.x - bb.max.x) < epsX;
    const onMinY = Math.abs(v.y - bb.min.y) < epsY;
    const onMaxY = Math.abs(v.y - bb.max.y) < epsY;
    const onMinZ = Math.abs(v.z - bb.min.z) < epsZ;
    const onMaxZ = Math.abs(v.z - bb.max.z) < epsZ;

    if (onMinX || onMaxX || onMinY || onMaxY || onMinZ || onMaxZ) {
      boxPlaneClingCount++;
    }

    const sIdx = Math.min(slices - 1, Math.max(0, Math.floor(((v.y - bb.min.y) / Math.max(0.001, size.y)) * slices)));
    if (v.x < sliceMinX[sIdx]) sliceMinX[sIdx] = v.x;
    if (v.x > sliceMaxX[sIdx]) sliceMaxX[sIdx] = v.x;
    if (v.z < sliceMinZ[sIdx]) sliceMinZ[sIdx] = v.z;
    if (v.z > sliceMaxZ[sIdx]) sliceMaxZ[sIdx] = v.z;
  }

  const boxClingRatio = boxPlaneClingCount / Math.max(1, vCount);
  diagnostics.boxClingPct = +(boxClingRatio * 100).toFixed(1);

  // Compute silhouette width variation across vertical slices (stdDev of width / total width)
  const widths = [];
  const depths = [];
  for (let s = 0; s < slices; s++) {
    if (Number.isFinite(sliceMaxX[s]) && Number.isFinite(sliceMinX[s])) {
      widths.push((sliceMaxX[s] - sliceMinX[s]) / Math.max(0.001, size.x));
      depths.push((sliceMaxZ[s] - sliceMinZ[s]) / Math.max(0.001, size.z));
    }
  }

  function stdDev(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / arr.length;
    return Math.sqrt(variance);
  }

  const widthSilhouetteVar = stdDev(widths);
  const depthSilhouetteVar = stdDev(depths);
  diagnostics.silhouetteVarX = +(widthSilhouetteVar * 100).toFixed(1);
  diagnostics.silhouetteVarZ = +(depthSilhouetteVar * 100).toFixed(1);

  let silhouetteScore = 25;
  if (boxClingRatio > 0.28) {
    const pen = Math.min(12, Math.round((boxClingRatio - 0.22) * 35));
    silhouetteScore -= pen;
    recommendations.push(
      `[SILHOUETTE] ${diagnostics.boxClingPct}% of vertices cling to flat bounding-box walls — apply 3D fracture-plane clipping (sliceGeometryWithPlanes) or vertical taper/chamfer to break the rectangular box container.`
    );
  }
  if (widthSilhouetteVar < 0.045) {
    silhouetteScore -= 8;
    recommendations.push(
      `[SILHOUETTE] Low lateral X-silhouette variance (${diagnostics.silhouetteVarX}%) — left/right side edges read as straight vertical lines; displace X along side flanks using stepped buttress ribs and Voronoi block offsets.`
    );
  }
  if (depthSilhouetteVar < 0.045) {
    silhouetteScore -= 5;
    recommendations.push(
      `[SILHOUETTE] Low depth Z-profile variance (${diagnostics.silhouetteVarZ}%) — add stronger cantilevered overhangs or basal talus flare.`
    );
  }
  silhouetteScore = Math.max(0, silhouetteScore);

  // =========================================================================
  // 3. 360-DEGREE MULTI-FACE RELIEF BALANCE (20 pts)
  // =========================================================================
  // Check if back (-Z) and side (-X, +X) faces have actual normal variation
  // or if they are dead-flat planar box faces.
  const faceBuckets = { front: [], back: [], left: [], right: [] };
  for (let i = 0; i < vCount; i++) {
    v.fromBufferAttribute(pos, i);
    nA.fromBufferAttribute(norm, i);
    if (v.z < bb.min.z + size.z * 0.15 && nA.z < -0.5) faceBuckets.back.push(nA.x * nA.x + nA.y * nA.y);
    if (v.z > bb.max.z - size.z * 0.25 && nA.z > 0.3) faceBuckets.front.push(nA.x * nA.x + nA.y * nA.y);
    if (v.x < bb.min.x + size.x * 0.15 && nA.x < -0.5) faceBuckets.left.push(nA.y * nA.y + nA.z * nA.z);
    if (v.x > bb.max.x - size.x * 0.15 && nA.x > 0.5) faceBuckets.right.push(nA.y * nA.y + nA.z * nA.z);
  }

  const avgRelief = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const frontRelief = avgRelief(faceBuckets.front);
  const backRelief = avgRelief(faceBuckets.back);
  const sideRelief = (avgRelief(faceBuckets.left) + avgRelief(faceBuckets.right)) * 0.5;

  diagnostics.frontRelief = +frontRelief.toFixed(3);
  diagnostics.backRelief = +backRelief.toFixed(3);
  diagnostics.sideRelief = +sideRelief.toFixed(3);

  let multiFaceScore = 20;
  if (backRelief < 0.02) {
    multiFaceScore -= 8;
    recommendations.push(
      `[360-KITBASH] Back face (-Z) is nearly flat (relief=${diagnostics.backRelief}) — module cannot be rotated 180° for kitbash reuse; extend horizontal bedding strata and columnar joints around all 4 sides.`
    );
  }
  if (sideRelief < 0.03) {
    multiFaceScore -= 7;
    recommendations.push(
      `[360-KITBASH] Left/Right flank faces (±X) lack sculptural relief (relief=${diagnostics.sideRelief}) — wrap strata ledges around ±X flanks so oblique camera angles (Photo 3) don't expose flat side walls.`
    );
  }
  multiFaceScore = Math.max(0, multiFaceScore);

  // =========================================================================
  // 4. WORM'S-EYE UNDER-SURFACE INTEGRITY (20 pts)
  // =========================================================================
  // Inspect bottom 10% of module height for flat downward-facing box bottom slabs
  let bottomVerts = 0;
  let flatBottomVerts = 0;
  for (let i = 0; i < vCount; i++) {
    v.fromBufferAttribute(pos, i);
    nA.fromBufferAttribute(norm, i);
    if (v.y < bb.min.y + size.y * 0.08) {
      bottomVerts++;
      if (nA.y < -0.92 && Math.abs(v.y - bb.min.y) < size.y * 0.015) {
        flatBottomVerts++;
      }
    }
  }
  const flatBottomRatio = bottomVerts > 0 ? flatBottomVerts / bottomVerts : 0;
  diagnostics.flatBottomPct = +(flatBottomRatio * 100).toFixed(1);

  let undersideScore = 20;
  // Horizontal pavement slabs are meant to sit on top of the plateau, still shouldn't have exposed flat floating bottoms
  if (flatBottomRatio > 0.45) {
    const pen = Math.min(15, Math.round((flatBottomRatio - 0.3) * 25));
    undersideScore -= pen;
    recommendations.push(
      `[WORMS-EYE] ${diagnostics.flatBottomPct}% of bottom vertices form a flat horizontal slab (n.y < -0.92) — when viewed from below (Photo 2 plunge pool), this creates an artificial flat box ceiling; taper bottom 15% inward toward the cliff backwall or carve stepped corbelled under-ledges.`
    );
  }
  undersideScore = Math.max(0, undersideScore);

  // =========================================================================
  // 5. ATTRIBUTE DYNAMIC RANGE (aAO & aCurvature) (15 pts)
  // =========================================================================
  let attrScore = 15;
  if (ao && curv) {
    const aoStd = stdDev(ao.array);
    const curvStd = stdDev(curv.array);
    diagnostics.aoStdDev = +aoStd.toFixed(3);
    diagnostics.curvStdDev = +curvStd.toFixed(3);

    if (aoStd < 0.08) {
      attrScore -= 6;
      recommendations.push(
        `[SHADER-AO] Low aAO contrast (stdDev=${diagnostics.aoStdDev}) — deepen crevice occlusion (target 0.15 in joint fissures, 1.0 on exposed ridges).`
      );
    }
    if (curvStd < 0.08) {
      attrScore -= 6;
      recommendations.push(
        `[SHADER-CURV] Low aCurvature contrast (stdDev=${diagnostics.curvStdDev}) — compute discrete Laplacian curvature from neighbor normals so sharp edges highlight accurately.`
      );
    }
  } else {
    attrScore = 0;
  }
  attrScore = Math.max(0, attrScore);

  const totalScore = topoScore + silhouetteScore + multiFaceScore + undersideScore + attrScore;

  return {
    id,
    name,
    vertices: vCount,
    triangles: Math.round(triCount),
    dimensions: `${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)}`,
    scores: {
      total: totalScore,
      topology: `${topoScore}/20`,
      silhouette: `${silhouetteScore}/25`,
      multiFace360: `${multiFaceScore}/20`,
      wormsEyeUnderside: `${undersideScore}/20`,
      attributes: `${attrScore}/15`
    },
    diagnostics,
    recommendations
  };
}

// CLI Execution
const args = process.argv.slice(2);
const idArg = args.find((a) => a.startsWith('--id='))?.split('=')[1];
const jsonOutput = args.includes('--json');

const targetEntries = idArg
  ? Object.entries(MILESTONE_1_CLIFF_MODULES).filter(([k]) => k.toUpperCase() === idArg.toUpperCase())
  : Object.entries(MILESTONE_1_CLIFF_MODULES);

if (targetEntries.length === 0) {
  console.error(`Unknown module ID: ${idArg}`);
  process.exit(1);
}

const reports = [];
for (const [id, def] of targetEntries) {
  const geom = def.create();
  const report = auditGeometryModule(id, def.name, geom);
  reports.push(report);
  geom.dispose();
}

if (jsonOutput) {
  console.log(JSON.stringify(reports, null, 2));
} else {
  console.log('\n================================================================================');
  console.log(' SALTO ÁNGEL — GEOMETRY SELF-IMPROVEMENT AUDIT & DIAGNOSTIC SCORECARD');
  console.log('================================================================================\n');

  const summaryTable = reports.map((r) => ({
    ID: r.id,
    Name: r.name.slice(0, 30),
    Score: `${r.scores.total}/100`,
    Topo: r.scores.topology,
    Silhouette: r.scores.silhouette,
    '360°': r.scores.multiFace360,
    Underside: r.scores.wormsEyeUnderside,
    Attrs: r.scores.attributes,
    'BoxCling%': r.diagnostics.boxClingPct + '%',
    'FlatBtm%': r.diagnostics.flatBottomPct + '%'
  }));
  console.table(summaryTable);

  const avgScore = (reports.reduce((acc, r) => acc + r.scores.total, 0) / reports.length).toFixed(1);
  console.log(`\nAverage Milestone 1 Geometry Score: ${avgScore} / 100\n`);

  for (const r of reports) {
    console.log(`--- [${r.id}] ${r.name} (Score: ${r.scores.total}/100 | Dims: ${r.dimensions}) ---`);
    if (r.recommendations.length === 0) {
      console.log('  ✅ Passes all self-improvement thresholds.');
    } else {
      for (const rec of r.recommendations) {
        console.log(`  • ${rec}`);
      }
    }
    console.log('');
  }
}

