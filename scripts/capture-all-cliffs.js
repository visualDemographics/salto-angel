import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = process.env.VITE_URL || 'http://127.0.0.1:5173';

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

async function captureAllCliffs() {
  console.log(`[Capture All Cliffs] Waiting for dev server at ${TARGET_URL}...`);
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
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.error(`  [Browser ERROR] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`  [Browser Page Error] ${err.message}`);
  });

  // 1. Capture All 35 Macro Cliffs Exhibition Stage
  const exhibitionUrl = `${TARGET_URL}/?asset=all_cliffs`;
  console.log(`\n[Capture All Cliffs] Navigating to Exhibition Stage: ${exhibitionUrl}`);
  await page.goto(exhibitionUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const metricsExhibition = await page.evaluate(() => window.__SCENE_METRICS__);
  console.log('  [Exhibition Metrics]:', metricsExhibition);

  const QA_DIR = path.resolve('qa');
  if (!fs.existsSync(QA_DIR)) {
    fs.mkdirSync(QA_DIR, { recursive: true });
  }

  const exhibitionScreenshot = path.join(QA_DIR, 'qa-milestone1-all-cliffs-exhibition.png');
  await page.screenshot({ path: exhibitionScreenshot, fullPage: true });
  console.log(`  Saved: ${exhibitionScreenshot} (${fs.statSync(exhibitionScreenshot).size} bytes)`);

  // Angled view of exhibition
  await page.evaluate(() => {
    if (window.__CAMERA_RIG__) {
      window.__CAMERA_RIG__.camera.position.set(70, 48, 75);
      window.__CAMERA_RIG__.controls.target.set(0, 0, 0);
      window.__CAMERA_RIG__.controls.update();
    }
  });
  await page.waitForTimeout(1000);
  const angledScreenshot = path.join(QA_DIR, 'qa-milestone1-all-cliffs-angled.png');
  await page.screenshot({ path: angledScreenshot, fullPage: true });
  console.log(`  Saved: ${angledScreenshot} (${fs.statSync(angledScreenshot).size} bytes)`);

  // 2. Capture Assembled Salto Ángel Cliff Facade
  const assemblyUrl = `${TARGET_URL}/?asset=cliff_assembly`;
  console.log(`\n[Capture All Cliffs] Navigating to Assembled Cliff Facade: ${assemblyUrl}`);
  await page.goto(assemblyUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const metricsAssembly = await page.evaluate(() => window.__SCENE_METRICS__);
  console.log('  [Assembly Metrics]:', metricsAssembly);

  const assemblyScreenshot = path.join(QA_DIR, 'qa-milestone1-cliff-assembly.png');
  await page.screenshot({ path: assemblyScreenshot, fullPage: true });
  console.log(`  Saved: ${assemblyScreenshot} (${fs.statSync(assemblyScreenshot).size} bytes)`);

  // 3. Capture WATER-086 Emergence Chute on Turntable
  const waterUrl = `${TARGET_URL}/?asset=WATER-086`;
  console.log(`\n[Capture All Cliffs] Navigating to WATER-086 Chute: ${waterUrl}`);
  await page.goto(waterUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const waterScreenshot = path.join(QA_DIR, 'qa-asset-water-086.png');
  await page.screenshot({ path: waterScreenshot, fullPage: true });
  console.log(`  Saved: ${waterScreenshot} (${fs.statSync(waterScreenshot).size} bytes)`);

  // 4. Capture CLIFF-022 Arch on Turntable
  const archUrl = `${TARGET_URL}/?asset=CLIFF-022`;
  console.log(`\n[Capture All Cliffs] Navigating to CLIFF-022 Arch: ${archUrl}`);
  await page.goto(archUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const archScreenshot = path.join(QA_DIR, 'qa-asset-cliff-022.png');
  await page.screenshot({ path: archScreenshot, fullPage: true });
  console.log(`  Saved: ${archScreenshot} (${fs.statSync(archScreenshot).size} bytes)`);

  await browser.close();
  console.log('\n✅ All screenshots captured successfully!');
}

captureAllCliffs().catch((err) => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});
