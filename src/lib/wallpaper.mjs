// Wallpapers.
//
// The desktop wallpapers are the OLED set: sixteen finished images in four sets, on a true black ground, each in
// 2560 × 1440, 3440 × 1440, 3840 × 2160 and 5120 × 2160 (wallpapers/<id>/<W>x<H>.jpg). The build packages them as
// they are; Plasma picks the rendition nearest the screen. They are one ground for every variant.
//
// Two grounds are still drawn here: the quiet ground for a second screen (the wallpapers' black, with nothing on
// it), and the lock screen's composition, the variant's ground with the flat plate at rest, low and to the right,
// clear of the lock screen's clock, avatar, password field and footer. The lock screen's own plugin (src/lock)
// draws the live plate exactly over the resting one.
import { plateAt } from './mark.mjs';

const VW = 2560, VH = 1440;
export const ART = { width: VW, height: VH };

// [set, id, name, description], in the sets' own order. The first is the default.
export const WALLPAPERS = [
  ['Afterglow Prism', 'innerpulse-afterglow-prism', 'Afterglow Prism', 'The beat rings down into its afterglow, cooling from ember through the spectrum'],
  ['Afterglow Prism', 'innerpulse-afterglow-diverging', 'Afterglow Diverging', 'The afterglow spread both ways from one lit strike'],
  ['Afterglow Prism', 'innerpulse-afterglow-stages', 'Afterglow Stages', 'Three readings side by side, from planned to live'],
  ['Afterglow Prism', 'innerpulse-afterglow-monolith', 'Afterglow Monolith', 'The afterglow receding in depth as stacked glass'],
  ['Phosphor Harmonics', 'innerpulse-harmonic-spectrum', 'Harmonic Spectrum', 'Overlapping harmonics traced in phosphor'],
  ['Phosphor Harmonics', 'innerpulse-harmonic-caustics', 'Harmonic Caustics', 'A sheet of fine traces folding into caustics'],
  ['Phosphor Harmonics', 'innerpulse-harmonic-rf-envelope', 'Harmonic RF Envelope', 'A carrier under its envelope, cooling across the band'],
  ['Phosphor Harmonics', 'innerpulse-harmonic-overtones', 'Harmonic Overtones', 'Overtones laid out as parallel traces'],
  ['Chromatic Helix', 'innerpulse-chromatic-ribbon', 'Chromatic Ribbon', 'A ribbon of contour lines twisting through the spectrum'],
  ['Chromatic Helix', 'innerpulse-helix-bifrost', 'Helix Bifrost', 'A helix of bars bridging ember to violet'],
  ['Chromatic Helix', 'innerpulse-celestial-astrolabe', 'Celestial Astrolabe', 'Concentric arcs on an engraved dial'],
  ['Chromatic Helix', 'innerpulse-torsion-prism', 'Torsion Prism', 'Two lobes of bars twisting in opposite colors'],
  ['Pulse Chronograph', 'innerpulse-chronograph-wake', 'Chronograph Wake', 'The beat leaving a wake of readings behind it'],
  ['Pulse Chronograph', 'innerpulse-spectral-waterfall', 'Spectral Waterfall', 'A spectral waterfall in lit cells'],
  ['Pulse Chronograph', 'innerpulse-retake-horizon', 'Retake Horizon', 'Readings receding to a horizon as a terrain of lines'],
  ['Pulse Chronograph', 'innerpulse-instrument-scope', 'Instrument Scope', 'Lissajous traces on a scope'],
];
export const DEFAULT_WALLPAPER = WALLPAPERS[0][1];
// the renditions every wallpaper ships in, smallest first
export const WALLPAPER_SIZES = [[2560, 1440], [3440, 1440], [3840, 2160], [5120, 2160]];
// the true black the OLED set is drawn on
export const OLED_GROUND = '#000000';

// The footer. Every image in the set carries two lines of text in the same place: the wordmark at the bottom left
// and the image's caption at the bottom right, both 3.5% of the height from the bottom edge (50 px at 1440). A
// bottom panel covers that: Plasma's default 44 px floating panel takes the bottom 52 px, so it cut through both
// lines. The build lifts each of the two boxes, on its own, until its foot is LIFT_TO of the height from the
// bottom (96 px at 1440, 144 at 2160), which clears a 64 px panel at 100% and a 46 px one at 200%. Both boxes move
// by the same amount, so the wordmark and the caption keep their alignment, and each over its own columns only,
// so artwork beside a caption stays where it is. Where artwork hangs low over a caption (Chromatic Ribbon), the
// lift stops short of it, but never under minClear, which still clears Plasma's default 44 px floating panel
// with 12 px to spare; the build fails if a box can't be found cleanly or can't land on bare ground.
export const FOOTER = {
  band: [0.945, 0.975], // the rows the footer is looked for in, as fractions of the height
  liftTo: 0.0667, // where a box's foot ends up, as a fraction of the height from the bottom edge
  minClear: 0.0445, // the least that will do: 64 px at 1440
  lit: 40, // a gray level above this is ink
  ground: 24, // the ground a box lands on must stay at or under this
  gap: 0.015, // a run of dark columns wider than this (× height) ends a box; word spaces in the set are under 0.01
  anchor: 0.1, // a box's text rows are the band's rows with ink in its own tenth of the width (left or right)
  pad: 0.003, // the margin moved along with a box and checked around where it lands (× height, at least 3 px)
};

