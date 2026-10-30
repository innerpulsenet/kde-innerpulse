// Glass and the index tick: one definition for every surface that draws them (Plasma frames and controls in
// plasma.mjs, title bars and buttons in aurorae.mjs), so the shell and the window decoration can't drift apart.
//
// Glass is lit from above: a white sheen falling from the top edge, a 1 px white highlight lip just inside the
// top hairline, and a 1 px dark shade inside the bottom edge. Values are alphas. Paper is light, so its sheen
// and lip are strong and its shade faint; Carbon is polished metal, so its glass is a little brighter than Ink's.

export const GLASS = {
  ink: { sheen: 0.075, lip: 0.13, shade: 0.35 },
  paper: { sheen: 0.55, lip: 0.85, shade: 0.07 },
  carbon: { sheen: 0.09, lip: 0.17, shade: 0.4 },
};

// Title bars: [active, inactive]. An inactive title bar keeps a faint version of the light, so it reads as the
// same material, just not lit. `shade` is the window's bottom edge, the same lit or not.
export const TITLE_GLASS = {
  ink: { sheen: [0.07, 0.035], lip: [0.13, 0.07], shade: 0.3 },
  paper: { sheen: [0.55, 0.3], lip: [0.9, 0.6], shade: 0.06 },
  carbon: { sheen: [0.11, 0.05], lip: [0.2, 0.09], shade: 0.3 },
};

// The index tick: a short ember bar on the edge that faces the content, starting `gap` px past the end of the
// corner's curve. The same mark on popups, the active window and the active tab.
export const TICK = { length: 12, thickness: 2, gap: 2 };
