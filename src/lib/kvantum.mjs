// The application style, "smoked glass": a Kvantum theme per variant, InnerpulseCarbon, InnerpulseInk and
// InnerpulsePaper. Kvantum is a Qt widget style that draws every control from one SVG and reads its metrics from
// one .kvconfig, so the whole look is generated here from the palette, like the Plasma theme and the decoration.
//
// The material, as in glass.mjs: light falls from the top of the window and everything catches it.
//   window     its ground with a soft glow falling from the top edge and a shade toward the foot, both as white
//              and black alpha so the ground keeps its hue (Ink stays warm)
//   raised     buttons, combo boxes, the active tab, headers: glass lit from above, a bright lip inside the top
//              edge, a hairline rim, a 1 px shade under the foot
//   sunken     fields, grooves, check boxes: a well, shaded from its top edge, with a lip of light under its foot
//   hover      a soft glow in the hover color (stone or steel, never ember) around the control
//   focus      the same glow in ember: the keyboard focus, and the one place ember appears in a window
//   level      what a slider or a progress bar has filled: steel, never the selection color
//   selection  the scheme's selection color, lit from above like everything else
//
// Raised and sunken controls keep a 2 px margin inside their own rectangle (GLOW) where the hover and focus glows
// are drawn, so a glow never needs to paint outside its widget. Kvantum crossfades between a control's states
// (animate_states), which is what makes the glows fade in; install.sh turns that off when animations are off.
//
// Kvantum names a nine-slice frame <element>-<state>-<slice> and its stretched middle <element>-<state>, and
// calls the hover state "focused". Qt SVG renders SVG Tiny 1.2, so every slice is plain paths and gradients, and
// each carries an invisible spacer that pins its bounding box (see svg.mjs).
import { n, quarter, rect, spacer, SHADOW_STOPS } from './svg.mjs';
import { hexRGB } from './palette.mjs';

const WHITE = '#ffffff', BLACK = '#000000';
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const pa = ([c, a = 1]) => `fill="${c}"${a < 1 ? ` fill-opacity="${n(a)}"` : ''}`;

export const kvantumId = (t) => `Innerpulse${t.id[0].toUpperCase()}${t.id.slice(1)}`;

const GLOW = 2; // the margin a control keeps for its hover and focus glow
const CELL = 6; // a control's corner cell: GLOW plus its 4 px corner
const RADIUS = 4;

// The materials per ground. A color is [hex, alpha]; a `v` is four stops down a control: the top of its top row,
// the top and the foot of its stretched middle, the foot of its bottom row.
function materials(t) {
  const line = hex(t.lineRGB), shadow = hex(t.shadow);
  const d = t.dark;
  return {
    glass: { v: d ? [[WHITE, 0.15], [WHITE, 0.085], [WHITE, 0.03], [WHITE, 0.06]] : [[WHITE, 0.95], [WHITE, 0.72], [WHITE, 0.3], [WHITE, 0.42]] },
    glassHover: { v: d ? [[WHITE, 0.21], [WHITE, 0.125], [WHITE, 0.06], [WHITE, 0.09]] : [[WHITE, 1], [WHITE, 0.9], [WHITE, 0.55], [WHITE, 0.65]] },
    glassPress: { v: d ? [[BLACK, 0.36], [BLACK, 0.26], [BLACK, 0.12], [BLACK, 0.06]] : [[line, 0.17], [line, 0.11], [line, 0.06], [line, 0.04]] },
    rim: [line, d ? 0.15 : 0.2],
    rimStrong: [line, d ? 0.26 : 0.3],
    lip: [WHITE, d ? 0.22 : 0.95],
    drop: [shadow, d ? 0.45 : 0.16], // the shade under a raised control
    shadeIn: [d ? BLACK : line, d ? 0.42 : 0.12], // the shade inside the top edge of anything sunken
    well: [d ? BLACK : WHITE, d ? 0.42 : 0.7],
    wellRim: [d ? BLACK : line, d ? 0.6 : 0.24],
    wellLip: [WHITE, d ? 0.09 : 0.9], // the light under a well's foot
    level: { v: d ? [['#ffffff', 1], [t.text, 1], [t.text2, 1], [t.text3, 1]] : [[t.text3, 1], [t.text2, 1], [t.text, 1], [t.text, 1]] },
    levelOff: { v: [[t.disabled, 0.7], [t.disabled, 0.6], [t.disabled, 0.5], [t.disabled, 0.5]] },
    levelLip: [WHITE, d ? 0.7 : 0.25],
    bar: (a) => [d ? WHITE : line, a], // scroll bar handles, grips
    surface: d ? t.s2 : t.ground, // menus
    tip: d ? t.s3 : t.s1, // tooltips
    hover: t.hover, focus: t.focus,
  };
}

// --- the sheet: every element on one canvas, laid out left to right in rows ----------------------------

