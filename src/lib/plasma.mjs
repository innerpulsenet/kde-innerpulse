// The Plasma desktop theme "innerpulse". One theme serves Ink and Paper: every paint goes through
// ColorScheme-* classes, so Plasma recolors it from whichever color scheme is active.
//
// What it draws itself (everything else falls back to Breeze, which also follows the color scheme):
//   panel        the header ground, a hairline, and a faint graduated scale along the long edges
//   dialogs      popups on the window ground, hairline ring, soft shadow, one ember index tick at top left
//   tooltips     the same, one step lighter, no tick
//   widgets      desktop widget cards
//   tasks        task manager states: running, focused (ember bar on the panel side), attention, minimized
//   viewitem     list highlights in menus and launchers: the index turns ember on hover
import { frame, maskFrame, shadowFrame, hints, doc, colorStyle, rect, spacer, n, quarter } from './svg.mjs';

const cls = (c, op = 1) => `class="ColorScheme-${c}" fill="currentColor"${op < 1 ? ` opacity="${n(op)}"` : ''}`;

// --- frames with shadows and blur masks ----------------------------------------------------------------

// Glass, after Oxygen's polish and the brand's frosted panel: the surface is lit from above. A sheen falls
// from the top edge through the top row of cells, a 1 px highlight lip runs just inside the top hairline, and a
// faint shade sits inside the bottom edge, so each surface reads as a slab with a bevel. All of it is white or
// black at low alpha, never ember, and it lives only in the top and bottom rows, which tile horizontally, so it
// holds at any width.
const GLASS = {
  ink: { sheen: 0.075, lip: 0.13, shade: 0.35 },
  paper: { sheen: 0.55, lip: 0.85, shade: 0.07 },
  carbon: { sheen: 0.09, lip: 0.17, shade: 0.4 },
};

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

function framedSurface(t, { bg, alpha, r = 4, cell = 8, margins, tick = false, scale = false, shadow = true, shadowReach = 22, shadowDy = 6, shadowAlpha, glass = true }) {
  const W = 32, H = 32;
  const fill = cls(bg, alpha);
  const stroke = `class="ColorScheme-Text" fill="currentColor" opacity="${t.dark ? 0.16 : 0.18}"`;
  const extra = (name, c, f) => {
    let s = glass ? glassPaint(t, name, c, f, r, 1) : '';
    // the index tick: one short ember bar along the top edge, just inside the corner, like a cursor on a scale
    if (tick && name === 'topleft') s += rect(c.x + r + 2, c.y, Math.min(12, c.w - r - 2), 2, cls('ButtonFocus'));
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
    hints('', margins, 30 + 2 * span, 10),
  ];
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
  // translucent/ is what Plasma uses when the compositor blurs behind: frosted glass, about three quarters ground
  const variants = [['', 1], ['translucent/', t.dark ? 0.74 : 0.78], ['solid/', 1], ['opaque/', 1]];
  for (const [dir, a] of variants) {
    files[`${dir}widgets/panel-background.svg`] = framedSurface(t, { bg: 'HeaderBackground', alpha: a, cell: 14, margins: panelM, scale: true, shadowReach: 16, shadowDy: 2, shadowAlpha: t.shadowAlpha * 0.7 });
    files[`${dir}dialogs/background.svg`] = framedSurface(t, { bg: 'Background', alpha: a, cell: 20, margins: dialogM, tick: true, shadowDy: 3 });
    files[`${dir}widgets/tooltip.svg`] = framedSurface(t, { bg: 'Background', alpha: a, margins: { top: 6, bottom: 6, left: 8, right: 8 }, shadowReach: 14, shadowDy: 2 });
    files[`${dir}widgets/background.svg`] = framedSurface(t, { bg: 'Background', alpha: dir === 'translucent/' ? a : 1, cell: 20, margins: { top: 10, bottom: 10, left: 10, right: 10 }, tick: true, shadowReach: 18, shadowDy: 3 });
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

// --- package ---------------------------------------------------------------------------------------------

export function plasmaTheme(t, version) {
  const files = surfaces(t);
  files['widgets/tasks.svg'] = tasks(t);
  files['widgets/viewitem.svg'] = viewitem(t);
  files['metadata.json'] = JSON.stringify({
    KPlugin: {
      Authors: [{ Name: 'innerpulse', Email: '' }],
      Category: '',
      Description: 'The innerpulse instrument theme: machined corners, hairlines and one ember signal. Follows the active color scheme.',
      EnabledByDefault: true,
      Id: 'innerpulse',
      License: 'MIT',
      Name: 'innerpulse',
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
