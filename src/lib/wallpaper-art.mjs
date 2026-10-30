// Two more wallpapers, both drawn from the mark’s own beat (mark.mjs), so what they show is true.
//
//   horizon   one beat laid out in depth. Each row is a reading of the mark's envelope across a wide floor
//             of bars; rows recede to a horizon, 0.05625 s apart, so the 80 rows span exactly one 4.5 s
//             period and the beat crosses the terrain once as a diagonal crest. The front row is the live
//             reading, in ember; history fades to gray toward the horizon. Rows occlude the ones behind them.
//   exposure  a long exposure of the beat: the six bars photographed 96 times over the 1.6 s the beat takes to
//             pass through them, each exposure 8 px to the right of the last, as hairline outlines. The trail
//             resolves into the mark at rest, in solid ember.
//   lock      the same exposure set low and to the right, smaller and without the time axis, so the lock
//             screen's clock, avatar, password field and footer sit on clear ground. The lock screen's own
//             plugin (src/lock) draws the live mark exactly over the resting one.
import { beatHeights, barHeights, barX, MARK } from './mark.mjs';
import { n } from './svg.mjs';
import { rng, caption, grain, svgDoc } from './wallpaper.mjs';

const VW = 2560, VH = 1440;
const PERIOD = 4.5;

const palette = (t) => ({
  bg: t.ground,
  gray: t.text2,
  ember: t.mark,
  cap: t.text3,
  fog: t.dark ? '#000' : '#d6d1c8',
});

// Carbon fiber: a plain weave of shaded tows, 8 px each, so close to the ground it reads as texture, not pattern
function weave(t) {
  const lo = '#0a0c0f', hi = '#191c21';
  return {
    defs: `<linearGradient id="towH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lo}"/><stop offset=".45" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient>` +
      `<linearGradient id="towV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${lo}"/><stop offset=".45" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient>` +
      `<pattern id="weave" width="16" height="16" patternUnits="userSpaceOnUse">` +
      `<rect width="8" height="8" fill="url(#towH)"/><rect x="8" y="8" width="8" height="8" fill="url(#towH)"/>` +
      `<rect x="8" width="8" height="8" fill="url(#towV)"/><rect y="8" width="8" height="8" fill="url(#towV)"/></pattern>`,
    layer: `<rect width="${VW}" height="${VH}" fill="url(#weave)"/>`,
  };
}

// --- horizon ---------------------------------------------------------------------------------------------

export const HORIZON = { rows: 80, cols: 150, dt: PERIOD / 80 };
const RISE_X = 3;

