// The icon themes: innerpulse for the dark grounds (Carbon, Ink) and innerpulse Light for Paper. They draw the
// objects a file manager shows (places, file types, drives) and a few generic apps in one material, smoked glass,
// plus the busy throbber; everything else, toolbar and action icons above all, is inherited from Breeze, since a
// partial set of actions would put two line styles in one toolbar.
//
// The material, lit from the top everywhere:
//   folder   a back tab in the kind's tint (opaque at the top, fading toward the foot) and a front panel of smoked
//            glass with a sheen falling from its top edge and a hairline rim, the kind's glyph in bright steel
//   file     a smoked-glass page with its folded corner in the tint, the family's glyph in bright steel and, from
//            32 px up, a tint chip with the format's name in a 3 × 5 pixel capital font (drawn as rects, since
//            QtSvg's text depends on installed fonts)
//   device   the same glass as a slab, disc, card or screen, with one tint lamp or line
//   app      a glass tile, a soft pool of tint light under it and a tint line at its foot, the glyph in the tint
// Glyphs share one grammar: a 24-unit grid, centerlines inside 3 … 21, stroke 2 with round caps and joins, no
// fills, straight segments and plain arcs, one idea each. Two rules keep them clear of the brand mark: no glyph is
// a set of bars mirrored about a horizontal axis, and no tile has slots cut through it. Ember is the mark's alone
// and appears in no icon.
//
// Each icon is drawn at four size classes from the same functions with per-size geometry: a detailed one at 64
// (shipped in a scalable directory that serves 48 … 256), a simplified one at 32, and pixel-aligned ones at 22 and
// 16, where every edge is a whole pixel and the glyph is hand-drawn on a 9- or 7-pixel grid with 1 px square-capped
// strokes. The directory layout copies Breeze's coverage size for size (KIconLoader tries an exact size in every
// inherited theme before it settles for a near one, so a gap here would let a Breeze icon through), including the
// @2x/@3x directories, which are links to the 1× ones as in Breeze.
//
// QtSvg renders SVG Tiny 1.2: no filters, masks, blur or text. Glows are radial gradients, shadows too.
//
// The light theme keeps the glass dark (it is smoked glass, and it reads on paper), makes it a little more opaque,
// and gives every tint shape an edge in the tint's paper step, since the bright tints alone are about 1.1:1 on
// #f4f1ec. Its pools of light under app tiles take the paper step, a bright glow being invisible on paper.

import { MARK, PULSE, barHeights, beatBars } from './mark.mjs';
import { n } from './svg.mjs';

export const ICON_THEMES = [
  { id: 'innerpulse', name: 'innerpulse', dark: true, inherits: 'breeze-dark' },
  { id: 'innerpulse-light', name: 'innerpulse Light', dark: false, inherits: 'breeze' },
];

// The brand's family accents: [the bright step for dark grounds and glass, the paper step]. Gold is the bright
// amber of the ANSI set, only for a folder the user colors yellow.
const TINT = {
  steel: ['#b9bdc3', '#575e6b'],
  violet: ['#b38cff', '#6a3fd0'],
  cyan: ['#52e3ff', '#09677e'],
  amber: ['#ffb347', '#8b5109'],
  gold: ['#ffd08a', '#8b5109'],
  mint: ['#7dffb0', '#0d6d3d'],
  blue: ['#7f9fe0', '#2f56b0'],
  red: ['#ff9a8f', '#a3221a'],
};

const STEEL = '#f4f6f8'; // glyphs on glass
const INK = '#0b0d10'; // letters on a tint chip
const SKIN = {
  dark: { glass: [0.84, 0.92], shade: ['#000000', 0.45], edge: false, text: '#e3e6e9' },
  light: { glass: [0.93, 0.97], shade: ['#281e14', 0.3], edge: true, text: '#14171c' },
};

// --- glyphs -------------------------------------------------------------------------------------------------------

// 24-unit stroke glyphs, for 64 and 32 px.
const star = (() => {
  const p = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 3.9 : 8.6;
    p.push(`${n(12 + r * Math.cos(a))} ${n(12.8 + r * Math.sin(a))}`);
  }
  return `M${p.join('L')}z`;
})();
const G = {
  home: 'M4 11.5L12 4l8 7.5M6.5 9.5V20h11V9.5',
  desktop: 'M3.5 4.5h17v11h-17zM12 15.5v4.5M8 20h8',
  doc: 'M7 8h10M7 12h10M7 16h6',
  para: 'M6 6h12M6 10h12M6 14h12M6 18h7',
  download: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14',
  music: 'M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0M19 15.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0',
  image: 'M4 18l5.5-6 4 4.5 2.5-2.5 4 4M15.5 8v.1',
  video: 'M3.5 5.5h17v13h-17zM10 9v6l5-3z',
  template: 'M4 5h16v14H4zM4 9.5h16M10 9.5V19',
  share: 'M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v7h14v-7',
  globe: 'M20.5 12a8.5 8.5 0 1 1-17 0a8.5 8.5 0 1 1 17 0M3.5 12h17M12 3.5c3.2 3.4 3.2 13.6 0 17M12 3.5c-3.2 3.4-3.2 13.6 0 17',
  trash: 'M5 7h14M9.5 7V4.5h5V7M7 7l1 13h8l1-13M10.5 11v5M13.5 11v5',
  trashFull: 'M5 7h14M9.5 7V4.5h5V7M7 7l1 13h8l1-13M9.5 11h5M9.8 14h4.4M10.1 17h3.8',
  star,
  clock: 'M20 12a8 8 0 1 1-16 0a8 8 0 1 1 16 0M12 7.5V12l3 2.5',
  lock: 'M5.5 11h13v9h-13zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2',
  unlock: 'M5.5 11h13v9h-13zM8.5 11V8a3.5 3.5 0 0 1 6.9-.8M12 14.5v2',
  cloud: 'M7.5 18.5h9a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 10.6A4 4 0 0 0 7.5 18.5z',
  code: 'M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5',
  root: 'M15 4L9 20',
  terminal: 'M5 7l5 5-5 5M12.5 17H19',
  zip: 'M12 4v2M12 8.5v2M10 13.5h4v5h-4z',
  box: 'M4 8l8-4 8 4v8.5L12 20.5 4 16.5zM4 8l8 4 8-4M12 12v8.5',
  sheet: 'M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14',
  slides: 'M3.5 4.5h17M5 4.5v10h14v-10M12 14.5v5.5M8.5 20h7M8.5 11.5l2.5-2.5 2 2 2.5-2.5',
  font: 'M5.5 20L12 4l6.5 16M8 14h8',
  gear: 'M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9L18 18M6 18l2.1-2.1M15.9 8.1L18 6M15.5 12a3.5 3.5 0 1 1-7 0a3.5 3.5 0 1 1 7 0',
  question: 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.3-1.5 2.4v.5M12 18.5v.1',
  search: 'M17 10.5a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M15.2 15.2L20.5 20.5',
  settings: 'M6 4v9M6 17v3M12 4v2.5M12 10.5V20M18 4v6.5M18 14.5V20M8 15a2 2 0 1 1-4 0a2 2 0 1 1 4 0M14 8.5a2 2 0 1 1-4 0a2 2 0 1 1 4 0M20 12.5a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
  pencil: 'M4.5 19.5l1-4.5L15.5 5l3.5 3.5-10 10zM13.5 7l3.5 3.5',
  install: 'M12 3.5v10M8 9.5l4 4 4-4M4.5 15v4.5h15V15',
  calc: 'M6.5 3.5h11v17h-11zM9.5 7.5h5M9.5 12v.1M12 12v.1M14.5 12v.1M9.5 16v.1M12 16v.1M14.5 16v.1',
  chart: 'M4 20h16M4.5 15.5l4-5 3.5 3 4.5-6.5 3.5 4.5',
  mail: 'M4 6h16v12H4zM4.5 6.5L12 12.5l7.5-6',
  folder: 'M4 7h6l2 2.5h8V19H4z',
  eject: 'M12 6l6 7H6zM6 17.5h12',
};

