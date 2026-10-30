# innerpulse for KDE Plasma 6

A complete Plasma 6 desktop theme built on the [innerpulse](https://www.innerpulse.net) identity: an instrument
look with warm ink grounds, machined corners, hairlines, glass that's lit from above, and one ember signal. It ships
in three variants: **Ink** (the default), **Paper** and **Carbon**. Every color, frame and wallpaper is generated
from code, so nothing is redrawn by hand.

![innerpulse Ink](docs/preview-ink.jpg)

| Paper | Carbon |
|---|---|
| ![innerpulse Paper](docs/preview-paper.jpg) | ![innerpulse Carbon](docs/preview-carbon.jpg) |

These previews are illustrations drawn from the theme's own palette and geometry. The captures below are real.

| Apps in Carbon (Oxygen widget style) | Splash screen |
|---|---|
| ![widgets in Carbon](docs/widgets-carbon.png) | ![splash](docs/splash.jpg) |

## What's in it

| Part | What it does |
|---|---|
| Color schemes `InnerpulseInk`, `InnerpulsePaper`, `InnerpulseCarbon` | Warm ink surfaces, paper, or carbon with brushed-steel text. Three text grays that clear WCAG AA. Selection is deep ember with white text (6.5:1), or gunmetal at 8.1:1 in Carbon. Focus rings are ember, links violet, and status colors mint, amber and soft red |
| Plasma theme `innerpulse` | One theme for all three variants, recolored by the active scheme. Panels have machined 4 px corners, a hairline and a faint graduated scale along the long edge. Popups carry one ember index tick at the top left. In menus and launchers the row index turns ember on hover. The focused task gets an ember bar on the panel side; tasks that want attention get amber |
| Glass | Surfaces are lit from above: a sheen through the top edge, a 1 px highlight lip and a faint shade at the foot. Panels and popups are frosted (about three quarters ground, blurred behind). Apps use Oxygen's widget style, recolored by the scheme, for raised glass buttons, tabs and progress bars. `--style breeze` gives flat widgets instead |
| Window decorations (Aurorae) | Glass title bar, hairline ring and soft shadow, with the ember index tick on the active window only. Buttons lift onto a glass tile on hover; close lifts onto the action red |
| Wallpapers | **Exposure** (default), **Horizon**, **Field**, **Ribbon**, and **Carbon**. All but Carbon come in ink and paper renditions, and Plasma picks the one that matches the scheme. Each caption states what's actually drawn |
| Splash screen | The mark fades in at rest where the Exposure wallpaper's mark stands (centered on a portrait screen), then beats at a 2.4 s working tempo while Plasma starts, over a working line that shows the real elapsed time. When start-up is done the words fade and the mark settles to rest where the wallpaper's mark will appear, so the handoff to the desktop keeps it in place. It holds still when animations are off, and the timer then counts whole seconds |
| Lock screen | Its own composition, set low and to the right so the clock, avatar, password field and footer sit on clear ground, shown by a small wallpaper plugin (`net.innerpulse.lock`) that beats the live mark over the drawn one every 4.5 s. The mark holds still when animations are off |
| Logout prompt | Plasma's own prompt, loaded as it is, on the ink ground instead of black, with the countdown in JetBrains Mono and the mark above the avatar at the 4.5 s ambient beat |
| Motion | Windows open and close on a shorter, shallower scale (160 ms from 94 %, instead of 200 ms from 80 %). Launch feedback is static: the starting app's icon sits still by the pointer instead of bouncing. Oxygen's widget animations follow Plasma's animation speed (see below) |
| Global themes | `innerpulse Ink`, `innerpulse Paper` and `innerpulse Carbon` in System Settings → Colors & Themes → Global Theme. None of them touches your panel layout |
| Konsole | Matching color schemes and profiles, with an ember block cursor |
| Fonts (optional) | Inter for the interface, JetBrains Mono for fixed-width. The installer fetches them, plus Instrument Sans and Syne, from google/fonts with `--fonts` |

### Wallpapers

| Exposure | Horizon |
|---|---|
| ![Exposure](docs/wallpaper-exposure.jpg) | ![Horizon](docs/wallpaper-horizon.jpg) |
| One beat of the mark photographed 96 times over 1.6 s, 8 px apart, resolving into the mark at rest | One beat in depth: 80 readings 0.056 s apart, receding to a horizon, with the rise drawn 3× (as its caption says). The front row is live |
| **Field** | **Carbon** |
| ![Field](docs/wallpaper-field.jpg) | ![Carbon](docs/wallpaper-carbon.jpg) |
| A frozen waterfall, 240 × 128 of the mark's bars, with the mark cleaned out of the noise | Exposure over a fine carbon-fiber weave |

## Install

You need Plasma 6 with Aurorae and the Oxygen widget style. On Kubuntu or Ubuntu that's
`sudo apt install kwin-style-aurorae kde-style-oxygen-qt6`.

### From a release (no build tools)

Download `kde-innerpulse-<version>.tar.gz` from the
[latest release](https://github.com/innerpulsenet/kde-innerpulse/releases/latest). It's already built.

```bash
tar -xzf kde-innerpulse-1.0.0.tar.gz && cd kde-innerpulse-1.0.0
```

```bash
./install.sh --fonts --apply ink
```

### From source

Building also needs Node 20 or newer, librsvg and ImageMagick:

```bash
sudo apt install librsvg2-bin imagemagick nodejs
```

```bash
git clone https://github.com/innerpulsenet/kde-innerpulse.git && cd kde-innerpulse
```

```bash
node src/build.mjs
```

```bash
./install.sh --fonts --apply ink
```

Everything installs under `~/.local/share` for the current user, so there's no sudo and nothing system-wide.

| Option | What it does |
|---|---|
| (none) | Copy the theme into place. Nothing on screen changes |
| `--apply ink`, `paper` or `carbon` | Switch the desktop to that variant. Your previous global theme, colors, decoration, splash, widget style, Konsole profile, fonts, lock screen, window open and close animation, launch feedback and Oxygen animation settings are saved first |
| `--style breeze` | With `--apply`: flat Breeze widgets instead of Oxygen's glass |
| `--fonts` | Fetch Inter, Instrument Sans, JetBrains Mono and Syne (SIL OFL) into `~/.local/share/fonts/innerpulse`. With them installed, `--apply` sets the interface and fixed-width fonts |
| `--launcher-icon` | Put the mark on the application launcher |
| `--restore` | Put back what was active before the first `--apply`, the lock screen included. The desktop wallpaper is left as it is |
| `--uninstall` | Restore, then remove every installed file. Each screen still showing an innerpulse wallpaper is switched to the previous global theme's wallpaper (or Plasma's Next); screens showing your own wallpaper keep it. Fetched fonts are left in place |

### Motion settings

- **Animation speed and Oxygen.** Oxygen doesn't read Plasma's Animation speed setting, so `--apply` copies it
  into Oxygen's own settings: at Instant, Oxygen's animations are off. It's read once, so after you change the
  speed, run `--apply` again and restart open apps. KWin's effects follow the setting on their own. The splash,
  lock screen and logout prompt hold the mark still when the speed is Instant; at any other speed they keep the
  brand's 4.5 s and 2.4 s beats.
- **A still mark on the lock screen.** While the password prompt is up, the lock screen blurs its wallpaper, which
  turns the beating mark into a soft pulsing glow. To keep it still, turn off "Beat every 4.5 s while locked" in
  System Settings → Screen Locking → Appearance, or run
  `kwriteconfig6 --file kscreenlockerrc --group Greeter --group Wallpaper --group net.innerpulse.lock --group General --key BeatOnLock false`.

## Known limitations

Both come from Oxygen's widget style, so a color scheme can't change them. `--style breeze` avoids both, at the
cost of the glass.

- In a list that doesn't have keyboard focus, Oxygen dims the selection to about 40% (roughly 1.3–1.5:1 against
  the list). The focused selection is full strength: 3.5:1 in Ink, 5.2:1 in Paper and 3.7:1 in Carbon.