/**
 * Finds the footer's two boxes in a grayscale band (one byte a pixel, `w` wide, starting at row `y0` of an
 * image `h` tall). Returns [{ x0, x1, y0, y1 }, …] in image coordinates (inclusive), left box first.
 */
export function footerBoxes(gray, w, bandH, y0, h) {
  const ink = (x, y) => gray[y * w + x] > FOOTER.lit;
  const rowHas = (y, x0, x1) => { for (let x = x0; x <= x1; x++) if (ink(x, y)) return true; return false; };
  const gap = Math.round(FOOTER.gap * h), edge = Math.round(FOOTER.anchor * w);
  const boxes = [];
  for (const side of ['left', 'right']) {
    // 1. the text's rows: ink in this side's own tenth of the width, where the set puts the wordmark (left) or
    //    the end of the caption (right) and no artwork reaches in any of the sixteen
    const [ax0, ax1] = side === 'left' ? [0, edge] : [w - 1 - edge, w - 1];
    const rows = [];
    for (let y = 0; y < bandH; y++) if (rowHas(y, ax0, ax1)) rows.push(y);
    if (!rows.length) throw new Error(`no footer text at the ${side}`);
    let [r0, r1] = [rows[0], rows.at(-1)], x0, x1;
    // 2. its columns: a run of inked columns within those rows from this side, ended by a dark gap wider than a
    //    word space, so artwork farther in stays out of the box. 3. then its rows grow over those columns until a
    //    dark row (a bracket or a caret farther in stands taller than the caption's end). Repeat until neither
    //    changes; a box that grows into the band's edge is not a line of text on clear ground.
    for (let pass = 0; ; pass++) {
      const lit = (x) => { for (let y = r0; y <= r1; y++) if (ink(x, y)) return true; return false; };
      const step = side === 'left' ? 1 : -1;
      let x = side === 'left' ? 0 : w - 1;
      while (!lit(x)) x += step;
      let start = x, end = x, dark = 0;
      for (x += step; x >= 0 && x < w; x += step) {
        if (lit(x)) { end = x; dark = 0; } else if (++dark > gap) break;
      }
      [x0, x1] = side === 'left' ? [start, end] : [end, start];
      let [g0, g1] = [r0, r1];
      while (g0 > 0 && rowHas(g0 - 1, x0, x1)) g0--;
      while (g1 < bandH - 1 && rowHas(g1 + 1, x0, x1)) g1++;
      if (g0 === 0 || g1 === bandH - 1 || pass > 4) {
        throw new Error(`the ${side} footer text runs into other artwork (rows ${y0 + g0}–${y0 + g1})`);
      }
      if (g0 === r0 && g1 === r1) break;
      [r0, r1] = [g0, g1];
    }
    boxes.push({ x0, x1, y0: y0 + r0, y1: y0 + r1 });
  }
  if (boxes[0].x1 >= boxes[1].x0) throw new Error('the footer\'s two boxes overlap');
  return boxes;
}

// The resting plate on the lock screen: its center as a fraction of the 2560 × 1440 box, and its size in px.
export const LOCK_MARK = { mx: 0.72, my: 0.8, size: 176 };
// the sizes the lock composition is rasterized at
export const LOCK_SIZES = [[1920, 1080], [2560, 1440], [3840, 2160]];

export const svgDoc = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${VW}" height="${VH}" viewBox="0 0 ${VW} ${VH}">\n${body}\n</svg>\n`;

export const quietWallpaper = () => svgDoc(`<rect width="${VW}" height="${VH}" fill="${OLED_GROUND}"/>`);

export const lockWallpaper = (t) => svgDoc([
  `<rect width="${VW}" height="${VH}" fill="${t.ground}"/>`,
  plateAt(LOCK_MARK.mx * VW, LOCK_MARK.my * VH, LOCK_MARK.size, t.mark),
].join('\n'));