// Pixel glyphs for 22 px (a 9-pixel grid) and 16 px (7 pixels): `d` is 1 px strokes through pixel centers (cell
// coordinates, square caps), `dots` are filled cells [x, y, w, h]. Hand-simplified: fewer details, whole pixels.
const P9 = {
  home: { d: 'M0 4L4 0L8 4M1 3V8H7V3' },
  desktop: { d: 'M0 0H8V5H0ZM4 6V8M2 8H6' },
  doc: { d: 'M0 1H8M0 4H8M0 7H5' },
  para: { d: 'M0 1H8M0 3H8M0 5H8M0 7H5' },
  download: { d: 'M4 0V6M1 3L4 6L7 3M0 8H8' },
  music: { d: 'M3 7V0H8V6M3 1H8', dots: [[0, 6, 3, 3], [5, 5, 3, 3]] },
  image: { d: 'M0 8L3 5L6 8M5 7L6 6L8 8', dots: [[6, 1, 2, 2]] },
  video: { d: 'M0 1H8V7H0ZM3 3V5L4 4Z', dots: [[3, 3, 1, 3]] },
  template: { d: 'M0 0H8V8H0ZM0 3H8M3 3V8' },
  share: { d: 'M4 6V0M1 3L4 0L7 3M0 5V8H8V5' },
  globe: { d: 'M3 0H5L8 3V5L5 8H3L0 5V3ZM0 4H8M4 0V8' },
  trash: { d: 'M0 1H8M3 0H5M1 2V8H7V2M3 4V6M5 4V6' },
  trashFull: { d: 'M0 1H8M3 0H5M1 2V8H7V2', dots: [[2, 3, 5, 5]] },
  star: { d: 'M4 0L5 3H8L6 5L7 8L4 6L1 8L2 5L0 3H3Z' },
  clock: { d: 'M3 0H5L8 3V5L5 8H3L0 5V3ZM4 2V4H6' },
  lock: { d: 'M0 4H8V8H0ZM2 4V1L3 0H5L6 1V4', dots: [[4, 5, 1, 2]] },
  unlock: { d: 'M0 4H8V8H0ZM2 4V1L3 0H5L6 1V2', dots: [[4, 5, 1, 2]] },
  cloud: { d: 'M1 7H7L8 6V5L7 4H6V3L5 2H3L2 3V4H1L0 5V6Z' },
  code: { d: 'M2 2L0 4L2 6M6 2L8 4L6 6M5 0L3 8' },
  root: { d: 'M6 0L2 8' },
  terminal: { d: 'M0 1L3 4L0 7M4 7H8' },
  zip: { d: 'M3 5H5V8H3Z', dots: [[4, 0, 1, 1], [3, 1, 1, 1], [4, 2, 1, 1], [3, 3, 1, 1]] },
  box: { d: 'M4 0L8 2V6L4 8L0 6V2ZM0 2L4 4L8 2M4 4V8' },
  sheet: { d: 'M0 1H8V7H0ZM0 3H8M0 5H8M3 1V7' },
  slides: { d: 'M0 0H8M1 0V5H7V0M4 6V8M2 8H6' },
  font: { d: 'M0 8L4 0L8 8M2 5H6' },
  gear: { d: 'M3 3H5V5H3ZM4 0V1M4 7V8M0 4H1M7 4H8M1 1L2 2M7 1L6 2M1 7L2 6M7 7L6 6' },
  question: { d: 'M1 2V1L2 0H6L7 1V3L6 4H4V6', dots: [[4, 8, 1, 1]] },
  search: { d: 'M1 0H4L5 1V4L4 5H1L0 4V1ZM5 5L8 8' },
  settings: { d: 'M1 0V3M1 7V8M0 4H2V6H0ZM3 0H5V2H3ZM4 3V8M7 0V4M6 5H8V7H6Z', dots: [[7, 8, 1, 1]] },
  pencil: { d: 'M0 8V6L6 0L8 2L2 8ZM5 1L7 3' },
  install: { d: 'M4 0V5M2 3L4 5L6 3M0 6V8H8V6' },
  calc: { d: 'M1 0H7V8H1ZM3 2H5', dots: [[3, 4, 1, 1], [5, 4, 1, 1], [3, 6, 1, 1], [5, 6, 1, 1]] },
  chart: { d: 'M0 8H8M0 6L3 3L5 5L8 1' },
  mail: { d: 'M0 1H8V7H0ZM1 2L4 4L7 2' },
  folder: { d: 'M0 1H3L4 2H8V7H0Z' },
  eject: { d: 'M0 5L4 1L8 5ZM0 7H8' },
};
const P7 = {
  home: { d: 'M0 3L3 0L6 3M1 3V6H5V3' },
  desktop: { d: 'M0 0H6V4H0ZM3 5V6M1 6H5' },
  doc: { d: 'M0 1H6M0 3H6M0 5H3' },
  para: { d: 'M0 0H6M0 2H6M0 4H6M0 6H3' },
  download: { d: 'M3 0V4M1 2L3 4L5 2M0 6H6' },
  music: { d: 'M2 4V0H6V3', dots: [[0, 4, 2, 2], [4, 3, 2, 2]] },
  image: { d: 'M0 6L2 4L4 6M4 5L5 4L6 5', dots: [[4, 0, 2, 2]] },
  video: { d: 'M1 0L6 3L1 6Z' },
  template: { d: 'M0 0H6V6H0ZM0 2H6M2 2V6' },
  share: { d: 'M3 4V0M1 2L3 0L5 2M0 4V6H6V4' },
  globe: { d: 'M2 0H4L6 2V4L4 6H2L0 4V2ZM0 3H6M3 0V6' },
  trash: { d: 'M0 1H6M2 0H4M1 2V6H5V2M3 3V5' },
  trashFull: { d: 'M0 1H6M2 0H4M1 2V6H5V2', dots: [[2, 3, 3, 3]] },
  star: { d: 'M3 0L4 2H6L5 4L5 6L3 5L1 6L1 4L0 2H2Z' },
  clock: { d: 'M2 0H4L6 2V4L4 6H2L0 4V2ZM3 1V3H5' },
  lock: { d: 'M0 3H6V6H0ZM1 3V1L2 0H4L5 1V3', dots: [[3, 4, 1, 1]] },
  unlock: { d: 'M0 3H6V6H0ZM1 3V1L2 0H4L5 1', dots: [[3, 4, 1, 1]] },
  cloud: { d: 'M1 5H5L6 4V3L5 2H4L3 1H2L1 2V3L0 4Z' },
  code: { d: 'M1 2L0 3L1 4M5 2L6 3L5 4M4 0L2 6' },
  root: { d: 'M4 0L2 6' },
  terminal: { d: 'M0 1L2 3L0 5M3 5H6' },
  zip: { d: 'M2 4H4V6H2Z', dots: [[3, 0, 1, 1], [2, 1, 1, 1], [3, 2, 1, 1]] },
  box: { d: 'M3 0L6 2V5L3 6L0 5V2ZM0 2L3 3L6 2M3 3V6' },
  sheet: { d: 'M0 0H6V6H0ZM0 2H6M0 4H6M2 0V6' },
  slides: { d: 'M0 0H6M1 0V4H5V0M3 4V6M1 6H5' },
  font: { d: 'M0 6L3 0L6 6M1 4H5' },
  gear: { d: 'M2 2H4V4H2ZM3 0V1M3 5V6M0 3H1M5 3H6', dots: [[1, 1, 1, 1], [5, 1, 1, 1], [1, 5, 1, 1], [5, 5, 1, 1]] },
  question: { d: 'M1 1L2 0H4L5 1V2L3 3V4', dots: [[3, 6, 1, 1]] },
  search: { d: 'M1 0H3L4 1V3L3 4H1L0 3V1ZM4 4L6 6' },
  settings: { d: 'M1 0V1M0 2H2V4H0ZM1 5V6M5 0V3M4 4H6V6H4Z' },
  pencil: { d: 'M0 6V4L4 0L6 2L2 6ZM3 1L5 3' },
  install: { d: 'M3 0V3M1 1L3 3L5 1M0 4V6H6V4' },
  calc: { d: 'M1 0H5V6H1ZM2 2H4', dots: [[2, 4, 1, 1], [4, 4, 1, 1]] },
  chart: { d: 'M0 6H6M0 4L2 2L3 3L6 0' },
  mail: { d: 'M0 1H6V5H0ZM1 2L3 3L5 2' },
  folder: { d: 'M0 1H2L3 2H6V6H0Z' },
  eject: { d: 'M0 4L3 1L6 4ZM0 6H6' },
};

