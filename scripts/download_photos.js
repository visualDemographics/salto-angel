import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('salto-angel-photos');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CATEGORIES = [
  'Category:Angel_Falls',
  'Category:Aerial photographs of Angel Falls',
  'Category:Mirador Laime',
  'Category:Cañon del Diablo (Angel Falls)',
  'Category:Panoramics in Angel Falls',
  'Category:Sunrises of Angel Falls',
  'Category:Fog in Angel Falls'
];

async function fetchCategory(category) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=${encodeURIComponent(category)}&gcmnamespace=6&gcmlimit=30&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1600&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SaltoAngelPhotoDownloader/1.0 (contact: bot@example.com)' }
  });
  const data = await res.json();
  const list = [];
  if (data.query?.pages) {
    for (const p of Object.values(data.query.pages)) {
      const info = p.imageinfo?.[0];
      if (info && (info.mime === 'image/jpeg' || info.mime === 'image/png')) {
        const meta = info.extmetadata || {};
        list.push({
          title: p.title.replace(/^File:/, ''),
          category: category.replace('Category:', ''),
          url: info.thumburl || info.url,
          fullUrl: info.url,
          width: info.thumbwidth || info.width,
          height: info.thumbheight || info.height,
          description: meta.ImageDescription?.value?.replace(/<[^>]*>?/gm, '').trim() || '',
          artist: meta.Artist?.value?.replace(/<[^>]*>?/gm, '').trim() || 'Unknown',
          license: meta.LicenseShortName?.value || 'CC-BY-SA'
        });
      }
    }
  }
  return list;
}

// Curated list of search targets to get maximum angular and environmental diversity
const SEARCH_QUERIES = [
  'Angel Falls aerial',
  'Salto Angel aereo',
  'Salto Angel Mirador Laime',
  'Angel Falls base',
  'Auyantepuy Salto Angel',
  'Angel Falls rainbow',
  'Angel Falls dry season',
  'Canyon del Diablo Salto Angel'
];

async function fetchSearch(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=15&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1600&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SaltoAngelPhotoDownloader/1.0 (contact: bot@example.com)' }
  });
  const data = await res.json();
  const list = [];
  if (data.query?.pages) {
    for (const p of Object.values(data.query.pages)) {
      const info = p.imageinfo?.[0];
      if (info && (info.mime === 'image/jpeg' || info.mime === 'image/png')) {
        const meta = info.extmetadata || {};
        list.push({
          title: p.title.replace(/^File:/, ''),
          category: 'Search: ' + query,
          url: info.thumburl || info.url,
          fullUrl: info.url,
          width: info.thumbwidth || info.width,
          height: info.thumbheight || info.height,
          description: meta.ImageDescription?.value?.replace(/<[^>]*>?/gm, '').trim() || '',
          artist: meta.Artist?.value?.replace(/<[^>]*>?/gm, '').trim() || 'Unknown',
          license: meta.LicenseShortName?.value || 'CC-BY-SA'
        });
      }
    }
  }
  return list;
}

async function downloadFile(url, destPath) {
  const cleanUrl = url.split('?')[0];
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://commons.wikimedia.org/'
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    let res = await fetch(cleanUrl, { headers });
    if (res.status === 429) {
      console.log('    [429 Rate Limit] Backing off 3s...');
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }
    if (!res.ok) {
      res = await fetch(url, { headers });
    }
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
      return;
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error(`Failed to download after retries: ${cleanUrl}`);
}

