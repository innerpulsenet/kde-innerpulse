// Wallpapers, drawn in a 2560×1440 box and rasterized at several sizes by the build.
//
//   field    the brand's field frozen: a waterfall of the mark's own bar, 240 columns × 128 rows, a grey
//            noise floor with a few carriers drifting through it, and the mark itself cleaned out of the noise
//            in ember. The caption states what is drawn.
//   ribbon   the kit's ribbon (the mark's envelope as a strip twisted two beats), bleeding off the right edge.
import { readFileSync } from 'node:fs';
import { barRects } from './mark.mjs';
import { n } from './svg.mjs';

const VW = 2560, VH = 1440;
const COLS = 240, ROWS = 128;

// mulberry32: a small seeded PRNG so the wallpaper is the same on every build
export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export const mono = `font-family="JetBrains Mono, IBM Plex Mono, DM Mono, monospace"`;

export function caption(lines, x, y, color, { size = 13, anchor = 'end' } = {}) {
  return lines.map((l, i) =>
    `<text x="${x}" y="${y + i * size * 1.75}" text-anchor="${anchor}" ${mono} font-size="${size}" font-weight="500" letter-spacing="${n(size * 0.14)}" fill="${color}">${l}</text>`).join('');
}

export function grain(id, opacity) {
  return {
    defs: `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.1 -.35"/></filter>`,
    layer: `<rect width="${VW}" height="${VH}" filter="url(#${id})" opacity="${opacity}"/>`,
  };
}