// The chip's capitals, 3 × 5 cells each.
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101',
  L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101',
  X: '101101010101101', Y: '101101010010010', Z: '111001010100111', 3: '110001010001110', 4: '101101111001001', 7: '111001010010010',
};
const labelWidth = (s) => s.length * 4 - 1;
function letters(s, x, y, u) {
  let d = '';
  [...s].forEach((ch, i) => {
    const bits = FONT[ch];
    if (!bits) throw new Error(`icons: no glyph for "${ch}" in the chip font`);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if (bits[r * 3 + c] !== '1' || (c && bits[r * 3 + c - 1] === '1')) continue;
        let w = 1;
        while (c + w < 3 && bits[r * 3 + c + w] === '1') w++;
        d += `M${n(x + (i * 4 + c) * u)} ${n(y + r * u)}h${n(w * u)}v${n(u)}h${n(-w * u)}z`;
      }
    }
  });
  return d;
}

// --- size classes -------------------------------------------------------------------------------------------------

// Per-size geometry. Vector glyphs are placed by center and scale with a stroke in px; pixel glyphs by top-left cell.
// Folder: back x0…x1 from `top` (the tab, to t0 then sloping to t1 at `body`) down to `bot`; front ft…fb.
// File: page x0…x1, y0…y1, fold `fold`; glyph with and without a chip. Tile: x, y, w (square), r.
const CLS = {
  64: {
    S: 64, px: 0, lip: true,
    folder: { x0: 6, x1: 58, top: 11, t0: 24, t1: 29, body: 17, bot: 54, rb: 4, ft: 23, fb: 56, rf: 5, g: { cx: 32, cy: 39.5, s: 0.95, w: 1.75 } },
    file: { x0: 11, x1: 51, y0: 6, y1: 58, fold: 12, r: 4, g: { cx: 31, cy: 36, s: 1.05, w: 1.8 }, gl: { cx: 31, cy: 29.5, s: 0.9, w: 1.7 }, chip: { y: 45, h: 7, u: 1, pad: 2 } },
    tile: { x: 7, y: 6, w: 50, r: 9, g: { cx: 32, cy: 31, s: 1.15, w: 2.2 }, foot: 1.6 },
  },
  32: {
    S: 32, px: 0, lip: true,
    folder: { x0: 3, x1: 29, top: 5, t0: 12, t1: 15, body: 8, bot: 27, rb: 2, ft: 11, fb: 28, rf: 2.5, g: { cx: 16, cy: 19.5, s: 0.5, w: 1.5 } },
    file: { x0: 5, x1: 26, y0: 3, y1: 29, fold: 7, r: 2, g: { cx: 15.5, cy: 17.5, s: 0.55, w: 1.5 }, gl: { cx: 15.5, cy: 14, s: 0.45, w: 1.4 }, chip: { y: 20, h: 7, u: 1, pad: 1 } },
    tile: { x: 3, y: 2, w: 26, r: 4.5, g: { cx: 16, cy: 15, s: 0.62, w: 1.6 }, foot: 1 },
  },
  22: {
    S: 22, px: 9,
    folder: { x0: 1, x1: 20, top: 2, t0: 8, t1: 10, body: 4, bot: 20, rb: 1.5, ft: 8, fb: 21, rf: 1.5, g: { x: 6, y: 10 } },
    file: { x0: 3, x1: 18, y0: 1, y1: 21, fold: 5, r: 1.5, g: { x: 6, y: 8 }, bar: { y: 18, w: 9 } },
    tile: { x: 2, y: 1, w: 17, r: 3, g: { x: 6, y: 5 }, foot: 1 },
  },
  16: {
    S: 16, px: 7,
    folder: { x0: 1, x1: 14, top: 1, t0: 6, t1: 8, body: 3, bot: 15, rb: 1, ft: 5, fb: 16, rf: 1, g: { x: 4, y: 7 } },
    file: { x0: 2, x1: 15, y0: 0, y1: 16, fold: 4, r: 1, g: { x: 5, y: 5 }, bar: { y: 13, w: 7 } },
    tile: { x: 1, y: 1, w: 13, r: 2, g: { x: 4, y: 4 }, foot: 1 },
  },
};
const SIZES = [64, 32, 22, 16];

// --- painting -----------------------------------------------------------------------------------------------------

const rr = (x, y, w, h, r) => (r > 0
  ? `M${n(x + r)} ${n(y)}h${n(w - 2 * r)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}v${n(h - 2 * r)}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}h${n(-(w - 2 * r))}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(-r)}v${n(-(h - 2 * r))}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(-r)}z`
  : `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`);
const stop = (o, c, a) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`;
const lin = (id, ...stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.join('')}</linearGradient>`;
const rad = (id, c, a) => `<radialGradient id="${id}">${stop(0, c, a)}${stop(0.55, c, a * 0.45)}${stop(1, c, 0)}</radialGradient>`;

