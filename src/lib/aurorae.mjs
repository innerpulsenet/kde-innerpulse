// Aurorae window decorations: innerpulse-ink and innerpulse-paper.
//
// The title bar is the header ground (ink on Ink), a hairline rings the window, the corners are machined
// (4 px), and the active window carries one ember index tick at the top left of its title bar: the same tick
// the popups carry, so "where the focus is" reads the same everywhere. Inactive windows drop the tick.
// Buttons are flat glyphs that lift onto a machined tile on hover; close lifts onto the action red.
import { n, spacer, rect, doc } from './svg.mjs';

const PAD = 20; // shadow padding on every side (uniform, so the shadow slices meet without seams)
const BORDER = 2; // visible side and bottom border (hairline + 1 px of ground)
const TITLE = 30;
const EDGE_T = 3, EDGE_B = 3;
const CORNER = 28; // the corner slices reach this far into the frame, wide enough for the index tick
const R = 4;

const LAYOUT = {
  BorderLeft: BORDER, BorderRight: BORDER, BorderBottom: BORDER,
  TitleEdgeTop: EDGE_T, TitleEdgeBottom: EDGE_B, TitleEdgeLeft: 10, TitleEdgeRight: 6,
  TitleEdgeTopMaximized: 0, TitleEdgeBottomMaximized: 0, TitleEdgeLeftMaximized: 6, TitleEdgeRightMaximized: 2,
  TitleBorderLeft: 10, TitleBorderRight: 10, TitleHeight: TITLE,
  ButtonWidth: 28, ButtonHeight: 24, ButtonSpacing: 2, ButtonMarginTop: 3, ExplicitButtonSpacer: 10,
  PaddingTop: PAD, PaddingBottom: PAD, PaddingLeft: PAD, PaddingRight: PAD,
};

// --- the decoration frame -------------------------------------------------------------------------------

function shadowDefs(uid, x0, y0, w, h, rgb, alpha) {
  // Frame F sits PAD inside the virtual slice grid. Shadow regions: four bands and four corner squares, each
  // with its own gradient in document space, so every slice that cuts through a region continues it exactly.
  const [r, g, b] = rgb;
  const stop = (o, k) => `<stop offset="${n(o)}" stop-color="rgb(${r},${g},${b})" stop-opacity="${n(alpha * k)}"/>`;
  const fall = (o0) => [stop(o0, 1), stop(o0 + (1 - o0) * 0.2, 0.55), stop(o0 + (1 - o0) * 0.45, 0.22), stop(o0 + (1 - o0) * 0.72, 0.06), stop(1, 0)].join('');
  const F = { x0: x0 + PAD, y0: y0 + PAD, x1: x0 + w - PAD, y1: y0 + h - PAD };
  const defs = [
    `<linearGradient id="${uid}-t" gradientUnits="userSpaceOnUse" x1="0" y1="${n(F.y0)}" x2="0" y2="${n(F.y0 - PAD)}">${fall(0)}</linearGradient>`,
    `<linearGradient id="${uid}-b" gradientUnits="userSpaceOnUse" x1="0" y1="${n(F.y1)}" x2="0" y2="${n(F.y1 + PAD)}">${fall(0)}</linearGradient>`,
    `<linearGradient id="${uid}-l" gradientUnits="userSpaceOnUse" x1="${n(F.x0)}" y1="0" x2="${n(F.x0 - PAD)}" y2="0">${fall(0)}</linearGradient>`,
    `<linearGradient id="${uid}-r" gradientUnits="userSpaceOnUse" x1="${n(F.x1)}" y1="0" x2="${n(F.x1 + PAD)}" y2="0">${fall(0)}</linearGradient>`,
  ];
  const corners = {
    tl: [F.x0 + R, F.y0 + R], tr: [F.x1 - R, F.y0 + R], bl: [F.x0 + R, F.y1 - R], br: [F.x1 - R, F.y1 - R],
  };
  for (const [k, [cx, cy]] of Object.entries(corners)) {
    defs.push(`<radialGradient id="${uid}-${k}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(PAD + R)}">${fall(R / (PAD + R))}</radialGradient>`);
  }
  // regions as [x, y, w, h, gradient]
  const regions = [
    [F.x0 + R, F.y0 - PAD, F.x1 - F.x0 - 2 * R, PAD, 't'],
    [F.x0 + R, F.y1, F.x1 - F.x0 - 2 * R, PAD, 'b'],
    [F.x0 - PAD, F.y0 + R, PAD, F.y1 - F.y0 - 2 * R, 'l'],
    [F.x1, F.y0 + R, PAD, F.y1 - F.y0 - 2 * R, 'r'],
    [F.x0 - PAD, F.y0 - PAD, PAD + R, PAD + R, 'tl'],
    [F.x1 - R, F.y0 - PAD, PAD + R, PAD + R, 'tr'],
    [F.x0 - PAD, F.y1 - R, PAD + R, PAD + R, 'bl'],
    [F.x1 - R, F.y1 - R, PAD + R, PAD + R, 'br'],
  ];
  return { defs: defs.join(''), regions, F };
}

