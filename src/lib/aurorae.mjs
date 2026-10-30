// Aurorae window decorations: innerpulse-ink, innerpulse-paper and innerpulse-carbon, each also as an opt-in
// innerpulse-<variant>-frosted (install.sh --frosted-titlebar) whose active title bar is translucent glass.
//
// The title bar is the header ground (ink on Ink), a hairline rings the window, the corners are machined
// (4 px), and the active window carries one ember index tick at the top left of its title bar: the same tick
// the popups carry (glass.mjs TICK), so "where the focus is" reads the same everywhere. Inactive windows drop
// the tick. Buttons are flat glyphs that lift onto a machined tile on hover; close lifts onto the action red.
//
// Maximized windows: Aurorae paints decoration-maximized(-inactive) with FrameSvg NoBorder, so only the center
// slice is drawn, stretched across the screen. That slice is the whole 30 px title bar (sheen, lip and a foot
// line), with no shadow, border or corners, and no tick: a tick can't live in a slice that stretches, and a
// stretched ember bar would break the reserve on ember. Active vs inactive is the caption color and a stronger
// foot line.
//
// Animation: Aurorae's QML (/usr/share/kwin/aurorae/*.qml) uses the rc's Animation= value as is and ignores KDE's
// AnimationDurationFactor, so install.sh --apply rescales it from the current animation speed (0 = instant).
// That is a snapshot: after moving the speed slider, run --apply again.
import { n, spacer, rect, doc, maskFrame, SHADOW_STOPS } from './svg.mjs';
import { GLASS, TITLE_GLASS, TICK } from './glass.mjs';

// The shadow is modeled like a CSS box-shadow, lit from above as Plasma's popups are: the frame's box shifted
// down by dy, blurred out by reach. Aurorae's padding is per theme, not per state, so it is sized for the
// active shadow and the inactive one (shorter, less offset) fits inside it.
const SHADOW = { reach: 28, dy: 6 };
const SHADOW_INACTIVE = { reach: 18, dy: 3, k: 0.55 };
const PAD_T = SHADOW.reach - SHADOW.dy, PAD_B = SHADOW.reach + SHADOW.dy, PAD_X = SHADOW.reach;
// visible side and bottom border (hairline + 3 px of ground); also the side/bottom resize target, since Aurorae
// adds no resize-only margin at the default border size
const BORDER = 4;
const TITLE = 30;
const EDGE_T = 3, EDGE_B = 3;
const TOP = EDGE_T + TITLE + EDGE_B; // the title bar, all of it in the top row of slices
const CORNER = 28; // the corner slices reach this far into the frame, wide enough for the index tick
const R = 4;
const BOT = BORDER + R + 2; // the bottom row's share of the frame: the border plus room for the corner's arc
const MENU_W = 18; // the window-menu button: Kirigami rounds the app icon in it down to 16 px

const LAYOUT = {
  BorderLeft: BORDER, BorderRight: BORDER, BorderBottom: BORDER,
  // TitleEdgeLeft puts the window-menu icon (ButtonWidthMenu wide) centered under the index tick
  TitleEdgeTop: EDGE_T, TitleEdgeBottom: EDGE_B, TitleEdgeLeft: R + TICK.gap + TICK.length / 2 - MENU_W / 2, TitleEdgeRight: 6,
  // maximized: buttons run to the screen edges, so a throw to a top corner lands on them
  TitleEdgeTopMaximized: 0, TitleEdgeBottomMaximized: 0, TitleEdgeLeftMaximized: 0, TitleEdgeRightMaximized: 0,
  TitleBorderLeft: 10, TitleBorderRight: 10, TitleHeight: TITLE,
  // buttons are the full title height and touch, so the whole strip clicks; the visible tile sits inside
  ButtonWidth: 30, ButtonHeight: 30, ButtonWidthMenu: MENU_W, ButtonSpacing: 0, ButtonMarginTop: 0, ButtonMarginTopMaximized: 0,
  ExplicitButtonSpacer: 10,
  PaddingTop: PAD_T, PaddingBottom: PAD_B, PaddingLeft: PAD_X, PaddingRight: PAD_X,
};
const TITLE_MAX = LAYOUT.TitleEdgeTopMaximized + TITLE + LAYOUT.TitleEdgeBottomMaximized;

