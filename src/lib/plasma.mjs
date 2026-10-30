// The Plasma desktop themes: "innerpulse" (Ink), "innerpulse-paper" and "innerpulse-carbon". Every color goes
// through ColorScheme-* classes, so Plasma recolors each theme from the active color scheme; what differs per
// variant is the glass (white and black alphas from glass.mjs), the shadow and the hairline weights, which
// no color scheme can carry.
//
// What it draws itself (anything else falls back to Breeze, which also follows the color scheme):
//   panel        the header ground, a hairline, and a faint graduated scale along the long edges
//   dialogs      popups on the window ground, hairline ring, soft shadow, one ember index tick at top left
//   tooltips     the same, one step lighter, no tick
//   widgets      desktop widget cards
//   tasks        task manager states: running, focused (ember bar on the panel side), attention, minimized
//   viewitem     list highlights in menus and launchers: the index turns ember on hover
//   listitem     rows in combo box lists and plain delegates: the same index on the pressed row
//   controls     buttons, text fields, tabs, check boxes, radio buttons, switches, sliders, meters, scroll bars
//   pager        the desktops in the panel's pager: the current one raised, with a short index tick
//   headings     the band under a popup's title and over its footer
//   busy         a neutral steel arc that Plasma turns; never the mark, which must not rotate
//   overlays     the add, remove and open buttons on desktop icons
//
// Ember stays where the brand puts it: focus rings, the index ticks, the focused task. Nothing here paints
// ColorScheme-Highlight, so the selection color never reaches a meter, slider or switch.
import { frame, maskFrame, shadowFrame, hints, insetHints, doc, colorStyle, rect, spacer, n, quarter, arc, disc, annulus, roundShadow } from './svg.mjs';
import { GLASS, TICK } from './glass.mjs';

const cls = (c, op = 1) => `class="ColorScheme-${c}" fill="currentColor"${op < 1 ? ` opacity="${n(op)}"` : ''}`;

// --- frames with shadows and blur masks ----------------------------------------------------------------

// Glass, after Oxygen's polish and the brand's frosted panel: the surface is lit from above. A sheen falls
// from the top edge through the top row of cells, a 1 px highlight lip runs just inside the top hairline, and a
// faint shade sits inside the bottom edge, so each surface reads as a slab with a bevel. All of it is white or
// black at low alpha, never ember, and it lives only in the top and bottom rows, which tile horizontally, so it
// holds at any width.

function glassPaint(t, name, c, f, r, border) {
  const g = GLASS[t.id];
  const top = name === 'topleft' || name === 'top' || name === 'topright';
  const bottom = name === 'bottomleft' || name === 'bottom' || name === 'bottomright';
  let s = '';
  if (top) {
    if (name === 'top') {
      s += rect(c.x, f.fy0 + border, c.w, f.fy1 - f.fy0 - border, 'fill="url(#sheen)"');
      s += rect(c.x, f.fy0 + border, c.w, 1, `fill="#fff" fill-opacity="${g.lip}"`);
    } else {
      const sx = name === 'topleft' ? 1 : -1;
      const cx = sx > 0 ? f.fx0 : f.fx1;
      const size = Math.min(f.fx1 - f.fx0, f.fy1 - f.fy0);
      s += `<path d="${quarter(cx, f.fy0, sx, 1, size, r, border)}" fill="url(#sheen)"/>`;
      // the lip starts where the corner's curve ends, so it never cuts across the arc
      const x0 = sx > 0 ? f.fx0 + r : f.fx0, w = f.fx1 - f.fx0 - r;
      s += rect(x0, f.fy0 + border, w, 1, `fill="#fff" fill-opacity="${g.lip}"`);
    }
  }
  if (bottom) {
    const x0 = name === 'bottomleft' ? f.fx0 + r : f.fx0;
    const x1 = name === 'bottomright' ? f.fx1 - r : f.fx1;
    s += rect(x0, f.fy1 - border - 1, x1 - x0, 1, `fill="#000" fill-opacity="${g.shade}"`);
  }
  return s;
}

function framedSurface(t, { bg, alpha, r = 4, cell = 8, margins, insets, tick = false, scale = false, shadow = true, shadowReach = 22, shadowDy = 6, shadowAlpha, glass = true, more = '' }) {
  const W = 32, H = 32;
  const fill = cls(bg, alpha);
  const stroke = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.16 : 0.18}"`;
  const extra = (name, c, f) => {
    let s = glass ? glassPaint(t, name, c, f, r, 1) : '';
    // the index tick: one short ember bar along the top edge, just inside the corner, like a cursor on a scale
    if (tick && name === 'topleft') s += rect(c.x + r + TICK.gap, c.y, Math.min(TICK.length, c.w - r - TICK.gap), TICK.thickness, cls('ButtonFocus'));
    // the scale: 1 px ticks every 8 px, every fourth one longer, very faint. The edge tiles, so the scale runs
    // the full length of the panel.
    if (scale && (name === 'top' || name === 'bottom')) {
      for (let i = 0; i < W; i += 8) {
        const h = i === 0 ? 4 : 2;
        const y = name === 'top' ? c.y + 2 : c.y + c.h - 2 - h;
        s += rect(c.x + i + 3.5, y, 1, h, `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.12 : 0.16}"`);
      }
    }
    return s;
  };
  const geo = { L: cell, T: cell, R: cell, B: cell, W, H, r };
  // three blocks side by side: the frame, its blur mask, its hints; the shadow underneath
  const span = 2 * cell + W;
  const body = [
    frame({ ...geo, x: 10, y: 10, fill, stroke, extra }),
    maskFrame({ ...geo, x: 20 + span, y: 10 }),
    hints('', margins, 30 + 2 * span, 10, insets),
  ];
  if (more) body.push(more);
  let defs = glass ? `<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${GLASS[t.id].sheen}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` : '';
  const sy = 20 + span;
  if (shadow) {
    const sh = shadowFrame({ x: 10, y: sy, s: shadowReach, inner: cell, r, rgb: t.shadow, alpha: shadowAlpha ?? t.shadowAlpha, dy: shadowDy, uid: 'sh' });
    body.push(sh.body);
    defs += sh.defs;
  }
  return doc(Math.max(60 + 2 * span + 30, 2 * (shadowReach + shadowDy + cell) + W + 260), sy + 2 * (shadowReach + shadowDy + cell) + H + 20, body.join('\n'), { style: colorStyle(t), defs });
}