// The gradients every glass icon uses: g the glass, s its sheen, r the rim (bright at the top edge, faint at the
// foot: light from above), t the tint (opaque at the top), h the shade under an object, w the pool of tint light.
function defs(sk, tint, small) {
  const [bright, deep] = TINT[tint];
  return `<defs>${lin('g', stop(0, '#3a414b', sk.glass[0]), stop(1, '#14171b', sk.glass[1]))}` +
    lin('s', stop(0, '#ffffff', small ? 0.2 : 0.28), stop(0.5, '#ffffff', 0)) +
    lin('r', stop(0, '#ffffff', small ? 0.42 : 0.5), stop(0.35, '#ffffff', 0.18), stop(1, '#ffffff', 0.07)) +
    lin('t', stop(0, bright, 0.97), stop(1, bright, sk.edge ? 0.7 : 0.45)) +
    rad('h', sk.shade[0], sk.shade[1]) + rad('w', sk.edge ? deep : bright, sk.edge ? 0.38 : 0.5) + '</defs>';
}

const doc = (S, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${body}</svg>\n`;
// a glass body: fill, sheen and rim, the rim inset half a pixel so it lands on a whole one
const glass = (d, dIn, extra = '') => `<path d="${d}" fill="url(#g)"${extra}/><path d="${dIn}" fill="url(#s)" stroke="url(#r)"/>`;
const glassRR = (x, y, w, h, r) => glass(rr(x, y, w, h, r), rr(x + 0.5, y + 0.5, w - 1, h - 1, Math.max(0, r - 0.5)));
const shadeUnder = (cx, cy, rx, ry) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#h)"/>`;

function glyph(c, name, g, color) {
  if (!name) return '';
  if (c.px) {
    const P = (c.px === 9 ? P9 : P7)[name];
    if (!P) throw new Error(`icons: no ${c.px}-pixel glyph "${name}"`);
    const dots = (P.dots ?? []).map(([x, y, w, h]) => `M${g.x + x} ${g.y + y}h${w}v${h}h${-w}z`).join('');
    return `<path transform="translate(${n(g.x + 0.5)} ${n(g.y + 0.5)})" d="${P.d}" fill="none" stroke="${color}" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter"/>` +
      (dots ? `<path d="${dots}" fill="${color}"/>` : '');
  }
  if (!G[name]) throw new Error(`icons: no glyph "${name}"`);
  return `<path transform="translate(${n(g.cx - 12 * g.s)} ${n(g.cy - 12 * g.s)}) scale(${g.s})" d="${G[name]}" fill="none" stroke="${color}" stroke-width="${n(g.w / g.s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// --- the four kinds -----------------------------------------------------------------------------------------------

function folderIcon(c, sk, { tint, glyph: gn, open }) {
  const F = c.folder, [, deep] = TINT[tint], r = F.rb;
  const back = `M${F.x0} ${F.top + r}a${r} ${r} 0 0 1 ${r} ${-r}H${F.t0}L${F.t1} ${F.body}H${F.x1 - r}a${r} ${r} 0 0 1 ${r} ${r}V${F.bot - r}a${r} ${r} 0 0 1 ${-r} ${r}H${F.x0 + r}a${r} ${r} 0 0 1 ${-r} ${-r}z`;
  const edge = sk.edge ? ` stroke="${deep}" stroke-opacity=".8"` : '';
  // on paper the tab's edge is a hairline drawn inside it, so it stays on whole pixels
  const backIn = `M${F.x0 + 0.5} ${F.top + r}a${r - 0.5} ${r - 0.5} 0 0 1 ${r - 0.5} ${0.5 - r}H${F.t0 - 0.2}L${F.t1 - 0.2} ${F.body + 0.5}H${F.x1 - r}a${r - 0.5} ${r - 0.5} 0 0 1 ${r - 0.5} ${r - 0.5}V${F.bot - r}`;
  let out = c.lip ? shadeUnder((F.x0 + F.x1) / 2, F.fb - 0.5, (F.x1 - F.x0) * 0.52, c.S * 0.06) : '';
  out += `<path d="${back}" fill="url(#t)"/>`;
  out += sk.edge ? `<path d="${backIn}" fill="none"${edge}/>` : '';
  // the tab's lip: light catching its top edge
  if (c.lip) out += `<path d="M${F.x0 + r} ${F.top + 0.5}H${F.t0 - 0.5}" stroke="#ffffff" stroke-opacity=".55" stroke-linecap="round"/>`;
  if (open) {
    // an open folder: a sheet stands up from the back and the front flap leans out toward the viewer
    const k = Math.round((F.x1 - F.x0) * 0.1), sh = F.body + (c.px ? 0 : 1);
    out += `<path d="${rr(F.x0 + k + 1, sh, F.x1 - F.x0 - 2 * k - 2, F.fb - sh - 2, c.px ? 0 : 1)}" fill="#d5d9de" fill-opacity=".62"/>`;
    const y0 = F.ft + (c.px ? 2 : Math.round((F.fb - F.ft) * 0.12));
    const fl = `M${F.x0 + k} ${y0}H${F.x1}L${F.x1 - k} ${F.fb}H${F.x0}z`;
    const fi = `M${F.x0 + k + 0.6} ${y0 + 0.5}H${F.x1 - 0.7}L${F.x1 - k - 0.4} ${F.fb - 0.5}H${F.x0 + 0.7}z`;
    return out + `<path d="${fl}" fill="url(#g)"/><path d="${fi}" fill="url(#s)" stroke="url(#r)" stroke-linejoin="round"/>`;
  }
  out += glassRR(F.x0, F.ft, F.x1 - F.x0, F.fb - F.ft, F.rf);
  return out + glyph(c, gn, F.g, STEEL);
}

function fileIcon(c, sk, { tint, glyph: gn, label }) {
  const P = c.file, [bright, deep] = TINT[tint], r = P.r, f = P.fold;
  const page = (i) => `M${n(P.x0 + r)} ${n(P.y0 + i)}H${n(P.x1 - f - i * 0.4)}L${n(P.x1 - i)} ${n(P.y0 + f + i * 0.4)}V${n(P.y1 - r)}a${n(r - i)} ${n(r - i)} 0 0 1 ${n(i - r)} ${n(r - i)}H${n(P.x0 + r)}a${n(r - i)} ${n(r - i)} 0 0 1 ${n(i - r)} ${n(i - r)}V${n(P.y0 + r)}a${n(r - i)} ${n(r - i)} 0 0 1 ${n(r - i)} ${n(i - r)}z`;
  let out = c.lip ? shadeUnder((P.x0 + P.x1) / 2, P.y1 - 0.5, (P.x1 - P.x0) * 0.55, c.S * 0.05) : '';
  out += glass(page(0), page(0.5), '');
  // the fold: the corner turned down, in the tint, its crease shaded
  const fr = Math.min(r * 1.5, f / 3);
  const fold = `M${P.x1 - f} ${P.y0}V${n(P.y0 + f - fr)}a${n(fr)} ${n(fr)} 0 0 0 ${n(fr)} ${n(fr)}H${P.x1}z`;
  out += `<path d="${fold}" fill="${bright}" fill-opacity=".9"${sk.edge ? ` stroke="${deep}" stroke-opacity=".8" stroke-width=".8" stroke-linejoin="round"` : ''}/>`;
  if (!c.px && label) {
    const C = P.chip, w = labelWidth(label) * C.u + 2 * C.pad, x = Math.round((P.x0 + P.x1) / 2 - w / 2);
    out += `<path d="${rr(x, C.y, w, C.h, c.S >= 64 ? 2 : 1.5)}" fill="${bright}" fill-opacity=".95"/>`;
    out += `<path d="${letters(label, x + C.pad, C.y + (C.h - 5 * C.u) / 2, C.u)}" fill="${INK}"/>`;
    return out + glyph(c, gn, P.gl, STEEL);
  }
  // under 32 px no letters: the chip is a plain tint bar under the glyph
  if (c.px) out += `<path d="M${n(P.x0 + (P.x1 - P.x0 - P.bar.w) / 2)} ${P.bar.y}h${P.bar.w}v1h${-P.bar.w}z" fill="${bright}"/>`;
  return out + glyph(c, gn, P.g, STEEL);
}

function tileIcon(c, sk, { tint, glyph: gn }) {
  const T = c.tile, [bright] = TINT[tint], foot = T.y + T.w;
  let out = `<ellipse cx="${n(T.x + T.w / 2)}" cy="${n(foot - (c.px ? 0 : 1))}" rx="${n(T.w * 0.46)}" ry="${n(Math.max(2, T.w * 0.13))}" fill="url(#w)"/>`;
  out += glassRR(T.x, T.y, T.w, T.w, T.r);
  // the line at its foot: tint light caught in the glass's bottom edge
  const inset = c.px ? Math.round(T.r) + 1 : T.r * 0.8;
  if (c.px) out += `<path d="M${T.x + inset} ${foot - 1}h${T.w - 2 * inset}v1h${-(T.w - 2 * inset)}z" fill="${bright}"/>`;
  else out += `<path d="M${n(T.x + inset)} ${n(foot - T.foot / 2 - 0.3)}H${n(T.x + T.w - inset)}" stroke="${bright}" stroke-width="${T.foot}" stroke-linecap="round" stroke-opacity=".95"/>`;
  return out + glyph(c, gn, T.g, bright);
}

// Devices are drawn on the 64 grid and laid on each size's pixel grid by rounding (whole pixels under 64), with the
// details dropped that would not survive: the lamp's glow, screws and seams under 32.
function deviceIcon(c, sk, { tint, shape }) {
  const S = c.S, k = S / 64, small = S < 32;
  const q = (v) => (S === 64 ? v : Math.round(v * k));
  const box = (x, y, w, h) => [q(x), q(y), q(x + w) - q(x), q(y + h) - q(y)];
  const rad = (r) => (S === 64 ? r : Math.max(small ? 1 : 1.5, Math.round(r * k * 2) / 2));
  const [bright, deep] = TINT[tint];
  const slab = (x, y, w, h, r) => { const [X, Y, W, H] = box(x, y, w, h); return glassRR(X, Y, W, H, rad(r)); };
  const lamp = (x, y, w, h) => {
    const [X, Y, W, H] = box(x, y, w, h);
    const glow = small ? '' : `<ellipse cx="${n(X + W / 2)}" cy="${n(Y + H / 2)}" rx="${n(W * 1.3)}" ry="${n(H * 2.2)}" fill="url(#w)"/>`;
    return glow + `<path d="${rr(X, Y, Math.max(1, W), Math.max(1, H), small ? 0 : Math.min(W, H) / 2)}" fill="${bright}"/>`;
  };
  const screen = (x, y, w, h, r) => {
    const [X, Y, W, H] = box(x, y, w, h);
    return `<path d="${rr(X, Y, W, H, small ? 0 : rad(r))}" fill="#07080a" fill-opacity=".85"/>` +
      `<path d="${rr(X, Y, W, H * 0.55, small ? 0 : rad(r))}" fill="${bright}" fill-opacity="${small ? 0.22 : 0.16}"/>` +
      `<path d="M${X} ${Y + H - 0.5}h${W}" stroke="#ffffff" stroke-opacity=".12"/>`;
  };
  const metal = (x, y, w, h, r) => {
    const [X, Y, W, H] = box(x, y, w, h);
    return `<path d="${rr(X, Y, W, H, small ? 0 : rad(r))}" fill="#b9bdc3"/><path d="M${X} ${Y + 0.5}h${W}" stroke="#ffffff" stroke-opacity=".7"/>` +
      `<path d="M${X} ${Y + H - 0.5}h${W}" stroke="#5d636c"/>`;
  };
  const shade = (cx, cy, rx, ry) => (small ? '' : shadeUnder(cx * k, cy * k, rx * k, ry * k));
  let out = '';
  switch (shape) {
    case 'disk': // a drive: a low slab with a seam and a lamp
      out += shade(32, 50, 28, 4) + slab(5, 15, 54, 35, 5);
      if (!small) out += `<path d="M${q(9)} ${q(38) + 0.5}H${q(55)}" stroke="#ffffff" stroke-opacity=".12"/>`;
      out += lamp(46, 42, 7, small ? 4 : 2.5);
      break;
    case 'removable': // a slab with the eject glyph
      out += shade(32, 50, 26, 4) + slab(8, 12, 48, 38, 5);
      out += glyphOn(c, 'eject', S === 64 ? { cx: 32, cy: 30, s: 1.05, w: 1.7 } : S === 32 ? { cx: 16, cy: 15.5, s: 0.55, w: 1.5 } : { x: S === 22 ? 6 : 4, y: S === 22 ? 4 : 3 });
      out += lamp(46, 43, 6, small ? 4 : 2);
      break;
    case 'usb': // a stick: glass body, a steel plug
      out += shade(30, 46, 26, 4) + metal(44, 24, 16, 16, 1.5) + slab(4, 18, 42, 28, 5);
      if (!small) out += `<path d="${rr(q(50), q(28), q(4), q(3), 0.5)}${rr(q(50), q(33), q(4), q(3), 0.5)}" fill="#2b3037"/>`;
      out += lamp(10, 38, 7, small ? 4 : 2.5);
      break;
    case 'disc': { // an optical disc, a ring of glass round its hub, a tint track
      const R = S === 64 ? 27 : S === 32 ? 13.5 : S === 22 ? 9.5 : 7, h = S === 64 ? 5 : S === 32 ? 3 : 2, cx = S / 2;
      const ring = (a, b) => `M${n(cx - a)} ${n(cx)}a${a} ${a} 0 1 1 ${2 * a} 0a${a} ${a} 0 1 1 ${-2 * a} 0zM${n(cx - b)} ${n(cx)}a${b} ${b} 0 1 0 ${2 * b} 0a${b} ${b} 0 1 0 ${-2 * b} 0z`;
      out += shade(32, 58, 22, 3.5);
      out += `<path d="${ring(R, h)}" fill="url(#g)" fill-rule="evenodd"/><path d="${ring(R - 0.5, h + 0.5)}" fill="url(#s)" fill-rule="evenodd" stroke="url(#r)"/>`;
      const tr = R * 0.6;
      out += `<path d="M${n(cx - tr)} ${n(cx)}a${n(tr)} ${n(tr)} 0 1 1 ${n(2 * tr)} 0a${n(tr)} ${n(tr)} 0 1 1 ${n(-2 * tr)} 0" fill="none" stroke="${bright}" stroke-opacity=".85" stroke-width="${S === 64 ? 1.6 : 1}"/>`;
      if (!small) out += `<path d="M${n(cx - R * 0.78)} ${n(cx - R * 0.3)}A${n(R * 0.83)} ${n(R * 0.83)} 0 0 1 ${n(cx - R * 0.3)} ${n(cx - R * 0.78)}" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="${S === 64 ? 1.6 : 1}" stroke-linecap="round"/>`;
      break;
    }
    case 'card': { // a memory card: portrait, one corner cut, a tint label at its foot
      const [X, Y, W, H] = box(16, 5, 32, 54), cut = q(9), r = rad(3);
      const card = (i) => `M${n(X + i)} ${n(Y + cut + 0.4 * i)}V${n(Y + H - r)}a${n(r - i)} ${n(r - i)} 0 0 0 ${n(r - i)} ${n(r - i)}H${n(X + W - r)}a${n(r - i)} ${n(r - i)} 0 0 0 ${n(r - i)} ${n(i - r)}V${n(Y + i + 0.4 * i)}H${n(X + cut + 0.4 * i)}L${n(X + i)} ${n(Y + cut + 0.4 * i)}z`;
      out += shade(32, 59, 18, 3) + glass(card(0), card(0.5));
      const [lx, ly, lw, lh] = box(21, 41, 22, 12);
      out += `<path d="${rr(lx, ly, lw, lh, small ? 0 : rad(1.5))}" fill="${bright}" fill-opacity=".9"/>`;
      if (!small) out += `<path d="M${q(36)} ${q(10)}V${q(20)}" stroke="#ffffff" stroke-opacity=".2" stroke-width="${S === 64 ? 2 : 1}"/>`;
      break;
    }
    case 'phone': // a portrait slab, a dark screen lit in the tint, a tint line at its foot
      out += shade(32, 59, 16, 3) + slab(17, 4, 30, 56, 6) + screen(20, 10, 24, 42, 2);
      out += `<path d="${rr(q(27), q(55), q(37) - q(27), Math.max(1, q(2)), small ? 0 : 0.5)}" fill="${bright}"/>`;
      break;
    case 'monitor': // a screen on a steel stand
      out += shade(32, 58, 18, 3) + metal(29, 44, 6, 9, 0) + slab(18, 52, 28, 5, 2);
      out += slab(4, 8, 56, 37, 4) + screen(8, 12, 48, 29, 1.5);
      break;
    case 'laptop': // a screen above a glass deck
      out += shade(32, 54, 30, 3) + slab(10, 11, 44, 33, 4) + screen(14, 15, 36, 25, 1.5);
      out += slab(3, 44, 58, 7, 2.5);
      if (!small) out += `<path d="M${q(26)} ${q(44) + 0.5}H${q(38)}" stroke="${bright}" stroke-opacity=".8" stroke-linecap="round"/>`;
      break;
    default: throw new Error(`icons: no device shape "${shape}"`);
  }
  return out;
}
const glyphOn = (c, name, g) => glyph(c, name, g, STEEL);

const KIND = { folder: folderIcon, file: fileIcon, tile: tileIcon, device: deviceIcon };
function draw(size, sk, spec) {
  const c = CLS[size];
  return doc(c.S, defs(sk, spec.tint, !!c.px) + KIND[spec.kind](c, sk, spec));
}

// --- the throbber -------------------------------------------------------------------------------------------------

// process-working, as Breeze ships it: one SVG per size holding a vertical strip of square frames, frame k at
// y = k·size, read top to bottom and looped. 15 frames, Breeze's count, so it keeps the stock throbber's pace in
// whatever timer an app runs it with. The bars are the small mark running the Beat: one pulse of beatBars(), from
// the moment it reaches the first bar until the last has settled, plus a short rest. The Beat's long idle stretch
// is cut, because a busy indicator that stands still for two seconds reads as stalled.
//
// Laid on whole pixels like the panel icons (build.mjs): at 22 px bars 2 wide with 1 px gaps (17 px, near the
// master's bar-to-gap ratio), at 16 px 1 and 1 (11 px; 2 and 1 would be 17 px, and 1 and 2 ties bar 2 with the
// echo). Heights scale with the chosen width and keep the frame's parity so every bar centers on the middle row.
// One flat color, ColorScheme-Text: inside an app this is an indicator, and it follows the scheme.
const FRAMES = 15, REST = 0.06;
const SWEEP = PULSE.width + MARK.beat * PULSE.lag + REST; // the span of the period one strip covers
const THROB = { 16: { bar: 1, gap: 1 }, 22: { bar: 2, gap: 1 } };

function throbber(N, sk) {
  const { bar, gap } = THROB[N], width = 6 * bar + 5 * gap, x0 = Math.floor((N - width) / 2);
  const k = width / (2 * MARK.span + MARK.stroke);
  const px = (h) => 2 * Math.round(((2 * h + MARK.stroke) * k - (N % 2)) / 2) + (N % 2);
  const rest = barHeights().map(px), [a, b, c, d, e, f] = rest;
  if (!(b > e && e > c && c > d && d > a && a === f && a > 0)) throw new Error(`icons: the throbber at ${N} px broke the beat's order (${rest})`);
  let rects = '';
  for (let fr = 0; fr < FRAMES; fr++) {
    const hs = beatBars((fr / FRAMES) * SWEEP).map(({ h }) => px(h));
    if (Math.max(...hs) > N) throw new Error(`icons: the throbber at ${N} px outgrows its frame`);
    rects += hs.map((h, i) => `M${x0 + i * (bar + gap)} ${fr * N + (N - h) / 2}h${bar}v${h}h${-bar}z`).join('');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N * FRAMES}" viewBox="0 0 ${N} ${N * FRAMES}">` +
    `<style id="current-color-scheme" type="text/css">.ColorScheme-Text { color: ${sk.text}; }</style>` +
    `<path class="ColorScheme-Text" d="${rects}" fill="currentColor"/></svg>\n`;
}

// --- what is drawn ------------------------------------------------------------------------------------------------

// name: [glyph, tint, extra aliases]. Aliases are the names Breeze links to the same drawing (less its -symbolic
// names, which must stay monochrome, and app names), plus a few of the same meaning that Breeze draws separately.
const PLACES = {
  folder: [null, 'steel', 'stock_folder folder-grey folder-gray'],
  'folder-open': ['open', 'steel', ''],
  'user-home': ['home', 'violet', 'folder-home'],
  'user-desktop': ['desktop', 'violet', 'desktop folder-desktop'],
  'folder-documents': ['doc', 'blue', 'document-multiple folder-text folder-txt'],
  'folder-download': ['download', 'cyan', 'folder-downloads'],
  'folder-music': ['music', 'amber', 'folder-sound library-music'],
  'folder-pictures': ['image', 'mint', 'folder-image folder-images folder-picture'],
  'folder-videos': ['video', 'mint', 'folder-video'],
  'folder-templates': ['template', 'blue', ''],
  'folder-publicshare': ['share', 'cyan', 'folder-public'],
  'folder-network': ['globe', 'cyan', 'network-workgroup network-server folder-remote'],
  'folder-favorites': ['star', 'amber', 'favorites'],
  'folder-temp': ['clock', 'steel', 'folder-recent'],
  'folder-locked': ['lock', 'steel', 'folder-encrypted'],
  'folder-unlocked': ['unlock', 'steel', 'folder-decrypted'],
  'folder-cloud': ['cloud', 'cyan', 'folder-dropbox folder-onedrive folder-owncloud'],
  'folder-development': ['code', 'mint', 'folder-script'],
  'folder-root': ['root', 'steel', ''],
  'user-trash': ['trash', 'steel', ''],
  'user-trash-full': ['trashFull', 'steel', ''],
  'folder-blue': [null, 'blue', ''],
  'folder-violet': [null, 'violet', ''],
  'folder-cyan': [null, 'cyan', ''],
  'folder-green': [null, 'mint', ''],
  'folder-orange': [null, 'amber', ''],
  'folder-yellow': [null, 'gold', ''],
  'folder-red': [null, 'red', ''],
};

// File types: the generic family (no chip) and its common formats (a chip with the format's name). Under 32 px a
// format has no chip and is drawn exactly as its family, so it is a link there.
const MIME = {
  'text-x-generic': ['doc', 'blue', null, 'text-x-plain text-x-log text-x-katefilelist text-x-lilypond application-x-zerosize'],
  'text-plain': ['doc', 'blue', 'TXT', ''],
  'text-markdown': ['doc', 'blue', 'MD', 'text-x-markdown'],
  'text-x-script': ['code', 'mint', null, 'application-x-awk application-x-executable-script text-x-objcsrc text-x-chdr text-x-c++src text-x-c++hdr text-x-java text-x-makefile application-xml text-xml'],
  'application-x-shellscript': ['terminal', 'mint', 'SH', 'text-x-sh application-x-sh'],
  'text-x-python': ['code', 'mint', 'PY', 'text-x-python2 text-x-python3'],
  'application-javascript': ['code', 'mint', 'JS', 'application-x-javascript text-javascript text-x-javascript'],
  'application-json': ['code', 'mint', 'JSON', ''],
  'text-x-csrc': ['code', 'mint', 'C', 'text-x-c'],
  'text-html': ['globe', 'cyan', 'HTML', 'application-xhtml+xml application-x-mimearchive'],
  'image-x-generic': ['image', 'mint', null, 'application-vnd.oasis.opendocument.image application-x-egon image-bmp image-tiff image-x-icon image-avif image-heif image-x-portable-pixmap image-jpeg2000 application-vnd.oasis.opendocument.drawing application-vnd.oasis.opendocument.graphics x-office-drawing'],
  'image-png': ['image', 'mint', 'PNG', ''],
  'image-jpeg': ['image', 'mint', 'JPG', ''],
  'image-svg+xml': ['image', 'mint', 'SVG', 'image-x-svg+xml image-svg+xml-compressed'],
  'image-gif': ['image', 'mint', 'GIF', ''],
  'image-webp': ['image', 'mint', 'WEBP', ''],
  'audio-x-generic': ['music', 'amber', null, 'audio-ac3 audio-x-aiff audio-x-monkey audio-mp2 audio-x-mp2 audio-mp4 audio-x-adpcm audio-aac audio-x-m4a'],
  'audio-mpeg': ['music', 'amber', 'MP3', 'audio-mp3 audio-x-mp3 audio-x-mpeg'],
  'audio-flac': ['music', 'amber', 'FLAC', 'audio-x-flac'],
  'audio-x-wav': ['music', 'amber', 'WAV', 'audio-vnd.wave audio-wav'],
  'audio-ogg': ['music', 'amber', 'OGG', 'application-ogg audio-x-vorbis+ogg audio-x-flac+ogg audio-x-speex+ogg audio-x-opus+ogg'],
  'video-x-generic': ['video', 'mint', null, 'application-vnd.rn-realmedia application-x-mplayer2 video-mp2t video-vivo video-x-anim video-x-flic video-mlt-playlist video-x-msvideo video-quicktime video-mpeg video-ogg'],
  'video-mp4': ['video', 'mint', 'MP4', ''],
  'video-x-matroska': ['video', 'mint', 'MKV', ''],
  'video-webm': ['video', 'mint', 'WEBM', ''],
  'application-x-archive': ['zip', 'amber', null, 'application-x-compress application-x-pak application-x-zoo application-x-lha application-gzip application-x-gzip application-x-bzip application-x-xz application-x-zstd'],
  'application-zip': ['zip', 'amber', 'ZIP', ''],
  'application-x-compressed-tar': ['zip', 'amber', 'TAR', 'application-x-xz-compressed-tar application-x-bzip-compressed-tar application-x-zstd-compressed-tar'],
  'application-x-tar': ['zip', 'amber', 'TAR', ''],
  'application-x-7z-compressed': ['zip', 'amber', '7Z', ''],
  'application-x-rar': ['zip', 'amber', 'RAR', 'application-vnd.rar'],
  'package-x-generic': ['box', 'amber', null, 'application-x-xz-pkg'],
  'application-vnd.debian.binary-package': ['box', 'amber', 'DEB', 'application-x-deb'],
  'application-x-rpm': ['box', 'amber', 'RPM', 'application-x-source-rpm'],
  'application-pdf': ['doc', 'red', 'PDF', ''],
  'x-office-document': ['para', 'blue', null, 'application-sxw application-vnd.oasis.opendocument.text-master application-vnd.sun.xml.writer application-vnd.sun.xml.writer.global application-vnd.wordperfect application-x-abiword application-x-applix-word application-x-kword application-x-mswrite application-msword application-vnd.ms-word application-vnd.ms-word.document.macroenabled.12 application-rtf'],
  'x-office-spreadsheet': ['sheet', 'blue', null, 'application-vnd.stardivision.calc application-vnd.sun.xml.calc application-x-applix-spreadsheet application-x-gnumeric application-x-quattropro application-vnd.ms-excel application-vnd.ms-excel.sheet.macroenabled.12'],
  'x-office-presentation': ['slides', 'blue', null, 'application-vnd.sun.xml.impress application-vnd.ms-powerpoint'],
  'text-csv': ['sheet', 'blue', 'CSV', ''],
  'application-vnd.oasis.opendocument.text': ['para', 'blue', 'ODT', ''],
  'application-vnd.oasis.opendocument.spreadsheet': ['sheet', 'blue', 'ODS', ''],
  'application-vnd.oasis.opendocument.presentation': ['slides', 'blue', 'ODP', ''],
  'application-vnd.openxmlformats-officedocument.wordprocessingml.document': ['para', 'blue', 'DOCX', ''],
  'application-vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['sheet', 'blue', 'XLSX', ''],
  'application-vnd.openxmlformats-officedocument.presentationml.presentation': ['slides', 'blue', 'PPTX', ''],
  'font-x-generic': ['font', 'violet', null, 'fonts-package application-x-font-afm application-x-font-bdf application-x-font-pcf application-x-font-type1'],
  'font-ttf': ['font', 'violet', 'TTF', 'application-x-font-ttf'],
  'font-otf': ['font', 'violet', 'OTF', 'application-x-font-otf'],
  'application-x-executable': ['gear', 'steel', null, 'application-x-sharedlib'],
  'application-x-ms-dos-executable': ['gear', 'steel', 'EXE', ''],
  unknown: ['question', 'steel', null, ''],
  'application-octet-stream': ['question', 'steel', null, 'application-x-object'],
};

const DEVICES = {
  'drive-harddisk': ['disk', 'mint', 'drive drive-harddisk-root drive-partition'],
  'drive-removable-media': ['removable', 'amber', 'media-removable'],
  'drive-removable-media-usb': ['usb', 'amber', 'drive-removable-media-usb-pendrive'],
  'media-optical': ['disc', 'violet', 'drive-optical media-optical-audio media-optical-data media-optical-dvd media-optical-blu-ray media-optical-video media-optical-recordable'],
  'media-flash-sd-mmc': ['card', 'amber', 'media-flash media-flash-smart-media media-flash-memory-stick'],
  smartphone: ['phone', 'blue', 'phone'],
  computer: ['monitor', 'blue', 'monitor'],
  'computer-laptop': ['laptop', 'blue', ''],
};

const APPS = {
  'utilities-terminal': ['terminal', 'mint', ''],
  'system-file-manager': ['folder', 'violet', ''],
  'preferences-system': ['settings', 'violet', 'systemsettings'],
  'internet-web-browser': ['globe', 'cyan', ''],
  'accessories-text-editor': ['pencil', 'blue', ''],
  'system-software-install': ['install', 'amber', ''],
  'help-browser': ['question', 'blue', 'system-help'],
  'accessories-calculator': ['calc', 'steel', ''],
  'system-search': ['search', 'steel', ''],
  'utilities-system-monitor': ['chart', 'cyan', ''],
  'internet-mail': ['mail', 'cyan', ''],
};

// --- the theme ----------------------------------------------------------------------------------------------------

// Directories, size for size against Breeze's: [context dir, Context, the 22 px dir's spec, the large dir's range,
// sizes with @2x/@3x links]. The large dir holds the 64 drawing and serves every size from its MinSize up.
const LAYOUT = [
  ['places', 'Places', 'Fixed', [48, 256], [16, 22]],
  ['mimetypes', 'MimeTypes', [22, 24], [48, 256], [16, 22]],
  ['devices', 'Devices', [22, 31], [33, 256], [16, 22, 32]],
  ['apps', 'Applications', 'Fixed', [48, 256], [16, 22]],
];

const tokens = (s) => (s ? s.split(' ') : []);

export function iconTheme(theme, version) {
  const sk = theme.dark ? SKIN.dark : SKIN.light;
  const out = {}, dirs = [], scaled = [];
  const section = (path, size, ctx, type, extra = {}) => ({ path, lines: [`[${path}]`, `Size=${size}`, ...(extra.scale ? [`Scale=${extra.scale}`] : []), `Context=${ctx}`, `Type=${type}`, ...(extra.min ? [`MinSize=${extra.min}`, `MaxSize=${extra.max}`] : [])] });

  const sets = {
    places: Object.entries(PLACES).map(([name, [g, tint, al]]) => ({ name, spec: g === 'open' ? { kind: 'folder', tint, open: true } : { kind: 'folder', tint, glyph: g }, aliases: tokens(al) })),
    mimetypes: Object.entries(MIME).map(([name, [g, tint, label, al]]) => ({ name, spec: { kind: 'file', tint, glyph: g, label }, aliases: tokens(al) })),
    devices: Object.entries(DEVICES).map(([name, [shape, tint, al]]) => ({ name, spec: { kind: 'device', tint, shape }, aliases: tokens(al) })),
    apps: Object.entries(APPS).map(([name, [g, tint, al]]) => ({ name, spec: { kind: 'tile', tint, glyph: g }, aliases: tokens(al) })),
  };

  for (const [dir, ctx, d22, big, hidpi] of LAYOUT) {
    for (const size of SIZES) {
      const sub = `${dir}/${size}`;
      if (size === 64) dirs.push(section(sub, 64, ctx, 'Scalable', { min: big[0], max: big[1] }));
      else if (size === 22 && d22 !== 'Fixed') dirs.push(section(sub, 22, ctx, 'Scalable', { min: d22[0], max: d22[1] }));
      else dirs.push(section(sub, size, ctx, 'Fixed'));
      const seen = new Map(); // identical drawings within a directory become links
      for (const { name, spec, aliases } of sets[dir]) {
        const svg = draw(size, sk, spec);
        if (seen.has(svg)) out[`${sub}/${name}.svg`] = { link: `${seen.get(svg)}.svg` };
        else { out[`${sub}/${name}.svg`] = svg; seen.set(svg, name); }
        for (const a of aliases) out[`${sub}/${a}.svg`] = { link: `${name}.svg` };
      }
      // inode-directory is a file type whose icon is the plain folder
      if (dir === 'mimetypes') out[`${sub}/inode-directory.svg`] = { link: `../../places/${size}/folder.svg` };
      for (const sc of hidpi.includes(size) ? [2, 3] : []) {
        const t = d22 !== 'Fixed' && size === 22 ? ['Scalable', { min: d22[0], max: d22[1] }] : ['Fixed', {}];
        scaled.push(section(`${sub}@${sc}x`, size, ctx, t[0], { ...t[1], scale: sc }));
        out[`${sub}@${sc}x`] = { link: String(size) };
      }
    }
  }
  // the throbber: 16 px fixed (with Breeze's @2x/@3x links), 22 px scalable to 256
  out['animations/16/process-working.svg'] = throbber(16, sk);
  out['animations/22/process-working.svg'] = throbber(22, sk);
  dirs.push(section('animations/16', 16, 'Animations', 'Fixed'), section('animations/22', 22, 'Animations', 'Scalable', { min: 22, max: 256 }));
  for (const sc of [2, 3]) {
    scaled.push(section(`animations/16@${sc}x`, 16, 'Animations', 'Fixed', { scale: sc }));
    out[`animations/16@${sc}x`] = { link: '16' };
  }

  const head = [
    '[Icon Theme]', `Name=${theme.name}`,
    `Comment=innerpulse ${version}: places, file types, drives and generic apps in smoked glass; the rest from ${theme.inherits === 'breeze' ? 'Breeze' : 'Breeze Dark'}`,
    `Inherits=${theme.inherits},hicolor`, 'Example=folder', 'DisplayDepth=32', 'FollowsColorScheme=true',
    'DesktopDefault=48', 'DesktopSizes=16,22,32,48,64,128,256', 'ToolbarDefault=22', 'ToolbarSizes=16,22,32,48',
    'MainToolbarDefault=22', 'MainToolbarSizes=16,22,32,48', 'SmallDefault=16', 'SmallSizes=16,22,32,48',
    'PanelDefault=48', 'PanelSizes=16,22,32,48,64,128,256', 'DialogDefault=32', 'DialogSizes=16,22,32,48,64,128,256',
    'KDE-Extensions=.svg',
    `Directories=${dirs.map((d) => d.path).join(',')}`, `ScaledDirectories=${scaled.map((d) => d.path).join(',')}`,
  ];
  out['index.theme'] = [head.join('\n'), ...[...dirs, ...scaled].map((d) => d.lines.join('\n'))].join('\n\n') + '\n';
  return out;
}
