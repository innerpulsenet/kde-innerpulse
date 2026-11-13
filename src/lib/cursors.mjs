// The innerpulse cursors: smoked glass pointers, and the small mark in motion for the two busy shapes.
//
// Every shape is drawn in one language. Solid shapes (the arrow, the hands, the badges) are dark glass, a
// vertical #3a414b → #0b0d10 gradient inside a bright steel rim; line shapes (the I-beam, the crosshair, the
// resize arrows, the forbidden sign) are a dark stroke over a wider steel outline, so both read on carbon and on
// paper. All of it sits on one soft shadow, a blurred copy dropped a unit down, the way Breeze does it.
//
// wait is the six bars alone running Retake, one cycle per THINK.period; progress is the arrow with the bars as a
// badge running Pass, one pass per THINK.busy (mark.mjs). The bars carry a carbon halo so they hold on light
// windows. A cursor theme cannot read the reduced-motion setting, so innerpulse-cursors-still has both busy shapes
// as one frame with the mark at rest, and the installer picks the theme.
//
// Two formats, both from the same drawings. cursors_scalable/ is what Plasma 6 reads: SVG frames plus a
// metadata.json, mirroring Breeze's conventions (a 32-unit canvas at nominal size 24, hotspots in canvas units,
// delays in ms, aliases as directory symlinks). cursors/ holds Xcursor files for XWayland and GTK, written here
// byte by byte since xcursorgen is not a dependency. In the rasters the bars are re-laid on each size's pixel grid
// (whole-pixel widths, gaps and heights, the same hinting as the small mark's panel icons in build.mjs), so they
// stay sharp and move in whole pixels; the scalable frames keep the mark's exact geometry. Undrawn shapes fall
// back to Breeze.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { n } from './svg.mjs';
import { MARK, THINK, barHeights, barX, litColor, passBars, retakeBars } from './mark.mjs';

export const CURSOR_THEMES = [
  { id: 'innerpulse-cursors', name: 'innerpulse', still: false },
  { id: 'innerpulse-cursors-still', name: 'innerpulse (still)', still: true },
];

const CANVAS = 32, NOMINAL = 24; // as Breeze: a 24 px cursor is a 32 px image with room for the shadow
const RIM = '#eef0f2', FACE = '#14171b', CARBON = '#0b0d10';
const LINE = { out: 4.6, face: 2.2 }; // line shapes: steel outline, dark stroke; 1.2 units of steel each side
const GLASS_RIM = 1.4;
const DEFS = '<defs><linearGradient id="glass" x2="0" y2="1"><stop stop-color="#3a414b"/><stop offset="1" stop-color="#0b0d10"/></linearGradient>' +
  '<filter id="shade" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation=".9"/></filter></defs>';

// --- parts: each is { s, b }, its shadow silhouette (black) and its body ------------------------------------

const join2 = (...parts) => ({ s: parts.map((p) => p.s).join(''), b: parts.map((p) => p.b).join('') });
const moved = (t, ...parts) => { const p = join2(...parts); return { s: `<g transform="${t}">${p.s}</g>`, b: `<g transform="${t}">${p.b}</g>` }; };
const round = 'stroke-linecap="round" stroke-linejoin="round"';

