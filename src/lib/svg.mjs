// Nine-slice frames for Plasma's FrameSvg and Aurorae, drawn as plain filled paths.
//
// Qt SVG renders SVG Tiny 1.2, so nothing here leans on clip paths, masks or filters: every slice is drawn
// directly, a rounded corner as an arc, a border as an even-odd ring. Each slice also carries an invisible
// spacer (opacity .001, the trick Breeze uses) so its bounding box is the full cell even when the visible
// paint is smaller.

export const n = (v) => {
  const s = (+v).toFixed(3);
  return s.replace(/\.?0+$/, '') || '0';
};

const SLICES = ['topleft', 'top', 'topright', 'left', 'center', 'right', 'bottomleft', 'bottom', 'bottomright'];

// Plasma recolors any element with class="ColorScheme-X" from the active color scheme. The colors written
// here are only what an SVG viewer shows; Plasma replaces this block at load time.
export function colorStyle(t) {
  const c = {
    Text: t.text, Background: t.dark ? t.s2 : t.ground, ViewBackground: t.dark ? t.s1 : '#faf8f4',
    HeaderBackground: t.dark ? t.ground : t.s2, ButtonBackground: t.dark ? t.s3 : t.s1, ButtonText: t.text,
    ButtonFocus: t.focus, ViewFocus: t.focus, ButtonHover: t.hover, Highlight: t.select,
    NegativeText: t.err, NeutralText: t.warn, PositiveText: t.ok, ComplementaryBackground: '#0a0908',
  };
  return `<style id="current-color-scheme" type="text/css">${Object.entries(c).map(([k, v]) => `.ColorScheme-${k}{color:${v};}`).join('')}</style>`;
}

