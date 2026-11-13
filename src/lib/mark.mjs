// The innerpulse mark: its geometry and its one motion. Everything the theme draws of the mark comes from here, so
// the previews, icons, splash, lock and logout screens match the brand kit (scripts/pulse.mjs) exactly.
//
//   h_i = rest(90 · e^(−0.15·(i−1)) · |sin(2π·i/5 + φ)|)      φ = −π/30      i = 0 … 5
//
// The beat is one damped pulse: the strike (bar 1) is the tallest, the reading rings down into a smaller echo
// (bar 4), and φ puts a rest, a stub held at the 12-unit optical minimum, at both ends: 12 · 82.22 · 51.83 · 33.34
// · 56.13 · 12. Each sample is a bar 22 units wide from −h−11 to +h+11 with 4-unit corners, spread evenly across
// x = −92 … 92 in a 220-unit box.
//
// The plate is the mark: the beat cut out of a solid ember tile, a 200-unit square with 26-unit corners and the bars
// at 0.74. Under 32 px rendered its slots are about a pixel wide, so there the mark is the small mark, the six bars
// alone (panel and tray icons, the launcher in a preview). The plate never moves; every period one pulse of light
// passes through its slots, left to right, and on load the slots open once.

const TAU = Math.PI * 2;

export const MARK = {
  beat: 5, // samples per beat
  span: 92, // half-width: bars run x = −92 … 92
  amp: 90, // amplitude of the undamped beat; the strike (i = 1) comes out at ±82.22
  decay: 0.15, // damping per bar after the strike: each sample is scaled by e^(−decay·(i−1))
  minBar: 12, // optical minimum, so a rest still prints as a stub
  ease: 30, // heights between minBar and ease join the floor smoothly
  phase: -Math.PI / 30, // puts the rests at both ends
  stroke: 22, // bar width
  corner: 4, // corner radius: machined, not a pill
};

/** The plate: a 200-unit square (viewBox −100…100) with the beat cut out of it. */
export const PLATE = {
  size: 200,
  corner: 26,
  cut: 0.74, // the bars' scale inside the plate
  plateFrom: 32, // rendered px from which the plate is used; below it the small mark
};

/** The lamp: a lit slot, the light seen through the plate as the pulse passes. */
export const LAMP = '#ffd9c2';

// The tempos, in seconds per pulse of light: ambient where the viewer rests (the lock and logout screens), working
// while something runs (the splash), busy for a short wait.
export const TEMPO = { ambient: 4.5, working: 2.4, busy: 1.2 };

export const PULSE = {
  period: TEMPO.ambient,
  rise: 16, // a bar's lift over its rest at the pulse's peak: the lamp's full brightness
  width: 0.19, // a slot stays lit this fraction of the period
  lag: 0.0245, // each slot lights this fraction of the period after the one to its left
  drawIn: 0.55, // on load each slot opens from its stub to its rest in this many seconds …
  drawLag: 0.09, // … starting this long after the slot to its left
};

// The bars in motion, for the places the small mark moves: the busy pointers (cursors.mjs) and the throbber icon
// (icons.mjs). These are the brand kit's own numbers (THINK and beatHeights in scripts/pulse.mjs); the plate above
// only ever takes light.
//
// Retake ("thinking"): the bars fall to rests one after another, then the reading is taken again: each bar is lit
// as it rises to its height and cools once it lands. Pass ("writing"): the bars stand as the mark and light passes
// through them. Beat: every bar lifts by PULSE.rise as the pulse passes, with no light at all, so it reads in one
// flat color. Everywhere the light rings down with the beat: the strike is lit brightest.
export const THINK = {
  period: 2.4, // seconds a retake cycle takes
  busy: 1.2, // seconds a pass of light takes
  riseAt: 0.06, riseLag: 0.05, rise: 0.2, // bar i starts to rise at riseAt + i·riseLag and takes `rise`
  fallAt: 0.72, fallLag: 0.028, fall: 0.12, // and starts to fall at fallAt + i·fallLag, taking `fall`
  glow: 0.34, glowCurve: 0.6, glowPower: 1.5, // a bar is lit from the start of its rise for `glow`, hottest mid-rise
  floor: 0.35, // a bar's light is floor … 1 by its height
  passLag: 0.05, passWidth: 0.26, // pass: the light reaches bar i at i·passLag and stays passWidth
};

/** How strongly each bar is lit: THINK.floor for a bar of no height, 1 for the strike. */
export function lightWeights() {
  const rest = barHeights(), top = Math.max(...rest);
  return rest.map((h) => THINK.floor + (1 - THINK.floor) * (h / top));
}