const glass = (d) => ({
  s: `<path d="${d}" fill="#000" stroke="#000" stroke-width="${GLASS_RIM}" stroke-linejoin="round"/>`,
  b: `<path d="${d}" fill="url(#glass)" stroke="${RIM}" stroke-width="${GLASS_RIM}" stroke-linejoin="round"/>`,
});
const line = (d) => ({
  s: `<path d="${d}" fill="none" stroke="#000" stroke-width="${LINE.out}" ${round}/>`,
  b: `<path d="${d}" fill="none" stroke="${RIM}" stroke-width="${LINE.out}" ${round}/><path d="${d}" fill="none" stroke="${FACE}" stroke-width="${LINE.face}" ${round}/>`,
});
// a steel mark drawn on glass (a badge's glyph, a hand's finger lines); casts no shadow of its own
const etch = (d, w = 1.5, opacity = 1) => ({ s: '', b: `<path d="${d}" fill="none" stroke="${RIM}" stroke-width="${w}" ${opacity < 1 ? `stroke-opacity="${opacity}" ` : ''}${round}/>` });
const circle = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 1 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 1 ${n(-2 * r)} 0z`;

// --- the drawings, in the 32-unit canvas ---------------------------------------------------------------------

// The arrow: tip at the hotspot, a 44° leading edge, and a tail cut square to its own direction.
const TIP = [5, 3];
const ARROW = [TIP, [5, 21.2], [9.4, 17.2], [12.5, 24.1], [15.5, 22.8], [12.5, 16], [18.6, 16]];
const arrow = (k = 1) => glass('M' + ARROW.map(([x, y]) => `${n(TIP[0] + (x - TIP[0]) * k)} ${n(TIP[1] + (y - TIP[1]) * k)}`).join('L') + 'z');

// The badge the arrow carries for help, copy, alias and the context menu: a glass disc clear of the tail.
const BADGE = [22.2, 22.4, 5.3];
const badged = (glyph) => join2(arrow(), glass(circle(...BADGE)), etch(glyph));

// The hands. Fingers are arcs over a shared palm; the steel finger lines are faint so the glass stays one piece.
const HAND_POINT = 'M11.1 4.9a1.9 1.9 0 0 1 3.8 0V12.6a1.75 1.75 0 0 1 3.5 0v.8a1.65 1.65 0 0 1 3.3 0v1.2a1.5 1.5 0 0 1 3 0' +
  'V20.3c0 4-2.4 6.7-6.1 6.7h-2.6c-2.2 0-3.7-.9-5-2.5l-4.4-5.3a1.75 1.75 0 0 1 2.6-2.3l2.3 2.1z';
const HAND_OPEN = 'M9.7 18.5V9.3a1.6 1.6 0 0 1 3.2 0V7.6a1.6 1.6 0 0 1 3.2 0v.5a1.6 1.6 0 0 1 3.2 0v2.2a1.5 1.5 0 0 1 3 0' +
  'V20c0 4.2-2.5 7-6.3 7h-1.4c-2.2 0-3.7-.9-5-2.5l-4.2-5.1a1.7 1.7 0 0 1 2.5-2.3z';
const HAND_FIST = 'M9.7 18.5v-4.8a1.6 1.6 0 0 1 3.2 0v-.6a1.6 1.6 0 0 1 3.2 0v.1a1.6 1.6 0 0 1 3.2 0v.6a1.5 1.5 0 0 1 3 0' +
  'V20c0 4.2-2.5 7-6.3 7h-1.4c-2.2 0-3.7-.9-5-2.5l-3-3.6a1.7 1.7 0 0 1 2.5-2.3z';

// Resize arrows: a shaft and two open heads, turned for each axis about the center.
const DOUBLE = 'M5.5 16h21M10 11.5 5.5 16l4.5 4.5M22 11.5l4.5 4.5-4.5 4.5';
const SPLIT = 'M14 8.5v15M18 8.5v15M11 16H5.5M8.5 13 5.5 16l3 3M21 16h5.5M23.5 13l3 3-3 3';
const IBEAM = 'M12.5 6c1.9 0 3.5.6 3.5 2.4v15.2c0 1.8-1.6 2.4-3.5 2.4M19.5 6c-1.9 0-3.5.6-3.5 2.4M16 23.6c0 1.8 1.6 2.4 3.5 2.4';
const FORBID = (cx, cy, r) => `${circle(cx, cy, r)}M${n(cx - r * 0.7071)} ${n(cy - r * 0.7071)}l${n(r * 1.4142)} ${n(r * 1.4142)}`;
const turned = (deg, k, d) => moved(`rotate(${deg} 16 16)${k === 1 ? '' : ` translate(16 16) scale(${k}) translate(-16 -16)`}`, line(d));
const lens = (glyph) => join2(line('M18.4 18.4 25.5 25.5'), glass(circle(13, 13, 7)), etch(glyph, 1.7));

const C = [16, 16];
const STATIC = {
  default: [TIP, () => arrow()],
  pointer: [[13, 3], () => join2(glass(HAND_POINT), etch('M14.9 12.6v2.6M18.4 13.4v2.2M21.7 14.6v1.8', 0.9, 0.45))],
  text: [C, () => line(IBEAM)],
  'vertical-text': [C, () => turned(90, 1, IBEAM)],
  crosshair: [C, () => line('M16 5v7.5M16 19.5V27M5 16h7.5M19.5 16H27M16 16h.01')],
  help: [TIP, () => badged('M20.3 21a1.9 1.9 0 1 1 2.7 1.7c-.5.25-.8.6-.8 1.1v.3M22.2 26.1v.01')],
  'context-menu': [TIP, () => join2(arrow(), glass('M17.5 18.5h9.5v8.5h-9.5z'), etch('M19.6 20.9h5.3M19.6 22.75h5.3M19.6 24.6h5.3', 1.1))],
  copy: [TIP, () => badged('M22.2 19.9v5M19.7 22.4h5')],
  alias: [TIP, () => badged('M20 25c0-2.7 1.4-4.2 4.1-4.2M22.6 19.2l1.6 1.6-1.6 1.6')],
  'not-allowed': [C, () => line(FORBID(16, 16, 8.5))],
  'no-drop': [TIP, () => join2(arrow(), line(FORBID(22.4, 22.6, 4)))],
  fleur: [C, () => line('M16 5.5v21M5.5 16h21M12.5 9 16 5.5 19.5 9M12.5 23l3.5 3.5 3.5-3.5M9 12.5 5.5 16 9 19.5M23 12.5l3.5 3.5-3.5 3.5')],
  openhand: [C, () => join2(glass(HAND_OPEN), etch('M12.9 9.3v5.2M16.1 8.1v6.4M19.3 10.3v4.2', 0.9, 0.45))],
  'dnd-move': [C, () => join2(glass(HAND_FIST), etch('M12.9 13.7v1.6M16.1 13.2v2M19.3 13.8v1.6', 0.9, 0.45))],
  cell: [C, () => glass('M13.8 8h4.4v5.8H24v4.4h-5.8V24h-4.4v-5.8H8v-4.4h5.8z')],
  'zoom-in': [[13, 13], () => lens('M13 10v6M10 13h6')],
  'zoom-out': [[13, 13], () => lens('M10 13h6')],
  'col-resize': [C, () => line(SPLIT)],
  'row-resize': [C, () => turned(90, 1, SPLIT)],
  size_hor: [C, () => line(DOUBLE)],
  size_ver: [C, () => turned(90, 1, DOUBLE)],
  size_fdiag: [C, () => turned(45, 0.9, DOUBLE)],
  size_bdiag: [C, () => turned(-45, 0.9, DOUBLE)],
};

// The busy shapes: where the bars sit (center and the 220-unit box's size, in canvas units), what else is drawn,
// and the motion: one cycle of `period` seconds in `frames` frames of 40 ms.
const BUSY = {
  wait: { hot: C, at: [16, 16, 22], base: null, motion: retakeBars, period: THINK.period, frames: 60 },
  progress: { hot: TIP, at: [22.6, 22.8, 16], base: () => arrow(0.8), motion: passBars, period: THINK.busy, frames: 30 },
};

// Aliases, as Breeze links them (cursors/ and cursors_scalable/ alike), for every shape drawn here. Two choices
// differ: move and all-scroll are the four-way arrows rather than a closed hand and Breeze's own all-scroll, and
// dnd-no-drop joins no-drop instead of keeping a drawing of its own.
const ALIASES = {
  default: ['arrow', 'left_ptr', 'size-bdiag', 'size-fdiag', 'size-hor', 'size-ver', 'top_left_arrow'],
  pointer: ['9d800788f1b08800ae810202380a0822', 'e29285e634086352946a0e7090d73106', 'hand1', 'hand2', 'pointing_hand'],
  text: ['ibeam', 'xterm'],
  crosshair: ['cross', 'tcross'],
  wait: ['watch'],
  progress: ['00000000000000020006000e7e9ffc3f', '08e8e1c95fe2fc01f976f1e063a24ccd', '3ecb610c1bf2410f44200f48c40d3599', 'half-busy', 'left_ptr_watch'],
  help: ['5c6cd98b3f3ebcb1f9c7f1c204630408', 'd9ce0ab605698f320427677b458ad60b', 'left_ptr_help', 'question_arrow', 'whats_this'],
  copy: ['1081e37283d90000800003c07f3ef6bf', '6407b0e94181790501fd1e167b474872', 'b66166c04f8c3109214a4fbd64a50fc8', 'dnd-copy'],
  alias: ['3085a0e285430894940527032f8b26df', '640fb0e74195791501fd1ed57b41487f', 'a2a266d0498c3104214a47bd64ab0fc8', 'link'],
  'not-allowed': ['03b6e0fcb3499374a867c041f52298f0', 'circle', 'crossed_circle'],
  'no-drop': ['dnd-no-drop', 'forbidden'],
  fleur: ['all-scroll', 'move', 'size_all'],
  openhand: ['grab'],
  'dnd-move': ['4498f0e0c1937ffe01fd06f973665830', '9081237383d90e509aa00f00170e968f', 'closedhand', 'dnd-none', 'fcf21c00b30f7e3f83fe0dfd12e71cff', 'grabbing'],
  cell: ['plus'],
  'col-resize': ['split_h'],
  'row-resize': ['split_v'],
  size_hor: ['e-resize', 'ew-resize', 'h_double_arrow', 'sb_h_double_arrow', 'w-resize'],
  size_ver: ['00008160000006810000408080010102', 'n-resize', 'ns-resize', 'sb_v_double_arrow', 's-resize', 'v_double_arrow'],
  size_fdiag: ['nw-resize', 'nwse-resize', 'se-resize'],
  size_bdiag: ['ne-resize', 'nesw-resize', 'sw-resize'],
};

// --- the bars ------------------------------------------------------------------------------------------------

const barRect = (x, y, w, h, rx, fill) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}" fill="${fill}"/>`;

