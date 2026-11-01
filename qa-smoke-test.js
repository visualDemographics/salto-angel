import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = process.env.VITE_URL || 'http://127.0.0.1:5173';
const QA_DIR = path.resolve('qa');
if (!fs.existsSync(QA_DIR)) {
  fs.mkdirSync(QA_DIR, { recursive: true });
}
const SCREENSHOT_PATH = path.join(QA_DIR, 'qa-screenshot.png');

const isAssetsOnly = process.argv.includes('--assets');
const ASSETS_TO_TEST = ['tree', 'boulder', 'cliff', 'waterfall', 'shrub', 'cleft', 'amphitheater', 'buttress', 'spire', 'pavement', 'pillars'];

async function waitForServer(url, timeoutMs = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Dev server initializing
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Dev server at ${url} did not respond within ${timeoutMs}ms.`);
}

async function runSmokeTest() {
  console.log(`[QA Smoke Test] Checking server readiness at ${TARGET_URL}...`);
  await waitForServer(TARGET_URL);
  console.log(`[QA Smoke Test] Server is ready. Launching Chromium ANGLE...`);

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
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const shaderWarnings = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    console.log(`  [Browser ${type.toUpperCase()}] ${text}`);

    if (type === 'error') {
      consoleErrors.push(text);
    } else if (
      type === 'warning' &&
      /shader|compile|webgl|three|program/i.test(text)
    ) {
      shaderWarnings.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`  [Page Error] ${err.message}`);
    consoleErrors.push(err.message);
  });

  if (isAssetsOnly) {
    console.log('[QA Smoke Test] Running Asset Studio Turntable tests for all Phase 1 assets...');

    for (const assetKey of ASSETS_TO_TEST) {
      const assetUrl = `${TARGET_URL}/?asset=${assetKey}`;
      console.log(`\n--- Inspecting Asset [${assetKey}] at ${assetUrl} ---`);
      await page.goto(assetUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const metrics = await page.evaluate(() => window.__SCENE_METRICS__);
      console.log(`  [Asset ${assetKey}] Metrics:`, metrics);

      if (!metrics || metrics.glErrors) {
        throw new Error(`Asset ${assetKey} produced WebGL errors!`);
      }

      const assetScreenshot = path.join(QA_DIR, `qa-asset-${assetKey}.png`);
      await page.screenshot({ path: assetScreenshot, fullPage: true });
      console.log(`  [Asset ${assetKey}] Captured screenshot: ${assetScreenshot}`);

      // Verify canvas is not blank
      const nonBlank = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return false;
        const pixels = new Uint8Array(32 * 32 * 4);
        gl.readPixels(canvas.width / 2 - 16, canvas.height / 2 - 16, 32, 32, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        let colored = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] > 15 || pixels[i + 1] > 15 || pixels[i + 2] > 15) colored++;
        }
        return colored > 0;
      });

      if (!nonBlank) {
        throw new Error(`Asset ${assetKey} canvas is completely blank!`);
      }
    }

    console.log('\n----------------------------------------------------');
    console.log('✅ All Phase 1 Assets Verified Successfully in Asset Studio!');
    console.log('----------------------------------------------------');
    await browser.close();
    return;
  }

  // Full Scene Verification
  console.log(`[QA Smoke Test] Navigating to Full Scene at ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

  console.log('[QA Smoke Test] Waiting 2.5s for scene stabilization...');
  await page.waitForTimeout(2500);

  const metrics = await page.evaluate(() => window.__SCENE_METRICS__);
  console.log('[QA Smoke Test] Evaluated Scene Metrics:', metrics);

  if (!metrics) {
    throw new Error('window.__SCENE_METRICS__ is undefined.');
  }

  if (metrics.activeMeshes < 4) {
    throw new Error(`Expected >= 4 active meshes, found: ${metrics.activeMeshes}`);
  }

  if (metrics.fps <= 0) {
    throw new Error(`FPS is zero or invalid: ${metrics.fps}`);
  }

  if (metrics.glErrors) {
    throw new Error('WebGL error detected in window.__SCENE_METRICS__.glErrors');
  }

  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
  console.log(`[QA Smoke Test] Captured screenshot: ${SCREENSHOT_PATH}`);

  // Also capture Photo 2 and Photo 3 presets for visual inspection
  await page.evaluate(() => {
    if (window.__CAMERA_RIG__) {
      window.__CAMERA_RIG__.setPreset('Photo 2 — Dramatic Alcove & Rapids', true);
    }
  });
  await page.waitForTimeout(1000);
  const photo2Path = path.join(QA_DIR, 'qa-preset-photo2.png');
  await page.screenshot({ path: photo2Path, fullPage: true });
  console.log(`[QA Smoke Test] Captured Photo 2 preset screenshot: ${photo2Path}`);

  await page.evaluate(() => {
    if (window.__CAMERA_RIG__) {
      window.__CAMERA_RIG__.setPreset('Photo 3 — Wide Tepui Panorama', true);
    }
  });
  await page.waitForTimeout(1000);
  const photo3Path = path.join(QA_DIR, 'qa-preset-photo3.png');
  await page.screenshot({ path: photo3Path, fullPage: true });
  console.log(`[QA Smoke Test] Captured Photo 3 preset screenshot: ${photo3Path}`);

  // Restore Photo 1
  await page.evaluate(() => {
    if (window.__CAMERA_RIG__) {
      window.__CAMERA_RIG__.setPreset('Photo 1 — Classic Canyon Frame', true);
    }
  });

  const pixelAnalysis = await page.evaluate(() => {
    const canvas = document.querySelector('#webgl-canvas') || document.querySelector('canvas');
    if (!canvas) return { found: false, error: 'Canvas element not found' };

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { found: true, webgl: false, error: 'WebGL context unavailable' };

    const width = canvas.width;
    const height = canvas.height;

    const regions = [
      { name: 'Cliff Rock Face', x: Math.floor(width * 0.35), y: Math.floor(height * 0.50) },
      { name: 'Waterfall Column', x: Math.floor(width * 0.50), y: Math.floor(height * 0.45) },
      { name: 'Plunge Pool Basin', x: Math.floor(width * 0.50), y: Math.floor(height * 0.25) }
    ];

    const results = [];
    const sampleSize = 32;
    const pixels = new Uint8Array(sampleSize * sampleSize * 4);

    for (const region of regions) {
      gl.readPixels(region.x - sampleSize / 2, region.y - sampleSize / 2, sampleSize, sampleSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let colored = 0;
      let nonZero = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if (r > 0 || g > 0 || b > 0) nonZero++;
        if ((r > 15 || g > 15 || b > 15) && a > 0) colored++;
      }
      results.push({
        name: region.name,
        total: sampleSize * sampleSize,
        nonZero,
        colored
      });
    }

    return { found: true, webgl: true, width, height, regions: results };
  });

  console.log('[QA Smoke Test] Multi-Region Pixel Analysis:', JSON.stringify(pixelAnalysis.regions, null, 2));

  if (!pixelAnalysis.found) {
    throw new Error('Canvas element not found in DOM');
  }

  for (const reg of pixelAnalysis.regions) {
    if (reg.colored === 0) {
      throw new Error(`Region ${reg.name} is completely blank/black!`);
    }
  }

  if (!fs.existsSync(SCREENSHOT_PATH) || fs.statSync(SCREENSHOT_PATH).size < 1000) {
    throw new Error('Screenshot file was not generated or is empty.');
  }

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors emitted during execution:\n${consoleErrors.join('\n')}`);
  }

  if (shaderWarnings.length > 0) {
    throw new Error(`Shader compile warnings detected:\n${shaderWarnings.join('\n')}`);
  }

  console.log('----------------------------------------------------');
  console.log('✅ Salto Angel QA Smoke Test Passed Successfully!');
  console.log(`- Active Meshes/Points: ${metrics.activeMeshes}`);
  console.log(`- FPS: ${metrics.fps}`);
  console.log(`- WebGL Errors: ${metrics.glErrors}`);
  console.log(`- Console Warnings/Errors: 0`);
  console.log(`- Screenshot: ${SCREENSHOT_PATH}`);
  console.log('----------------------------------------------------');

  await browser.close();
}

runSmokeTest().catch((err) => {
  console.error('❌ Salto Angel QA Smoke Test Failed:', err);
  process.exit(1);
});
