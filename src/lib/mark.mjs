// The innerpulse mark: its geometry and its one motion, the beat. Everything the theme draws of the mark comes
// from here, so the wallpapers, previews and splash match the brand exactly.
//
//   h_i = rest(84 · |sin(2π·i/5 + φ)|)      φ = −π/30      i = 0 … 5
//
// Five samples make one beat and φ puts a rest (a stub held at the 12-unit optical minimum) at both ends. Each
// sample is a bar 22 units wide from −h−11 to +h+11 with 4-unit corners, spread evenly across x = −92 … 92 in a
// 220-unit box. The beat: every period, one pulse passes through the bars left to right, each rising 16 units
// with a sin² bump and settling.

const TAU = Math.PI * 2;

export const MARK = {
  beat: 5, // samples per beat
  span: 92, // half-width: bars run x = −92 … 92
  amp: 84, // full amplitude; a bar is ±h
  minBar: 12, // optical minimum, so a rest still prints as a stub
  ease: 30, // heights between minBar and ease join the floor smoothly
  phase: -Math.PI / 30, // puts the rests at both ends
  stroke: 22, // bar width
  corner: 4, // corner radius: machined, not a pill
};

// The beat's three tempos, in seconds per pulse: ambient where the viewer rests (wallpapers, the lock and logout
// screens), working while something runs (the splash), busy for a short wait.
export const TEMPO = { ambient: 4.5, working: 2.4, busy: 1.2 };

export const PULSE = {
  period: TEMPO.ambient, // seconds between beats for an ambient mark
  rise: 16, // every bar rises this much as the beat passes
  width: 0.19, // a bar's rise lasts this fraction of the period
  lag: 0.0245, // each bar starts this fraction of the period after the one to its left
};

/** The optical minimum with a soft landing: a cubic Hermite join from minBar up to ease. */
export function restFloor(v, { min = MARK.minBar, ease = MARK.ease } = {}) {
  if (v <= min) return min;
  if (v >= ease) return v;
  const w = ease - min, t = (v - min) / w;
  return (2 * t ** 3 - 3 * t ** 2 + 1) * min + (-2 * t ** 3 + 3 * t ** 2) * ease + (t ** 3 - t ** 2) * w;
}

/** The six resting heights: 12 · 76.74 · 56.21 · 42 · 82.16 · 12. */
export function barHeights({ phase = MARK.phase } = {}) {
  return Array.from({ length: MARK.beat + 1 }, (_, i) =>
    restFloor(MARK.amp * Math.abs(Math.sin((TAU * i) / MARK.beat + phase))));
}

/** The x center of bar i. */
export const barX = (i) => -MARK.span + (i / MARK.beat) * MARK.span * 2;

/** The heights at time t (seconds) while the beat passes through the resting mark. */
export function beatHeights(t, { period = PULSE.period, rise = PULSE.rise, width = PULSE.width, lag = PULSE.lag, heights } = {}) {
  const rest = heights ?? barHeights();
  if (!(period > 0)) return rest;
  const T = ((t % period) + period) % period;
  return rest.map((h, i) => {
    const u = (T - i * lag * period) / (width * period);
    return u > 0 && u < 1 ? h + rise * Math.sin(Math.PI * u) ** 2 : h;
  });
}

/** The bars as rects {x, y, w, h, rx} in the mark's own 220-unit box. */
export function barRects({ heights } = {}) {
  const r = MARK.stroke / 2;
  return (heights ?? barHeights()).map((h, i) => ({ x: barX(i) - r, y: -h - r, w: MARK.stroke, h: 2 * h + 2 * r, rx: MARK.corner }));
}