// Bars from rects {x, y, w, h, rx, l}: each on a carbon halo `halo` wider all round, the halos casting the shadow.
function barPart(rects, halo) {
  const grow = (r, fill) => barRect(r.x - halo, r.y - halo, r.w + 2 * halo, r.h + 2 * halo, r.rx + halo, fill);
  return { s: rects.map((r) => grow(r, '#000')).join(''), b: rects.map((r) => grow(r, CARBON)).join('') + rects.map((r) => barRect(r.x, r.y, r.w, r.h, r.rx, litColor(r.l))).join('') };
}

// The mark's exact geometry, for the scalable frames: the bars of the 220-unit box at (cx, cy), `size` across. The
// halo is one canvas unit, a pixel at the nominal size.
function exactBars(bars, [cx, cy, size]) {
  const k = size / 220, r = MARK.stroke / 2;
  return barPart(bars.map(({ h, l }, i) => ({ x: cx + (barX(i) - r) * k, y: cy - (h + r) * k, w: MARK.stroke * k, h: (2 * h + MARK.stroke) * k, rx: MARK.corner * k, l })), 1);
}

// The bars laid on the pixel grid of a raster `s` px per canvas unit. Bar and gap widths are whole pixels, chosen
// to come closest to the mark's width while keeping its bar-to-gap ratio of about 1.5 (at small sizes 2:1 or 1:1
// wins, as in build.mjs); heights scale with the chosen width and keep the parity that puts every bar's center on
// the badge's center row, so a bar grows two pixels at a time. The beat's order must survive the rounding at rest.
function pixelLayout([cx, cy, size], s) {
  const full = 2 * MARK.span + MARK.stroke, target = (full * size * s) / 220, ratio = MARK.stroke / (2 * MARK.span / MARK.beat - MARK.stroke);
  let best;
  for (let bar = 1; bar <= 12; bar++) for (let gap = 1; gap <= 8; gap++) {
    const w = 6 * bar + 5 * gap, score = Math.abs(w - target) / target + 0.2 * Math.abs(Math.log(bar / gap / ratio));
    if (!best || score < best.score) best = { bar, gap, w, score };
  }
  const k = best.w / full, x0 = Math.round(cx * s - best.w / 2);
  const centers = [Math.round(cy * s), Math.round(cy * s - 0.5) + 0.5].sort((a, b) => Math.abs(a - cy * s) - Math.abs(b - cy * s));
  for (const mid of centers) {
    const parity = (2 * mid) % 2;
    const height = (h) => Math.max(parity || 2, 2 * Math.round(((2 * h + MARK.stroke) * k - parity) / 2) + parity);
    const [a, b, c, d, e, f] = barHeights().map(height);
    if (b > e && e >= c && c > d && d > a && a === f) {
      const rx = Math.min(best.bar / 2, Math.max(0.5, MARK.corner * k)), halo = Math.max(1, Math.round(s));
      return { ...best, x0, mid, height, rx, halo, s };
    }
  }
  throw new Error(`cursors: rounding broke the beat's order at ${s * CANVAS} px`);
}

