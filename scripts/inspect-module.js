import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

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

const { auditGeometryModule } = await import('./audit-geometry.js');
const { MILESTONE_1_CLIFF_MODULES } = await import('../src/assets/MacroCliffModules.js');

const TARGET_URL = process.env.VITE_URL || 'http://127.0.0.1:5173';

const args = process.argv.slice(2);
const assetArg = args.find((a) => a.startsWith('--asset='))?.split('=')[1] || 'CLIFF-001';

async function waitForServer(url, timeoutMs = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Waiting
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Dev server at ${url} did not respond within ${timeoutMs}ms.`);
}

async function runModuleInspection() {
  console.log(`\n[Inspect Module] Running Self-Improvement Diagnostic Pass for [${assetArg}]...`);

  // 1. Run deterministic math & topology audit if in MILESTONE_1_CLIFF_MODULES
  let auditReport = null;
  const upperId = assetArg.toUpperCase();
  if (MILESTONE_1_CLIFF_MODULES[upperId]) {
    const def = MILESTONE_1_CLIFF_MODULES[upperId];
    const geom = def.create();
    auditReport = auditGeometryModule(upperId, def.name, geom);
    geom.dispose();
    console.log(`  [Math Audit] Score: ${auditReport.scores.total}/100`, auditReport.scores);
    for (const rec of auditReport.recommendations) {
      console.log(`    • ${rec}`);
    }
  }

  // 2. Capture 6-Panel Contact Sheet in Chromium ANGLE
  await waitForServer(TARGET_URL);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 640, height: 420 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  const panels = [
    { label: '1. BEAUTY SHADER (3/4 OBLIQUE)', diag: 'beauty', view: 'threequarter' },
    { label: '2. CLAY MATCAP (PURE 3D FORM)', diag: 'clay', view: 'threequarter' },
    { label: '3. WORLD NORMAL RGB (BOX-FACE CHECK)', diag: 'normals', view: 'threequarter' },
    { label: '4. aAO + aCURVATURE + STRATA HEATMAP', diag: 'ao_curv', view: 'front' },
    { label: '5. WORMS-EYE UPWARD (+42° UNDERSIDE)', diag: 'clay', view: 'wormseye' },
    { label: '6. BINARY SILHOUETTE CONTOUR MASK', diag: 'silhouette', view: 'front' }
  ];

  const panelDataUrls = [];

  for (const panel of panels) {
    const url = `${TARGET_URL}/?asset=${encodeURIComponent(assetArg)}&diag=${panel.diag}&view=${panel.view}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    // Hide lil-gui overlay for clean contact sheet panels
    await page.evaluate(() => {
      const guiEl = document.querySelector('.lil-gui');
      if (guiEl) guiEl.style.display = 'none';
    });
    await page.waitForTimeout(450);

    const buf = await page.screenshot({ type: 'png' });
    panelDataUrls.push({
      label: panel.label,
      dataUrl: 'data:image/png;base64,' + buf.toString('base64')
    });
  }

  // Stitch all 6 panels into a single 1920x920 Contact Sheet with Diagnostic Header
  await page.setViewportSize({ width: 1920, height: 920 });
  const QA_DIR = path.resolve('qa');
  if (!fs.existsSync(QA_DIR)) {
    fs.mkdirSync(QA_DIR, { recursive: true });
  }
  const safeSlug = assetArg.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const outPath = path.join(QA_DIR, `qa-diag-${safeSlug}.png`);

  await page.evaluate(
    async ({ panels, report, assetArg }) => {
      document.body.innerHTML = '';
      document.body.style.margin = '0';
      document.body.style.background = '#0d1017';

      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 920;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0d1017';
      ctx.fillRect(0, 0, 1920, 920);

      // Header Banner (80px tall)
      ctx.fillStyle = '#151a24';
      ctx.fillRect(0, 0, 1920, 76);
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 76);
      ctx.lineTo(1920, 76);
      ctx.stroke();

      ctx.fillStyle = '#ff9f43';
      ctx.font = 'bold 26px monospace';
      const title = report
        ? `${report.id}: ${report.name}  |  SCORE: ${report.scores.total}/100`
        : `DIAGNOSTIC CONTACT SHEET: ${assetArg}`;
      ctx.fillText(title, 24, 34);

      if (report) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '17px monospace';
        const sub = `Topology: ${report.scores.topology}  |  Silhouette: ${report.scores.silhouette} (BoxCling: ${report.diagnostics.boxClingPct}%)  |  360° Relief: ${report.scores.multiFace360}  |  Worm's-Eye Underside: ${report.scores.wormsEyeUnderside} (FlatBtm: ${report.diagnostics.flatBottomPct}%)  |  Attrs: ${report.scores.attributes}`;
        ctx.fillText(sub, 24, 62);
      }

      // Draw 3x2 Grid of 640x420 panels
      for (let i = 0; i < panels.length; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = col * 640;
        const y = 80 + row * 420;

        const img = new Image();
        await new Promise((res) => {
          img.onload = res;
          img.src = panels[i].dataUrl;
        });
        ctx.drawImage(img, x, y, 640, 420);

        // Panel Border
        ctx.strokeStyle = '#262f40';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 640, 420);

        // Panel Label Badge
        ctx.fillStyle = 'rgba(13, 16, 23, 0.85)';
        ctx.fillRect(x + 12, y + 12, 390, 32);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 12, y + 12, 390, 32);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(panels[i].label, x + 22, y + 33);
      }
    },
    { panels: panelDataUrls, report: auditReport, assetArg }
  );

  await page.screenshot({ path: outPath });
  await browser.close();
  console.log(`  [Contact Sheet] Saved 6-panel diagnostic sheet -> ${outPath}`);
}

runModuleInspection().catch((err) => {
  console.error('❌ Module inspection failed:', err);
  process.exit(1);
});