export const spacer = (x, y, w, h) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="#000" opacity=".001"/>`;
export const rect = (x, y, w, h, paint) => (w > 0 && h > 0 ? `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${paint}/>` : '');

// The quarter of a rounded rect that sits in a c×c corner cell. (cx, cy) is the frame's outer corner; sx, sy
// point into the cell. `inset` shrinks the shape by that much along both outer edges (for the fill inside a
// border). Returns path data.
export function quarter(cx, cy, sx, sy, c, r, inset = 0) {
  const P = (u, v) => `${n(cx + sx * u)},${n(cy + sy * v)}`;
  const sweep = sx * sy > 0 ? 0 : 1;
  const ri = Math.max(0, r - inset);
  if (ri <= 0) return `M${P(c, inset)}L${P(inset, inset)}L${P(inset, c)}L${P(c, c)}Z`;
  return `M${P(c, inset)}L${P(r, inset)}A${n(ri)} ${n(ri)} 0 0 ${sweep} ${P(inset, r)}L${P(inset, c)}L${P(c, c)}Z`;
}

/**
 * A frame as nine slices.
 *   prefix   element prefix ('' for plain, 'mask-', 'decoration-inactive-' …)
 *   x, y     where the slice grid starts in the document
 *   L, T, R, B   slice sizes (left column width, top row height …); W, H the center cell
 *   r        corner radius;  border  width of the hairline ring (0 for none)
 *   fill / stroke   paint attributes for the inside and the ring
 *   extra(name, cell)   more paint for a slice; cell is {x, y, w, h}
 *   off      offsets {l, t, r, b} of the frame's edge inside the outer cells (for shadow padding in Aurorae)
 */
export function frame({ prefix = '', x = 0, y = 0, L, T, R, B, W = 16, H = 16, r = 4, border = 1, fill, stroke, extra, off = { l: 0, t: 0, r: 0, b: 0 }, square = {} }) {
  const cols = [x, x + L, x + L + W], rows = [y, y + T, y + T + H];
  const ws = [L, W, R], hs = [T, H, B];
  const out = [];
  SLICES.forEach((name, k) => {
    const ci = k % 3, ri = Math.floor(k / 3);
    const cell = { x: cols[ci], y: rows[ri], w: ws[ci], h: hs[ri] };
    const body = [];
    // The frame's own rectangle inside this cell (cells on the outside may hold shadow padding first).
    const fx0 = ci === 0 ? cell.x + off.l : cell.x, fx1 = ci === 2 ? cell.x + cell.w - off.r : cell.x + cell.w;
    const fy0 = ri === 0 ? cell.y + off.t : cell.y, fy1 = ri === 2 ? cell.y + cell.h - off.b : cell.y + cell.h;
    const isCorner = ci !== 1 && ri !== 1;
    if (isCorner) {
      const sx = ci === 0 ? 1 : -1, sy = ri === 0 ? 1 : -1;
      const cx = sx > 0 ? fx0 : fx1, cy = sy > 0 ? fy0 : fy1;
      const cw = fx1 - fx0, chh = fy1 - fy0;
      const cr = square[name] ? 0 : r;
      // Corner cells may be taller than wide (a title bar); draw the arc part in a square of the short side
      // and fill the rest straight.
      const c = Math.min(cw, chh);
      const parts = [];
      const extend = [];
      if (chh > c) extend.push(sy > 0 ? [fx0, fy0 + c, cw, chh - c] : [fx0, fy0, cw, chh - c]);
      if (cw > c) extend.push(sx > 0 ? [fx0 + c, fy0, cw - c, chh] : [fx0, fy0, cw - c, chh]);
      if (border > 0) {
        // The fill runs under the ring, so the hairline is a tint on the surface everywhere (corners and
        // edges alike) and never a 1 px gap the desktop shows through.
        parts.push(`<path d="${quarter(cx, cy, sx, sy, c, cr)}" ${fill}/>`);
        parts.push(`<path d="${quarter(cx, cy, sx, sy, c, cr)}${quarter(cx, cy, sx, sy, c, cr, border)}" fill-rule="evenodd" ${stroke}/>`);
        for (const [ex, ey, ew, eh] of extend) {
          // the straight remainder: fill, then the border along the outer edge
          const vertical = ew === cw;
          body.push(rect(ex, ey, ew, eh, fill));
          if (vertical) body.push(rect(sx > 0 ? ex : ex + ew - border, ey, border, eh, stroke));
          else body.push(rect(ex, sy > 0 ? ey : ey + eh - border, ew, border, stroke));
        }
      } else {
        parts.push(`<path d="${quarter(cx, cy, sx, sy, c, cr)}" ${fill}/>`);
        for (const [ex, ey, ew, eh] of extend) body.push(rect(ex, ey, ew, eh, fill));
      }
      body.unshift(...parts);
    } else if (ci === 1 && ri === 1) {
      body.push(rect(cell.x, cell.y, cell.w, cell.h, fill));
    } else {
      // edges: fill the strip, then the ring along its outer side
      const b = border;
      if (ri === 0) body.push(rect(cell.x, fy0, cell.w, fy1 - fy0, fill), rect(cell.x, fy0, cell.w, b, stroke));
      if (ri === 2) body.push(rect(cell.x, fy0, cell.w, fy1 - fy0, fill), rect(cell.x, fy1 - b, cell.w, b, stroke));
      if (ci === 0) body.push(rect(fx0, cell.y, fx1 - fx0, cell.h, fill), rect(fx0, cell.y, b, cell.h, stroke));
      if (ci === 2) body.push(rect(fx0, cell.y, fx1 - fx0, cell.h, fill), rect(fx1 - b, cell.y, b, cell.h, stroke));
    }
    const more = extra ? extra(name, cell, { fx0, fx1, fy0, fy1 }) : '';
    out.push(`<g id="${prefix}${name}">${spacer(cell.x, cell.y, cell.w, cell.h)}${more?.under ?? ''}${body.join('')}${typeof more === 'string' ? more : more?.over ?? ''}</g>`);
  });
  return out.join('\n');
}

/** A blur/contrast mask: the frame's shape in solid black, no border. */
export const maskFrame = (o) => frame({ ...o, prefix: 'mask-', border: 0, fill: 'fill="#000"', stroke: '', extra: undefined });

/**
 * A soft drop shadow as nine slices, for Plasma's shadow-* elements. `s` is how far the shadow reaches past
 * the frame, `inner` how far each slice reaches under the frame (Plasma lays the slices around the frame
 * and overlaps them by the shadow-hint margins). `dy` pushes the shadow down (it is thicker below).
 */
// The falloff of every drop shadow (Plasma's frames here, the window decoration in aurorae.mjs): [offset, weight].
export const SHADOW_STOPS = [[0, 1], [0.25, 0.62], [0.5, 0.3], [0.75, 0.1], [1, 0]];

export function shadowFrame({ x, y, s, inner = 6, r = 4, rgb = [0, 0, 0], alpha = 0.5, dy = 0, uid }) {
  const [R, G, B] = rgb;
  const stops = (a) => SHADOW_STOPS
    .map(([o, k]) => `<stop offset="${o}" stop-color="rgb(${R},${G},${B})" stop-opacity="${n(a * k)}"/>`).join('');
  const T = s - dy, Bt = s + dy; // reach above and below
  const C = { l: s, t: T, r: s, b: Bt };
  const defs = [];
  const out = [];
  const W = 16, H = 16;
  const X = [x, x + C.l + inner, x + C.l + inner + W];
  const Y = [y, y + C.t + inner, y + C.t + inner + H];
  const cw = [C.l + inner, W, C.r + inner], ch = [C.t + inner, H, C.b + inner];
  SLICES.forEach((name, k) => {
    const ci = k % 3, ri = Math.floor(k / 3);
    const cx = X[ci], cy = Y[ri], w = cw[ci], h = ch[ri];
    const id = `${uid}-${name}`;
    let paint = '';
    if (ci === 1 && ri === 1) paint = '';
    else if (ci === 1 || ri === 1) {
      // edge: linear falloff from the frame edge outward
      const reach = ri === 0 ? C.t : ri === 2 ? C.b : ci === 0 ? C.l : C.r;
      let x1, y1, x2, y2, gx, gy, gw, gh;
      if (ri === 0) { gx = cx; gy = cy; gw = w; gh = reach; x1 = 0; y1 = 1; x2 = 0; y2 = 0; }
      if (ri === 2) { gx = cx; gy = cy + inner; gw = w; gh = reach; x1 = 0; y1 = 0; x2 = 0; y2 = 1; }
      if (ci === 0) { gx = cx; gy = cy; gw = reach; gh = h; x1 = 1; y1 = 0; x2 = 0; y2 = 0; }
      if (ci === 2) { gx = cx + inner; gy = cy; gw = reach; gh = h; x1 = 0; y1 = 0; x2 = 1; y2 = 0; }
      defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(alpha)}</linearGradient>`);
      paint = rect(gx, gy, gw, gh, `fill="url(#${id})"`);
    } else {
      // corner: radial falloff around the frame corner, minus the part under the frame
      const fcx = ci === 0 ? cx + C.l + r : cx + inner - r;
      const fcy = ri === 0 ? cy + C.t + r : cy + inner - r;
      const reach = (ri === 0 ? C.t : C.b) + r;
      defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(fcx)}" cy="${n(fcy)}" r="${n(reach)}">` +
        [[0, 1], [r / reach, 1], [(r + 0.25 * (reach - r)) / reach, 0.62], [(r + 0.5 * (reach - r)) / reach, 0.3], [(r + 0.75 * (reach - r)) / reach, 0.1], [1, 0]]
          .map(([o, kk]) => `<stop offset="${n(o)}" stop-color="rgb(${R},${G},${B})" stop-opacity="${n(alpha * kk)}"/>`).join('') +
        `</radialGradient>`);
      paint = rect(cx, cy, w, h, `fill="url(#${id})"`);
    }
    out.push(`<g id="shadow-${name}">${spacer(cx, cy, w, h)}${paint}</g>`);
  });
  // Plasma reads how far the shadow slices extend past the frame from these hints.
  const hint = (side, w, h, hx, hy) => `<rect id="shadow-hint-${side}-margin" x="${n(hx)}" y="${n(hy)}" width="${n(w)}" height="${n(h)}" fill="#f0f" opacity=".001"/>`;
  out.push(hint('top', 4, C.t, x + 200, y), hint('bottom', 4, C.b, x + 206, y), hint('left', C.l, 4, x + 212, y), hint('right', C.r, 4, x + 212, y + 6));
  return { defs: defs.join(''), body: out.join('\n') };
}