- Oxygen doesn't fill the default button in a dialog, so "OK" and "Cancel" look alike. Breeze fills it.

## How it's built

```
brand/            the wordmark, ribbon and icon artwork
src/build.mjs     builds dist/, laid out like ~/.local/share
src/lib/
  mark.mjs        the mark's geometry and its one motion, the beat
  palette.mjs     every color in all three variants, chosen for contrast
  colors.mjs      KDE and Konsole color schemes
  svg.mjs         nine-slice frames drawn as plain paths (Qt SVG renders SVG Tiny, so no clip paths or filters)
  plasma.mjs      the Plasma theme: panel, popups, tooltips, widgets, tasks, list highlights, glass
  aurorae.mjs     the window decorations and their buttons
  wallpaper.mjs, wallpaper-art.mjs   Field, Ribbon, Exposure, Horizon, Carbon, and the lock screen's ground
  preview.mjs     the global-theme and splash previews
src/splash/       Splash.qml
src/lock/         the lock screen's wallpaper plugin
src/logout/       the logout prompt (a wrapper that loads Plasma's own)
src/qml/          AmbientMark.qml, the mark at the 4.5 s beat, shared by the lock screen and the logout prompt
install.sh        install, apply, restore, uninstall
```

To change a color, edit `src/lib/palette.mjs` and rebuild. The QML screens take the mark's geometry, tempos and
colors from the same modules at build time (values tagged `/*@KEY@*/`). `dist/` and `build/` are generated, so don't edit them.

## License

The code and theme files are MIT licensed (see [LICENSE](LICENSE)). The innerpulse name, mark, wordmark and
artwork are not covered by it. They ship with this theme and may be used as part of it, but not to brand anything
else. See [BRAND.md](BRAND.md), which also explains how to fork the theme with your own identity.