// --- the decoration frame -------------------------------------------------------------------------------

// rect a minus rect b, as up to four rects
function subtract(a, b) {
  const [ax, ay, aw, ah, ...rest] = a, ax1 = ax + aw, ay1 = ay + ah;
  const bx0 = Math.max(ax, b[0]), by0 = Math.max(ay, b[1]), bx1 = Math.min(ax1, b[0] + b[2]), by1 = Math.min(ay1, b[1] + b[3]);
  if (bx1 <= bx0 || by1 <= by0) return [a];
  const out = [];
  if (by0 > ay) out.push([ax, ay, aw, by0 - ay, ...rest]);
  if (by1 < ay1) out.push([ax, by1, aw, ay1 - by1, ...rest]);
  if (bx0 > ax) out.push([ax, by0, bx0 - ax, by1 - by0, ...rest]);
  if (bx1 < ax1) out.push([bx1, by0, ax1 - bx1, by1 - by0, ...rest]);
  return out;
}

function shadowDefs(uid, F, rgb, alpha, { reach, dy }, frosted) {
  // S is the frame's box pushed down by dy. Shadow regions: four bands, four corner squares and S's solid inside,
  // each with its own paint in document space, so every slice that cuts through a region continues it exactly.
  // Nothing paints under the frame except its corner squares, where the gap outside the arc needs the shadow.
  // Under a frosted title bar even that would show through, so there the top corners get only the gap.
  const [r, g, b] = rgb;
  const S = { x0: F.x0, y0: F.y0 + dy, x1: F.x1, y1: F.y1 + dy };
  const sw = S.x1 - S.x0, sh = S.y1 - S.y0;
  const stop = (o, k) => `<stop offset="${n(o)}" stop-color="rgb(${r},${g},${b})" stop-opacity="${n(alpha * k)}"/>`;
  const fall = (o0) => SHADOW_STOPS.map(([o, k]) => stop(o0 + (1 - o0) * o, k)).join('');
  const defs = [
    `<linearGradient id="${uid}-t" gradientUnits="userSpaceOnUse" x1="0" y1="${n(S.y0)}" x2="0" y2="${n(S.y0 - reach)}">${fall(0)}</linearGradient>`,
    `<linearGradient id="${uid}-b" gradientUnits="userSpaceOnUse" x1="0" y1="${n(S.y1)}" x2="0" y2="${n(S.y1 + reach)}">${fall(0)}</linearGradient>`,
    `<linearGradient id="${uid}-l" gradientUnits="userSpaceOnUse" x1="${n(S.x0)}" y1="0" x2="${n(S.x0 - reach)}" y2="0">${fall(0)}</linearGradient>`,
    `<linearGradient id="${uid}-r" gradientUnits="userSpaceOnUse" x1="${n(S.x1)}" y1="0" x2="${n(S.x1 + reach)}" y2="0">${fall(0)}</linearGradient>`,
  ];
  const corners = {
    tl: [S.x0 + R, S.y0 + R], tr: [S.x1 - R, S.y0 + R], bl: [S.x0 + R, S.y1 - R], br: [S.x1 - R, S.y1 - R],
  };
  for (const [k, [cx, cy]] of Object.entries(corners)) {
    defs.push(`<radialGradient id="${uid}-${k}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(reach + R)}">${fall(R / (reach + R))}</radialGradient>`);
  }
  const solid = `fill="rgb(${r},${g},${b})" fill-opacity="${n(alpha)}"`;
  // regions as [x, y, w, h, paint]
  let regions = [
    [S.x0 + R, S.y0 - reach, sw - 2 * R, reach, 't'],
    [S.x0 + R, S.y1, sw - 2 * R, reach, 'b'],
    [S.x0 - reach, S.y0 + R, reach, sh - 2 * R, 'l'],
    [S.x1, S.y0 + R, reach, sh - 2 * R, 'r'],
    [S.x0 - reach, S.y0 - reach, reach + R, reach + R, 'tl'],
    [S.x1 - R, S.y0 - reach, reach + R, reach + R, 'tr'],
    [S.x0 - reach, S.y1 - R, reach + R, reach + R, 'bl'],
    [S.x1 - R, S.y1 - R, reach + R, reach + R, 'br'],
    [S.x0 + R, S.y0, sw - 2 * R, sh, null],
    [S.x0, S.y0 + R, R, sh - 2 * R, null],
    [S.x1 - R, S.y0 + R, R, sh - 2 * R, null],
  ];
  const fw = F.x1 - F.x0, fh = F.y1 - F.y0;
  const cover = [[F.x0 + R, F.y0, fw - 2 * R, fh], [F.x0, F.y0 + R, R, fh - 2 * R], [F.x1 - R, F.y0 + R, R, fh - 2 * R]];
  if (frosted) cover.push([F.x0, F.y0, R, R], [F.x1 - R, F.y0, R, R]);
  for (const c of cover) regions = regions.flatMap((a) => subtract(a, c));
  regions = regions.map(([x, y, w, h, k]) => [x, y, w, h, k ? `fill="url(#${uid}-${k})"` : solid]);
  // the gaps outside the top corners' arcs, as paths (frosted only; otherwise the squares above cover them)
  const gaps = !frosted ? {} : {
    topleft: `<path d="M${n(F.x0)},${n(F.y0)}L${n(F.x0 + R)},${n(F.y0)}A${R} ${R} 0 0 0 ${n(F.x0)},${n(F.y0 + R)}Z" fill="url(#${uid}-tl)"/>`,
    topright: `<path d="M${n(F.x1)},${n(F.y0)}L${n(F.x1 - R)},${n(F.y0)}A${R} ${R} 0 0 1 ${n(F.x1)},${n(F.y0 + R)}Z" fill="url(#${uid}-tr)"/>`,
  };
  return { defs: defs.join(''), regions, gaps };
}