/**
 * Margin hints for a frame, plus inset hints when `insets` is given. A hint's value is its height (top,
 * bottom) or its width (left, right). The insets go in a second row, 12 px down.
 */
export function hints(prefix, { top, bottom, left, right }, x, y, insets) {
  const out = [
    `<rect id="${prefix}hint-top-margin" x="${x}" y="${y}" width="4" height="${n(top)}" fill="#f0f" opacity=".001"/>`,
    `<rect id="${prefix}hint-bottom-margin" x="${x + 6}" y="${y}" width="4" height="${n(bottom)}" fill="#f0f" opacity=".001"/>`,
    `<rect id="${prefix}hint-left-margin" x="${x + 12}" y="${y}" width="${n(left)}" height="4" fill="#f0f" opacity=".001"/>`,
    `<rect id="${prefix}hint-right-margin" x="${x + 12}" y="${y + 6}" width="${n(right)}" height="4" fill="#f0f" opacity=".001"/>`,
  ];
  if (insets) out.push(insetHints(prefix, insets, x, y + 12));
  return out.join('\n');
}

/**
 * Inset hints alone: how far a frame's background sits inside the item's edges (a negative margin, for
 * popups whose content runs to the frame). `thin` is the side that carries no value.
 */
export function insetHints(prefix, { top, bottom, left, right }, x, y, thin = 4) {
  return [
    `<rect id="${prefix}hint-top-inset" x="${x}" y="${y}" width="${thin}" height="${n(top)}" fill="#f0f" opacity=".001"/>`,
    `<rect id="${prefix}hint-bottom-inset" x="${x + thin + 2}" y="${y}" width="${thin}" height="${n(bottom)}" fill="#f0f" opacity=".001"/>`,
    `<rect id="${prefix}hint-left-inset" x="${x + 2 * thin + 4}" y="${y}" width="${n(left)}" height="${thin}" fill="#f0f" opacity=".001"/>`,
    `<rect id="${prefix}hint-right-inset" x="${x + 2 * thin + 4}" y="${y + thin + 2}" width="${n(right)}" height="${thin}" fill="#f0f" opacity=".001"/>`,
  ].join('\n');
}