/** Retake at phase u (0 … 1 of a cycle): [{ h, l }] per bar, h the half-height and l the light 0 … 1. */
export function retakeBars(u) {
  const rest = barHeights(), w = lightWeights(), T = THINK;
  return rest.map((h, i) => {
    const a = Math.min(1, Math.max(0, (u - T.riseAt - i * T.riseLag) / T.rise)), up = 1 - (1 - a) ** 3;
    const f = Math.min(1, Math.max(0, (u - T.fallAt - i * T.fallLag) / T.fall)), down = f * f;
    const g = (u - T.riseAt - i * T.riseLag) / T.glow;
    const l = g > 0 && g < 1 ? Math.sin(Math.PI * g ** T.glowCurve) ** T.glowPower : 0;
    return { h: MARK.minBar + (h - MARK.minBar) * up * (1 - down), l: w[i] * l * (1 - down) };
  });
}

/** Pass at phase u (0 … 1 of a pass): the bars at rest, [{ h, l }] with the light passing left to right. */
export function passBars(u) {
  const rest = barHeights(), w = lightWeights(), T = THINK;
  return rest.map((h, i) => {
    const x = (u - i * T.passLag) / T.passWidth;
    return { h, l: x > 0 && x < 1 ? w[i] * Math.sin(Math.PI * x) ** 2 : 0 };
  });
}

/** Beat at phase u (0 … 1 of a period): [{ h, l: 0 }], each bar lifted by PULSE.rise as the pulse passes. */
export function beatBars(u) {
  return barHeights().map((h, i) => {
    const x = (u - i * PULSE.lag) / PULSE.width;
    return { h: x > 0 && x < 1 ? h + PULSE.rise * Math.sin(Math.PI * x) ** 2 : h, l: 0 };
  });
}

/** A bar's color at light l: ember toward the lamp. */
export function litColor(l, from = '#f43a2a', to = LAMP) {
  const c = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [c(from), c(to)];
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * l).toString(16).padStart(2, '0')).join('');
}

/** The optical minimum with a soft landing: a cubic Hermite join from minBar up to ease. */
export function restFloor(v, { min = MARK.minBar, ease = MARK.ease } = {}) {
  if (v <= min) return min;
  if (v >= ease) return v;
  const w = ease - min, t = (v - min) / w;
  return (2 * t ** 3 - 3 * t ** 2 + 1) * min + (-2 * t ** 3 + 3 * t ** 2) * ease + (t ** 3 - t ** 2) * w;
}

/** The six resting heights: 12 · 82.22 · 51.83 · 33.34 · 56.13 · 12. */
export function barHeights({ phase = MARK.phase } = {}) {
  return Array.from({ length: MARK.beat + 1 }, (_, i) =>
    restFloor(MARK.amp * Math.exp(-MARK.decay * (i - 1)) * Math.abs(Math.sin((TAU * i) / MARK.beat + phase))));
}

/** The x center of bar i. */
export const barX = (i) => -MARK.span + (i / MARK.beat) * MARK.span * 2;

/** The bars as rects {x, y, w, h, rx} in the mark's own 220-unit box. */
export function barRects({ heights } = {}) {
  const r = MARK.stroke / 2;
  return (heights ?? barHeights()).map((h, i) => ({ x: barX(i) - r, y: -h - r, w: MARK.stroke, h: 2 * h + 2 * r, rx: MARK.corner }));
}

/** The plate's slots, in the plate's 200-unit box. */
export function slotRects({ heights } = {}) {
  const c = PLATE.cut;
  return barRects({ heights }).map((b) => ({ x: b.x * c, y: b.y * c, w: b.w * c, h: b.h * c, rx: b.rx * c }));
}

const f = (v) => +v.toFixed(2);
const roundRectD = (x, y, w, h, r) =>
  `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(r)}v${f(h - 2 * r)}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(r)}` +
  `h${f(-(w - 2 * r))}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(-r)}v${f(-(h - 2 * r))}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(-r)}z`;

/** The flat plate as one even-odd path, in its 200-unit box centered on 0. */
export function plateD({ heights } = {}) {
  const half = PLATE.size / 2;
  return roundRectD(-half, -half, PLATE.size, PLATE.size, PLATE.corner) +
    slotRects({ heights }).map((s) => roundRectD(s.x, s.y, s.w, s.h, s.rx)).join('');
}

/** The flat plate placed with its center at (cx, cy), `size` px across, as an SVG fragment. */
export const plateAt = (cx, cy, size, color) =>
  `<path transform="translate(${f(cx)} ${f(cy)}) scale(${f(size / PLATE.size)})" fill="${color}" fill-rule="evenodd" d="${plateD()}"/>`;