// Opaque, translucent (blurred behind) and solid variants of each surface.
function surfaces(t) {
  const files = {};
  const panelM = { top: 4, bottom: 4, left: 4, right: 4 };
  const dialogM = { top: 8, bottom: 8, left: 8, right: 8 };
  // translucent/ is what Plasma uses when the compositor blurs behind. The panel only ever has the wallpaper
  // behind it, so it can be properly frosted (about three quarters ground). Popups and tooltips open over
  // any window, so they stay about 92% ground: at three quarters, a popup over a dark window drifted far enough
  // from its ground to fail AA for small gray text (measured: paper #e9e4db became #c3c1bd).
  // The panel's "thick" prefix is never drawn: Panel.qml reads only its margins, adds smallSpacing and caps
  // the sum by the panel's thickness. 8 is Breeze's value, so a 46 px panel pads 12 px and its icons are
  // 22 px, as Plasma lays them out. Without these hints the prefix fell back to panelM (4) and the icons grew
  // to 30 px, close enough to the edges to crowd the graduated scale.
  const thick = '<rect id="thick-center" x="200" y="10" width="32" height="32" fill="#f0f" opacity=".001"/>\n' +
    hints('thick-', { top: 8, bottom: 8, left: 8, right: 8 }, 240, 10);
  // Popups: an inset of 1 (the hairline) lets a popup that asks to collapse its margins (the clipboard, KDE
  // Connect, Vaults) run its list to the frame, as Breeze does, without covering the ring. Breeze writes
  // about 0; a 0-size hint would read as no hint at all.
  const dialogI = { top: 1, bottom: 1, left: 1, right: 1 };
  const variants = [['', 1, 1], ['translucent/', t.dark ? 0.74 : 0.78, t.dark ? 0.92 : 0.93], ['solid/', 1, 1], ['opaque/', 1, 1]];
  for (const [dir, a, pop] of variants) {
    files[`${dir}widgets/panel-background.svg`] = framedSurface(t, { bg: 'HeaderBackground', alpha: a, cell: 14, margins: panelM, scale: true, shadowReach: 16, shadowDy: 2, shadowAlpha: t.shadowAlpha * 0.7, more: thick });
    files[`${dir}dialogs/background.svg`] = framedSurface(t, { bg: 'Background', alpha: pop, cell: 20, margins: dialogM, insets: dialogI, tick: true, shadowDy: 3 });
    files[`${dir}widgets/tooltip.svg`] = framedSurface(t, { bg: 'Background', alpha: pop, margins: { top: 6, bottom: 6, left: 8, right: 8 }, shadowReach: 14, shadowDy: 2 });
    files[`${dir}widgets/background.svg`] = framedSurface(t, { bg: 'Background', alpha: pop, cell: 20, margins: { top: 10, bottom: 10, left: 10, right: 10 }, tick: true, shadowReach: 18, shadowDy: 3 });
  }
  return files;
}

// --- task manager ---------------------------------------------------------------------------------------

// Each state is a small nine-slice frame, drawn four times: unprefixed (panel at the bottom), north-, west-,
// east-. The state bar always sits on the panel's screen edge, so it reads as a reading taken from that side.
function tasks(t) {
  const C = 4, W = 16, H = 16, size = C * 2 + W;
  const states = {
    normal: { fill: null, bar: ['Text', t.dark ? 0.32 : 0.38], barW: 2 },
    hover: { fill: ['Text', t.dark ? 0.07 : 0.08], bar: ['Text', t.dark ? 0.32 : 0.38], barW: 2 },
    focus: { fill: ['Text', t.dark ? 0.1 : 0.1], bar: ['ButtonFocus', 1], barW: 2 },
    attention: { fill: ['NeutralText', 0.14], bar: ['NeutralText', 1], barW: 2 },
    minimized: { fill: null, bar: ['Text', t.dark ? 0.18 : 0.22], barW: 1 },
    progress: { fill: ['Text', t.dark ? 0.12 : 0.12], bar: null, barW: 0 },
  };
  const sides = [['', 'south'], ['north-', 'north'], ['west-', 'west'], ['east-', 'east']];
  const out = [];
  let row = 0;
  for (const [pfx, side] of sides) {
    let col = 0;
    for (const [state, s] of Object.entries(states)) {
      const x0 = 10 + col * (size + 10), y0 = 10 + row * (size + 10);
      const fillAttr = s.fill ? cls(s.fill[0], s.fill[1]) : 'fill="none"';
      const extra = (name, c) => {
        if (!s.bar) return '';
        const bar = cls(s.bar[0], s.bar[1]);
        const w = s.barW;
        // the bar runs along the edge cells only (not the corners), so it is inset from the rounded ends
        if (side === 'south' && name === 'bottom') return rect(c.x, c.y + c.h - w, c.w, w, bar);
        if (side === 'north' && name === 'top') return rect(c.x, c.y, c.w, w, bar);
        if (side === 'west' && name === 'left') return rect(c.x, c.y, w, c.h, bar);
        if (side === 'east' && name === 'right') return rect(c.x + c.w - w, c.y, w, c.h, bar);
        return '';
      };
      out.push(frame({ prefix: `${pfx}${state}-`, x: x0, y: y0, L: C, T: C, R: C, B: C, W, H, r: 3, border: 0, fill: fillAttr, stroke: '', extra }));
      col++;
    }
    row++;
  }
  // margins for the icon inside a task
  out.push(hints('normal-', { top: 4, bottom: 4, left: 4, right: 4 }, 10, 10 + 4 * (size + 10)));
  // group expanders: small machined chevrons pointing away from the panel edge
  const gy = 40 + 4 * (size + 10);
  const chev = {
    top: 'M2 6 L6 2 L10 6', bottom: 'M2 2 L6 6 L10 2', left: 'M6 2 L2 6 L6 10', right: 'M2 2 L6 6 L2 10',
  };
  Object.entries(chev).forEach(([dir, d], i) => {
    const ox = 10 + i * 20;
    const [w, h] = dir === 'top' || dir === 'bottom' ? [12, 8] : [8, 12];
    out.push(`<g id="group-expander-${dir}">${spacer(ox, gy, w, h)}<path transform="translate(${ox} ${gy})" d="${d}" fill="none" stroke-width="1.5" stroke-linecap="square" class="ColorScheme-Text" stroke="currentColor" opacity=".7"/></g>`);
  });
  const H2 = 80 + 4 * (size + 10);
  return doc(10 + 6 * (size + 10), H2, out.join('\n'), { style: colorStyle(t) });
}