function clipRect(a, c) {
  const x0 = Math.max(a[0], c.x), y0 = Math.max(a[1], c.y);
  const x1 = Math.min(a[0] + a[2], c.x + c.w), y1 = Math.min(a[1] + a[3], c.y + c.h);
  return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
}

// A cw x ch rect with its outer corner (cx, cy) rounded by r, shrunk by `inset` along the two outer edges.
// sx, sy point into the cell. Returns path data.
function cornerPath(cx, cy, sx, sy, cw, ch, r, inset = 0) {
  const P = (u, v) => `${n(cx + sx * u)},${n(cy + sy * v)}`;
  const sweep = sx * sy > 0 ? 0 : 1, ri = r - inset;
  return `M${P(cw, inset)}L${P(r, inset)}A${n(ri)} ${n(ri)} 0 0 ${sweep} ${P(inset, r)}L${P(inset, ch)}L${P(cw, ch)}Z`;
}

const NAMES = ['topleft', 'top', 'topright', 'left', 'center', 'right', 'bottomleft', 'bottom', 'bottomright'];

// One restored state of the decoration (prefix 'decoration-' or 'decoration-inactive-') as nine slices laid out
// contiguously at (x, y). The top row is the title bar, exactly TOP tall, so the glass in it runs the full bar.
function decorationState(t, prefix, x, y, { active, frosted }, uid) {
  const L = PAD_X + CORNER, T = PAD_T + TOP, B = PAD_B + BOT;
  const W = 16, H = 16;
  const w = 2 * L + W, h = T + H + B;
  const head = active ? t.headActive : t.headInactive;
  const line = `fill="rgb(${t.lineRGB.join(',')})" fill-opacity="${active ? (t.dark ? 0.16 : 0.2) : (t.dark ? 0.10 : 0.14)}"`;
  const fillA = `fill="${head}"`;
  // the frosted title bar: only the active one, so inactive captions (text3) keep AA over any backdrop
  const fillT = frosted && active ? `fill="${head}" fill-opacity="${t.dark ? 0.88 : 0.9}"` : fillA;
  const F = { x0: x + PAD_X, y0: y + PAD_T, x1: x + w - PAD_X, y1: y + h - PAD_B };
  const sh = shadowDefs(`${uid}`, F, t.shadow, active ? t.shadowAlpha : t.shadowAlpha * SHADOW_INACTIVE.k, active ? SHADOW : SHADOW_INACTIVE, frosted && active);
  const cols = [x, x + L, x + L + W], rows = [y, y + T, y + T + H], ws = [L, W, L], hs = [T, H, B];
  const gl = TITLE_GLASS[t.id], ai = active ? 0 : 1;
  const out = [];
  NAMES.forEach((name, k) => {
    const ci = k % 3, ri = Math.floor(k / 3);
    const c = { x: cols[ci], y: rows[ri], w: ws[ci], h: hs[ri] };
    const parts = [spacer(c.x, c.y, c.w, c.h)];
    for (const reg of sh.regions) {
      const cr = clipRect(reg, c);
      if (cr) parts.push(rect(...cr, reg[4]));
    }
    if (sh.gaps[name]) parts.push(sh.gaps[name]);
    // The frame inside this cell, as a rounded rect clipped by hand: corner cells get the arc.
    const fx0 = Math.max(F.x0, c.x), fy0 = Math.max(F.y0, c.y), fx1 = Math.min(F.x1, c.x + c.w), fy1 = Math.min(F.y1, c.y + c.h);
    const fill = ri === 0 ? fillT : fillA;
    const b = 1;
    if (ci !== 1 && ri !== 1) {
      // ground under the whole corner first, then the ring over it, as on the edges: the hairline is
      // always a tint on the title bar, never a gap the desktop shows through
      const sx = ci === 0 ? 1 : -1, sy = ri === 0 ? 1 : -1;
      const cx = sx > 0 ? F.x0 : F.x1, cy = sy > 0 ? F.y0 : F.y1, cw = fx1 - fx0, ch = fy1 - fy0;
      parts.push(`<path d="${cornerPath(cx, cy, sx, sy, cw, ch, R)}" ${fill}/>`,
        `<path d="${cornerPath(cx, cy, sx, sy, cw, ch, R)}${cornerPath(cx, cy, sx, sy, cw, ch, R, b)}" fill-rule="evenodd" ${line}/>`);
    } else {
      parts.push(rect(fx0, fy0, fx1 - fx0, fy1 - fy0, fill));
      if (ri === 0) parts.push(rect(fx0, fy0, fx1 - fx0, b, line));
      if (ri === 2) parts.push(rect(fx0, fy1 - b, fx1 - fx0, b, line));
      if (ci === 0) parts.push(rect(fx0, fy0, b, fy1 - fy0, line));
      if (ci === 2) parts.push(rect(fx1 - b, fy0, b, fy1 - fy0, line));
    }
    // glass, after Oxygen: the title bar is lit from above (one sheen ramp over the whole bar and a 1 px lip
    // just inside the hairline), a 1 px foot line where it meets the window, and a faint shade inside the
    // window's bottom edge
    if (ri === 0) {
      if (ci === 1) parts.push(rect(fx0, fy0 + b, fx1 - fx0, fy1 - fy0 - b, `fill="url(#${uid}-sheen)"`));
      else {
        const sx = ci === 0 ? 1 : -1;
        parts.push(`<path d="${cornerPath(sx > 0 ? F.x0 : F.x1, F.y0, sx, 1, fx1 - fx0, fy1 - fy0, R, b)}" fill="url(#${uid}-sheen)"/>`);
      }
      // the lip starts where the corner's curve ends, so it never cuts across the arc
      const lx0 = ci === 0 ? F.x0 + R : fx0, lx1 = ci === 2 ? F.x1 - R : fx1;
      parts.push(rect(lx0, F.y0 + b, lx1 - lx0, 1, `fill="#fff" fill-opacity="${gl.lip[ai]}"`));
      // the foot runs inside the side hairlines: there is no arc down here
      const ox0 = ci === 0 ? F.x0 + b : fx0, ox1 = ci === 2 ? F.x1 - b : fx1;
      parts.push(rect(ox0, F.y0 + TOP - 1, ox1 - ox0, 1, `fill="rgb(${t.lineRGB.join(',')})" fill-opacity="${active ? (t.dark ? 0.10 : 0.12) : (t.dark ? 0.06 : 0.08)}"`));
    }
    if (ri === 2) {
      const x0 = ci === 0 ? F.x0 + R : fx0, x1 = ci === 2 ? F.x1 - R : fx1;
      parts.push(rect(x0, F.y1 - 2, x1 - x0, 1, `fill="#000" fill-opacity="${gl.shade}"`));
    }
    // the index tick: active windows only, along the top edge just past the corner's curve
    if (name === 'topleft' && active) parts.push(rect(F.x0 + R + TICK.gap, F.y0, TICK.length, TICK.thickness, `fill="${t.mark}"`));
    out.push(`<g id="${prefix}${name}">${parts.join('')}</g>`);
  });
  // one sheen ramp from the top hairline to the title bar's foot, shared by every top-row slice
  const sheen = `<linearGradient id="${uid}-sheen" gradientUnits="userSpaceOnUse" x1="0" y1="${n(F.y0)}" x2="0" y2="${n(F.y0 + TOP)}"><stop offset="0" stop-color="#fff" stop-opacity="${gl.sheen[ai]}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  return { body: out.join('\n'), defs: sh.defs + sheen, w, h };
}

// A maximized state: only the center slice is ever painted (see the header), so it is the whole title bar.
// The other eight slices stay as bare spacers, so hasElementPrefix("decoration-maximized…") keeps resolving.
function maximizedState(t, prefix, x, y, { active }, uid) {
  const L = CORNER, T = CORNER, W = 16, H = TITLE_MAX;
  const w = 2 * L + W, h = 2 * T + H;
  const cols = [x, x + L, x + L + W], rows = [y, y + T, y + T + H], ws = [L, W, L], hs = [T, H, T];
  const gl = TITLE_GLASS[t.id], ai = active ? 0 : 1;
  const out = NAMES.map((name, k) => {
    const ci = k % 3, ri = Math.floor(k / 3);
    const c = { x: cols[ci], y: rows[ri], w: ws[ci], h: hs[ri] };
    const parts = [spacer(c.x, c.y, c.w, c.h)];
    if (name === 'center') {
      parts.push(
        rect(c.x, c.y, c.w, c.h, `fill="${active ? t.headActive : t.headInactive}"`),
        rect(c.x, c.y, c.w, c.h, `fill="url(#${uid}-sheen)"`),
        rect(c.x, c.y, c.w, 1, `fill="#fff" fill-opacity="${gl.lip[ai]}"`),
        // the foot carries more of the active/inactive difference here: the two grounds are close and there is no tick
        rect(c.x, c.y + c.h - 1, c.w, 1, `fill="rgb(${t.lineRGB.join(',')})" fill-opacity="${active ? (t.dark ? 0.16 : 0.2) : (t.dark ? 0.08 : 0.12)}"`),
      );
    }
    return `<g id="${prefix}${name}">${parts.join('')}</g>`;
  });
  const sheen = `<linearGradient id="${uid}-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${gl.sheen[ai]}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  return { body: out.join('\n'), defs: sheen, w, h };
}