export function horizonWallpaper(t) {
  const c = palette(t);
  const rand = rng(4500);
  const { rows: N, cols: M, dt } = HORIZON;
  const cx = VW / 2, y0 = VH * 0.43, yF = VH * 0.86;
  const dz = 0.17, span = VW * 0.98, amp = 150;
  const rest = barHeights();
  const maxH = Math.max(...rest) + 16; // normalize to the true peak, so resting rows keep their scale and the crest stands above them
  // where the six bars sit on the floor (world x, −1 … 1)
  const pos = rest.map((_, i) => (barX(i) / MARK.span) * 0.34);
  // low hills under everything, fixed in x so they read as ground, not signal
  const hills = Array.from({ length: 5 }, () => ({ f: 2 + rand() * 7, p: rand() * 6.28, a: 0.04 + rand() * 0.06 }));
  const noise = Array.from({ length: N * M }, () => rand());

  // the front row is now; T0 puts the crest a few rows back, where perspective still shows it: it enters at the
  // left stub about 12 rows deep and reaches the right stub about 2 rows from the front
  const T0 = 0.45 + 12 * dt;
  const rowsOut = [];
  for (let k = N - 1; k >= 0; k--) {
    const z = 1 + k * dz, s = 1 / z;
    const y = y0 + (yF - y0) * s;
    // the beat's rise is drawn 3× (stated in the caption): at true scale, 16 units on 98, the crest is lost
    const hs = beatHeights(T0 - k * dt, { period: PERIOD, rise: 16 * RISE_X });
    const pts = [];
    for (let j = 0; j < M; j++) {
      const xw = -1 + (2 * j) / (M - 1);
      let v = 0;
      for (let i = 0; i < 6; i++) v = Math.max(v, (hs[i] / maxH) * Math.exp(-(((xw - pos[i]) / 0.03) ** 2)));
      let floor = 0.035 + noise[k * M + j] ** 3 * 0.09;
      for (const h of hills) floor += h.a * (0.5 + 0.5 * Math.sin(h.f * xw + h.p));
      // the floor quiets toward the middle so the six readings stand clear of it
      floor *= 0.35 + 0.65 * Math.min(1, Math.abs(xw) / 0.5);
      v = Math.max(v, floor);
      pts.push({ x: cx + xw * span * s, h: Math.max(0.6, v * amp * s) });
    }
    // occluder: the row's silhouette in the ground color, so nearer rows hide the ones behind
    const top = pts.map((p, j) => `${j ? 'L' : 'M'}${n(p.x)},${n(y - p.h - 1)}`).join('');
    const bot = pts.slice().reverse().map((p) => `L${n(p.x)},${n(y + p.h + 1)}`).join('');
    const w = Math.max(1, 5.2 * s);
    const front = k === 0;
    const fade = Math.min(1, 0.1 + 0.85 * s ** 0.85);
    const bars = pts.map((p) => `<rect x="${n(p.x - w / 2)}" y="${n(y - p.h)}" width="${n(w)}" height="${n(2 * p.h)}" rx="${n(Math.min(1.5, w / 3))}"/>`).join('');
    rowsOut.push(`<path d="${top}${bot}Z" fill="${c.bg}"/>` +
      `<g fill="${front ? c.ember : c.gray}" fill-opacity="${n(front ? 1 : fade * (t.dark ? 0.8 : 0.7))}">${bars}</g>`);
  }

  // the horizon: a hairline with a graduated scale, every 32 px, every fourth tick longer
  const ticks = [];
  for (let x = 32, i = 1; x < VW; x += 32, i++) ticks.push(`<rect x="${x}" y="${n(y0 - (i % 4 ? 3 : 7))}" width="1" height="${i % 4 ? 3 : 7}"/>`);
  // the dial: a faint graduated half circle rising from the vanishing point, one tick per 3°, every fifth
  // longer. It is the brand's instrument face, not a reading, so it carries no numbers.
  const R0 = VH * 0.36;
  const dial = [`<path d="M${n(cx - R0)},${n(y0)}A${n(R0)} ${n(R0)} 0 0 1 ${n(cx + R0)},${n(y0)}" fill="none" stroke="${c.gray}" stroke-width="1"/>`];
  for (let deg = 3; deg < 180; deg += 3) {
    const a = (deg * Math.PI) / 180, len = deg % 15 ? 9 : 22;
    const x1 = cx - Math.cos(a) * R0, y1 = y0 - Math.sin(a) * R0;
    const x2 = cx - Math.cos(a) * (R0 - len), y2 = y0 - Math.sin(a) * (R0 - len);
    dial.push(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${c.gray}" stroke-width="1"/>`);
  }
  const g = grain('grain', t.dark ? 0.05 : 0.035);
  const defs = g.defs +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset=".43" stop-color="${t.dark ? '#14110e' : '#ebe6de'}"/><stop offset=".431" stop-color="${c.bg}"/></linearGradient>` +
    `<radialGradient id="vig" cx=".5" cy=".55" r=".85"><stop offset=".5" stop-color="${c.bg}" stop-opacity="0"/><stop offset="1" stop-color="${c.fog}" stop-opacity="${t.dark ? 0.6 : 0.4}"/></radialGradient>`;
  const body = [
    `<rect width="${VW}" height="${VH}" fill="url(#sky)"/>`,
    `<g opacity="${t.dark ? 0.16 : 0.2}">${dial.join('')}</g>`,
    `<g fill="${c.gray}" opacity="${t.dark ? 0.35 : 0.4}"><rect x="0" y="${n(y0)}" width="${VW}" height="1"/>${ticks.join('')}</g>`,
    rowsOut.join('\n'),
    `<rect width="${VW}" height="${VH}" fill="url(#vig)"/>`,
    g.layer,
    caption([
      `ONE BEAT IN DEPTH · ${N} READINGS, ${dt.toFixed(3)} s APART`,
      `FRONT ROW LIVE · PERIOD 4.5 s · RISE DRAWN ×${RISE_X}`,
    ], VW - 72, Math.round(y0 - 92), c.cap),
  ].join('\n');
  return svgDoc(body, defs);
}

// --- exposure --------------------------------------------------------------------------------------------

export const EXPOSURE = { frames: 96, window: 1.6, dx: 8 };
// Where the resting mark sits, as fractions of the 2560 × 1440 box, and the side of its 220-unit box in px. The
// splash and the lock plugin place their live marks from these, so they land exactly on the wallpaper's.
export const EXPOSURE_MARK = { mx: 0.67, my: 0.45, box: 560 };
// The lock composition keeps x 0.3–0.7, y 0.08–0.66 free (clock, avatar, password, actions) and the footer row
// clear: the bars, beating, span y ≈ 1028–1334 and the trail x ≈ 939–1987.
export const LOCK_MARK = { mx: 0.72, my: 0.82, box: 308 };
export const ART = { width: VW, height: VH };

export const exposureWallpaper = (t) => exposureArt(t, { at: EXPOSURE_MARK, axis: true, vig: ['.6', '.46'] });
export const lockWallpaper = (t) => exposureArt(t, { at: LOCK_MARK, axis: false, vig: ['.66', '.62'] });

function exposureArt(t, { at, axis: withAxis, vig }) {
  const c = palette(t);
  const { frames: F, window: WIN, dx } = EXPOSURE;
  const S = at.box / 220;
  const MX = VW * at.mx, MY = VH * at.my;
  const r = MARK.stroke / 2;
  const out = [];
  for (let f = 0; f < F; f++) {
    const hs = beatHeights((f / (F - 1)) * WIN, { period: PERIOD });
    const ox = MX - (F - 1 - f) * dx;
    const age = f / (F - 1);
    const op = 0.03 + 0.24 * age ** 1.8;
    const rects = hs.map((h, i) => {
      const x = ox + (barX(i) - r) * S, y = MY - (h + r) * S;
      return `<rect x="${n(x)}" y="${n(y)}" width="${n(MARK.stroke * S)}" height="${n((2 * h + 2 * r) * S)}" rx="${n(MARK.corner * S)}"/>`;
    }).join('');
    out.push(`<g fill="none" stroke="${c.ember}" stroke-width="1.25" stroke-opacity="${n(op)}">${rects}</g>`);
  }
  // the exposure ends on the mark at rest, solid
  const rest = barHeights().map((h, i) =>
    `<rect x="${n(MX + (barX(i) - r) * S)}" y="${n(MY - (h + r) * S)}" width="${n(MARK.stroke * S)}" height="${n((2 * h + 2 * r) * S)}" rx="${n(MARK.corner * S)}"/>`).join('');

  // a time axis under the trail: one tick per 0.1 s of the window, labeled at each half second
  const axis = [], labels = [];
  if (withAxis) {
    const axisY = MY + (98 + 16 + 11) * S + 46;
    // the axis follows the left stub's leading edge, where every exposure starts
    const lead = (barX(0) - r) * S;
    const x0 = MX - (F - 1) * dx + lead, x1 = MX + lead;
    axis.push(`<rect x="${n(x0)}" y="${n(axisY)}" width="${n(x1 - x0)}" height="1"/>`);
    for (let i = 0; i <= WIN * 10 + 1e-9; i++) {
      const x = x0 + ((i / 10) / WIN) * (x1 - x0);
      const major = i % 5 === 0;
      axis.push(`<rect x="${n(x)}" y="${n(axisY)}" width="1" height="${major ? 9 : 5}"/>`);
      if (major) labels.push(`<text x="${n(x)}" y="${n(axisY + 28)}" text-anchor="middle" font-family="JetBrains Mono, IBM Plex Mono, monospace" font-size="12" fill="${c.cap}">${(i / 10).toFixed(1)} s</text>`);
    }
  }

  const g = grain('grain', t.dark ? 0.05 : 0.035);
  const wv = t.id === 'carbon' ? weave(t) : null;
  // the vignette is clear (transparent out to 0.4 of its radius) over the resting mark
  const defs = g.defs + (wv ? wv.defs : '') +
    `<radialGradient id="vig" cx="${vig[0]}" cy="${vig[1]}" r=".9"><stop offset=".4" stop-color="${c.bg}" stop-opacity="0"/><stop offset="1" stop-color="${c.fog}" stop-opacity="${t.dark ? 0.65 : 0.4}"/></radialGradient>`;
  const body = [
    `<rect width="${VW}" height="${VH}" fill="${c.bg}"/>`,
    wv ? wv.layer : '',
    out.join('\n'),
    `<g fill="${c.ember}">${rest}</g>`,
    axis.length ? `<g fill="${c.gray}" opacity=".45">${axis.join('')}</g>` : '',
    labels.join(''),
    `<rect width="${VW}" height="${VH}" fill="url(#vig)"/>`,
    g.layer,
    caption([
      `ONE BEAT · ${F} EXPOSURES OVER ${WIN} s, ${dx} PX APART`,
      'ENDS AT REST · h = rest(84·|sin(2πi/5 − π/30)|)',
    ], 72, VH - 150, c.cap, { anchor: 'start' }),
  ].join('\n');
  return svgDoc(body, defs);
}
