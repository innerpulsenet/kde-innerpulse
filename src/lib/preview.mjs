// The look-and-feel preview: the field wallpaper with a panel, a window and a popup drawn in the theme's own
// colors and geometry, so the picture in System Settings shows what applying it does. It is an illustration
// built from the palette, not a screenshot.
import { readFileSync } from 'node:fs';
import { barRects } from './mark.mjs';
import { EXPOSURE_MARK } from './wallpaper-art.mjs';
import { n } from './svg.mjs';

const VW = 2560, VH = 1440;

export function preview(t, wallpaperPng) {
  const wp = readFileSync(wallpaperPng).toString('base64');
  const line = `rgb(${t.lineRGB.join(',')})`;
  const head = t.dark ? t.ground : t.s2, win = t.dark ? t.s2 : t.ground, view = t.dark ? t.s1 : '#faf8f4';
  const sans = 'font-family="Inter, Instrument Sans, IBM Plex Sans, sans-serif"'; // the interface face install.sh sets
  const mono = 'font-family="JetBrains Mono, IBM Plex Mono, monospace"';
  const out = [];
  out.push(`<image href="data:image/png;base64,${wp}" width="${VW}" height="${VH}"/>`);

  // window
  // the window sits left, clear of the Exposure mark (right of center) and above the panel's popup
  const W = { x: 150, y: 150, w: 1180, h: 800 };
  out.push(`<rect x="${W.x - 2}" y="${W.y + 10}" width="${W.w + 4}" height="${W.h}" rx="6" fill="#000" opacity="${t.dark ? 0.45 : 0.14}" filter="url(#soft)"/>`);
  out.push(`<rect x="${W.x}" y="${W.y}" width="${W.w}" height="${W.h}" rx="4" fill="${win}" stroke="${line}" stroke-opacity="${t.dark ? 0.16 : 0.2}"/>`);
  out.push(`<path d="M${W.x + 4} ${W.y + 0.5}h${W.w - 8}a3.5 3.5 0 0 1 3.5 3.5v32.5h-${W.w - 1}v-32.5a3.5 3.5 0 0 1 3.5-3.5z" fill="${head}"/>`);
  out.push(`<rect x="${W.x + 8}" y="${W.y}" width="14" height="2" fill="${t.mark}"/>`); // index tick
  out.push(`<text x="${W.x + 16}" y="${W.y + 23}" ${sans} font-size="14" font-weight="600" fill="${t.text}">${t.name}</text>`);
  // buttons: minimize, maximize, close
  const bx = W.x + W.w - 30;
  out.push(`<g fill="none" stroke="${t.text2}" stroke-width="1.5" stroke-linecap="square"><path d="M${bx - 9} ${W.y + 13}l10 10M${bx + 1} ${W.y + 13}l-10 10"/><path d="M${bx - 38.5} ${W.y + 13.5}h9v9h-9z"/><path d="M${bx - 69} ${W.y + 18}h10"/></g>`);
  // sidebar and view
  const top = W.y + 36;
  out.push(`<rect x="${W.x + 1}" y="${top}" width="240" height="${W.h - 37}" fill="${win}"/>`);
  out.push(`<rect x="${W.x + 241}" y="${top}" width="${W.w - 242}" height="${W.h - 37}" fill="${view}"/>`);
  out.push(`<rect x="${W.x + 241}" y="${top}" width="1" height="${W.h - 37}" fill="${line}" opacity="${t.dark ? 0.12 : 0.16}"/>`);
  const side = ['Home', 'Documents', 'Projects', 'Downloads', 'Trash'];
  side.forEach((s, i) => {
    const y = top + 24 + i * 34;
    if (i === 2) {
      out.push(`<rect x="${W.x + 10}" y="${y - 20}" width="220" height="30" rx="3" fill="${t.text}" opacity=".11"/><rect x="${W.x + 10}" y="${y - 17}" width="2" height="24" fill="${t.mark}"/>`);
    }
    out.push(`<text x="${W.x + 26}" y="${y}" ${sans} font-size="14" fill="${i === 2 ? t.text : t.text2}">${s}</text>`);
  });
  // list with a header, one selected row (deep ember fill) and an eyebrow
  const lx = W.x + 270;
  out.push(`<text x="${lx}" y="${top + 34}" ${mono} font-size="11" letter-spacing="1.6" fill="${t.text3}">NAME</text>`);
  const rows = ['brand', 'huntsite', 'KDE-Innerpulse', 'stats', 'dashboard', 'notes.md', 'deploy.sh'];
  rows.forEach((r, i) => {
    const y = top + 72 + i * 36;
    if (i % 2 === 1) out.push(`<rect x="${W.x + 242}" y="${y - 23}" width="${W.w - 243}" height="36" fill="${t.dark ? t.viewAlt : t.ground}"/>`);
    if (i === 2) out.push(`<rect x="${W.x + 250}" y="${y - 22}" width="${W.w - 262}" height="34" rx="3" fill="${t.select}"/>`);
    const fg = i === 2 ? '#ffffff' : t.text;
    out.push(`<rect x="${lx}" y="${y - 13}" width="14" height="12" rx="2" fill="${i === 2 ? '#ffffff' : t.text3}" opacity="${i === 2 ? 0.9 : 0.6}"/>`);
    out.push(`<text x="${lx + 26}" y="${y}" ${sans} font-size="14" fill="${fg}">${r}</text>`);
  });
  // one action button
  out.push(`<rect x="${W.x + W.w - 160}" y="${W.y + W.h - 58}" width="136" height="36" rx="4" fill="${t.action}"/><text x="${W.x + W.w - 92}" y="${W.y + W.h - 35}" text-anchor="middle" ${sans} font-size="12" font-weight="600" letter-spacing="1.6" fill="#fff">OPEN</text>`);
  out.push(`<rect x="${W.x + W.w - 310}" y="${W.y + W.h - 58}" width="136" height="36" rx="4" fill="${t.dark ? t.s3 : t.s1}" stroke="${line}" stroke-opacity=".18"/><text x="${W.x + W.w - 242}" y="${W.y + W.h - 35}" text-anchor="middle" ${sans} font-size="12" font-weight="600" letter-spacing="1.6" fill="${t.text}">CANCEL</text>`);

  // panel (floating), with the faint scale on its top edge
  const P = { x: 720, y: VH - 66, w: VW - 1440, h: 52 };
  out.push(`<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="4" fill="${head}" fill-opacity="${t.dark ? 0.92 : 0.94}" stroke="${line}" stroke-opacity="${t.dark ? 0.16 : 0.18}"/>`);
  for (let x = P.x + 8; x < P.x + P.w - 8; x += 8) out.push(`<rect x="${x}" y="${P.y + 1}" width="1" height="${(x - P.x) % 32 === 8 ? 4 : 2}" fill="${t.text}" opacity="${t.dark ? 0.12 : 0.16}"/>`);
  // launcher: the mark
  const S = 30 / 220;
  out.push(`<g transform="translate(${P.x + 34} ${P.y + 26}) scale(${n(S)})" fill="${t.mark}">${barRects().map((r) => `<rect x="${n(r.x)}" y="${n(r.y)}" width="${r.w}" height="${n(r.h)}" rx="${r.rx}"/>`).join('')}</g>`);
  // tasks: one focused (ember bar on the panel side), two running, one minimized
  const states = ['focus', 'normal', 'normal', 'minimized'];
  states.forEach((s, i) => {
    const x = P.x + 84 + i * 56;
    if (s === 'focus') out.push(`<rect x="${x}" y="${P.y + 4}" width="48" height="44" rx="3" fill="${t.text}" opacity=".1"/>`);
    out.push(`<rect x="${x + 12}" y="${P.y + 12}" width="24" height="24" rx="5" fill="${t.text2}" opacity="${s === 'minimized' ? 0.45 : 0.85}"/>`);
    const bar = s === 'focus' ? [t.mark, 1, 2] : s === 'normal' ? [t.text, t.dark ? 0.32 : 0.38, 2] : [t.text, 0.2, 1];
    out.push(`<rect x="${x + 4}" y="${P.y + 48 - bar[2]}" width="40" height="${bar[2]}" fill="${bar[0]}" opacity="${bar[1]}"/>`);
  });
  // tray: three plain glyph wells (no invented clock or readings)
  for (let i = 0; i < 3; i++) out.push(`<rect x="${P.x + P.w - 40 - i * 34}" y="${P.y + 17}" width="18" height="18" rx="4" fill="${t.text2}" opacity=".55"/>`);

  // a popup over the panel: hairline, shadow, the ember index tick, and a hovered row with its index
  const M = { x: P.x, y: P.y - 330, w: 360, h: 316 };
  out.push(`<rect x="${M.x}" y="${M.y + 8}" width="${M.w}" height="${M.h}" rx="6" fill="#000" opacity="${t.dark ? 0.5 : 0.16}" filter="url(#soft)"/>`);
  out.push(`<rect x="${M.x}" y="${M.y}" width="${M.w}" height="${M.h}" rx="4" fill="${win}" fill-opacity="${t.dark ? 0.96 : 0.97}" stroke="${line}" stroke-opacity="${t.dark ? 0.16 : 0.18}"/>`);
  out.push(`<rect x="${M.x + 6}" y="${M.y}" width="12" height="2" fill="${t.mark}"/>`);
  out.push(`<text x="${M.x + 20}" y="${M.y + 36}" ${mono} font-size="11" letter-spacing="1.6" fill="${t.text3}">APPLICATIONS</text>`);
  ['Konsole', 'Dolphin', 'Kate', 'System Settings', 'Spectacle'].forEach((a, i) => {
    const y = M.y + 74 + i * 46;
    if (i === 1) out.push(`<rect x="${M.x + 8}" y="${y - 26}" width="${M.w - 16}" height="40" rx="3" fill="${t.text}" opacity=".07"/><rect x="${M.x + 8}" y="${y - 23}" width="2" height="34" fill="${t.mark}"/>`);
    out.push(`<rect x="${M.x + 22}" y="${y - 18}" width="24" height="24" rx="5" fill="${t.text2}" opacity=".8"/>`);
    out.push(`<text x="${M.x + 60}" y="${y}" ${sans} font-size="14" fill="${t.text}">${a}</text>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VW}" height="${VH}" viewBox="0 0 ${VW} ${VH}"><defs><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter></defs>\n${out.join('\n')}\n</svg>\n`;
}

// The splash screen's thumbnail for System Settings: src/splash/Splash.qml laid out at 1920 × 1080 (grid unit
// 18 px), the mark at rest where the Exposure wallpaper puts it, the wordmark under it, and the working line's
// verb. The elapsed readout is left out: a frozen number would be invented.
export function splashPreview(t, wordmarkSvg) {
  const W = 1920, H = 1080, gu = 18;
  const k = Math.max(W / VW, H / VH);
  const box = EXPOSURE_MARK.box * k, s = box / 220;
  const cx = W / 2 + (EXPOSURE_MARK.mx - 0.5) * VW * k, cy = H / 2 + (EXPOSURE_MARK.my - 0.5) * VH * k;
  const bars = barRects().map((r) => `<rect x="${n(r.x)}" y="${n(r.y)}" width="${r.w}" height="${n(r.h)}" rx="${r.rx}"/>`).join('');
  // the wordmark, 790.4 × 120 units, 2.2 grid units tall, 1.5 grid units under the mark's box
  const wh = gu * 2.2, ww = wh * 790.4 / 120;
  const wm = `data:image/svg+xml;base64,${Buffer.from(wordmarkSvg).toString('base64')}`;
  const size = Math.max(12, gu * 0.72);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${t.ground}"/>` +
    `<g transform="translate(${n(cx)} ${n(cy)}) scale(${n(s)})" fill="${t.mark}">${bars}</g>` +
    `<image href="${wm}" x="${n(cx - ww / 2)}" y="${n(cy + box / 2 + gu * 1.5)}" width="${n(ww)}" height="${n(wh)}"/>` +
    `<text x="${n(cx)}" y="${n(H - gu * 3 - size * 0.3)}" text-anchor="middle" font-family="JetBrains Mono, IBM Plex Mono, monospace" font-size="${n(size)}" font-weight="500" fill="${t.text}">Starting Plasma…</text>` +
    `</svg>\n`;
}