// --- list highlights ------------------------------------------------------------------------------------

function viewitem(t) {
  const C = 4, W = 16, H = 16, size = C * 2 + W;
  const states = {
    normal: { fill: null, index: false },
    hover: { fill: t.dark ? 0.07 : 0.07, index: true },
    selected: { fill: t.dark ? 0.11 : 0.11, index: true },
    'selected+hover': { fill: t.dark ? 0.15 : 0.14, index: true },
  };
  const out = [`<rect id="hint-tile-center" x="0" y="0" width="2" height="2" fill="#f60" opacity=".001"/>`];
  Object.entries(states).forEach(([state, s], i) => {
    const x0 = 10 + i * (size + 10), y0 = 10;
    const fillAttr = s.fill ? cls('Text', s.fill) : 'fill="none"';
    const ember = cls('ButtonFocus');
    const extra = (name, c) => {
      if (!s.index) return '';
      // the index: a 2 px ember rule down the left edge, starting below the corner's curve
      if (name === 'left') return rect(c.x, c.y, 2, c.h, ember);
      if (name === 'topleft') return rect(c.x, c.y + 3, 2, c.h - 3, ember);
      if (name === 'bottomleft') return rect(c.x, c.y, 2, c.h - 3, ember);
      return '';
    };
    out.push(frame({ prefix: `${state}-`, x: x0, y: y0, L: C, T: C, R: C, B: C, W, H, r: 3, border: 0, fill: fillAttr, stroke: '', extra }));
  });
  return doc(10 + 4 * (size + 10), size + 20, out.join('\n'), { style: colorStyle(t) });
}

// Rows drawn by plain delegates where the list has no highlight of its own: combo box popups above all, plus
// check, radio and switch delegates and PlasmaExtras.ListItem. Breeze fills the current row with 40% of the
// focus color, which here is ember; this is the viewitem language instead, a faint tint with the index. Hover
// is laid over pressed by the delegate, so it carries no index of its own (one index, never two).
function listitem(t) {
  const C = 2, W = 16, H = 16, size = C * 2 + W;
  const ember = cls('ButtonFocus');
  const rule = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.16 : 0.18}"`;
  const states = {
    normal: { fill: 'fill="none"' },
    hover: { fill: cls('Text', 0.07) },
    // the 2 px corners are too small to hold the index below their curve, so it runs the left edge only
    pressed: { fill: cls('Text', 0.11), extra: (name, c) => (name === 'left' ? rect(c.x, c.y, 2, c.h, ember) : '') },
    section: { fill: cls('Text', 0.04), extra: (name, c) => (name === 'bottom' ? rect(c.x, c.y + c.h - 1, c.w, 1, rule) : '') },
  };
  const out = [`<rect id="hint-tile-center" x="0" y="0" width="2" height="2" fill="#f0f" opacity=".001"/>`];
  Object.entries(states).forEach(([state, s], i) => {
    const x0 = 10 + i * (size + 10);
    out.push(frame({ prefix: `${state}-`, x: x0, y: 10, L: C, T: C, R: C, B: C, W, H, r: 2, border: 0, fill: s.fill, stroke: '', extra: s.extra }));
    // Breeze's row padding (kickoff sizes its rows from the normal- hints); hover has none, as in Breeze
    if (state !== 'hover') out.push(hints(`${state}-`, { top: 6, bottom: 6, left: 6, right: 6 }, x0, size + 20));
  });
  // the separator between rows: its natural height (1) is the line's thickness
  out.push(`<g id="separator">${rect(10, size + 50, 40, 1, `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.14 : 0.16}"`)}</g>`);
  return doc(10 + 4 * (size + 10), size + 60, out.join('\n'), { style: colorStyle(t) });
}

// --- controls: buttons, text fields, tabs ----------------------------------------------------------------
//
// Plasma's own controls in the same glass as the apps' Oxygen widgets, so the shell and the apps speak one
// language. Every margin matches Breeze's, so no layout moves. A raised control is lit from above (sheen, lip,
// shade at the foot); a sunken one (a text field) is shaded at the top with a lip at the foot. Focus is an
// ember ring; the active tab carries the ember index tick on the side that faces its content.

const tiny = 0.001; // Breeze writes zero-width margins as hairline hints; a 0 would read as "no hint"