function pixelBars(bars, L) {
  const rects = bars.map(({ h, l }, i) => { const hp = L.height(h); return { x: L.x0 + i * (L.bar + L.gap), y: L.mid - hp / 2, w: L.bar, h: hp, rx: L.rx, l }; });
  return moved(`scale(${n(1 / L.s)})`, barPart(rects, L.halo));
}

// --- documents and rasters -------------------------------------------------------------------------------------

const body = (p) => `<g filter="url(#shade)" opacity=".5" transform="translate(0 1)">${p.s}</g>${p.b}`;
const svgDoc = (p) => `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">${DEFS}${body(p)}</svg>\n`;

// All frames of one shape at one size in a single strip, rendered once and cut into straight RGBA frames.
function rasterize(frames, W) {
  const strip = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * frames.length}" height="${W}">${DEFS}` +
    frames.map((p, i) => `<svg x="${i * W}" width="${W}" height="${W}" viewBox="0 0 ${CANVAS} ${CANVAS}">${body(p)}</svg>`).join('') + '</svg>';
  const png = execFileSync('rsvg-convert', ['-'], { input: strip, maxBuffer: 1 << 28 });
  const rgba = execFileSync('magick', ['png:-', '-depth', '8', 'rgba:-'], { input: png, maxBuffer: 1 << 28 });
  return frames.map((_, i) => {
    const out = Buffer.alloc(W * W * 4);
    for (let y = 0; y < W; y++) rgba.copy(out, y * W * 4, (y * W * frames.length + i * W) * 4, (y * W * frames.length + (i + 1) * W) * 4);
    return out;
  });
}