export function fieldWallpaper(t) {
  const rand = rng(240128);
  const pitchX = VW / COLS, pitchY = VH / ROWS;
  const barW = 4, maxH = pitchY * 0.42;

  // The mark: 460 px across, centered at the left third, a little above the middle.
  const MW = 460, S = MW / 220, MX = VW * 0.31, MY = VH * 0.46;
  // Clear space: the field fades out in an ellipse around the mark (the mark "cleaned out of the noise").
  const clean = (x, y) => {
    const dx = (x - MX) / (MW / 2 * 1.6), dy = (y - MY) / (MW / 2 * 1.3);
    return smooth(0.55, 1.05, Math.sqrt(dx * dx + dy * dy));
  };
  // The caption block, bottom right, above where a panel sits. No bar is drawn under it.
  const capX = VW - 72, capY = VH - 150;
  const capBox = { x0: capX - 560, x1: capX + 24, y0: capY - 30, y1: capY + 60 };

  // carriers: columns with sustained energy that drift a little over time and drop out now and then
  const carriers = Array.from({ length: 11 }, () => ({
    c: 12 + rand() * (COLS - 24), amp: 0.35 + rand() * 0.55, w: 0.8 + rand() * 1.8,
    drift: (rand() - 0.5) * 6, freq: 8 + rand() * 30, on: rand(), duty: 0.45 + rand() * 0.5,
  }));

  const bars = [];
  for (let j = 0; j < ROWS; j++) {
    const age = j / (ROWS - 1); // 0 = oldest (top), 1 = the newest row, at the front
    const rowFade = 0.22 + 0.78 * age ** 1.6;
    for (let i = 0; i < COLS; i++) {
      const x = (i + 0.5) * pitchX, y = (j + 0.5) * pitchY;
      if (x > capBox.x0 && x < capBox.x1 && y > capBox.y0 && y < capBox.y1) continue;
      let v = 0.08 + rand() ** 2.2 * 0.36;
      for (const k of carriers) {
        const phase = (j / ROWS + k.on) % 1;
        if (phase > k.duty) continue;
        const cc = k.c + k.drift * Math.sin(j / k.freq);
        v += k.amp * Math.exp(-(((i - cc) / k.w) ** 2)) * (0.75 + 0.25 * rand());
      }
      v = Math.min(1, v) * clean(x, y);
      if (v < 0.035) continue;
      const h = Math.max(1, v * maxH);
      const op = Math.min(1, (0.1 + 0.9 * v) * rowFade) * (t.dark ? 0.62 : 0.5);
      bars.push(`<rect x="${n(x - barW / 2)}" y="${n(y - h)}" width="${barW}" height="${n(2 * h)}" rx="1" fill-opacity="${n(op)}"/>`);
    }
  }

  const mark = barRects().map((r) =>
    `<rect x="${n(MX + r.x * S)}" y="${n(MY + r.y * S)}" width="${n(r.w * S)}" height="${n(r.h * S)}" rx="${n(r.rx * S)}"/>`).join('');

  const g = grain('grain', t.dark ? 0.05 : 0.04);
  const bg = t.dark ? '#0a0908' : '#f4f1ec';
  const barColor = t.dark ? '#b0a99f' : '#454b56';
  const defs = [
    g.defs,
    `<radialGradient id="vig" cx="${n(MX / VW)}" cy="${n(MY / VH)}" r="1.05"><stop offset=".35" stop-color="${bg}" stop-opacity="0"/><stop offset="1" stop-color="${t.dark ? '#000' : '#d6d1c8'}" stop-opacity="${t.dark ? 0.7 : 0.5}"/></radialGradient>`,
    `<linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}" stop-opacity=".9"/><stop offset=".3" stop-color="${bg}" stop-opacity="0"/></linearGradient>`,
    t.dark ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>` : '',
  ].join('');

  const markColor = t.dark ? '#f43a2a' : '#cf2a1c';
  const body = [
    `<rect width="${VW}" height="${VH}" fill="${bg}"/>`,
    `<g fill="${barColor}">${bars.join('')}</g>`,
    `<rect width="${VW}" height="${VH}" fill="url(#front)"/>`,
    t.dark ? `<g fill="${markColor}" filter="url(#glow)" opacity=".38">${mark}</g>` : '',
    `<g fill="${markColor}">${mark}</g>`,
    `<rect width="${VW}" height="${VH}" fill="url(#vig)"/>`,
    g.layer,
    caption([
      `THE FIELD · ${COLS} × ${ROWS} BARS`,
      'SIGNAL · h = rest(84·|sin(2πi/5 − π/30)|)',
    ], capX, capY, t.dark ? '#8e877d' : '#575e6b'),
  ].join('\n');
  return svgDoc(body, defs);
}

export function ribbonWallpaper(t, brandDir) {
  const src = readFileSync(`${brandDir}/innerpulse-ribbon-on-${t.dark ? 'dark' : 'light'}.svg`, 'utf8');
  // strip the outer <svg> so the ribbon can be placed and scaled inside our own document
  const inner = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, '');
  const bg = t.dark ? '#0a0908' : '#f4f1ec';
  const scale = 1.02;
  const g = grain('grain', t.dark ? 0.05 : 0.04);
  const defs = g.defs +
    `<radialGradient id="vig" cx=".7" cy=".5" r="1"><stop offset=".4" stop-color="${bg}" stop-opacity="0"/><stop offset="1" stop-color="${t.dark ? '#000' : '#d6d1c8'}" stop-opacity="${t.dark ? 0.65 : 0.45}"/></radialGradient>`;
  const capX = 72, capY = VH - 150;
  const body = [
    `<rect width="${VW}" height="${VH}" fill="${bg}"/>`,
    `<g transform="translate(${VW - 2000 * scale + 260} ${(VH - 1800 * scale) / 2 - 40}) scale(${scale})">${inner}</g>`,
    `<rect width="${VW}" height="${VH}" fill="url(#vig)"/>`,
    g.layer,
    caption(['THE RIBBON · THE MARK’S ENVELOPE', 'A STRIP TWISTED TWO BEATS, SIDE-ON HEIGHT W·|sin θ|'], capX, capY, t.dark ? '#8e877d' : '#575e6b', { anchor: 'start' }),
  ].join('\n');
  return svgDoc(body, defs);
}

export const svgDoc = (body, defs) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${VW}" height="${VH}" viewBox="0 0 ${VW} ${VH}"><defs>${defs}</defs>\n${body}\n</svg>\n`;

export const WALLPAPER_SIZES = [[3840, 2160], [2560, 1440], [1920, 1080]];
export const WALLPAPER_BOX = [VW, VH];