function controlDoc(t, blocks, defs = '', step = 60) {
  const sheen = `<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${GLASS[t.id].sheen}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  let y = 10;
  const body = blocks.map((b) => { const out = b(y); y += step; return out; }).join('\n');
  return doc(260, y + 10, body, { style: colorStyle(t), defs: sheen + defs });
}

// one nine-slice block at row y: the frame at x 10, its hints at x 120
function block(prefix, { fill, stroke = '', border = 1, cell = 6, r = 4, margins, extra }) {
  return (y) => frame({ prefix, x: 10, y, L: cell, T: cell, R: cell, B: cell, W: 32, H: 32, r, border, fill, stroke, extra }) +
    '\n' + hints(prefix, margins, 120, y);
}

const ring = (cls2, op, width = 1) => ({ fill: 'fill="none"', stroke: `class="ColorScheme-${cls2}" fill="currentColor"${op < 1 ? ` opacity="${op}"` : ''}`, border: width });

// shade/lip helpers on a frame's top or bottom edge cells
function bevel(t, { raised = true, sheen = true }) {
  const g = GLASS[t.id];
  return (name, c, f) => {
    const isTop = name === 'top' || name === 'topleft' || name === 'topright';
    const isBottom = name === 'bottom' || name === 'bottomleft' || name === 'bottomright';
    const x0 = name.endsWith('left') ? f.fx0 + 4 : f.fx0, x1 = name.endsWith('right') ? f.fx1 - 4 : f.fx1;
    let s = '';
    if (isTop && raised && sheen) s += rect(x0, f.fy0 + 1, x1 - x0, f.fy1 - f.fy0 - 1, 'fill="url(#sheen)"');
    if (isTop) s += raised ? rect(x0, f.fy0 + 1, x1 - x0, 1, `fill="#fff" fill-opacity="${g.lip}"`) : rect(x0, f.fy0 + 1, x1 - x0, 1, `fill="#000" fill-opacity="${g.shade}"`);
    if (isBottom) s += raised ? rect(x0, f.fy1 - 2, x1 - x0, 1, `fill="#000" fill-opacity="${g.shade}"`) : rect(x0, f.fy1 - 2, x1 - x0, 1, `fill="#fff" fill-opacity="${g.lip * 0.6}"`);
    return s;
  };
}

function buttonSvg(t) {
  const line = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.18 : 0.22}"`;
  const blocks = [
    block('normal-', { fill: cls('ButtonBackground'), stroke: line, margins: { top: 6, bottom: 6, left: 6, right: 6 }, extra: bevel(t, { raised: true }) }),
    block('pressed-', { fill: cls('ButtonBackground'), stroke: line, margins: { top: 6, bottom: 6, left: 6, right: 6 }, extra: (n2, c, f) => bevel(t, { raised: false })(n2, c, f) + (n2 === 'center' ? rect(c.x, c.y, c.w, c.h, `fill="#000" fill-opacity="${t.dark ? 0.12 : 0.05}"`) : '') }),
    block('hover-', { ...ring('ButtonHover', 1), margins: { top: tiny, bottom: tiny, left: tiny, right: tiny } }),
    block('focus-', { ...ring('ButtonFocus', 1, 2), margins: { top: 2, bottom: 2, left: 2, right: 2 } }),
    block('toolbutton-hover-', { fill: `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.08 : 0.07}"`, stroke: `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.12 : 0.14}"`, margins: { top: 4, bottom: 4, left: 4, right: 4 }, extra: bevel(t, { raised: true }) }),
    block('toolbutton-pressed-', { fill: `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.14 : 0.12}"`, stroke: `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.16 : 0.18}"`, margins: { top: 4, bottom: 4, left: 4, right: 4 }, extra: bevel(t, { raised: false }) }),
    block('toolbutton-focus-', { ...ring('ButtonFocus', 1, 2), margins: { top: 2, bottom: 2, left: 2, right: 2 } }),
    (y) => frame({ prefix: 'mask-normal-', x: 10, y, L: 6, T: 6, R: 6, B: 6, W: 32, H: 32, r: 4, border: 0, fill: 'fill="#000"', stroke: '' }),
    // Compose over border: KSvg stretches the center under the whole frame and cuts it with mask-<prefix>,
    // so fractional scales leave no seams between slices. Each hint needs its own mask; the masks match the
    // visible frames (6 px slices, r 4) so the center never shows past a corner.
    (y) => frame({ prefix: 'mask-pressed-', x: 10, y, L: 6, T: 6, R: 6, B: 6, W: 32, H: 32, r: 4, border: 0, fill: 'fill="#000"', stroke: '' }) +
      '\n<rect id="normal-hint-compose-over-border" x="200" y="10" width="4" height="4" fill="#000" opacity=".001"/>' +
      '<rect id="pressed-hint-compose-over-border" x="206" y="10" width="4" height="4" fill="#000" opacity=".001"/>',
  ];
  const sh = shadowFrame({ x: 10, y: 10 + blocks.length * 60, s: 3, inner: 6, r: 4, rgb: t.shadow, alpha: t.shadowAlpha * 0.6, dy: 1, uid: 'bsh' });
  blocks.push(() => sh.body);
  return controlDoc(t, blocks, sh.defs);
}

function lineeditSvg(t) {
  const line = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.2 : 0.24}"`;
  return controlDoc(t, [
    block('base-', { fill: cls('ViewBackground'), stroke: line, margins: { top: 6, bottom: 6, left: 6, right: 6 }, extra: bevel(t, { raised: false }) }),
    block('hover-', { ...ring('ButtonHover', 1), margins: { top: tiny, bottom: tiny, left: tiny, right: tiny } }),
    block('focus-', { ...ring('ViewFocus', 1, 2), margins: { top: tiny, bottom: tiny, left: tiny, right: tiny } }),
    block('focusframe-', { ...ring('ViewFocus', 0.5, 2), margins: { top: 2, bottom: 2, left: 2, right: 2 } }),
    () => `<rect id="hint-focus-over-base" x="200" y="10" width="2" height="2" fill="#f0f" opacity=".001"/><rect id="hint-tile-center" x="206" y="10" width="2" height="2" fill="#f0f" opacity=".001"/>`,
  ]);
}

function tabbarSvg(t) {
  const fill = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.08 : 0.07}"`;
  const ember = cls('ButtonFocus');
  // the tick sits on the edge that faces the tab's content: south tabs (a bar under its content) tick on top
  const sides = {
    south: (n2, c) => (n2 === 'topleft' ? rect(c.x + 5, c.y, Math.min(12, c.w - 5), 2, ember) : ''),
    north: (n2, c) => (n2 === 'bottomleft' ? rect(c.x + 5, c.y + c.h - 2, Math.min(12, c.w - 5), 2, ember) : ''),
    west: (n2, c) => (n2 === 'topright' ? rect(c.x + c.w - 2, c.y + 5, 2, Math.min(12, c.h - 5), ember) : ''),
    east: (n2, c) => (n2 === 'topleft' ? rect(c.x, c.y + 5, 2, Math.min(12, c.h - 5), ember) : ''),
  };
  // Breeze's margins, in screen orientation (Breeze draws the east and west hints rotated; these are not).
  // East and west also frame the shell's highlight behind an expanded applet on a side panel.
  const M = {
    south: { top: 10, bottom: 10, left: 6, right: 6 },
    north: { top: 10, bottom: 10, left: 6, right: 6 },
    west: { top: 6, bottom: 6, left: 4, right: 8 },
    east: { top: 6, bottom: 6, left: 8, right: 4 },
  };
  const blocks = Object.entries(sides).map(([side, tick]) =>
    block(`${side}-active-tab-`, { fill, border: 0, cell: 18, margins: M[side],
      extra: (n2, c, f) => bevel(t, { raised: true })(n2, c, f) + tick(n2, c) }));
  blocks.push(() => `<rect id="hint-tile-center" x="200" y="10" width="2" height="2" fill="#f0f" opacity=".001"/>`);
  return controlDoc(t, blocks, '', 80);
}