function decorationSVG(t, frosted) {
  const states = [
    ['decoration-', { active: true, maximized: false }],
    ['decoration-inactive-', { active: false, maximized: false }],
    ['decoration-maximized-', { active: true, maximized: true }],
    ['decoration-maximized-inactive-', { active: false, maximized: true }],
  ];
  let x = 0, defs = '', body = [], h = 0;
  states.forEach(([p, s], i) => {
    const r = (s.maximized ? maximizedState : decorationState)(t, p, x, 0, { ...s, frosted }, `sh${i}`);
    defs += r.defs; body.push(r.body); x += r.w + 20; h = Math.max(h, r.h);
  });
  // Blur mask: the window's frame shape, solid, in slices the same size as the decoration's (rounded corners,
  // so a frosted title bar blurs nothing outside its arcs)
  const L = PAD_X + CORNER, T = PAD_T + TOP, B = PAD_B + BOT;
  body.push(maskFrame({ x, y: 0, L, T, R: L, B, W: 16, H: 16, r: R, off: { l: PAD_X, t: PAD_T, r: PAD_X, b: PAD_B } }));
  return doc(x + 2 * L + 16 + 10, Math.max(h, T + 16 + B), body.join('\n'), { defs });
}

// --- buttons --------------------------------------------------------------------------------------------