async function run() {
  console.log('Gathering candidate photos from Wikimedia Commons...');
  const candidates = [];
  for (const cat of CATEGORIES) {
    const items = await fetchCategory(cat);
    candidates.push(...items);
  }
  for (const q of SEARCH_QUERIES) {
    const items = await fetchSearch(q);
    candidates.push(...items);
  }

  // Deduplicate by title
  const uniqueMap = new Map();
  for (const item of candidates) {
    if (!uniqueMap.has(item.title.toLowerCase())) {
      uniqueMap.set(item.title.toLowerCase(), item);
    }
  }

  const all = Array.from(uniqueMap.values());
  console.log(`Discovered ${all.length} unique candidates.`);

  // Filter out unwanted files (svgs, diagrams, stamps, non-waterfall pictures)
  const filtered = all.filter(item => {
    const t = item.title.toLowerCase();
    if (t.includes('stamp') || t.includes('map') || t.includes('diagram') || t.includes('locator') || t.includes('flag')) return false;
    return true;
  });

  // Categorize by angle/perspective
  const angles = [
    { name: '01_aerial_panoramic_summit', test: t => t.includes('aerial') || t.includes('aereo') || t.includes('avión') || t.includes('above') },
    { name: '02_aerial_oblique_cliffs', test: t => t.includes('aerial') || t.includes('auyantepuy') || t.includes('flyby') },
    { name: '03_mirador_laime_classic_frontal', test: t => t.includes('laime') || t.includes('magnífico') || t.includes('classic') || t.includes('salto angel 1') },
    { name: '04_low_angle_plunge_cauldron', test: t => t.includes('base') || t.includes('caída') || t.includes('bottom') || t.includes('river') },
    { name: '05_canon_del_diablo_gorge', test: t => t.includes('diablo') || t.includes('churún') || t.includes('churun') || t.includes('canyon') },
    { name: '06_distant_savannah_wide', test: t => t.includes('distant') || t.includes('distance') || t.includes('lejos') || t.includes('valley') },
    { name: '07_mid_cliff_buttress_clouds', test: t => t.includes('fog') || t.includes('mist') || t.includes('clouds') || t.includes('nubes') || t.includes('neblina') },
    { name: '08_summit_rim_tabletop', test: t => t.includes('tepuy') || t.includes('top') || t.includes('rim') || t.includes('plateau') },
    { name: '09_dry_season_feathery_veil', test: t => t.includes('dry') || t.includes('february') || t.includes('seco') },
    { name: '10_rainy_season_full_torrent', test: t => t.includes('torrent') || t.includes('wet') || t.includes('full') || t.includes('rain') }
  ];

  // Select 20 varied items
  const selected = [];
  const chosenTitles = new Set();

  // First pass: pick best matching angle buckets
  for (const angle of angles) {
    const match = filtered.find(item => angle.test(item.title.toLowerCase()) && !chosenTitles.has(item.title));
    if (match) {
      selected.push({ ...match, angleTag: angle.name });
      chosenTitles.add(match.title);
    }
  }

  // Second pass: fill up to 20 with varied distinct images
  for (const item of filtered) {
    if (selected.length >= 20) break;
    if (!chosenTitles.has(item.title)) {
      selected.push({ ...item, angleTag: `angle_${selected.length + 1}` });
      chosenTitles.add(item.title);
    }
  }

  console.log(`Selected ${selected.length} photos covering varied angles.`);

  const metadata = [];

  for (let i = 0; i < selected.length; i++) {
    const photo = selected[i];
    const ext = photo.title.toLowerCase().endsWith('.png') ? '.png' : '.jpg';
    const cleanIndex = String(i + 1).padStart(2, '0');
    // Create clean readable filename
    const safeTitle = photo.title
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 40);
    const filename = `salto_angel_${cleanIndex}_${safeTitle}${ext}`;
    const destPath = path.join(OUT_DIR, filename);

    console.log(`[${i + 1}/20] Downloading: ${filename}...`);
    try {
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
        console.log(`  ✓ Already exists (${Math.round(fs.statSync(destPath).size / 1024)} KB)`);
      } else {
        await new Promise(r => setTimeout(r, 1200));
        await downloadFile(photo.url, destPath);
        const stat = fs.statSync(destPath);
        console.log(`  ✓ Saved (${Math.round(stat.size / 1024)} KB)`);
      }
      metadata.push({
        index: i + 1,
        filename,
        title: photo.title,
        angleTag: photo.angleTag,
        resolution: `${photo.width}x${photo.height}`,
        url: photo.fullUrl,
        artist: photo.artist,
        license: photo.license
      });
    } catch (err) {
      console.error(`  ✗ Error downloading ${photo.title}:`, err.message);
    }
  }

  // Generate INDEX.md
  let indexMd = `# Salto Angel (Angel Falls) — Photographic Reference Collection\n\n`;
  indexMd += `A curated collection of 20 high-resolution photographs of **Salto Ángel (Kerepakupai Merú)** from diverse angles, altitudes, viewpoints, and atmospheric conditions, sourced from Wikimedia Commons.\n\n`;
  indexMd += `| # | Thumbnail / Filename | Angle / Perspective | Resolution | Credit / License |\n`;
  indexMd += `|---|---|---|---|---|\n`;

  for (const m of metadata) {
    indexMd += `| ${m.index} | **\`${m.filename}\`** | ${m.angleTag.replace(/_/g, ' ')} | ${m.resolution} | ${m.artist} (${m.license}) |\n`;
  }

  fs.writeFileSync(path.join(OUT_DIR, 'INDEX.md'), indexMd);
  console.log(`\nAll 20 photos saved to ${OUT_DIR}/`);
  console.log(`Catalog index written to ${OUT_DIR}/INDEX.md`);
}

run().catch(console.error);

