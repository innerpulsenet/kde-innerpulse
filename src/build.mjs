#!/usr/bin/env node
// Builds the innerpulse KDE theme into dist/, laid out like ~/.local/share so install.sh can copy it as is.
//
//   node src/build.mjs            everything
//   node src/build.mjs --fast     package only the 2560 × 1440 wallpapers and lock grounds, for quick iteration
//
// Needs node ≥ 20, rsvg-convert (librsvg) and ImageMagick's magick. No npm packages.
import { mkdirSync, writeFileSync, rmSync, copyFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { themes, ink, paper, carbon } from './lib/palette.mjs';
import { colorScheme, konsoleScheme, konsoleProfile, contrastGate } from './lib/colors.mjs';
import { plasmaTheme, desktopThemeId } from './lib/plasma.mjs';
import { auroraeTheme } from './lib/aurorae.mjs';
import { WALLPAPERS, DEFAULT_WALLPAPER, WALLPAPER_SIZES, OLED_GROUND, LOCK_MARK, LOCK_SIZES, ART, quietWallpaper, lockWallpaper } from './lib/wallpaper.mjs';
import { MARK, PLATE, PULSE, TEMPO, LAMP, barHeights } from './lib/mark.mjs';
import { preview, splashPreview, SPLASH } from './lib/preview.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = join(ROOT, 'brand');
const ART_DIR = join(ROOT, 'wallpapers'); // the OLED wallpaper set, as finished JPEGs
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

// The QML screens (splash, lock, logout) carry the brand's values as working literals, each tagged with a
// trailing /*@KEY@*/ comment; the build swaps in the generator's value, so mark.mjs and palette.mjs stay the one
// source. An unknown key, or a tag the pattern cannot place, fails the build.
const q = (v) => JSON.stringify(v).replace(/,/g, ', ');
// Screens (the splash) stand on the brand's ink, which is carbon.
const QML_VALUES = {
  GROUND: q(carbon.ground), EMBER: q(carbon.mark), TEXT: q(carbon.text), TEXT3: q(carbon.text3),
  REST_H: q(barHeights().map((h) => +h.toFixed(2))),
  BEATS: MARK.beat, SPAN: MARK.span, STROKE: MARK.stroke, CORNER: MARK.corner,
  PLATE: PLATE.size, PLATE_CORNER: PLATE.corner, CUT: PLATE.cut, LAMP: q(LAMP),
  WORKING: TEMPO.working, AMBIENT: TEMPO.ambient, PULSE_W: PULSE.width, LAG: PULSE.lag,
  DRAW_IN: PULSE.drawIn, DRAW_LAG: PULSE.drawLag, STILL_UNDER: 48,
  SPLASH_PLATE: SPLASH.plate, SPLASH_LIFT: SPLASH.lift,
  ART_W: ART.width, ART_H: ART.height,
  LOCK_X: LOCK_MARK.mx, LOCK_Y: LOCK_MARK.my, LOCK_SIZE: LOCK_MARK.size,
  LOCK_MARKS: `(${q(Object.fromEntries(themes.map((t) => [t.id, t.mark])))})`,
  LOCK_GROUNDS: `(${q(Object.fromEntries(themes.map((t) => [t.id, t.ground])))})`,
  SIZES: q(fast ? LOCK_SIZES.filter(([w]) => w === 2560) : LOCK_SIZES),
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

// 2. Plasma desktop themes, one per variant: colors follow the active scheme, but the glass, the shadow and the
//    hairline weights are baked into the SVGs, so Paper and Carbon each get their own
for (const t of themes) {
  for (const [rel, data] of Object.entries(plasmaTheme(t, VERSION))) put(`plasma/desktoptheme/${desktopThemeId(t)}/${rel}`, data);
}
log('Plasma themes');

// 3. window decorations
// each also as an opt-in -frosted decoration (install.sh --frosted-titlebar)
for (const t of themes) for (const frosted of [false, true]) {
  const { id, files } = auroraeTheme(t, VERSION, { frosted });
  for (const [rel, data] of Object.entries(files)) put(`aurorae/themes/${id}/${rel}`, data);
}
log('Aurorae decorations');

// 4. wallpapers: the OLED set, packaged as they are, one ground for every variant (images/ only)
const meta = (id, name, desc) => put(`wallpapers/${id}/metadata.json`, JSON.stringify({
  KPlugin: { Authors: [{ Name: 'innerpulse' }], Description: desc, Id: id, License: 'All rights reserved: see BRAND.md', Name: name, Version: VERSION },
}, null, 4) + '\n');
const sizes = fast ? WALLPAPER_SIZES.filter(([w]) => w === 2560) : WALLPAPER_SIZES;
for (const [set, id, name, desc] of WALLPAPERS) {
  meta(id, `innerpulse ${name}`, `${desc} (${set})`);
  for (const [w, h] of sizes) {
    const src = join(ART_DIR, id, `${w}x${h}.jpg`);
    if (!existsSync(src)) throw new Error(`wallpapers/${id}: missing ${w}x${h}.jpg`);
    copyFileSync(src, put(`wallpapers/${id}/contents/images/${w}x${h}.jpg`, ''));
  }
  execFileSync('magick', [join(ART_DIR, id, '2560x1440.jpg'), '-resize', '400x225', '-quality', '90',
    put(`wallpapers/${id}/contents/screenshot.jpg`, '')]);
}
log(`wallpapers: ${WALLPAPERS.length}`);
// install.sh --quiet-second-screen puts this on every screen but the primary one: the set's black, nothing on it
{
  const id = 'innerpulse-quiet';
  meta(id, 'innerpulse Quiet', 'The wallpapers’ true black with nothing on it, for a second screen');
  const svg = putBuild(`wallpapers/${id}.svg`, quietWallpaper());
  for (const [w, h] of sizes) raster(svg, join(DIST, `wallpapers/${id}/contents/images/${w}x${h}.png`), w, h);
  raster(svg, join(DIST, `wallpapers/${id}/contents/screenshot.png`), 400, 225);
  log('wallpaper', id, OLED_GROUND);
}
// The lock screen's grounds: the variant's ground with the plate at rest, low and to the right, clear of the lock
// screen's clock, prompt and footer. innerpulse-lock carries Ink and Paper like a light/dark pair; Carbon has its own.
const lockSvgs = {};
const lockSizes = fast ? LOCK_SIZES.filter(([w]) => w === 2560) : LOCK_SIZES;
for (const [id, name, grounds] of [['innerpulse-lock', 'innerpulse Lock', [ink, paper]], ['innerpulse-lock-carbon', 'innerpulse Lock Carbon', [carbon]]]) {
  put(`wallpapers/${id}/metadata.json`, JSON.stringify({
    KPlugin: { Authors: [{ Name: 'innerpulse' }], Description: 'The lock screen composition: the plate at rest, low and to the right, clear of the clock and the prompt', Id: id, License: 'All rights reserved: see BRAND.md', Name: name, Version: VERSION },
  }, null, 4) + '\n');
  for (const t of grounds) {
    const svg = lockSvgs[t.id] = putBuild(`wallpapers/${id}-${t.id}.svg`, lockWallpaper(t));
    const dir = t.dark && t.id !== 'carbon' ? 'images_dark' : 'images';
    for (const [w, h] of lockSizes) raster(svg, join(DIST, `wallpapers/${id}/contents/${dir}/${w}x${h}.png`), w, h);
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
      Description: 'For the lock screen only: the innerpulse lock composition with the live plate, a pulse of light through it every 4.5 s',
      Icon: 'innerpulse-app', Id: 'net.innerpulse.lock', License: 'MIT', Name: 'innerpulse Lock (the live mark)', Version: VERSION,
    },
    'X-KDE-ParentApp': 'org.kde.plasmashell',
  }, null, 4) + '\n');
  copyFileSync(join(ROOT, 'src/lock/main.xml'), put(`${base}/contents/config/main.xml`, ''));
  copyFileSync(join(ROOT, 'src/lock/config.qml'), put(`${base}/contents/ui/config.qml`, ''));
  put(`${base}/contents/ui/main.qml`, qml('src/lock/main.qml'));
  put(`${base}/contents/ui/AmbientMark.qml`, qml('src/qml/AmbientMark.qml'));
  log('lock screen plugin');
}

