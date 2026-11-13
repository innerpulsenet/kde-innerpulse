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