// --- round controls: check marks, radio buttons, handles ------------------------------------------------
//
// The round version of a raised button: a disc on the button ground, a hairline ring, the lip as a 1 px arc
// across the top inside the ring and the shade as one across the foot. Pressed swaps them, as bevel() does.

const hairline = (t) => cls('Text', t.dark ? 0.18 : 0.22);

function knob(t, cx, cy, r, { pressed = false, ring = hairline(t) } = {}) {
  const g = GLASS[t.id];
  const lip = (op) => `fill="none" stroke="#fff" stroke-opacity="${n(op)}" stroke-width="1"`;
  const shade = `fill="none" stroke="#000" stroke-opacity="${n(g.shade)}" stroke-width="1"`;
  let s = disc(cx, cy, r, cls('ButtonBackground'));
  if (pressed) s += disc(cx, cy, r, `fill="#000" fill-opacity="${t.dark ? 0.12 : 0.05}"`);
  s += annulus(cx, cy, r - 1, r, ring);
  const top = arc(cx, cy, r - 1.5, 220, 320), foot = arc(cx, cy, r - 1.5, 40, 140);
  s += pressed ? `<path d="${top}" ${shade}/><path d="${foot}" ${lip(g.lip * 0.6)}/>` : `<path d="${top}" ${lip(g.lip)}/><path d="${foot}" ${shade}/>`;
  return s;
}

// The check box is Plasma's button frame (normal-) with this mark over it, so the mark brings no box of its
// own: Breeze's box here is a third of the focus color, which is ember. The radiobutton dot is only read when
// a theme has no radiobutton.svg; this theme has one, but the fallback stays neutral too.
function checkmarksSvg(t) {
  const ink = 'class="ColorScheme-ButtonText" stroke="currentColor"';
  return doc(16, 32, [
    `<g id="checkbox"><rect x="0" y="0" width="16" height="16" fill="#f0f" opacity=".001"/><path d="M4 8.5L7 11.5L12.5 5" fill="none" ${ink} stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" opacity=".9"/></g>`,
    `<g id="radiobutton"><rect x="0" y="16" width="16" height="16" fill="#f0f" opacity=".001"/>${disc(8, 24, 3, 'class="ColorScheme-ButtonText" fill="currentColor"')}</g>`,
  ].join('\n'), { style: colorStyle(t) });
}

// Each element is centered by its own size (RadioIndicator centers every layer on the indicator), so each
// sits in its own slot with a spacer of exactly its size: Breeze's 16 (normal, checked, hover, hint-size),
// 20 (focus), 22 (shadow) and 6 (symbol).
function radiobuttonSvg(t) {
  const cy = 20;
  const slot = (i) => 20 + i * 30;
  const box = (cx, size) => spacer(cx - size / 2, cy - size / 2, size, size);
  const sh = roundShadow('rsh', slot(5), cy + 1, 7, 10, t.shadow, t.shadowAlpha * 0.6);
  const els = [
    ['normal', 16, (cx) => knob(t, cx, cy, 8)],
    ['checked', 16, (cx) => disc(cx, cy, 7, cls('Text', 0.1))],
    ['focus', 20, (cx) => annulus(cx, cy, 8, 10, cls('ButtonFocus'))],
    ['hover', 16, (cx) => annulus(cx, cy, 7, 8, cls('ButtonHover'))],
    ['symbol', 6, (cx) => disc(cx, cy, 3, cls('ButtonText'))],
    ['shadow', 22, () => sh.body],
  ];
  const body = els.map(([id, size, draw], i) => `<g id="${id}">${box(slot(i), size)}${draw(slot(i))}</g>`);
  body.push(`<rect id="hint-size" x="${slot(6) - 8}" y="${cy - 8}" width="16" height="16" fill="#f0f" opacity=".001"/>`);
  return doc(slot(7), 40, body.join('\n'), { style: colorStyle(t), defs: sh.defs });
}

// --- meters, sliders, switches, scroll bars -------------------------------------------------------------
//
// Breeze paints all of these in ColorScheme-Highlight, the selection color: red on Ink and Paper, blue on
// Carbon. Here a level is a reading on an instrument, so it is steel: the track is a sunken slot on the view
// ground, the level a bright Text fill with the lip on top. The thin bars are 6 px (3 px corner cells), as in
// Breeze, so nothing moves.

const levelFill = (t) => cls('Text', t.dark ? 0.62 : 0.7);

// a sunken slot: view ground, hairline ring, shade under the top edge, a faint lip at the foot
const sunken = (t, prefix, x, y, C = 3, r = 3) =>
  frame({ prefix, x, y, L: C, T: C, R: C, B: C, W: 16, H: 4, r, border: 1, fill: cls('ViewBackground'), stroke: cls('Text', t.dark ? 0.18 : 0.2), extra: bevel(t, { raised: false }) });

// the level: a Text fill with the glass lip along its top edge (not over the corners' curve)
const level = (t, prefix, x, y, C = 3, r = 3, fill = levelFill(t)) =>
  frame({ prefix, x, y, L: C, T: C, R: C, B: C, W: 16, H: 4, r, border: 0, fill, stroke: '',
    extra: (name, c) => (name === 'top' ? rect(c.x, c.y, c.w, 1, `fill="#fff" fill-opacity="${n(levelLip(t))}"`) : '') });

// Paper's lip (.85) is made for its light ground; on a dark level fill it would read as a white seam
const levelLip = (t) => Math.min(GLASS[t.id].lip, 0.3);

function barMeterSvg(t) {
  return doc(120, 60, [
    sunken(t, 'bar-inactive-', 10, 10),
    level(t, 'bar-active-', 50, 10),
    `<rect id="hint-bar-size" x="90" y="10" width="6" height="6" fill="#f0f" opacity=".001"/>`,
    `<rect id="hint-tile-center" x="100" y="10" width="4" height="4" fill="#f0f" opacity=".001"/>`,
  ].join('\n'), { style: colorStyle(t) });
}