const BW = LAYOUT.ButtonWidth, BH = LAYOUT.ButtonHeight;
// The button is the hit area; the visible tile sits inside it, leaving a 4 px gap between neighbors.
const TX = 2, TY = 4, TW = BW - 2 * TX, TH = BH - 2 * TY;
// Glyphs are drawn on a 28 x 24 grid centered on (14, 12); GX, GY move them to the button's center.
const GX = BW / 2 - 14, GY = BH / 2 - 12;
// Each glyph is layers of [path, stroke width], 0 for filled. Straight strokes are 1 px on .5 coordinates (ends
// too, with square caps), so they land on whole pixels at 100%; diagonals and curves keep 1.5.
const GLYPH = {
  close: [['M9 7 L19 17 M19 7 L9 17', 1.5]],
  minimize: [['M9.5 12.5 H18.5', 1]],
  maximize: [['M9.5 7.5 h9 v9 h-9 z', 1]],
  restore: [['M9.5 10.5 h7 v7 h-7 z M12.5 10.5 v-3 h7 v7 h-3', 1]],
  alldesktops: [['M10 8 h3 v3 h-3 z M15 8 h3 v3 h-3 z M10 13 h3 v3 h-3 z M15 13 h3 v3 h-3 z', 0]],
  keepabove: [['M9 14 L14 9 L19 14', 1.5]],
  keepbelow: [['M9 10 L14 15 L19 10', 1.5]],
  shade: [['M9.5 8.5 H18.5', 1], ['M9 15 L14 11 L19 15', 1.5]],
  help: [['M11.2 9.6 C11.4 8 12.6 7 14.2 7 C16 7 17.2 8.2 17.2 9.7 C17.2 12 14.2 12 14.2 14.4 M14.2 16.6 L14.2 17.2', 1.5]],
  // the application-menu button (layout letter N); the window-menu button is the app icon, which Aurorae draws
  appmenu: [['M9.5 8.5 H18.5 M9.5 12.5 H18.5 M9.5 16.5 H18.5', 1]],
};
// Buttons that stay on (all desktops, keep above/below, shade). Aurorae shows the 'pressed' state for both a
// press and a toggle that is on, so for these it is a sunken, engaged tile with a bar under the glyph. Two
// limits come from AuroraeButton.qml and can't be fixed from the theme: an engaged toggle shows no hover, and
// the engaged look also flashes while the mouse is held on a toggle that is off (it previews the click).
const TOGGLES = new Set(['alldesktops', 'keepabove', 'keepbelow', 'shade']);