function clipRect(a, c) {
  const x0 = Math.max(a[0], c.x), y0 = Math.max(a[1], c.y);
  const x1 = Math.min(a[0] + a[2], c.x + c.w), y1 = Math.min(a[1] + a[3], c.y + c.h);
  return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
}

// One state of the decoration (prefix 'decoration-', 'decoration-inactive-', 'decoration-maximized-' …) as
// nine slices laid out contiguously at (x, y). Maximized states have no shadow, border or corner.
function decorationState(t, prefix, x, y, { active, maximized }, uid) {
  const L = maximized ? CORNER : PAD + CORNER, T = maximized ? CORNER : PAD + CORNER;
  const W = 16, H = 16;
  const w = 2 * L + W, h = 2 * T + H;
  const head = active ? t.headActive : t.headInactive;
  const line = `fill="rgb(${t.lineRGB.join(',')})" fill-opacity="${active ? (t.dark ? 0.16 : 0.2) : (t.dark ? 0.10 : 0.14)}"`;
  const fillA = `fill="${head}"`;
  const pad = maximized ? 0 : PAD;
  const F = { x0: x + pad, y0: y + pad, x1: x + w - pad, y1: y + h - pad };
  const sh = maximized ? null : shadowDefs(`${uid}`, x, y, w, h, t.shadow, active ? t.shadowAlpha : t.shadowAlpha * 0.6);
  const cols = [x, x + L, x + L + W], rows = [y, y + T, y + T + H], ws = [L, W, L], hs = [T, H, T];
  const names = ['topleft', 'top', 'topright', 'left', 'center', 'right', 'bottomleft', 'bottom', 'bottomright'];
  const out = [];
  names.forEach((name, k) => {
    const ci = k % 3, ri = Math.floor(k / 3);
    const c = { x: cols[ci], y: rows[ri], w: ws[ci], h: hs[ri] };
    const parts = [spacer(c.x, c.y, c.w, c.h)];
    if (sh) for (const reg of sh.regions) {
      const cr = clipRect(reg, c);
      if (cr) parts.push(rect(...cr, `fill="url(#${uid}-${reg[4]})"`));
    }
    // The frame inside this cell, as a rounded rect clipped by hand: corner cells get the arc.
    const fx0 = Math.max(F.x0, c.x), fy0 = Math.max(F.y0, c.y), fx1 = Math.min(F.x1, c.x + c.w), fy1 = Math.min(F.y1, c.y + c.h);
    if (fx1 > fx0 && fy1 > fy0) {
      const corner = !maximized && ci !== 1 && ri !== 1;
      const b = maximized ? 0 : 1;
      if (corner) {
        // rounded outer corner: draw ring + fill as paths over the clipped rect
        const sx = ci === 0 ? 1 : -1, sy = ri === 0 ? 1 : -1;
        const cx = sx > 0 ? F.x0 : F.x1, cy = sy > 0 ? F.y0 : F.y1;
        const P = (u, v) => `${n(cx + sx * u)},${n(cy + sy * v)}`;
        const sweep = sx * sy > 0 ? 0 : 1;
        const ext = Math.min(fx1 - fx0, fy1 - fy0);
        const outer = `M${P(ext, 0)}L${P(R, 0)}A${R} ${R} 0 0 ${sweep} ${P(0, R)}L${P(0, ext)}L${P(ext, ext)}Z`;
        const ri2 = R - b;
        const inner = `M${P(ext, b)}L${P(R, b)}A${ri2} ${ri2} 0 0 ${sweep} ${P(b, R)}L${P(b, ext)}L${P(ext, ext)}Z`;
        // ground under the whole corner first, then the ring over it, as on the edges: the hairline is
        // always a tint on the title bar, never a gap the desktop shows through
        parts.push(`<path d="${outer}" ${fillA}/>`, `<path d="${outer}${inner}" fill-rule="evenodd" ${line}/>`);
        // the rest of the corner cell beyond the arc square: straight ring along the outer edges + fill
        const cw = fx1 - fx0, chh = fy1 - fy0;
        if (cw > ext) { // wider than tall: extend along the horizontal outer edge
          const ex = sx > 0 ? fx0 + ext : fx0, ew = cw - ext;
          const ey = sy > 0 ? fy0 : fy1 - ext;
          parts.push(rect(ex, sy > 0 ? ey : ey + ext - b, ew, b, line), rect(ex, sy > 0 ? ey + b : ey, ew, ext - b, fillA));
        }
        if (chh > ext) {
          const ey = sy > 0 ? fy0 + ext : fy0, eh = chh - ext;
          parts.push(rect(sx > 0 ? fx0 : fx1 - b, ey, b, eh, line), rect(sx > 0 ? fx0 + b : fx0, ey, cw - b, eh, fillA));
        }
        if (cw > ext && chh > ext) {
          parts.push(rect(sx > 0 ? fx0 + ext : fx0, sy > 0 ? fy0 + ext : fy0, cw - ext, chh - ext, fillA));
        }
      } else {
        parts.push(rect(fx0, fy0, fx1 - fx0, fy1 - fy0, fillA));
        if (b) {
          if (ri === 0 && fy0 === F.y0) parts.push(rect(fx0, fy0, fx1 - fx0, b, line));
          if (ri === 2 && fy1 === F.y1) parts.push(rect(fx0, fy1 - b, fx1 - fx0, b, line));
          if (ci === 0 && fx0 === F.x0) parts.push(rect(fx0, fy0, b, fy1 - fy0, line));
          if (ci === 2 && fx1 === F.x1) parts.push(rect(fx1 - b, fy0, b, fy1 - fy0, line));
        }
      }
      // glass, after Oxygen: the title bar is lit from above (a sheen through the top row and a 1 px lip just
      // inside the hairline), and a faint shade sits inside the bottom edge
      const gl = t.id === 'carbon' ? { lip: active ? 0.2 : 0.09 } : t.dark ? { lip: active ? 0.13 : 0.07 } : { lip: active ? 0.9 : 0.6 };
      if (ri === 0) {
        const b1 = maximized ? 0 : 1;
        if (ci === 1) {
          parts.push(rect(fx0, fy0 + b1, fx1 - fx0, fy1 - fy0 - b1, `fill="url(#${uid}-sheen)"`));
          parts.push(rect(fx0, fy0 + b1, fx1 - fx0, 1, `fill="#fff" fill-opacity="${gl.lip}"`));
        } else {
          const sx = ci === 0 ? 1 : -1, cx = sx > 0 ? F.x0 : F.x1;
          const P = (u, v) => `${n(cx + sx * u)},${n(F.y0 + v)}`;
          const sweep = sx > 0 ? 0 : 1, ext = Math.min(fx1 - fx0, fy1 - fy0), rr = maximized ? 0 : R - 1;
          const d = rr > 0
            ? `M${P(ext, b1)}L${P(R, b1)}A${rr} ${rr} 0 0 ${sweep} ${P(b1, R)}L${P(b1, ext)}L${P(ext, ext)}Z`
            : `M${P(ext, 0)}L${P(0, 0)}L${P(0, ext)}L${P(ext, ext)}Z`;
          parts.push(`<path d="${d}" fill="url(#${uid}-sheen)"/>`);
          const lx = sx > 0 ? F.x0 + (maximized ? 0 : R) : fx0;
          parts.push(rect(lx, F.y0 + b1, fx1 - fx0 - (maximized ? 0 : R), 1, `fill="#fff" fill-opacity="${gl.lip}"`));
        }
      }
      if (ri === 2 && !maximized) {
        const x0 = ci === 0 ? F.x0 + R : fx0, x1 = ci === 2 ? F.x1 - R : fx1;
        parts.push(rect(x0, F.y1 - 2, x1 - x0, 1, `fill="#000" fill-opacity="${t.dark ? 0.3 : 0.06}"`));
      }
      // the index tick: active windows only, along the top edge just past the corner's curve
      if (name === 'topleft' && active) parts.push(rect(F.x0 + R + 4, F.y0, 14, 2, `fill="${t.mark}"`));
    }
    out.push(`<g id="${prefix}${name}">${parts.join('')}</g>`);
  });
  // carbon's title bar is polished steel: a brighter sheen than ink's
  const sheenA = t.id === 'carbon' ? (active ? 0.11 : 0.05) : t.dark ? (active ? 0.07 : 0.035) : (active ? 0.55 : 0.3);
  const sheen = `<linearGradient id="${uid}-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${sheenA}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  return { body: out.join('\n'), defs: (sh ? sh.defs : '') + sheen, w, h };
}

function maskState(prefix, x, y) {
  // Blur mask: the window's frame shape, solid
  const L = PAD + CORNER, W = 16;
  const names = ['topleft', 'top', 'topright', 'left', 'center', 'right', 'bottomleft', 'bottom', 'bottomright'];
  const cols = [x, x + L, x + L + W], ws = [L, W, L];
  return names.map((name, k) => {
    const ci = k % 3, ri = Math.floor(k / 3);
    const c = { x: cols[ci], y: cols[ri] - x + y, w: ws[ci], h: ws[ri] };
    const fx0 = ci === 0 ? c.x + PAD : c.x, fx1 = ci === 2 ? c.x + c.w - PAD : c.x + c.w;
    const fy0 = ri === 0 ? c.y + PAD : c.y, fy1 = ri === 2 ? c.y + c.h - PAD : c.y + c.h;
    return `<g id="${prefix}${name}">${spacer(c.x, c.y, c.w, c.h)}${rect(fx0, fy0, fx1 - fx0, fy1 - fy0, 'fill="#000"')}</g>`;
  }).join('\n');
}

function decorationSVG(t) {
  const states = [
    ['decoration-', { active: true, maximized: false }],
    ['decoration-inactive-', { active: false, maximized: false }],
    ['decoration-maximized-', { active: true, maximized: true }],
    ['decoration-maximized-inactive-', { active: false, maximized: true }],
  ];
  let x = 0, defs = '', body = [];
  states.forEach(([p, s], i) => {
    const r = decorationState(t, p, x, 0, s, `sh${i}`);
    defs += r.defs; body.push(r.body); x += r.w + 20;
  });
  body.push(maskState('mask-', x, 0));
  return doc(x + 2 * (PAD + CORNER) + 16 + 10, 2 * (PAD + CORNER) + 16, body.join('\n'), { defs });
}

// --- buttons --------------------------------------------------------------------------------------------

const BW = LAYOUT.ButtonWidth, BH = LAYOUT.ButtonHeight;
const GLYPH = {
  close: 'M9 7 L19 17 M19 7 L9 17',
  minimize: 'M9 12 L19 12',
  maximize: 'M9.5 7.5 h9 v9 h-9 z',
  restore: 'M9.5 10 h7 v7 h-7 z M12 10 v-2.5 h7 v7 h-2.5',
  alldesktops: 'M10 8 h3 v3 h-3 z M15 8 h3 v3 h-3 z M10 13 h3 v3 h-3 z M15 13 h3 v3 h-3 z',
  keepabove: 'M9 14 L14 9 L19 14',
  keepbelow: 'M9 10 L14 15 L19 10',
  shade: 'M9 8 L19 8 M9 15 L14 11 L19 15',
  help: 'M11.2 9.6 C11.4 8 12.6 7 14.2 7 C16 7 17.2 8.2 17.2 9.7 C17.2 12 14.2 12 14.2 14.4 M14.2 16.6 L14.2 17.2',
};

function buttonSVG(t, kind) {
  const isClose = kind === 'close';
  // [prefix, glyph color, tile fill or null, tile opacity]
  const st = [
    ['active', t.text2, null],
    ['inactive', t.text3, null],
    ['hover', isClose ? '#ffffff' : t.text, isClose ? t.action : `rgb(${t.lineRGB.join(',')})`, isClose ? 1 : (t.dark ? 0.1 : 0.1)],
    ['hover-inactive', isClose ? '#ffffff' : t.text, isClose ? t.action : `rgb(${t.lineRGB.join(',')})`, isClose ? 1 : (t.dark ? 0.1 : 0.1)],
    ['pressed', isClose ? '#ffffff' : t.text, isClose ? '#bd2417' : `rgb(${t.lineRGB.join(',')})`, isClose ? 1 : (t.dark ? 0.16 : 0.16)],
    ['pressed-inactive', isClose ? '#ffffff' : t.text, isClose ? '#bd2417' : `rgb(${t.lineRGB.join(',')})`, isClose ? 1 : (t.dark ? 0.16 : 0.16)],
    ['deactivated', t.disabled, null],
  ];
  const filled = kind === 'alldesktops';
  const body = st.map(([p, color, tile, op], i) => {
    const x = i * (BW + 6);
    // a lifted tile is glass: its fill, a sheen over the top half, a highlight lip and a shade at the foot
    const pressed = p.startsWith('pressed');
    const tileSvg = tile
      ? `<rect x="${x + 1}" y="1" width="${BW - 2}" height="${BH - 2}" rx="${R}" fill="${tile}" fill-opacity="${op}"/>` +
        `<rect x="${x + 1}" y="1" width="${BW - 2}" height="${(BH - 2) / 2}" rx="${R}" fill="url(#bsheen${pressed ? 'p' : ''})"/>` +
        `<rect x="${x + 1 + R}" y="1.5" width="${BW - 2 - 2 * R}" height="1" fill="#fff" fill-opacity="${isClose ? 0.35 : (t.dark ? 0.16 : 0.7)}"/>` +
        `<rect x="${x + 1 + R}" y="${BH - 2.5}" width="${BW - 2 - 2 * R}" height="1" fill="#000" fill-opacity="${isClose ? 0.25 : (t.dark ? 0.35 : 0.08)}"/>`
      : '';
    const g = filled
      ? `<path transform="translate(${x} 0)" d="${GLYPH[kind]}" fill="${color}"/>`
      : `<path transform="translate(${x} 0)" d="${GLYPH[kind]}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/>`;
    return `<g id="${p}-center">${spacer(x, 0, BW, BH)}${tileSvg}${g}</g>`;
  }).join('\n');
  const top = isClose ? 0.28 : (t.dark ? 0.1 : 0.6);
  const defs = `<linearGradient id="bsheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${top}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="bsheenp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${n(top * 0.4)}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  return doc(st.length * (BW + 6), BH, body, { defs });
}

// --- package ---------------------------------------------------------------------------------------------

export function auroraeTheme(t, version) {
  const id = `innerpulse-${t.id}`;
  const tt = { ...t, headActive: t.dark ? t.ground : t.s2, headInactive: t.dark ? t.s1 : t.s1 };
  const files = {};
  files['decoration.svg'] = decorationSVG(tt);
  for (const kind of Object.keys(GLYPH)) files[`${kind}.svg`] = buttonSVG(tt, kind);
  files['metadata.desktop'] = `[Desktop Entry]
Name=${t.name}
Comment=innerpulse window decoration: machined corners, a hairline and one ember index tick on the active window
X-KDE-PluginInfo-Author=innerpulse
X-KDE-PluginInfo-Email=
X-KDE-PluginInfo-Name=${id}
X-KDE-PluginInfo-Version=${version}
X-KDE-PluginInfo-Website=https://www.innerpulse.net
X-KDE-PluginInfo-Category=
X-KDE-PluginInfo-License=MIT
X-KDE-PluginInfo-EnabledByDefault=true
`;
  const hex = (h) => h;
  files[`${id}rc`] = `[General]
ActiveTextColor=${hex(t.text)}
InactiveTextColor=${hex(t.text3)}
TitleAlignment=Left
TitleVerticalAlignment=Center
Animation=180
UseTextShadow=false
Shadow=true
HaloActive=false
HaloInactive=false

[Layout]
${Object.entries(LAYOUT).map(([k, v]) => `${k}=${v}`).join('\n')}
`;
  return { id, files };
}

export const auroraeLayout = { PAD, BORDER, TITLE, EDGE_T, EDGE_B, CORNER, R, ...LAYOUT };