// --- round things: discs, rings and arcs (radio buttons, handles, the busy indicator) ------------------

const polar = (cx, cy, r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];

/** Path data for an arc of radius r from angle a0 to a1: degrees clockwise from 3 o'clock, as y runs down. */
export function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M${n(x0)},${n(y0)}A${n(r)} ${n(r)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${n(x1)},${n(y1)}`;
}

// a full circle as two half arcs, one closed path (no <circle>, so rings can be cut with even-odd)
const circlePath = (cx, cy, r) =>
  `M${n(cx - r)},${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx + r)},${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx - r)},${n(cy)}Z`;

export const disc = (cx, cy, r, paint) => `<path d="${circlePath(cx, cy, r)}" ${paint}/>`;

/** A ring between radii r0 < r1, drawn as a fill like every frame's hairline. */
export const annulus = (cx, cy, r0, r1, paint) => `<path d="${circlePath(cx, cy, r1)}${circlePath(cx, cy, r0)}" fill-rule="evenodd" ${paint}/>`;

/** A soft round shadow: a radial falloff from `inner` (under the shape) to `r`. */
export function roundShadow(id, cx, cy, inner, r, rgb, alpha) {
  const [R, G, B] = rgb;
  const k = inner / r;
  const stops = [[0, 1], [k, 1], [k + 0.25 * (1 - k), 0.55], [k + 0.55 * (1 - k), 0.2], [1, 0]]
    .map(([o, a]) => `<stop offset="${n(o)}" stop-color="rgb(${R},${G},${B})" stop-opacity="${n(alpha * a)}"/>`).join('');
  return {
    defs: `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}">${stops}</radialGradient>`,
    body: disc(cx, cy, r, `fill="url(#${id})"`),
  };
}

export const doc = (w, h, body, { style = '', defs = '' } = {}) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}">\n${style}<defs>${defs}</defs>\n${body}\n</svg>\n`;