function buttonSVG(t, kind) {
  const isClose = kind === 'close', toggle = TOGGLES.has(kind);
  const lineRGB = `rgb(${t.lineRGB.join(',')})`;
  // [prefix, glyph color, tile fill or null, tile opacity, glyph opacity]
  const st = [
    ['active', t.text2, null],
    ['inactive', t.text3, null],
    ['hover', isClose ? '#ffffff' : t.text, isClose ? t.action : lineRGB, isClose ? 1 : 0.1],
    ['hover-inactive', isClose ? '#ffffff' : t.text, isClose ? t.action : lineRGB, isClose ? 1 : 0.1],
    ['pressed', isClose ? '#ffffff' : t.text, isClose ? '#bd2417' : lineRGB, isClose ? 1 : 0.16],
    ['pressed-inactive', isClose ? '#ffffff' : toggle ? t.text2 : t.text, isClose ? '#bd2417' : lineRGB, isClose ? 1 : 0.16],
    ['deactivated', t.disabled, null],
    ['deactivated-inactive', t.disabled, null, 0, 0.7],
  ];
  const g0 = GLASS[t.id];
  const body = st.map(([p, color, tile, op, gop = 1], i) => {
    const x = i * (BW + 6);
    const pressed = p.startsWith('pressed');
    let tileSvg = '';
    if (tile && pressed && toggle) {
      // engaged: sunken, so the light flips (a shade under the top edge, a lip at the foot), and a bar marks it on
      tileSvg = `<rect x="${x + TX}" y="${TY}" width="${TW}" height="${TH}" rx="${R}" fill="${tile}" fill-opacity="0.14"/>` +
        rect(x + TX + R, TY + 1, TW - 2 * R, 1, `fill="#000" fill-opacity="${g0.shade}"`) +
        rect(x + TX + R, TY + TH - 2, TW - 2 * R, 1, `fill="#fff" fill-opacity="${n(g0.lip * 0.6)}"`) +
        rect(x + (BW - 10) / 2, TY + TH - 5, 10, 2, `fill="${p === 'pressed' ? t.text2 : t.text3}"`);
    } else if (tile) {
      // a lifted tile is glass: its fill, a sheen over the top half, a highlight lip and a shade at the foot
      tileSvg = `<rect x="${x + TX}" y="${TY}" width="${TW}" height="${TH}" rx="${R}" fill="${tile}" fill-opacity="${op}"/>` +
        `<rect x="${x + TX}" y="${TY}" width="${TW}" height="${TH / 2}" rx="${R}" fill="url(#bsheen${pressed ? 'p' : ''})"/>` +
        rect(x + TX + R, TY + 1, TW - 2 * R, 1, `fill="#fff" fill-opacity="${isClose ? 0.35 : (t.dark ? 0.16 : 0.7)}"`) +
        rect(x + TX + R, TY + TH - 2, TW - 2 * R, 1, `fill="#000" fill-opacity="${isClose ? 0.25 : (t.dark ? 0.35 : 0.08)}"`);
    }
    const o = gop < 1 ? ` opacity="${gop}"` : '';
    const g = GLYPH[kind].map(([d, sw]) => sw
      ? `<path transform="translate(${x + GX} ${GY})" d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="square" stroke-linejoin="miter"${o}/>`
      : `<path transform="translate(${x + GX} ${GY})" d="${d}" fill="${color}"${o}/>`).join('');
    return `<g id="${p}-center">${spacer(x, 0, BW, BH)}${tileSvg}${g}</g>`;
  }).join('\n');
  const top = isClose ? 0.28 : (t.dark ? 0.1 : 0.6);
  const defs = `<linearGradient id="bsheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${top}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="bsheenp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${n(top * 0.4)}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  return doc(st.length * (BW + 6), BH, body, { defs });
}

// --- package ---------------------------------------------------------------------------------------------

export function auroraeTheme(t, version, { frosted = false } = {}) {
  const id = `innerpulse-${t.id}${frosted ? '-frosted' : ''}`;
  const tt = { ...t, headActive: t.dark ? t.ground : t.s2, headInactive: t.dark ? t.s1 : t.s1 };
  const files = {};
  files['decoration.svg'] = decorationSVG(tt, frosted);
  for (const kind of Object.keys(GLYPH)) files[`${kind}.svg`] = buttonSVG(tt, kind);
  files['metadata.desktop'] = `[Desktop Entry]
Name=${t.name}${frosted ? ' (frosted title bar)' : ''}
Comment=innerpulse window decoration: machined corners, a hairline and one ember index tick on the active window${frosted ? '; the active title bar is translucent and blurred behind' : ''}
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
  // Animation: 120 ms at animation speed 1, short so the active/inactive crossfade (both layers at half
  // opacity midway, so the bar is briefly see-through) is over quickly. install.sh --apply rescales it.
  // Plasma 6 aurorae.qml draws the caption as a plain Text with no shadow or halo: UseTextShadow and Halo* are
  // parsed but never rendered, so don't try to add a title glow here. The shadow comes from Padding*.
  files[`${id}rc`] = `[General]
ActiveTextColor=${hex(t.text)}
InactiveTextColor=${hex(t.text3)}
TitleAlignment=Left
TitleVerticalAlignment=Center
Animation=120
UseTextShadow=false

[Layout]
${Object.entries(LAYOUT).map(([k, v]) => `${k}=${v}`).join('\n')}
`;
  return { id, files };
}

export const auroraeLayout = { PAD_T, PAD_B, PAD_X, SHADOW, BORDER, TITLE, EDGE_T, EDGE_B, TOP, CORNER, R, ...LAYOUT };