// An Xcursor file: a 16-byte header, a table of contents, then one image chunk per frame and size. Pixels are
// little-endian ARGB with premultiplied alpha; an animated cursor is several chunks of the same nominal size.
function xcursor(images) {
  const head = 16, toc = 12, chunk = 36;
  const parts = [], tocBuf = Buffer.alloc(images.length * toc);
  let pos = head + tocBuf.length;
  images.forEach(({ size, W, hot, delay, rgba }, i) => {
    tocBuf.writeUInt32LE(0xfffd0002, i * toc); tocBuf.writeUInt32LE(size, i * toc + 4); tocBuf.writeUInt32LE(pos, i * toc + 8);
    const b = Buffer.alloc(chunk + W * W * 4);
    [chunk, 0xfffd0002, size, 1, W, W, hot[0], hot[1], delay].forEach((v, j) => b.writeUInt32LE(v, j * 4));
    for (let p = 0; p < W * W; p++) {
      const [r, g, bl, a] = rgba.subarray(p * 4, p * 4 + 4), m = (v) => Math.round((v * a) / 255);
      b.writeUInt32LE(((a << 24) | (m(r) << 16) | (m(g) << 8) | m(bl)) >>> 0, chunk + p * 4);
    }
    parts.push(b); pos += b.length;
  });
  const header = Buffer.alloc(head);
  header.write('Xcur', 0, 'latin1'); header.writeUInt32LE(head, 4); header.writeUInt32LE(0x10000, 8); header.writeUInt32LE(images.length, 12);
  return Buffer.concat([header, tocBuf, ...parts]);
}

