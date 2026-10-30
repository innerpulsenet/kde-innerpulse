// The three grounds the theme ships on, taken from the innerpulse brand tokens (2026-10-25). Ink is the
// default: a desktop is a screen, and the brand keeps screens ink-first. Paper is the light variant, with the
// deep ember and the paper steps of every accent. Carbon is further down.
//
// Ember is reserved: the mark, focus rings, the one index tick on a window or popup, the focused task.
// Selection uses the action red (white text 5.1:1); links take the desktop family's violet, the one
// product-family accent allowed beside the pulse.
//
// Selection must be strongly colored, not just dark or light: Chrome and Edge in Qt theme mode don't paint the
// Qt Highlight as given, they rebuild it as a tonal color and lay it over the page at about two thirds. A
// low-chroma selection (Carbon's old gunmetal #5d636c) came out #151b27 on dark pages, about 1.04:1 against
// them. Measured on this desktop: #d12c1e reads 2.4:1 on a black page and #1a73b8 about 2.6:1.
//
// The selection color stays in selections. Breeze's Plasma meters, sliders, switches and scroll bars paint
// it, but this theme ships its own (plasma.mjs), in steel, so Plasma's meters, sliders, switches and scroll
// bars no longer paint it (a stepped slider's tick marks still come from QML).

export const ink = {
  id: 'ink',
  scheme: 'InnerpulseInk',
  name: 'innerpulse Ink',
  dark: true,
  ground: '#0a0908',
  s1: '#100e0c',
  s2: '#17140f',
  s3: '#1f1b17',
  s4: '#28231e', // one step past the kit's surface 3, for pressed buttons
  viewAlt: '#141210', // alternate rows in lists, half a step above surface 1
  text: '#ece7df',
  text2: '#b0a99f',
  text3: '#8e877d',
  disabled: '#5f5951',
  line: 'rgba(244,241,236,.09)',
  line2: 'rgba(244,241,236,.16)',
  lineRGB: [244, 241, 236],
  mark: '#f43a2a',
  focus: '#f43a2a',
  hover: '#9c3a2f',
  select: '#d12c1e', // the action red
  selectAlt: '#b3261a',
  selectText: '#ffffff',
  action: '#d12c1e',
  link: '#b38cff', // desktop & native · violet
  visited: '#9a7fd6',
  ok: '#7dffb0',
  warn: '#ffb347',
  err: '#ff9a8f',
  shadow: [0, 0, 0],
  shadowAlpha: 0.55,
};

export const paper = {
  id: 'paper',
  scheme: 'InnerpulsePaper',
  name: 'innerpulse Paper',
  dark: false,
  ground: '#f4f1ec',
  s1: '#efebe4',
  s2: '#e9e4db',
  s3: '#e0dad0',
  s4: '#d6cfc3',
  text: '#14171c',
  text2: '#454b56',
  text3: '#575e6b',
  disabled: '#a29c92',
  line: 'rgba(20,23,28,.10)',
  line2: 'rgba(20,23,28,.18)',
  lineRGB: [20, 23, 28],
  mark: '#cf2a1c',
  focus: '#cf2a1c',
  hover: '#d98a80',
  select: '#d12c1e',
  selectAlt: '#b42418',
  selectText: '#ffffff',
  action: '#d12c1e',
  link: '#6a3fd0',
  visited: '#5530b0',
  ok: '#0d6d3d',
  warn: '#8b5109',
  err: '#a3221a',
  shadow: [40, 30, 20],
  shadowAlpha: 0.22,
};

// Carbon: the brand's brushed steel (the chrome masthead's ramp, assets/web/innerpulse-chrome-defs.svg) over cool
// carbon blacks. Text is steel, selection is blued steel rather than ember, so ember stays the one signal: the
// mark, focus rings, the index ticks. Its glass is brighter, as polished metal would be.
export const carbon = {
  id: 'carbon',
  scheme: 'InnerpulseCarbon',
  name: 'innerpulse Carbon',
  dark: true,
  ground: '#0b0d10',
  s1: '#111317',
  s2: '#171a1f',
  s3: '#1f2329',
  s4: '#2b3037', // gunmetal
  viewAlt: '#14171b',
  text: '#e3e6e9', // bright steel
  text2: '#b9bdc3',
  text3: '#8f949b',
  disabled: '#5d636c',
  line: 'rgba(227,230,233,.10)',
  line2: 'rgba(227,230,233,.18)',
  lineRGB: [227, 230, 233],
  mark: '#f43a2a',
  focus: '#f43a2a',
  hover: '#8b9097',
  // Blued steel: the deep blue that steel takes when it's heat-tempered. Gunmetal gray was the first choice,
  // but a gray selection vanishes in Chrome on dark pages (see the note at the top). White text on it is 5.0:1.
  select: '#1a73b8',
  selectAlt: '#155f98',
  selectText: '#ffffff',
  action: '#d12c1e',
  link: '#b38cff',
  visited: '#9a7fd6',
  ok: '#7dffb0',
  warn: '#ffb347',
  err: '#ff9a8f',
  shadow: [0, 0, 0],
  shadowAlpha: 0.6,
};

export const themes = [ink, paper, carbon];

// ANSI sets for Konsole: the family accents as phosphors on ink, their deep steps on paper.
export const ansi = {
  ink: {
    bg: ink.ground, fg: ink.text, fgIntense: '#ffffff', bgIntense: ink.s2,
    normal: ['#17140f', '#f43a2a', '#7dffb0', '#ffb347', '#628dea', '#b38cff', '#52e3ff', '#b0a99f'],
    bright: ['#4a443d', '#ff6c51', '#b0ffd0', '#ffd08a', '#93b2f5', '#d2bdff', '#9aeeff', '#ece7df'],
    faint: ['#100e0c', '#9e2a20', '#4f9c6f', '#a3732f', '#435d96', '#755ca6', '#378fa1', '#7a746b'],
  },
  carbon: {
    bg: carbon.ground, fg: carbon.text, fgIntense: '#fbfcfd', bgIntense: carbon.s2,
    normal: ['#1d2025', '#f43a2a', '#7dffb0', '#ffb347', '#7f9fe0', '#b38cff', '#52e3ff', '#b9bdc3'],
    bright: ['#5d636c', '#ff6c51', '#b0ffd0', '#ffd08a', '#a8bff0', '#d2bdff', '#9aeeff', '#fbfcfd'],
    faint: ['#14171b', '#9e2a20', '#4f9c6f', '#a3732f', '#4f6491', '#755ca6', '#378fa1', '#6c7178'],
  },
  paper: {
    bg: paper.ground, fg: paper.text, fgIntense: '#000000', bgIntense: paper.s2,
    normal: ['#14171c', '#b42418', '#0d6d3d', '#8b5109', '#2f56b0', '#6a3fd0', '#09677e', '#575e6b'],
    bright: ['#454b56', '#cf2a1c', '#09582f', '#6e3f06', '#1f4291', '#5530b0', '#065164', '#7a746b'],
    faint: ['#575e6b', '#c9766d', '#6c9d83', '#b08e66', '#7d93c4', '#9c87d8', '#6aa0ad', '#b6b1a8'],
  },
};

// --- color math -----------------------------------------------------------------------------------------

export const hexRGB = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
export const rgbStr = (h) => hexRGB(h).join(',');

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
export const contrast = (a, b) => {
  const [la, lb] = [lum(hexRGB(a)), lum(hexRGB(b))].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
};