// The volume applet lays a second groove-highlight over the first with status Selected for the live level.
// Either way KSvg resolves ColorScheme-Text under Selected (the selection's text color, or Text itself), the
// translucent fill over the position fill reads as a distinct band. Not yet checked on screen.
function sliderSvg(t) {
  const cy = 60;
  const out = [sunken(t, 'groove-', 10, 10), level(t, 'groove-highlight-', 50, 10)];
  let defs = '';
  ['horizontal', 'vertical'].forEach((o, row) => {
    const y = cy + row * 34;
    const at = (i) => 22 + i * 32;
    const s = roundShadow(`${o}-ssh`, at(1), y + 1, 8, 12, t.shadow, t.shadowAlpha * 0.6);
    defs += s.defs;
    out.push(
      `<g id="${o}-slider-handle">${spacer(at(0) - 10, y - 10, 20, 20)}${knob(t, at(0), y, 10)}</g>`,
      `<g id="${o}-slider-shadow">${spacer(at(1) - 13, y - 13, 26, 26)}${s.body}</g>`,
      `<g id="${o}-slider-focus">${spacer(at(2) - 12, y - 12, 24, 24)}${annulus(at(2), y, 10, 12, cls('ButtonFocus'))}</g>`,
      `<g id="${o}-slider-hover">${spacer(at(3) - 10, y - 10, 20, 20)}${annulus(at(3), y, 9, 10, cls('ButtonHover'))}</g>`,
    );
  });
  out.push(`<circle id="hint-handle-size" cx="170" cy="${cy}" r="10" fill="#f0f" opacity=".001"/>`);
  out.push(`<rect id="hint-tile-center" x="200" y="10" width="2" height="2" fill="#f0f" opacity=".001"/>`);
  return doc(220, cy + 60, out.join('\n'), { style: colorStyle(t), defs });
}

// The switch: a 38×16 pill drawn as three slices (two 8 px half-discs and a 5 px center that stretches), and
// a 22 px knob. Off is the sunken slot; on, the level fill runs from the left end to under the knob.
function switchSvg(t) {
  const g = GLASS[t.id];
  const R = 8, CW = 5, H = 16;
  const lineAt = (op, white) => `fill="none" stroke="${white ? '#fff' : '#000'}" stroke-opacity="${n(op)}" stroke-width="1"`;
  // one pill as left, center and right slices; `top` and `foot` are 1 px lines inside the ring, as arcs on the ends
  const pill = (prefix, x, y, { fill, ring, top, foot }) => {
    const L = [x + R, y + R], Rt = [x + R + CW, y + R]; // the two arc centers
    const half = (cx, s) => `M${n(cx)},${n(y)}A${R} ${R} 0 0 ${s > 0 ? 0 : 1} ${n(cx)},${n(y + H)}Z`;
    const halfRing = (cx, s) => `M${n(cx)},${n(y)}A${R} ${R} 0 0 ${s > 0 ? 0 : 1} ${n(cx)},${n(y + H)}L${n(cx)},${n(y + H - 1)}A${R - 1} ${R - 1} 0 0 ${s > 0 ? 1 : 0} ${n(cx)},${n(y + 1)}Z`;
    const lines = (cx, a0, a1, b0, b1) => (top ? `<path d="${arc(cx, y + R, R - 1.5, a0, a1)}" ${top}/>` : '') + (foot ? `<path d="${arc(cx, y + R, R - 1.5, b0, b1)}" ${foot}/>` : '');
    const left = `<g id="${prefix}left">${spacer(x, y, R, H)}<path d="${half(L[0], 1)}" ${fill}/>${ring ? `<path d="${halfRing(L[0], 1)}" ${ring}/>` : ''}${lines(L[0], 215, 270, 90, 145)}</g>`;
    const center = `<g id="${prefix}center">${spacer(x + R, y, CW, H)}${rect(x + R, y, CW, H, fill)}${ring ? rect(x + R, y, CW, 1, ring) + rect(x + R, y + H - 1, CW, 1, ring) : ''}` +
      (top ? `<path d="M${n(x + R)},${n(y + 1.5)}H${n(x + R + CW)}" ${top}/>` : '') + (foot ? `<path d="M${n(x + R)},${n(y + H - 1.5)}H${n(x + R + CW)}" ${foot}/>` : '') + '</g>';
    const right = `<g id="${prefix}right">${spacer(x + R + CW, y, R, H)}<path d="${half(Rt[0], -1)}" ${fill}/>${ring ? `<path d="${halfRing(Rt[0], -1)}" ${ring}/>` : ''}${lines(Rt[0], 270, 325, 35, 90)}</g>`;
    return [left, center, right].join('\n');
  };
  const out = [
    pill('inactive-', 10, 10, { fill: cls('ViewBackground'), ring: cls('Text', t.dark ? 0.18 : 0.2), top: lineAt(g.shade, false), foot: lineAt(g.lip * 0.6, true) }),
    pill('active-', 50, 10, { fill: levelFill(t), top: lineAt(levelLip(t), true) }),
    `<rect id="hint-bar-size" x="90" y="10" width="38" height="16" fill="#f0f" opacity=".001"/>`,
    `<rect id="hint-stretch-borders" x="140" y="10" width="4" height="4" fill="#f0f" opacity=".001"/>`,
  ];
  // knobs: 22 px, the focus ring 26 (ember, keyboard focus only), the shadow 28
  const y = 50, at = (i) => 24 + i * 34;
  const sh = roundShadow('wsh', at(4), y + 1, 9, 13, t.shadow, t.shadowAlpha * 0.6);
  out.push(
    `<g id="handle">${spacer(at(0) - 11, y - 11, 22, 22)}${knob(t, at(0), y, 11)}</g>`,
    `<g id="handle-hover">${spacer(at(1) - 11, y - 11, 22, 22)}${knob(t, at(1), y, 11, { ring: cls('ButtonHover') })}</g>`,
    `<g id="handle-pressed">${spacer(at(2) - 11, y - 11, 22, 22)}${knob(t, at(2), y, 11, { pressed: true })}</g>`,
    `<g id="handle-focus">${spacer(at(3) - 13, y - 13, 26, 26)}${annulus(at(3), y, 11, 13, cls('ButtonFocus'))}</g>`,
    `<g id="handle-shadow">${spacer(at(4) - 14, y - 14, 28, 28)}${sh.body}</g>`,
  );
  return doc(at(5), y + 24, out.join('\n'), { style: colorStyle(t), defs: sh.defs });
}