/** Writes the cursor theme into outDir: index.theme, cursors/ (Xcursor) and cursors_scalable/ (Plasma 6 SVG). */
export function writeCursorTheme(outDir, { still = false, fast = false } = {}) {
  const theme = CURSOR_THEMES.find((t) => t.still === still);
  const sizes = fast ? [24, 32] : [24, 32, 48, 64];
  for (const dir of ['cursors', 'cursors_scalable']) rmSync(join(outDir, dir), { recursive: true, force: true });
  mkdirSync(join(outDir, 'cursors'), { recursive: true });
  writeFileSync(join(outDir, 'index.theme'), `[Icon Theme]\nName=${theme.name}\nComment=Smoked glass pointers; ${still
    ? 'the busy pointers hold the innerpulse mark at rest' : 'the busy pointers run the innerpulse mark'}\nInherits=breeze_cursors\n`);

  // each shape as { hot, delay, frames(s) }: frames(null) are the scalable frames, frames(s) a raster's
  const shapes = Object.entries(STATIC).map(([name, [hot, draw]]) => ({ name, hot, delay: 0, frames: () => [draw()] }));
  for (const [name, B] of Object.entries(BUSY)) {
    const runs = still ? [barHeights().map((h) => ({ h, l: 0 }))] : Array.from({ length: B.frames }, (_, f) => B.motion(f / B.frames));
    const frames = (s) => {
      const L = s && pixelLayout(B.at, s);
      return runs.map((bars) => join2(...(B.base ? [B.base()] : []), L ? pixelBars(bars, L) : exactBars(bars, B.at)));
    };
    shapes.push({ name, hot: B.hot, delay: still ? 0 : Math.round((B.period * 1000) / B.frames), frames });
  }

  for (const { name, hot, delay, frames } of shapes) {
    const dir = join(outDir, 'cursors_scalable', name), svgs = frames(null);
    mkdirSync(dir, { recursive: true });
    const meta = svgs.map((p, i) => {
      const filename = svgs.length > 1 ? `${name}-${String(i + 1).padStart(2, '0')}.svg` : `${name}.svg`;
      writeFileSync(join(dir, filename), svgDoc(p));
      return { filename, ...(svgs.length > 1 && { delay }), hotspot_x: hot[0], hotspot_y: hot[1], nominal_size: NOMINAL };
    });
    writeFileSync(join(dir, 'metadata.json'), JSON.stringify(meta, null, 4) + '\n');

    const images = sizes.flatMap((size) => {
      const W = Math.round((CANVAS * size) / NOMINAL), s = W / CANVAS;
      const at = hot.map((v) => Math.min(W - 1, Math.floor(v * s)));
      return rasterize(frames(s), W).map((rgba) => ({ size, W, hot: at, delay: delay || 50, rgba }));
    });
    writeFileSync(join(outDir, 'cursors', name), xcursor(images));
    for (const alias of ALIASES[name] ?? []) for (const sub of ['cursors', 'cursors_scalable']) symlinkSync(name, join(outDir, sub, alias));
  }
}
