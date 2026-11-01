import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function generateVisualComparisonSheet() {
  console.log('[Visual Comparison] Generating 12-Angle & Multi-Perspective Diagnostic Review Sheet...');

  const QA_DIR = path.resolve('qa');
  if (!fs.existsSync(QA_DIR)) {
    fs.mkdirSync(QA_DIR, { recursive: true });
  }

  const photo01Path = path.resolve('salto-angel-photos/salto_angel_01_Salto_Angel_from_above.jpg');
  const photo02Path = path.resolve('salto-angel-photos/salto_angel_02_Auyantepuy.jpg');
  const photo03Path = path.resolve('salto-angel-photos/salto_angel_03_Angel_Falls_Base.jpg');
  const photo04Path = path.resolve('salto-angel-photos/salto_angel_04_Salto_Angel_-_Ca_on_del_Diablo.jpg');
  const photo15Path = path.resolve('salto-angel-photos/salto_angel_15_Canaima_17.jpg');
  const photo17Path = path.resolve('salto-angel-photos/salto_angel_17_Canaima_19.jpg');

  const renderClassic = path.join(QA_DIR, 'qa-angle-classic.png');
  const renderClay = path.join(QA_DIR, 'qa-fullscene-clay.png');
  const renderSil = path.join(QA_DIR, 'qa-fullscene-silhouette.png');
  const renderSummitBrink = path.join(QA_DIR, 'qa-angle-summitBrink.png');
  const renderHighAerial = path.join(QA_DIR, 'qa-angle-highAerial.png');
  const renderRiverGorge = path.join(QA_DIR, 'qa-angle-riverGorge.png');
  const renderCauldronBase = path.join(QA_DIR, 'qa-angle-cauldronBase.png');
  const renderEastShoulder = path.join(QA_DIR, 'qa-angle-eastShoulder.png');
  const renderAlcove = path.join(QA_DIR, 'qa-angle-alcove.png');
  const renderPanorama = path.join(QA_DIR, 'qa-angle-panorama.png');

  function toDataUri(filePath, mime = 'image/jpeg') {
    if (!fs.existsSync(filePath)) return null;
    const buf = fs.readFileSync(filePath);
    return `data:${mime};base64,${buf.toString('base64')}`;
  }

  const p01Uri = toDataUri(photo01Path, 'image/jpeg');
  const p02Uri = toDataUri(photo02Path, 'image/jpeg');
  const p03Uri = toDataUri(photo03Path, 'image/jpeg');
  const p04Uri = toDataUri(photo04Path, 'image/jpeg');
  const p15Uri = toDataUri(photo15Path, 'image/jpeg');
  const p17Uri = toDataUri(photo17Path, 'image/jpeg');

  const classicUri = toDataUri(renderClassic, 'image/png');
  const clayUri = toDataUri(renderClay, 'image/png');
  const silUri = toDataUri(renderSil, 'image/png');
  const summitBrinkUri = toDataUri(renderSummitBrink, 'image/png');
  const highAerialUri = toDataUri(renderHighAerial, 'image/png');
  const riverGorgeUri = toDataUri(renderRiverGorge, 'image/png');
  const cauldronBaseUri = toDataUri(renderCauldronBase, 'image/png');
  const eastShoulderUri = toDataUri(renderEastShoulder, 'image/png');
  const alcoveUri = toDataUri(renderAlcove, 'image/png');
  const panoramaUri = toDataUri(renderPanorama, 'image/png');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 2160 } });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Salto Ángel — 12-Angle & Multi-Perspective Visual Comparison</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background: #0b0e14; color: #eceff4; padding: 24px; }
          h1 { font-size: 24px; margin-bottom: 6px; color: #e67e22; letter-spacing: -0.5px; }
          p.subtitle { font-size: 13px; color: #8892b0; margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 700; color: #58a6ff; text-transform: uppercase; letter-spacing: 0.8px; margin: 18px 0 10px 0; border-left: 3px solid #58a6ff; padding-left: 8px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 14px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
          .panel { background: #161b22; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
          .panel-header { padding: 7px 11px; font-size: 12px; font-weight: 600; background: #21262d; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; }
          .panel-header span.tag { font-size: 10px; padding: 2px 5px; border-radius: 4px; background: #e67e22; color: #fff; }
          .panel-header span.tag.ground { background: #238636; }
          .panel-header span.tag.clay { background: #8957e5; }
          .panel-header span.tag.aerial { background: #1f6feb; }
          .panel img { width: 100%; height: 260px; object-fit: cover; display: block; }
          .wide-row img { height: 290px; }
        </style>
      </head>
      <body>
        <h1>Salto Ángel — 12-Angle & Multi-Perspective Visual Quality Evaluation</h1>
        <p class="subtitle">Side-by-side photographic ground truth (salto-angel-photos/) vs. multi-channel full-scene WebGL passes across 12 calibrated viewpoints</p>

        <!-- Section 1: Classic Canyon & Clay Topology -->
        <div class="section-title">1. Classic Canyon Framing, Topology & Silhouette</div>
        <div class="grid">
          <div class="panel">
            <div class="panel-header">Reference Photo (Auyán-tepui)<span class="tag ground">Ground Truth #02</span></div>
            <img src="${p02Uri}">
          </div>
          <div class="panel">
            <div class="panel-header">3D Render: Angle 1 (Classic Overview)<span class="tag">Live WebGL</span></div>
            <img src="${classicUri}">
          </div>
          <div class="panel">
            <div class="panel-header">Full-Scene Clay (Foliage Hidden)<span class="tag clay">Raw Topology</span></div>
            <img src="${clayUri}">
          </div>
        </div>

        <!-- Section 2: Overlook From Above -->
        <div class="section-title">2. Perspectives From Above (Summit Brink Abyss & High Aerial Horizon)</div>
        <div class="grid">
          <div class="panel">
            <div class="panel-header">Reference Photo (Summit Overlook)<span class="tag ground">Ground Truth #01 (From Above)</span></div>
            <img src="${p01Uri}">
          </div>
          <div class="panel">
            <div class="panel-header">3D Render: Angle 5 (Summit Brink Abyss)<span class="tag aerial">Looking Down</span></div>
            <img src="${summitBrinkUri}">
          </div>
          <div class="panel">
            <div class="panel-header">3D Render: Angle 6 (High Aerial Horizon)<span class="tag aerial">Tabletop Overlook</span></div>
            <img src="${highAerialUri}">
          </div>
        </div>

        <!-- Section 3: Ground-Level Cauldron & River Gorge Approaches -->
        <div class="section-title">3. Ground-Level Approaches (Cauldron Plunge & River Gorge)</div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-header">Reference Photo (Angel Falls Base Plunge)<span class="tag ground">Ground Truth #03</span></div>
            <img src="${p03Uri}">
          </div>
          <div class="panel">
            <div class="panel-header">3D Render: Angle 9 (Cauldron Impact & Spray)<span class="tag">Live WebGL</span></div>
            <img src="${cauldronBaseUri}">
          </div>
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-header">Reference Photo (Cañón del Diablo River Gorge)<span class="tag ground">Ground Truth #04</span></div>
            <img src="${p04Uri}">
          </div>
          <div class="panel">
            <div class="panel-header">3D Render: Angle 4 (Cañón del Diablo Rapids)<span class="tag">Live WebGL</span></div>
            <img src="${riverGorgeUri}">
          </div>
        </div>

        <!-- Section 4: Buttress Terraces & Wet Alcove Telephoto -->
        <div class="section-title">4. Geological Detailing (Right Buttress Terraces & Central Wet Alcove)</div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-header">Reference Photo (Right Buttress Terraces)<span class="tag ground">Ground Truth #17</span></div>
            <img src="${p17Uri}">
          </div>
          <div class="panel">
            <div class="panel-header">3D Render: Angle 8 (Right Citadel Shoulder)<span class="tag">Live WebGL</span></div>
            <img src="${eastShoulderUri}">
          </div>
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-header">Reference Photo (Full Height Alcove & Basin)<span class="tag ground">Ground Truth #15</span></div>
            <img src="${p15Uri}">
          </div>
          <div class="panel">
            <div class="panel-header">3D Render: Angle 2 (Telephoto Alcove & Rapids)<span class="tag">Live WebGL</span></div>
            <img src="${alcoveUri}">
          </div>
        </div>

        <!-- Section 5: Wide Panorama Horizon & Pure Silhouette Mask -->
        <div class="section-title">5. Mesa Panorama Horizon & Multi-Angle Silhouette Integrity</div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-header">3D Render: Angle 3 (Wide Tepui Panorama)<span class="tag">Live WebGL</span></div>
            <img src="${panoramaUri}">
          </div>
          <div class="panel">
            <div class="panel-header">Pure-Cliff Binary Silhouette Mask<span class="tag clay">Zero Sky-Leaks</span></div>
            <img src="${silUri}">
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlContent);
  await page.waitForTimeout(500);

  const outputPath = path.join(QA_DIR, 'qa-visual-comparison.png');
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log('[Visual Comparison] Saved stitched contact sheet to ' + outputPath);

  await browser.close();
  return outputPath;
}

if (process.argv?.[1] && process.argv[1].endsWith('visual-comparison.js')) {
  generateVisualComparisonSheet().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
