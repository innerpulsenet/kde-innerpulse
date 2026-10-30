#!/usr/bin/env node
// Builds the innerpulse KDE theme into dist/, laid out like ~/.local/share so install.sh can copy it as is.
//
//   node src/build.mjs            everything
//   node src/build.mjs --fast     skip the large wallpaper renders (3840 and 1920), for quick iteration
//
// Needs node ≥ 20 and rsvg-convert (librsvg). No npm packages.
import { mkdirSync, writeFileSync, rmSync, copyFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { themes, ink, paper, carbon } from './lib/palette.mjs';
import { colorScheme, konsoleScheme, konsoleProfile, contrastGate } from './lib/colors.mjs';
import { plasmaTheme } from './lib/plasma.mjs';
import { auroraeTheme } from './lib/aurorae.mjs';
import { fieldWallpaper, ribbonWallpaper, WALLPAPER_SIZES } from './lib/wallpaper.mjs';
import { horizonWallpaper, exposureWallpaper } from './lib/wallpaper-art.mjs';
import { preview } from './lib/preview.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = join(ROOT, 'brand');
const DIST = join(ROOT, 'dist');
const BUILD = join(ROOT, 'build'); // intermediate SVGs
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const fast = process.argv.includes('--fast');

const put = (rel, data) => {
  const p = join(DIST, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
  return p;
};
const putBuild = (rel, data) => {
  const p = join(BUILD, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
  return p;
};
const raster = (svgPath, outPath, w, h) => {
  mkdirSync(dirname(outPath), { recursive: true });
  execFileSync('rsvg-convert', ['-w', String(w), '-h', String(h), '-o', outPath, svgPath]);
};
const log = (...a) => console.log('·', ...a);

// 0. contrast gate: every text and decoration pair in the schemes and Konsole sets must clear its floor
{
  const gate = themes.map(contrastGate);
  for (const w of gate.flatMap((g) => g.warns)) console.log('  known:', w);
  const fails = gate.flatMap((g) => g.fails);
  if (fails.length) {
    for (const f of fails) console.error('  contrast:', f);
    console.error(`build.mjs: ${fails.length} color pair(s) below their contrast floor (src/lib/colors.mjs contrastGate)`);
    process.exit(1);
  }
}

rmSync(DIST, { recursive: true, force: true });
rmSync(BUILD, { recursive: true, force: true });

// 1. color schemes
for (const t of themes) {
  const id = t.scheme;
  put(`color-schemes/${id}.colors`, colorScheme(t));
  put(`konsole/${id}.colorscheme`, konsoleScheme(t));
  // install.sh rewrites the font line if JetBrains Mono is missing
  put(`konsole/innerpulse-${t.id}.profile`, konsoleProfile(t, 'JetBrains Mono'));
}
log('color schemes and Konsole');

// 2. Plasma desktop theme (one theme, recolored by whichever scheme is active)
for (const [rel, data] of Object.entries(plasmaTheme(ink, VERSION))) put(`plasma/desktoptheme/innerpulse/${rel}`, data);
log('Plasma theme');

// 3. window decorations
for (const t of themes) {
  const { id, files } = auroraeTheme(t, VERSION);
  for (const [rel, data] of Object.entries(files)) put(`aurorae/themes/${id}/${rel}`, data);
}
log('Aurorae decorations');

// 4. wallpapers: images/ is the paper rendition, images_dark/ the ink one; Plasma picks by color scheme
const wallpapers = [
  ['innerpulse-exposure', 'innerpulse Exposure', 'A long exposure of one beat: 96 exposures over 1.6 s that resolve into the mark at rest', exposureWallpaper],
  ['innerpulse-horizon', 'innerpulse Horizon', 'One beat in depth: 80 readings receding to a horizon, the front row live', horizonWallpaper],
  ['innerpulse-field', 'innerpulse Field', 'The field frozen: a waterfall of the mark’s bar with the mark cleaned out of the noise', fieldWallpaper],
  ['innerpulse-ribbon', 'innerpulse Ribbon', 'The ribbon: the mark’s envelope as a strip twisted two beats', (t) => ribbonWallpaper(t, BRAND)],
];
const sizes = fast ? WALLPAPER_SIZES.filter(([w]) => w === 2560) : WALLPAPER_SIZES;
for (const [id, name, desc, draw] of wallpapers) {
  put(`wallpapers/${id}/metadata.json`, JSON.stringify({
    KPlugin: { Authors: [{ Name: 'innerpulse' }], Description: desc, Id: id, License: 'MIT', Name: name, Version: VERSION },
  }, null, 4) + '\n');
  for (const t of [ink, paper]) {
    const svg = putBuild(`wallpapers/${id}-${t.id}.svg`, draw(t));
    const dir = t.dark ? 'images_dark' : 'images';
    for (const [w, h] of sizes) raster(svg, join(DIST, `wallpapers/${id}/contents/${dir}/${w}x${h}.png`), w, h);
    if (t.dark) raster(svg, join(DIST, `wallpapers/${id}/contents/screenshot.png`), 400, 225);
  }
  log('wallpaper', id);
}
// Carbon gets its own package: Exposure over a carbon-fiber weave (one ground, so images/ only)
{
  const id = 'innerpulse-carbon';
  put(`wallpapers/${id}/metadata.json`, JSON.stringify({
    KPlugin: { Authors: [{ Name: 'innerpulse' }], Description: 'A long exposure of one beat over a carbon-fiber weave', Id: id, License: 'MIT', Name: 'innerpulse Carbon', Version: VERSION },
  }, null, 4) + '\n');
  const svg = putBuild(`wallpapers/${id}.svg`, exposureWallpaper(carbon));
  for (const [w, h] of sizes) raster(svg, join(DIST, `wallpapers/${id}/contents/images/${w}x${h}.png`), w, h);
  raster(svg, join(DIST, `wallpapers/${id}/contents/screenshot.png`), 400, 225);
  log('wallpaper', id);
}

// 5. look-and-feel packages, with the splash in the Ink package (the Paper package points at it: a splash is a
//    screen, and screens stay ink)
for (const t of themes) {
  const id = `net.innerpulse.${t.id}`;
  const base = `plasma/look-and-feel/${id}`;
  put(`${base}/metadata.json`, JSON.stringify({
    KPackageStructure: 'Plasma/LookAndFeel',
    KPlugin: {
      Authors: [{ Name: 'innerpulse' }],
      Category: '',
      Description: {
        ink: 'innerpulse on ink: warm ink grounds, machined corners, hairlines and one ember signal',
        paper: 'innerpulse on paper: the light ground, the deep ember, the same instrument',
        carbon: 'innerpulse in carbon and brushed steel: cool carbon grounds, steel text, blued-steel selection, one ember signal',
      }[t.id],
      Id: id, License: 'MIT', Name: t.name, Version: VERSION, Website: 'https://www.innerpulse.net',
    },
    'X-Plasma-MainScript': 'defaults',
  }, null, 4) + '\n');
  put(`${base}/contents/defaults`, `[kdeglobals][KDE]
widgetStyle=Oxygen

[kdeglobals][General]
ColorScheme=${t.scheme}
AccentColor=
accentColorFromWallpaper=false

[kdeglobals][Icons]
Theme=${t.dark ? 'breeze-dark' : 'breeze'}

[plasmarc][Theme]
name=innerpulse

[Wallpaper]
Image=${t.id === 'carbon' ? 'innerpulse-carbon' : 'innerpulse-exposure'}

[kcminputrc][Mouse]
cursorTheme=breeze_cursors

[kwinrc][org.kde.kdecoration2]
library=org.kde.kwin.aurorae
theme=__aurorae__svg__innerpulse-${t.id}

[KSplash]
Theme=net.innerpulse.ink
`);
  if (t.id === 'ink') {
    copyFileSync(join(ROOT, 'src/splash/Splash.qml'), put(`${base}/contents/splash/Splash.qml`, ''));
    copyFileSync(join(BRAND, 'innerpulse-wordmark-on-dark.svg'), put(`${base}/contents/splash/images/wordmark.svg`, ''));
  }
  const pv = putBuild(`preview-${t.id}.svg`, preview(t, join(DIST, t.id === 'carbon' ? 'wallpapers/innerpulse-carbon/contents/images/2560x1440.png' : `wallpapers/innerpulse-exposure/contents/${t.dark ? 'images_dark' : 'images'}/2560x1440.png`)));
  raster(pv, join(DIST, `${base}/contents/previews/preview.png`), 640, 360);
  const full = join(BUILD, `full-${t.id}.png`);
  raster(pv, full, 1920, 1080);
  execFileSync('magick', [full, '-quality', '90', join(DIST, `${base}/contents/previews/fullscreenpreview.jpg`)]);
  log('look-and-feel', id);
}

// 6. the mark as an icon, for the application launcher and anything else that asks for "innerpulse"
copyFileSync(join(BRAND, 'innerpulse-glyph.svg'), put('icons/hicolor/scalable/apps/innerpulse.svg', ''));
copyFileSync(join(BRAND, 'innerpulse-icon.svg'), put('icons/hicolor/scalable/apps/innerpulse-app.svg', ''));
log('icons');
console.log(`built ${VERSION} → ${DIST}`);