function sheet() {
  const defs = [], body = [];
  let gid = 0, px = 0, py = 0, rowH = 0;
  const place = (w, h) => {
    if (px + w > 720) { px = 0; py += rowH + 6; rowH = 0; }
    const at = { x: px, y: py };
    px += w + 6; rowH = Math.max(rowH, h);
    return at;
  };
  const stopsOf = (stops) => stops.map(([c, a = 1], i) => `<stop offset="${n(i / (stops.length - 1))}" stop-color="${c}" stop-opacity="${n(a)}"/>`).join('');
  const vgrad = (stops, y0, y1) => {
    const id = `v${gid++}`;
    defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${n(y0)}" x2="0" y2="${n(y1)}">${stopsOf(stops)}</linearGradient>`);
    return `fill="url(#${id})"`;
  };
  const rgrad = (stops, cx, cy, r, fx = cx, fy = cy) => {
    const id = `r${gid++}`;
    defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fx="${n(fx)}" fy="${n(fy)}">` +
      stops.map(([o, c, a = 1]) => `<stop offset="${n(o)}" stop-color="${c}" stop-opacity="${n(a)}"/>`).join('') + '</radialGradient>');
    return `fill="url(#${id})"`;
  };
  // a paint for row ri (0 top, 1 middle, 2 bottom) of a cell
  const rowPaint = (p, ri, cell) => (Array.isArray(p) ? pa(p) : vgrad([p.v[ri], p.v[ri + 1]], cell.y, cell.y + cell.h));

  /**
   * A frame as nine slices, painted in layers. F is the corner cell; each layer is one of
   *   { fill, d, r }             a rounded rect inset by d whose corners have radius r
   *   { ring, d, r, w }          its outline, w wide (1 by default)
   *   { hline, side, d, x, h }   a line h tall, d inside the top or bottom edge, starting x in from each end
   * and may carry rows: [0, 1, 2] to paint only some rows, square: 'bottom' | 'top' for square corners on that
   * side, and open: 'bottom' for a ring that leaves that side open (a tab standing on its frame).
   */
  function nine(id, layers, { F = CELL, W = 10, H = 10 } = {}) {
    const at = place(2 * F + W, 2 * F + H);
    const cols = [at.x, at.x + F, at.x + F + W], rows = [at.y, at.y + F, at.y + F + H], ws = [F, W, F], hs = [F, H, F];
    ['topleft', 'top', 'topright', 'left', '', 'right', 'bottomleft', 'bottom', 'bottomright'].forEach((name, k) => {
      const ci = k % 3, ri = Math.floor(k / 3);
      const c = { x: cols[ci], y: rows[ri], w: ws[ci], h: hs[ri] };
      const parts = [];
      for (const L of layers) {
        if (L.rows && !L.rows.includes(ri)) continue;
        if (L.hline) {
          if ((L.side === 'bottom' ? 2 : 0) !== ri) continue;
          const h = L.h ?? 1, x = L.x ?? 0;
          const y = L.side === 'bottom' ? c.y + c.h - L.d - h : c.y + L.d;
          const x0 = ci === 0 ? c.x + x : c.x, x1 = ci === 2 ? c.x + c.w - x : c.x + c.w;
          parts.push(rect(x0, y, x1 - x0, h, pa(L.hline)));
          continue;
        }
        const d = L.d ?? 0, w = L.w ?? 1, ring = !!L.ring;
        const p = rowPaint(L.fill ?? L.ring, ri, c);
        const squared = (L.square === 'bottom' && ri === 2) || (L.square === 'top' && ri === 0);
        const open = L.open === 'bottom' && ri === 2;
        if (ci !== 1 && ri !== 1) {
          const sx = ci === 0 ? 1 : -1, sy = ri === 0 ? 1 : -1;
          const cx = sx > 0 ? c.x : c.x + c.w, cy = sy > 0 ? c.y : c.y + c.h;
          if (open) { parts.push(rect(sx > 0 ? c.x + d : c.x + c.w - d - w, c.y, w, c.h, p)); continue; }
          const R = squared ? 0 : L.r + d; // quarter() takes the radius at the cell's edge and shrinks it by the inset
          const outer = quarter(cx, cy, sx, sy, F, R, d);
          parts.push(ring ? `<path d="${outer}${quarter(cx, cy, sx, sy, F, R, d + w)}" fill-rule="evenodd" ${p}/>` : `<path d="${outer}" ${p}/>`);
        } else if (ci === 1 && ri === 1) {
          if (!ring) parts.push(rect(c.x, c.y, c.w, c.h, p));
        } else if (ring) {
          if (open) continue;
          if (ri === 0) parts.push(rect(c.x, c.y + d, c.w, w, p));
          if (ri === 2) parts.push(rect(c.x, c.y + c.h - d - w, c.w, w, p));
          if (ci === 0) parts.push(rect(c.x + d, c.y, w, c.h, p));
          if (ci === 2) parts.push(rect(c.x + c.w - d - w, c.y, w, c.h, p));
        } else {
          if (ri === 0) parts.push(rect(c.x, c.y + d, c.w, c.h - d, p));
          if (ri === 2) parts.push(rect(c.x, c.y, c.w, c.h - d, p));
          if (ci === 0) parts.push(rect(c.x + d, c.y, c.w - d, c.h, p));
          if (ci === 2) parts.push(rect(c.x, c.y, c.w - d, c.h, p));
        }
      }
      body.push(`<g id="${id}${name && '-' + name}">${spacer(c.x, c.y, c.w, c.h)}${parts.join('')}</g>`);
    });
  }

  /** One element of a fixed size; draw(x, y) returns its paint. */
  function el(id, w, h, draw) {
    const at = place(w, h);
    body.push(`<g id="${id}">${spacer(at.x, at.y, w, h)}${draw ? draw(at.x, at.y) : ''}</g>`);
  }

  const svg = () => {
    const W = 726, H = py + rowH;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${n(H)}" viewBox="0 0 ${W} ${n(H)}">\n<defs>${defs.join('')}</defs>\n${body.join('\n')}\n</svg>\n`;
  };
  return { nine, el, vgrad, rgrad, svg, body, defs, place };
}