// Scroll bars: a 6 px steel slider that brightens under the pointer, on no track at all (as in Breeze). The
// insets are Breeze's: 6 px of air around the slider, so the bar is 18 px wide.
function scrollbarSvg(t) {
  const C = 3;
  const bar = (prefix, x, y, fill) => frame({ prefix, x, y, L: C, T: C, R: C, B: C, W: 6, H: 6, r: 3, border: 0, fill, stroke: '' });
  const air = { top: 6, bottom: 6, left: 6, right: 6 };
  const out = [
    bar('background-horizontal-', 10, 10, 'fill="none"'),
    bar('background-vertical-', 30, 10, 'fill="none"'),
    bar('slider-', 50, 10, cls('Text', t.dark ? 0.28 : 0.3)),
    bar('mouseover-slider-', 70, 10, cls('Text', t.dark ? 0.45 : 0.5)),
  ];
  ['background-horizontal-', 'background-vertical-', 'slider-', 'mouseover-slider-'].forEach((p, i) => out.push(insetHints(p, air, 10 + i * 20, 30, 3)));
  out.push(
    `<rect id="hint-scrollbar-size" x="100" y="10" width="6" height="6" fill="#f0f" opacity=".001"/>`,
    `<rect id="hint-tile-center" x="110" y="10" width="2" height="2" fill="#f0f" opacity=".001"/>`,
    // Breeze's switch for the hairline between a view and its scroll bar (PC3 ScrollBar draws it)
    `<rect id="private-hint-show-separator" x="116" y="10" width="2" height="2" fill="#f0f" opacity=".001"/>`,
  );
  return doc(130, 60, out.join('\n'), { style: colorStyle(t) });
}

// --- the pager --------------------------------------------------------------------------------------------
//
// Desktops as small sunken tiles; the current one is raised in glass and carries a short index tick at its
// top left, as the active tab does. Breeze fills it with 60% of the focus color (an ember slab). The corner
// cells are 8 wide so the tick fits inside its own slice and never lands on the edge slice, which stretches.
function pagerSvg(t) {
  const geo = { L: 8, T: 4, R: 8, B: 4, W: 16, H: 16, r: 2, border: 1 };
  const tick = (name, c) => (name === 'topleft' ? rect(c.x + geo.r + TICK.gap, c.y, Math.min(TICK.length, c.w - geo.r - TICK.gap), TICK.thickness, cls('ButtonFocus')) : '');
  return controlDoc(t, [
    (y) => frame({ ...geo, prefix: 'normal-', x: 10, y, fill: cls('Text', 0.05), stroke: cls('Text', 0.14) }),
    (y) => frame({ ...geo, prefix: 'hover-', x: 10, y, fill: cls('Text', 0.09), stroke: cls('ButtonHover') }),
    (y) => frame({ ...geo, prefix: 'active-', x: 10, y, fill: cls('Text', t.dark ? 0.16 : 0.14), stroke: cls('Text', 0.34),
      extra: (name, c, f) => bevel(t, { raised: true, sheen: false })(name, c, f) + tick(name, c) }),
    () => `<rect id="hint-tile-center" x="200" y="10" width="2" height="2" fill="#f0f" opacity=".001"/>`,
  ], '', 40);
}

// --- headings -------------------------------------------------------------------------------------------
//
// PlasmoidHeading draws its band only when this file comes from the same theme as dialogs/background, so
// without it every popup header and footer was blank. The band is a faint tint with a hairline where it meets
// the content. No glass of its own: in a popup its outer rows lie on the dialog's, which already carry the
// sheen, the lip and the shade, and the translucent tint lets them (and the ember tick) show through.
function headingSvg(t) {
  const rule = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.16 : 0.18}"`;
  const fill = cls('Text', t.dark ? 0.035 : 0.03);
  const geo = { L: 8, T: 8, R: 8, B: 8, W: 32, H: 32, r: 4, border: 0, fill, stroke: '' };
  // in the corner cells the rule stops 1 px short of the outer edge, where the dialog's own ring runs
  const ruleAt = (row) => (name, c) => {
    if (!name.startsWith(row)) return '';
    const x0 = name.endsWith('left') ? c.x + 1 : c.x, x1 = name.endsWith('right') ? c.x + c.w - 1 : c.x + c.w;
    return rect(x0, row === 'bottom' ? c.y + c.h - 1 : c.y, x1 - x0, 1, rule);
  };
  return doc(150, 80, [
    frame({ ...geo, prefix: 'header-', x: 10, y: 10, square: { bottomleft: true, bottomright: true }, extra: ruleAt('bottom') }),
    frame({ ...geo, prefix: 'footer-', x: 70, y: 10, square: { topleft: true, topright: true }, extra: ruleAt('top') }),
    `<rect id="hint-stretch-borders" x="130" y="10" width="4" height="4" fill="#f0f" opacity=".001"/>`,
    hints('', { top: 6, bottom: 6, left: 6, right: 6 }, 10, 64),
  ].join('\n'), { style: colorStyle(t) });
}

// --- the busy indicator ---------------------------------------------------------------------------------
//
// Plasma turns this element (2 s a turn, only while animations are on), so it can never be the mark, which
// must not rotate. It is a steel gauge instead: a faint ring and a quarter arc in Text. With animations off it
// stands still, the arc from 12 to 3 o'clock. Plasma picks the 22 and 16 px copies at those sizes; they sit
// on whole pixels.
function busywidgetSvg(t) {
  const gauge = (id, x, size, r, w) => {
    const c = size / 2;
    const stroke = `class="ColorScheme-Text" stroke="currentColor" fill="none" stroke-width="${n(w)}"`;
    return `<g id="${id}">${spacer(x, 0, size, size)}${disc(x + c, c, r, `${stroke} stroke-opacity="0.14"`)}` +
      (id === 'stopped' ? '' : `<path d="${arc(x + c, c, r, 270, 360)}" ${stroke} stroke-opacity="0.75" stroke-linecap="square"/>`) + '</g>';
  };
  return doc(150, 36, [
    gauge('busywidget', 0, 36, 14.5, 3),
    gauge('22-22-busywidget', 40, 22, 9, 2),
    gauge('16-16-busywidget', 66, 16, 6.25, 1.5),
    gauge('stopped', 86, 36, 14.5, 3),
    // Breeze's hint, at Breeze's size; nothing in Plasma 6.6 reads it (the turn is always smooth)
    `<rect id="hint-rotation-angle" x="130" y="0" width="14" height="14" fill="#f0f" opacity=".001"/>`,
  ].join('\n'), { style: colorStyle(t) });
}