// 5. look-and-feel packages, with the splash in the Ink package (the others point at it: a splash is a screen, and
//    screens stand on the brand's ink, which is carbon). Every package carries the logout prompt: the greeter reads
//    it from the active global theme and has no key to point elsewhere.
for (const t of themes) {
  const id = `net.innerpulse.${t.id}`;
  const base = `plasma/look-and-feel/${id}`;
  put(`${base}/metadata.json`, JSON.stringify({
    KPackageStructure: 'Plasma/LookAndFeel',
    KPlugin: {
      Authors: [{ Name: 'innerpulse' }],
      Category: '',
      Description: {
        ink: 'innerpulse on warm ink: the earlier warm grounds, machined corners, hairlines and one ember signal',
        paper: 'innerpulse on paper: the light ground, the deep ember, the same instrument',
        carbon: 'innerpulse in carbon and brushed steel, the default: cool carbon grounds, steel text, blued-steel selection, one ember signal',
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
name=${desktopThemeId(t)}

[Wallpaper]
Image=${DEFAULT_WALLPAPER}

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
    put(`${base}/contents/splash/AmbientMark.qml`, qml('src/qml/AmbientMark.qml'));
    copyFileSync(join(BRAND, 'innerpulse-wordmark-on-dark.svg'), put(`${base}/contents/splash/images/wordmark.svg`, ''));
    // the Splash Screen settings page's thumbnail (2× Breeze's 300 × 169)
    const sp = putBuild('splash-preview.svg', splashPreview(carbon, readFileSync(join(BRAND, 'innerpulse-wordmark-on-dark.svg'), 'utf8')));
    raster(sp, join(DIST, `${base}/contents/previews/splash.png`), 600, 338);
  }
  put(`${base}/contents/logout/Logout.qml`, qml('src/logout/Logout.qml'));
  put(`${base}/contents/logout/AmbientMark.qml`, qml('src/qml/AmbientMark.qml'));
  // the lock screen as this theme sets it (its ground, the mark at rest), at Breeze's 600 × 337
  raster(lockSvgs[t.id], join(DIST, `${base}/contents/previews/lockscreen.png`), 600, 337);
  const pv = putBuild(`preview-${t.id}.svg`, preview(t, join(ART_DIR, DEFAULT_WALLPAPER, '2560x1440.jpg')));
  raster(pv, join(DIST, `${base}/contents/previews/preview.png`), 640, 360);
  const full = join(BUILD, `full-${t.id}.png`);
  raster(pv, full, 1920, 1080);
  execFileSync('magick', [full, '-quality', '90', join(DIST, `${base}/contents/previews/fullscreenpreview.jpg`)]);
  log('look-and-feel', id);
}

// 6. the mark as icons. innerpulse-app is the app icon: the plate edge to edge, flat as a scalable SVG and at 16–48
//    px (whole-pixel), machined from 64 px. innerpulse is the mark in a panel (the launcher, a tray): the small mark,
//    the six bars alone, since a panel icon is under 32 px and the plate's slots would not read there.
copyFileSync(join(BRAND, 'innerpulse-icon.svg'), put('icons/hicolor/scalable/apps/innerpulse-app.svg', ''));
for (const N of [16, 24, 32, 48, 64, 128, 256, 512]) {
  copyFileSync(join(BRAND, `png/innerpulse-icon-${N}.png`), put(`icons/hicolor/${N}x${N}/apps/innerpulse-app.png`, ''));
}
copyFileSync(join(BRAND, 'innerpulse-mark-small.svg'), put('icons/hicolor/scalable/apps/innerpulse.svg', ''));
// Pixel-hinted copies of the small mark for the sizes a panel asks for, so the bars' edges land on whole pixels
// instead of the scalable mark's fractional ones. Bar and gap widths are chosen per size; heights are the resting
// heights scaled by the layout's width (the master's 206-unit span) and rounded to N's parity, so each bar centers
// on a whole pixel. At 22 and 24 px the bar-to-gap ratio is 1:1, not the master's roughly 1.5:1, because 3 + 1 bars
// would be 23 px wide. Never animated, no effects. Other sizes fall back to the scalable mark.
for (const [N, bar, gap, rx] of [[22, 2, 2, 0.5], [24, 2, 2, 0.5], [32, 3, 2, 0.5]]) {
  const width = 6 * bar + 5 * gap, x0 = Math.floor((N - width) / 2);
  const s = width / (2 * (MARK.span + MARK.stroke / 2));
  const master = barHeights().map((h) => 2 * h + MARK.stroke);
  const hs = master.map((h) => { const v = h * s; return 2 * Math.round((v - (N % 2)) / 2) + (N % 2); });
  // the beat's order must survive the rounding: the strike (bar 1) > the echo (bar 4) > bar 2 > bar 3 > the rests
  const [a, b, c, d, e, f] = hs;
  if (!(b > e && e >= c && c > d && d > a && a === f && a > 0)) throw new Error(`icon ${N}: rounding broke the beat's order (${hs})`);
  if (x0 < 0 || x0 + width > N || Math.max(...hs) > N) throw new Error(`icon ${N}: the bars do not fit (${hs})`);
  const rects = hs.map((h, i) => `<rect x="${x0 + i * (bar + gap)}" y="${(N - h) / 2}" width="${bar}" height="${h}" rx="${rx}"/>`).join('');
  put(`icons/hicolor/${N}x${N}/apps/innerpulse.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="${N}" height="${N}"><g fill="#f43a2a">${rects}</g></svg>\n`);
}
log('icons');
console.log(`built ${VERSION} → ${DIST}`);