const circle = (cx, cy, r) => `M${n(cx - r)},${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx + r)},${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx - r)},${n(cy)}Z`;
const stroke = (d, color, w = 1.6, a = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${a < 1 ? ` stroke-opacity="${n(a)}"` : ''}/>`;

// --- the elements --------------------------------------------------------------------------------------

function themeSvg(t) {
  const m = materials(t), S = sheet(), { nine, el } = S;
  const G = GLOW, R = RADIUS;
  const glow = (color, a = 1) => [{ ring: [color, 0.2 * a], d: 0, r: R + 2 }, { ring: [color, 0.6 * a], d: 1, r: R + 1 }];
  const focusGlow = [{ ring: [m.focus, 0.32], d: 0, r: R + 2 }, { ring: [m.focus, 0.9], d: 1, r: R + 1 }];

  // raised glass: push buttons, combo boxes, tool buttons
  const raised = (body, rim = m.rim) => [
    { ring: m.drop, d: G - 1, r: R + 1, rows: [2] },
    { fill: body, d: G, r: R }, { ring: rim, d: G, r: R }, { hline: m.lip, side: 'top', d: G + 1, x: G + R },
  ];
  const pressed = [{ fill: m.glassPress, d: G, r: R }, { ring: m.rim, d: G, r: R }, { hline: m.shadeIn, side: 'top', d: G + 1, x: G + R }];
  const latched = [...pressed, { hline: [t.text2, 1], side: 'bottom', d: G + 1, h: 2, x: G + R }];
  nine('button-normal', raised(m.glass));
  nine('button-focused', [...glow(m.hover), ...raised(m.glassHover, m.rimStrong)]);
  nine('button-pressed', pressed);
  nine('button-toggled', latched);
  nine('tbutton-normal', []);
  nine('tbutton-focused', raised(m.glassHover, m.rimStrong));
  nine('tbutton-pressed', pressed);
  nine('tbutton-toggled', latched);
  // the keyboard focus ring, drawn over whatever has the focus
  nine('focus', focusGlow);

  // sunken: fields. A field's "focused" is the keyboard focus, so it takes the ember glow.
  const well = [
    { ring: m.wellLip, d: G - 1, r: R + 1, rows: [2] },
    { fill: m.well, d: G, r: R }, { ring: m.wellRim, d: G, r: R }, { hline: m.shadeIn, side: 'top', d: G + 1, x: G + R },
  ];
  nine('lineedit-normal', well);
  nine('lineedit-focused', [...focusGlow, ...well]);

  // frames round views and panels: a hairline with the shade of a well inside its top edge
  const F2 = { F: 2 };
  nine('common-normal', [{ ring: m.wellRim, d: 0, r: 2 }, { ring: m.shadeIn, d: 1, r: 1, rows: [0] }], F2);
  nine('common-focused', [{ ring: [m.focus, 0.9], d: 0, r: 2 }, { ring: [m.focus, 0.3], d: 1, r: 1 }], F2);

  // group boxes and the page under a row of tabs: a faint pane of glass
  const pane = [{ fill: [WHITE, t.dark ? 0.03 : 0.35], d: 0, r: 5 }, { ring: m.rim, d: 0, r: 5 }, { hline: [WHITE, t.dark ? 0.07 : 0.6], side: 'top', d: 1, x: 5 }];
  nine('group-normal', pane, { F: 5 });
  nine('tabframe-normal', pane, { F: 5 });

  // tabs: only the selected one is glass, standing on the page with its foot open
  for (const p of ['tab', 'floating-tab']) {
    const F5 = { F: 5 };
    nine(`${p}-normal`, [], F5);
    nine(`${p}-focused`, [{ fill: [WHITE, t.dark ? 0.06 : 0.45], d: 0, r: R, square: 'bottom' }], F5);
    nine(`${p}-toggled`, [
      { fill: m.glass, d: 0, r: R, square: 'bottom' }, { ring: m.rim, d: 0, r: R, open: 'bottom' },
      { hline: m.lip, side: 'top', d: 1, x: R },
    ], F5);
  }

  // rows in lists, trees and menus: hover in the hover color, the selection lit from above
  const selected = [
    { fill: [t.select, 1], d: 0, r: 3 },
    { fill: { v: [[WHITE, 0.2], [WHITE, 0.1], [WHITE, 0], [BLACK, 0.08]] }, d: 0, r: 3 },
    { hline: [WHITE, 0.24], side: 'top', d: 0, x: 3 },
  ];
  const F3 = { F: 3 };
  nine('itemview-focused', [{ fill: [m.hover, 0.18], d: 0, r: 3 }], F3);
  nine('itemview-pressed', [{ fill: [t.select, 0.6], d: 0, r: 3 }], F3);
  nine('itemview-toggled', selected, F3);
  for (const s of ['focused', 'pressed', 'toggled']) nine(`menuitem-${s}`, selected, F3);
  for (const s of ['focused', 'pressed', 'toggled']) {
    nine(`menubaritem-${s}`, [{ fill: s === 'focused' ? m.glassHover : m.glassPress, d: 0, r: 3 }, { ring: m.rim, d: 0, r: 3 }], F3);
  }
  nine('menubaritem-normal', [], F3);

  // menus and tooltips: opaque surfaces with a hairline, a lip, and a soft shadow; 4 px corners, like Plasma's
  // popups and the window decoration
  nine('menu-normal', [
    { fill: [m.surface, 1], d: 0, r: R }, { fill: { v: [[WHITE, t.dark ? 0.07 : 0.5], [WHITE, 0], [WHITE, 0], [WHITE, 0]] }, d: 0, r: R },
    { ring: m.rimStrong, d: 0, r: R }, { hline: m.lip, side: 'top', d: 1, x: R },
  ]);
  nine('tooltip-normal', [{ fill: [m.tip, 1], d: 0, r: R }, { ring: m.rimStrong, d: 0, r: R }], { F: 4 });
  for (const [p, depth] of [['menu-shadow', SHADOW.menu], ['tooltip-shadow', SHADOW.tooltip]]) shadowSlices(S, p, depth, t);

  // meters: a well and its level in steel
  const groove = [{ fill: m.well, d: 0, r: 3 }, { ring: m.wellRim, d: 0, r: 3 }, { hline: m.shadeIn, side: 'top', d: 1, x: 3 }];
  const level = (v) => [{ fill: v, d: 1, r: 2 }, { hline: m.levelLip, side: 'top', d: 1, x: 3 }];
  nine('progress-normal', groove, F3);
  nine('progress-pattern-normal', level(m.level), F3);
  nine('progress-pattern-disabled', level(m.levelOff), F3);
  nine('slider-normal', groove, F3);
  nine('slider-toggled', [...groove, ...level(m.level)], F3);

  // the slider's handle: a round knob lit from above (a knob may be round; nothing else here is)
  const knob = (state) => (x, y) => {
    const cx = x + 9, cy = y + 9, lit = t.dark ? ['#ffffff', '#c9cdd2', '#7e848c'] : ['#ffffff', '#f4f1ec', '#cfc8bc'];
    const body = state === 'pressed' ? [lit[1], lit[2], lit[2]] : lit;
    return (state === 'focused' || state === 'pressed' ? `<path d="${circle(cx, cy, 9)}${circle(cx, cy, 8)}" fill-rule="evenodd" ${pa([m.hover, 0.7])}/>` : '') +
      `<path d="${circle(cx, cy + 0.6, 8)}" ${pa(m.drop)}/>` +
      `<path d="${circle(cx, cy, 7.4)}" ${S.rgrad([[0, body[0]], [0.5, body[1]], [1, body[2]]], cx, cy, 8.5, cx, cy - 4.5)}/>` +
      `<path d="${circle(cx, cy, 7.4)}${circle(cx, cy, 6.6)}" fill-rule="evenodd" ${pa(t.dark ? [BLACK, 0.25] : [hex(t.lineRGB), 0.3])}/>`;
  };
  for (const s of ['normal', 'focused', 'pressed']) el(`slidercursor-${s}`, 18, 18, knob(s));
  el('slidercursor-disabled', 18, 18, (x, y) => `<path d="${circle(x + 9, y + 9, 7.4)}" ${pa([t.disabled, 1])}/>`);

  // check boxes and radio buttons: wells, with the mark in bright steel
  const mark = t.dark ? '#ffffff' : t.text;
  const box = (hover, inner) => (x, y) => {
    const rr = (i, r) => `M${n(x + i + r)},${n(y + i)}h${n(16 - 2 * i - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${n(16 - 2 * i - 2 * r)}a${r} ${r} 0 0 1 -${r} ${r}h-${n(16 - 2 * i - 2 * r)}a${r} ${r} 0 0 1 -${r} -${r}v-${n(16 - 2 * i - 2 * r)}a${r} ${r} 0 0 1 ${r} -${r}z`;
    return (hover ? `<path d="${rr(0, 4)}${rr(1, 3)}" fill-rule="evenodd" ${pa([m.hover, 0.65])}/>` : '') +
      `<path d="${rr(1, 3)}" ${pa(m.well)}/><path d="${rr(1, 3)}${rr(2, 2)}" fill-rule="evenodd" ${pa(m.wellRim)}/>` +
      rect(x + 4, y + 2, 8, 1, pa(m.shadeIn)) + (inner ? inner(x, y) : '');
  };
  const tick = (x, y) => stroke(`M${x + 4.6},${y + 8.4}l2.4,2.5 4.6,-5.4`, mark, 1.8);
  const dash = (x, y) => stroke(`M${x + 5},${y + 8}h6`, mark, 1.8);
  const round = (hover, dot) => (x, y) => {
    const cx = x + 8, cy = y + 8;
    return (hover ? `<path d="${circle(cx, cy, 8)}${circle(cx, cy, 7)}" fill-rule="evenodd" ${pa([m.hover, 0.65])}/>` : '') +
      `<path d="${circle(cx, cy, 7)}" ${pa(m.well)}/><path d="${circle(cx, cy, 7)}${circle(cx, cy, 6)}" fill-rule="evenodd" ${pa(m.wellRim)}/>` +
      (dot ? `<path d="${circle(cx, cy, 3.2)}" ${S.rgrad([[0, mark], [1, t.dark ? t.text2 : t.text2]], cx, cy, 3.4, cx, cy - 1.6)}/>` : '');
  };
  for (const [s, hover] of [['normal', false], ['focused', true]]) {
    el(`checkbox-${s}`, 16, 16, box(hover));
    el(`checkbox-checked-${s}`, 16, 16, box(hover, tick));
    el(`checkbox-tristate-${s}`, 16, 16, box(hover, dash));
    el(`radio-${s}`, 16, 16, round(hover, false));
    el(`radio-checked-${s}`, 16, 16, round(hover, true));
  }

  // scroll bars: a faint groove and a bar of glass that brightens under the pointer
  const F5 = { F: 5 };
  nine('scrollbargroove-normal', [{ fill: [t.dark ? BLACK : hex(t.lineRGB), t.dark ? 0.16 : 0.05], d: 2, r: 3 }], F5);
  nine('scrollbarslider-normal', [{ fill: m.bar(t.dark ? 0.24 : 0.3), d: 3, r: 2 }], F5);
  nine('scrollbarslider-focused', [{ fill: m.bar(t.dark ? 0.38 : 0.45), d: 2, r: 3 }], F5);
  nine('scrollbarslider-pressed', [{ fill: m.bar(t.dark ? 0.5 : 0.58), d: 2, r: 3 }], F5);
  for (const s of ['normal', 'focused', 'pressed']) el(`grip-${s}`, 13, 13);

  // column headers: a flat band of glass with a hairline under it
  const head = (fill) => [{ fill, d: 0, r: 0 }, { hline: m.rim, side: 'bottom', d: 0 }];
  nine('header-normal', head([WHITE, t.dark ? 0.045 : 0.4]), F2);
  nine('header-focused', head([WHITE, t.dark ? 0.1 : 0.7]), F2);
  nine('header-pressed', head([t.dark ? BLACK : hex(t.lineRGB), t.dark ? 0.2 : 0.08]), F2);
  nine('header-toggled', head([WHITE, t.dark ? 0.07 : 0.55]), F2);
  el('header-separator', 1, 16, (x, y) => rect(x, y + 3, 1, 10, pa(m.rim)));

  // arrows: chevrons in the kit's stroke, 9 px
  const chev = { down: 'M1.8,3.2l2.7,2.9 2.7,-2.9', up: 'M1.8,5.8l2.7,-2.9 2.7,2.9', left: 'M5.8,1.8l-2.9,2.7 2.9,2.7', right: 'M3.2,1.8l2.9,2.7 -2.9,2.7', plus: 'M4.5,1.6v5.8M1.6,4.5h5.8', minus: 'M1.6,4.5h5.8' };
  for (const [name, d] of Object.entries(chev)) {
    for (const [s, color, a] of [['normal', t.text2, 1], ['focused', t.text, 1], ['pressed', t.text, 1], ['disabled', t.disabled, 1]]) {
      el(`arrow-${name}-${s}`, 9, 9, (x, y) => `<g transform="translate(${x} ${y})">${stroke(d, color, 1.5, a)}</g>`);
    }
  }

  // a tree's expanders are the same chevrons (Kvantum asks for <indicator>-minus when open, -plus when closed),
  // and the default button's corner marker is left empty: a default button is told by its bold label
  for (const [name, d] of [['minus', chev.down], ['plus', chev.right]]) {
    for (const [s, color] of [['normal', t.text3], ['focused', t.text], ['pressed', t.text], ['disabled', t.disabled]]) {
      el(`tree-${name}-${s}`, 9, 9, (x, y) => `<g transform="translate(${x} ${y})">${stroke(d, color, 1.5)}</g>`);
    }
  }
  for (const p of ['', 'flat-']) el(`${p}button-default-indicator`, 8, 8);

  // small furniture: grips, handles, the dial
  const dots = (pts, r = 0.9) => (x, y) => pts.map(([dx, dy]) => `<path d="${circle(x + dx, y + dy, r)}" ${pa([t.text3, 0.8])}/>`).join('');
  for (const s of ['normal', 'focused', 'pressed']) el(`splitter-grip-${s}`, 16, 16, dots([[8, 4], [8, 8], [8, 12]]));
  for (const s of ['normal', 'focused']) el(`resize-grip-${s}`, 13, 13, dots([[10, 10], [10, 6], [6, 10], [10, 2], [2, 10], [6, 6]], 0.8));
  el('toolbar-handle', 5, 16, dots([[2.5, 4], [2.5, 8], [2.5, 12]]));
  el('dial', 48, 48, (x, y) => `<path d="${circle(x + 24, y + 24, 23)}" ${pa(m.well)}/><path d="${circle(x + 24, y + 24, 23)}${circle(x + 24, y + 24, 22)}" fill-rule="evenodd" ${pa(m.wellRim)}/>`);
  el('dial-handle', 12, 12, (x, y) => `<path d="${circle(x + 6, y + 6, 5)}" ${S.rgrad([[0, mark], [1, t.text3]], x + 6, y + 6, 5.5, x + 6, y + 3)}/>`);
  for (const s of ['normal', 'focused']) el(`titlebar-${s}`, 32, 16, (x, y) => rect(x, y, 32, 16, pa([WHITE, t.dark ? (s === 'focused' ? 0.1 : 0.05) : 0.5])));

  // the window's ground: its color, a glow from the top, a shade toward the foot. Stretched over the window.
  el('window-normal', 32, 240, (x, y) => rect(x, y, 32, 240, pa([m.surface, 1])) +
    rect(x, y, 32, 110, S.vgrad([[WHITE, t.dark ? 0.085 : 0.55], [WHITE, t.dark ? 0.03 : 0.2], [WHITE, 0]], y, y + 110)) +
    rect(x, y + 110, 32, 130, S.vgrad([[BLACK, 0], [t.dark ? BLACK : hex(t.shadow), t.dark ? 0.2 : 0.05]], y + 110, y + 240)));

  return S.svg();
}

// Shadows round menus and tooltips: the slices are `depth` px cells round the popup, with the falloff of every
// other shadow in the theme (svg.mjs), a little heavier below.
const SHADOW = { menu: 8, tooltip: 6 };
function shadowSlices(S, prefix, D, t) {
  const color = hex(t.shadow), alpha = t.shadowAlpha * 0.8;
  const stops = SHADOW_STOPS.map(([o, k]) => [o, color, alpha * k]);
  const at = S.place(2 * D + 10, 2 * D + 10);
  const X = [at.x, at.x + D, at.x + D + 10], Y = [at.y, at.y + D, at.y + D + 10], ws = [D, 10, D];
  ['topleft', 'top', 'topright', 'left', null, 'right', 'bottomleft', 'bottom', 'bottomright'].forEach((name, k) => {
    if (!name) return;
    const ci = k % 3, ri = Math.floor(k / 3), x = X[ci], y = Y[ri], w = ws[ci], h = ws[ri];
    let paint;
    if (ci === 1 || ri === 1) {
      const id = `s${S.defs.length}`;
      const [x1, y1, x2, y2] = ri === 0 ? [0, 1, 0, 0] : ri === 2 ? [0, 0, 0, 1] : ci === 0 ? [1, 0, 0, 0] : [0, 0, 1, 0];
      S.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${n(a)}"/>`).join('')}</linearGradient>`);
      paint = `fill="url(#${id})"`;
    } else {
      paint = S.rgrad(stops, ci === 0 ? x + w : x, ri === 0 ? y + h : y, D);
    }
    S.body.push(`<g id="${prefix}-${name}">${spacer(x, y, w, h)}${rect(x, y, w, h, paint)}</g>`);
  });
  for (const side of ['top', 'bottom', 'left', 'right']) {
    const p = S.place(D, D);
    S.body.push(`<rect id="${prefix}-hint-${side}" x="${p.x}" y="${p.y}" width="${D}" height="${D}" fill="#f0f" opacity=".001"/>`);
  }
}

// --- the configuration ---------------------------------------------------------------------------------

const ini = (sections) => Object.entries(sections).map(([name, kv]) =>
  `[${name}]\n` + Object.entries(kv).map(([k, v]) => `${k}=${v}`).join('\n') + '\n').join('\n');
const sides = (prefix, v) => Object.fromEntries(['top', 'bottom', 'left', 'right'].map((s) => [`${prefix}.${s}`, v]));

function themeConfig(t, version) {
  const base = t.dark ? t.s1 : '#faf8f4';
  const onSelect = { 'text.focus.color': t.selectText, 'text.press.color': t.selectText, 'text.toggle.color': t.selectText };
  const flat = { inherits: 'PanelButtonCommand', frame: false, interior: false };
  return ini({
    '%General': {
      author: 'innerpulse', comment: `${t.name}: smoked glass, lit from above (kde-innerpulse ${version})`,
      x11drag: 'menubar_and_primary_toolbar', alt_mnemonic: true, left_tabs: true, attach_active_tab: false, embedded_tabs: false,
      mirror_doc_tabs: true, group_toolbar_buttons: false, toolbar_item_spacing: 1, toolbar_interior_spacing: 2,
      spread_progressbar: true, progressbar_thickness: 16, textless_progressbar: false,
      composite: true, translucent_windows: false, blurring: false, popup_blurring: false,
      menu_shadow_depth: SHADOW.menu, tooltip_shadow_depth: SHADOW.tooltip, spread_menuitems: true, submenu_overlap: 0,
      splitter_width: 7, scroll_width: 12, scroll_min_extent: 44, scroll_arrows: false, transient_scrollbar: false,
      slider_width: 6, slider_handle_width: 18, slider_handle_length: 18, tickless_slider_handle_size: 18, check_size: 16,
      combo_as_lineedit: false, combo_menu: true, hide_combo_checkboxes: true, square_combo_button: false, inline_spin_indicators: true, vertical_spin_indicators: false,
      merge_menubar_with_toolbar: true, groupbox_top_label: true, remove_extra_frames: true, fill_rubberband: false,
      small_icon_size: 16, large_icon_size: 32, button_icon_size: 16, toolbar_icon_size: 22,
      layout_spacing: 4, layout_margin: 6, click_behavior: 0, tooltip_delay: -1, dialog_button_layout: 2,
      animate_states: true, // install.sh turns this off when Plasma's animation speed is "instant"
    },
    GeneralColors: {
      'window.color': t.dark ? t.s2 : t.ground, 'base.color': base, 'alt.base.color': t.viewAlt ?? t.s1,
      'button.color': t.dark ? t.s3 : t.s1, 'light.color': t.dark ? t.s4 : '#ffffff', 'mid.light.color': t.s3,
      'dark.color': t.dark ? '#050607' : t.s4, 'mid.color': t.dark ? t.s1 : t.s3,
      'highlight.color': t.select, 'inactive.highlight.color': t.selectAlt,
      'text.color': t.text, 'window.text.color': t.text, 'button.text.color': t.text, 'disabled.text.color': t.disabled,
      'tooltip.text.color': t.text, 'highlight.text.color': t.selectText, 'link.color': t.link, 'link.visited.color': t.visited,
      // text over a level: the ground on steel in the dark variants, white on Paper's dark steel
      'progress.indicator.text.color': t.dark ? t.ground : '#ffffff',
    },
    Hacks: {
      respect_darkness: t.dark, transparent_ktitle_label: true, transparent_dolphin_view: false,
      transparent_menutitle: true, normal_default_pushbutton: false, iconless_pushbutton: false, force_size_grip: false,
    },
    PanelButtonCommand: {
      frame: true, 'frame.element': 'button', ...sides('frame', CELL), interior: true, 'interior.element': 'button',
      'indicator.size': 9, 'indicator.element': 'arrow',
      'text.normal.color': t.text, 'text.focus.color': t.text, 'text.press.color': t.text, 'text.toggle.color': t.text,
      'text.shadow': 0, 'text.margin': 1, 'text.iconspacing': 5, ...sides('text.margin', 1), 'text.margin.left': 5, 'text.margin.right': 5,
    },
    PanelButtonTool: { inherits: 'PanelButtonCommand', 'frame.element': 'tbutton', 'interior.element': 'tbutton', 'text.margin.left': 1, 'text.margin.right': 1, 'text.normal.color': t.text2 },
    Focus: { inherits: 'PanelButtonCommand', frame: true, 'frame.element': 'focus', interior: false, ...sides('frame', CELL), 'frame.patternsize': 0 },
    ComboBox: { inherits: 'PanelButtonCommand', 'text.margin.left': 4, 'text.margin.right': 2 },
    DropDownButton: { inherits: 'PanelButtonCommand', 'indicator.element': 'arrow-down' },
    IndicatorSpinBox: { inherits: 'PanelButtonCommand', frame: true, interior: true, 'frame.element': 'tbutton', 'interior.element': 'tbutton', ...sides('frame', 3), 'indicator.element': 'arrow', 'indicator.size': 9 },
    IndicatorArrow: { 'indicator.element': 'arrow', 'indicator.size': 9 },
    LineEdit: { inherits: 'PanelButtonCommand', 'frame.element': 'lineedit', 'interior.element': 'lineedit', 'text.margin.left': 3, 'text.margin.right': 3 },
    RadioButton: { ...flat, interior: true, 'interior.element': 'radio', 'text.margin.left': 3, 'text.margin.right': 3 },
    CheckBox: { ...flat, interior: true, 'interior.element': 'checkbox', 'text.margin.left': 3, 'text.margin.right': 3 },
    GenericFrame: { inherits: 'PanelButtonCommand', frame: true, interior: false, 'frame.element': 'common', 'interior.element': 'common', ...sides('frame', 2) },
    GroupBox: { inherits: 'GenericFrame', frame: true, 'frame.element': 'group', interior: true, 'interior.element': 'group', ...sides('frame', 5), 'text.shadow': 0, 'text.margin': 0, 'text.normal.color': t.text2 },
    TabFrame: { inherits: 'PanelButtonCommand', frame: true, 'frame.element': 'tabframe', interior: true, 'interior.element': 'tabframe', ...sides('frame', 5) },
    TabBarFrame: { inherits: 'GenericFrame', frame: false, interior: false, 'text.shadow': 0 },
    Tab: {
      inherits: 'PanelButtonCommand', 'frame.element': 'tab', 'interior.element': 'tab', 'indicator.element': 'tab', ...sides('frame', 5),
      ...sides('text.margin', 2), 'text.margin.left': 7, 'text.margin.right': 7,
      'text.normal.color': t.text2, 'text.focus.color': t.text, 'text.press.color': t.text, 'text.toggle.color': t.text, min_width: '+2', min_height: '2.0font',
    },
    ToolboxTab: { inherits: 'PanelButtonCommand' },
    TreeExpander: { ...flat, 'indicator.element': 'tree', 'indicator.size': 9 },
    HeaderSection: {
      inherits: 'PanelButtonCommand', 'frame.element': 'header', 'interior.element': 'header', ...sides('frame', 2),
      ...sides('text.margin', 2), 'text.margin.left': 5, 'text.margin.right': 5, 'text.normal.color': t.text2, 'indicator.element': 'arrow',
    },
    SizeGrip: { ...flat, 'indicator.element': 'resize-grip', 'indicator.size': 13 },
    Toolbar: { inherits: 'PanelButtonCommand', 'indicator.element': 'toolbar', 'indicator.size': 5, 'text.margin': 0, 'frame.element': 'none', 'interior.element': 'none', ...sides('frame', 2) },
    MenuBar: { inherits: 'PanelButtonCommand', 'frame.element': 'none', 'interior.element': 'none', ...sides('frame', 1) },
    MenuBarItem: { inherits: 'PanelButtonCommand', 'frame.element': 'menubaritem', 'interior.element': 'menubaritem', ...sides('frame', 3), 'text.margin.left': 4, 'text.margin.right': 4 },
    Menu: { inherits: 'PanelButtonCommand', 'frame.element': 'menu', 'interior.element': 'menu', ...sides('frame', CELL) },
    MenuItem: {
      inherits: 'PanelButtonCommand', frame: true, 'frame.element': 'menuitem', 'interior.element': 'menuitem', 'indicator.element': 'menuitem',
      ...sides('frame', 3), ...sides('text.margin', 1), 'text.margin.left': 4, 'text.margin.right': 4, ...onSelect,
    },
    ItemView: {
      inherits: 'PanelButtonCommand', 'frame.element': 'itemview', 'interior.element': 'itemview', ...sides('frame', 3),
      'text.margin': 0, ...sides('text.margin', 0), 'text.margin.left': 2, 'text.margin.right': 2,
      'text.focus.color': t.text, 'text.press.color': t.selectText, 'text.toggle.color': t.selectText,
    },
    Slider: { inherits: 'PanelButtonCommand', 'frame.element': 'slider', 'interior.element': 'slider', ...sides('frame', 3) },
    SliderCursor: { inherits: 'PanelButtonCommand', frame: false, 'interior.element': 'slidercursor' },
    Progressbar: { inherits: 'PanelButtonCommand', 'frame.element': 'progress', 'interior.element': 'progress', ...sides('frame', 3), 'text.margin': 0, 'text.bold': false },
    ProgressbarContents: { inherits: 'PanelButtonCommand', frame: true, 'frame.element': 'progress-pattern', 'interior.element': 'progress-pattern', ...sides('frame', 3) },
    Splitter: { ...flat, 'indicator.element': 'splitter-grip', 'indicator.size': 16 },
    Scrollbar: { inherits: 'PanelButtonCommand', 'indicator.size': 9 },
    ScrollbarSlider: { inherits: 'PanelButtonCommand', 'frame.element': 'scrollbarslider', 'interior.element': 'scrollbarslider', ...sides('frame', 5), 'indicator.element': 'grip', 'indicator.size': 13 },
    ScrollbarGroove: { inherits: 'PanelButtonCommand', 'frame.element': 'scrollbargroove', 'interior.element': 'scrollbargroove', ...sides('frame', 5) },
    TitleBar: { inherits: 'PanelButtonCommand', frame: false, 'interior.element': 'titlebar', 'indicator.size': 12, 'indicator.element': 'mdi', 'text.normal.color': t.text2, 'text.focus.color': t.text },
    Dock: { inherits: 'PanelButtonCommand', frame: false, interior: false },
    DockTitle: { inherits: 'PanelButtonCommand', frame: false, interior: false, 'text.normal.color': t.text2, 'text.focus.color': t.text },
    ToolTip: { inherits: 'GenericFrame', ...sides('frame', 4), interior: true, 'interior.element': 'tooltip', 'frame.element': 'tooltip', 'text.shadow': 0, 'text.margin': 2 },
    StatusBar: { inherits: 'GenericFrame', frame: false, interior: false },
    Window: { interior: true, 'interior.element': 'window' },
  });
}

/** A variant's Kvantum theme: { 'Name.kvconfig': …, 'Name.svg': … }, to be placed in a folder named Name. */
export function kvantumTheme(t, version) {
  const id = kvantumId(t);
  return { id, files: { [`${id}.kvconfig`]: themeConfig(t, version), [`${id}.svg`]: themeSvg(t) } };
}