// --- desktop icon overlays ------------------------------------------------------------------------------
//
// The add/remove (selection) and open (folder popup) buttons that appear on a hovered desktop icon: small
// glass discs with a ButtonText glyph. Breeze paints the open button's hover as an ember disc; here hover only
// rings the disc, and add and remove tint their glyphs with the positive and negative text colors.
function actionOverlaysSvg(t) {
  const glyphs = {
    add: 'M5.5 8H10.5M8 5.5V10.5',
    remove: 'M5.5 8H10.5',
    open: 'M5.5 10.5L10.5 5.5M7 5.5H10.5V9',
  };
  const tint = { add: 'PositiveText', remove: 'NegativeText', open: 'ButtonText' };
  const out = [];
  Object.entries(glyphs).forEach(([el, d], row) => {
    ['normal', 'hover', 'pressed'].forEach((state, col) => {
      const x = 10 + col * 20, y = 10 + row * 20, cx = x + 8, cy = y + 8;
      const c = state === 'hover' ? tint[el] : 'ButtonText';
      let s = knob(t, cx, cy, 7, { pressed: state === 'pressed', ring: state === 'hover' ? cls('ButtonHover') : cls('Text', 0.2) });
      if (state === 'pressed') s += disc(cx, cy, 6, cls('Text', 0.12));
      const glyph = `<path d="${d}" transform="translate(${x} ${y})" fill="none" class="ColorScheme-${c}" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" opacity=".85"/>`;
      out.push(`<g id="${el}-${state}">${spacer(x, y, 16, 16)}${s}${glyph}</g>`);
    });
  });
  return doc(80, 80, out.join('\n'), { style: colorStyle(t) });
}

// --- lines and plain frames -----------------------------------------------------------------------------

// Separators (Kickoff's section rules, list section headers, spin boxes): the popup ring's hairline, not
// Breeze's opaque Frame color. Kickoff reads the line's thickness from its height, so it stays 1.
function lineSvg(t) {
  const line = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.16 : 0.18}"`;
  return doc(60, 40, [
    `<g id="horizontal-line">${rect(0, 0, 32, 1, line)}</g>`,
    `<g id="vertical-line">${rect(40, 0, 1, 32, line)}</g>`,
  ].join('\n'), { style: colorStyle(t) });
}

// Frames for PC3 Frame and GroupBox (plain-), and raised- and sunken- for older plasmoids. Margins are Breeze's.
function frameSvg(t) {
  const stroke = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.16 : 0.18}"`;
  const fill = cls('Text', 0.03);
  return controlDoc(t, [
    block('plain-', { fill, stroke, r: 3, margins: { top: 6, bottom: 6, left: 6, right: 6 } }),
    block('raised-', { fill, stroke, r: 3, margins: { top: 6, bottom: 8, left: 6, right: 6 }, extra: bevel(t, { raised: true }) }),
    block('sunken-', { fill, stroke, r: 3, margins: { top: 6, bottom: 6, left: 6, right: 6 }, extra: bevel(t, { raised: false }) }),
    () => `<rect id="hint-tile-center" x="200" y="10" width="2" height="2" fill="#f0f" opacity=".001"/>`,
  ]);
}

// --- package ---------------------------------------------------------------------------------------------

/** The desktop theme's id for a variant: Ink keeps the plain name the theme has always had. */
export const desktopThemeId = (t) => (t.id === 'ink' ? 'innerpulse' : `innerpulse-${t.id}`);

export function plasmaTheme(t, version) {
  const files = surfaces(t);
  files['widgets/tasks.svg'] = tasks(t);
  files['widgets/viewitem.svg'] = viewitem(t);
  files['widgets/button.svg'] = buttonSvg(t);
  files['widgets/lineedit.svg'] = lineeditSvg(t);
  files['widgets/tabbar.svg'] = tabbarSvg(t);
  files['widgets/listitem.svg'] = listitem(t);
  files['widgets/checkmarks.svg'] = checkmarksSvg(t);
  files['widgets/radiobutton.svg'] = radiobuttonSvg(t);
  files['widgets/bar_meter_horizontal.svg'] = barMeterSvg(t);
  files['widgets/bar_meter_vertical.svg'] = barMeterSvg(t);
  files['widgets/slider.svg'] = sliderSvg(t);
  files['widgets/switch.svg'] = switchSvg(t);
  files['widgets/scrollbar.svg'] = scrollbarSvg(t);
  files['widgets/pager.svg'] = pagerSvg(t);
  files['widgets/plasmoidheading.svg'] = headingSvg(t);
  files['widgets/busywidget.svg'] = busywidgetSvg(t);
  files['widgets/action-overlays.svg'] = actionOverlaysSvg(t);
  files['widgets/line.svg'] = lineSvg(t);
  files['widgets/frame.svg'] = frameSvg(t);
  // the theme picker lists all three, so each carries its variant's name (Ink keeps the id it always had)
  files['metadata.json'] = JSON.stringify({
    KPlugin: {
      Authors: [{ Name: 'innerpulse', Email: '' }],
      Category: '',
      Description: `The innerpulse instrument theme: machined corners, hairlines and one ember signal. Glass tuned for ${t.name}; colors follow the active color scheme.`,
      EnabledByDefault: true,
      Id: desktopThemeId(t),
      License: 'MIT',
      Name: t.name,
      Version: version,
      Website: 'https://www.innerpulse.net',
    },
    KPackageStructure: 'Plasma/Theme',
    'X-Plasma-API': '5.0',
  }, null, 4) + '\n';
  files.plasmarc = `[Settings]
FallbackTheme=default

[ContrastEffect]
enabled=true
contrast=0.9
intensity=1.0
saturation=1.0

[AdaptiveTransparency]
enabled=true
`;
  return files;
}
