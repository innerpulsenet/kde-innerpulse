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
import { colorScheme, konsoleScheme, konsoleProfile } from './lib/colors.mjs';
import { plasmaTheme } from './lib/plasma.mjs';
import { auroraeTheme } from './lib/aurorae.mjs';
import { fieldWallpaper, ribbonWallpaper, WALLPAPER_SIZES } from './lib/wallpaper.mjs';
import { horizonWallpaper, exposureWallpaper, lockWallpaper, EXPOSURE_MARK, LOCK_MARK, ART } from './lib/wallpaper-art.mjs';
import { MARK, PULSE, TEMPO, barHeights } from './lib/mark.mjs';
import { preview, splashPreview } from './lib/preview.mjs';

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

// The QML screens (splash, lock, logout) carry the brand's values as working literals, each tagged with a
// trailing /*@KEY@*/ comment; the build swaps in the generator's value, so mark.mjs and palette.mjs stay the one
// source. An unknown key, or a tag the pattern cannot place, fails the build.
const q = (v) => JSON.stringify(v).replace(/,/g, ', ');
const QML_VALUES = {
  GROUND: q(ink.ground), EMBER: q(ink.mark), TEXT: q(ink.text), TEXT3: q(ink.text3),
  REST_H: q(barHeights().map((h) => +h.toFixed(2))),
  BEATS: MARK.beat, SPAN: MARK.span, STROKE: MARK.stroke, CORNER: MARK.corner, BOX: 220,
  WORKING: TEMPO.working, AMBIENT: TEMPO.ambient, RISE: PULSE.rise, PULSE_W: PULSE.width, LAG: PULSE.lag,
  ART_W: ART.width, ART_H: ART.height,
  EXPOSURE_X: EXPOSURE_MARK.mx, EXPOSURE_Y: EXPOSURE_MARK.my, EXPOSURE_BOX: EXPOSURE_MARK.box,
  LOCK_X: LOCK_MARK.mx, LOCK_Y: LOCK_MARK.my, LOCK_BOX: LOCK_MARK.box,
  LOCK_MARKS: `(${q(Object.fromEntries(themes.map((t) => [t.id, t.mark])))})`,
  LOCK_GROUNDS: `(${q(Object.fromEntries(themes.map((t) => [t.id, t.ground])))})`,
  SIZES: q((fast ? WALLPAPER_SIZES.filter(([w]) => w === 2560) : WALLPAPER_SIZES).map(([w, h]) => [w, h]).sort((a, b) => a[0] - b[0])),
};
const qml = (rel) => {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const out = src.replace(/(:\s*)[^\n]*?(\s*\/\*@([A-Z0-9_]+)@\*\/)/g, (_, pre, tag, key) => {
    if (!(key in QML_VALUES)) throw new Error(`${rel}: no value for @${key}@`);
    return pre + QML_VALUES[key] + tag;
  });
  const lost = out.split('\n').filter((l) => /\/\*@[A-Z0-9_]+@\*\//.test(l) && !/:\s*\S/.test(l));
  if (lost.length) throw new Error(`${rel}: a tag with no value before it: ${lost[0].trim()}`);
  return out;
};

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
// The lock screen's grounds: the exposure set low and right, clear of the lock screen's clock, prompt and footer.
// innerpulse-lock carries both grounds like Exposure; Carbon has its own, as on the desktop.
const lockSvgs = {};
for (const [id, name, grounds] of [['innerpulse-lock', 'innerpulse Lock', [ink, paper]], ['innerpulse-lock-carbon', 'innerpulse Lock Carbon', [carbon]]]) {
  put(`wallpapers/${id}/metadata.json`, JSON.stringify({
    KPlugin: { Authors: [{ Name: 'innerpulse' }], Description: 'The lock screen composition: one beat’s long exposure, low and to the right, clear of the clock and the prompt', Id: id, License: 'MIT', Name: name, Version: VERSION },
  }, null, 4) + '\n');
  for (const t of grounds) {
    const svg = lockSvgs[t.id] = putBuild(`wallpapers/${id}-${t.id}.svg`, lockWallpaper(t));
    const dir = t.dark && t.id !== 'carbon' ? 'images_dark' : 'images';
    for (const [w, h] of sizes) raster(svg, join(DIST, `wallpapers/${id}/contents/${dir}/${w}x${h}.png`), w, h);
    if (t.dark) raster(svg, join(DIST, `wallpapers/${id}/contents/screenshot.png`), 400, 225);
  }
  log('wallpaper', id);
}

// 4b. the lock screen's wallpaper plugin: the lock ground with the live mark over its resting one (src/lock)
{
  const base = 'plasma/wallpapers/net.innerpulse.lock';
  put(`${base}/metadata.json`, JSON.stringify({
    KPackageStructure: 'Plasma/Wallpaper',
    KPlugin: {
      Authors: [{ Name: 'innerpulse' }], Category: '',
      Description: 'For the lock screen only: the innerpulse lock composition with the live mark, beating every 4.5 s',
      Icon: 'innerpulse', Id: 'net.innerpulse.lock', License: 'MIT', Name: 'innerpulse Lock (the live mark)', Version: VERSION,
    },
    'X-KDE-ParentApp': 'org.kde.plasmashell',
  }, null, 4) + '\n');
  copyFileSync(join(ROOT, 'src/lock/main.xml'), put(`${base}/contents/config/main.xml`, ''));
  copyFileSync(join(ROOT, 'src/lock/config.qml'), put(`${base}/contents/ui/config.qml`, ''));
  put(`${base}/contents/ui/main.qml`, qml('src/lock/main.qml'));
  put(`${base}/contents/ui/AmbientMark.qml`, qml('src/qml/AmbientMark.qml'));
  log('lock screen plugin');
}

// 5. look-and-feel packages, with the splash in the Ink package (the Paper package points at it: a splash is a
//    screen, and screens stay ink). Every package carries the logout prompt: the greeter reads it from the active
//    global theme and has no key to point elsewhere.
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
        carbon: 'innerpulse in carbon and brushed steel: cool carbon grounds, steel text, gunmetal selection, one ember signal',
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
    put(`${base}/contents/splash/Splash.qml`, qml('src/splash/Splash.qml'));
    copyFileSync(join(BRAND, 'innerpulse-wordmark-on-dark.svg'), put(`${base}/contents/splash/images/wordmark.svg`, ''));
    // the Splash Screen settings page's thumbnail (2× Breeze's 300 × 169)
    const sp = putBuild('splash-preview.svg', splashPreview(ink, readFileSync(join(BRAND, 'innerpulse-wordmark-on-dark.svg'), 'utf8')));
    raster(sp, join(DIST, `${base}/contents/previews/splash.png`), 600, 338);
  }
  put(`${base}/contents/logout/Logout.qml`, qml('src/logout/Logout.qml'));
  put(`${base}/contents/logout/AmbientMark.qml`, qml('src/qml/AmbientMark.qml'));
  // the lock screen as this theme sets it (its ground, the mark at rest), at Breeze's 600 × 337
  raster(lockSvgs[t.id], join(DIST, `${base}/contents/previews/lockscreen.png`), 600, 337);
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
