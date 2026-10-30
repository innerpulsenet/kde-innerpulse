#!/usr/bin/env bash
# Install the innerpulse KDE theme for the current user (everything goes under ~/.local/share).
#
#   ./install.sh                     copy the built theme into place (nothing on screen changes)
#   ./install.sh --apply [ink|paper|carbon]  install, then switch the desktop to it (default: ink)
#   ./install.sh --fonts             also fetch the brand faces (Inter, Instrument Sans, JetBrains Mono, Syne; OFL)
#                                    from the google/fonts repository into ~/.local/share/fonts/innerpulse
#   ./install.sh --launcher-icon     set the application launcher's icon to the mark
#   ./install.sh --style breeze      with --apply: flat Breeze widgets instead of Oxygen's glass (default oxygen)
#   ./install.sh --frosted-titlebar  with --apply: the active title bar is translucent, blurred behind (default opaque)
#   ./install.sh --restore           switch back to what was active before the last --apply
#   ./install.sh --uninstall         --restore, then remove every installed file
#
# Run `node src/build.mjs` first if dist/ is missing.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$HERE/dist"
DATA="${XDG_DATA_HOME:-$HOME/.local/share}"
STATE="$DATA/innerpulse-kde"
FONTDIR="$DATA/fonts/innerpulse"

INSTALLED=(
  "color-schemes/InnerpulseInk.colors"
  "color-schemes/InnerpulsePaper.colors"
  "plasma/desktoptheme/innerpulse"
  "plasma/look-and-feel/net.innerpulse.ink"
  "plasma/look-and-feel/net.innerpulse.paper"
  "plasma/look-and-feel/net.innerpulse.carbon"
  "color-schemes/InnerpulseCarbon.colors"
  "aurorae/themes/innerpulse-carbon"
  "wallpapers/innerpulse-carbon"
  "konsole/InnerpulseCarbon.colorscheme"
  "konsole/innerpulse-carbon.profile"
  "aurorae/themes/innerpulse-ink"
  "aurorae/themes/innerpulse-paper"
  "aurorae/themes/innerpulse-ink-frosted"
  "aurorae/themes/innerpulse-paper-frosted"
  "aurorae/themes/innerpulse-carbon-frosted"
  "wallpapers/innerpulse-exposure"
  "wallpapers/innerpulse-horizon"
  "wallpapers/innerpulse-field"
  "wallpapers/innerpulse-ribbon"
  "konsole/InnerpulseInk.colorscheme"
  "konsole/InnerpulsePaper.colorscheme"
  "konsole/innerpulse-ink.profile"
  "konsole/innerpulse-paper.profile"
  "icons/hicolor/scalable/apps/innerpulse.svg"
  "icons/hicolor/scalable/apps/innerpulse-app.svg"
)

say() { printf '\033[38;2;244;58;42m▍\033[0m %s\n' "$*"; }
die() { printf 'install.sh: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }
# Is a font family installed? (grep without -q reads all of fc-list's output: with -q it exits on the first
# match, fc-list dies of SIGPIPE, and under pipefail the check reads as false.)
has_font() { fc-list : family | grep -iE "$1" >/dev/null; }

do_install() {
  [[ -d "$DIST" ]] || die "dist/ is missing: run  node src/build.mjs  first"
  for rel in "${INSTALLED[@]}"; do
    src="$DIST/$rel"; dst="$DATA/$rel"
    [[ -e "$src" ]] || die "missing from dist/: $rel"
    mkdir -p "$(dirname "$dst")"
    rm -rf "$dst"
    cp -r "$src" "$dst"
  done
  # Konsole profiles name JetBrains Mono; fall back to Hack (KDE's default mono) when it is not installed.
  if ! has_font '^JetBrains Mono'; then
    sed -i 's/^Font=JetBrains Mono,/Font=Hack,/' "$DATA"/konsole/innerpulse-{ink,paper,carbon}.profile
  fi
  have gtk-update-icon-cache && gtk-update-icon-cache -q -t "$DATA/icons/hicolor" 2>/dev/null || true
  say "installed into $DATA"
}

do_fonts() {
  have curl || die "--fonts needs curl"
  mkdir -p "$FONTDIR"
  local base="https://raw.githubusercontent.com/google/fonts/main/ofl"
  local files=(
    "instrumentsans/InstrumentSans[wdth,wght].ttf"
    "instrumentsans/InstrumentSans-Italic[wdth,wght].ttf"
    "jetbrainsmono/JetBrainsMono[wght].ttf"
    "jetbrainsmono/JetBrainsMono-Italic[wght].ttf"
    "syne/Syne[wght].ttf"
    "inter/Inter[opsz,wght].ttf"
    "inter/Inter-Italic[opsz,wght].ttf"
  )
  for f in "${files[@]}"; do
    local out; out="$FONTDIR/$(basename "$f")"
    [[ -s "$out" ]] && continue
    say "fetching $(basename "$f")"
    # --globoff: the file names carry [axis] brackets, which curl would otherwise read as a glob
    curl -fsSL --globoff "$base/$f" -o "$out" || { rm -f "$out"; die "could not fetch $f"; }
  done
  fc-cache -f "$FONTDIR" >/dev/null
  say "fonts in $FONTDIR"
}

save_previous() {
  mkdir -p "$STATE"
  [[ -f "$STATE/previous.conf" ]] && return # keep the state from before the first apply
  {
    echo "lookandfeel=$(kreadconfig6 --file kdeglobals --group KDE --key LookAndFeelPackage)"
    echo "colorscheme=$(kreadconfig6 --file kdeglobals --group General --key ColorScheme)"
    echo "decolib=$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key library)"
    echo "decotheme=$(kreadconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme)"
    echo "plasmatheme=$(kreadconfig6 --file plasmarc --group Theme --key name)"
    echo "splash=$(kreadconfig6 --file ksplashrc --group KSplash --key Theme)"
    echo "konsoleprofile=$(kreadconfig6 --file konsolerc --group 'Desktop Entry' --key DefaultProfile)"
    echo "widgetstyle=$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle)"
    echo "oxygengradient=$(kreadconfig6 --file oxygenrc --group Common --key UseBackgroundGradient)"
    echo "font=$(kreadconfig6 --file kdeglobals --group General --key font)"
    echo "fixed=$(kreadconfig6 --file kdeglobals --group General --key fixed)"
    echo "menuFont=$(kreadconfig6 --file kdeglobals --group General --key menuFont)"
    echo "toolBarFont=$(kreadconfig6 --file kdeglobals --group General --key toolBarFont)"
    echo "smallestReadableFont=$(kreadconfig6 --file kdeglobals --group General --key smallestReadableFont)"
    echo "activeFont=$(kreadconfig6 --file kdeglobals --group WM --key activeFont)"
  } > "$STATE/previous.conf"
}

# Aurorae's crossfade and button fades take the theme's Animation= value as is, ignoring the animation-speed
# setting, so scale every installed innerpulse decoration by it here (0 = instant). do_install has just copied
# the generated value in, so this starts from it each time. A snapshot: re-run --apply after moving the slider.
scale_aurorae_animation() {
  local f ms rc
  f=$(kreadconfig6 --file kdeglobals --group KDE --key AnimationDurationFactor --default 1)
  for rc in "$DATA"/aurorae/themes/innerpulse-*/innerpulse-*rc; do
    [[ -f "$rc" ]] || continue
    ms=$(LC_ALL=C awk -v f="$f" -F= '/^Animation=/ { printf "%d", $2 * f + 0.5 }' "$rc")
    [[ -n "$ms" ]] && sed -i "s/^Animation=.*/Animation=$ms/" "$rc"
  done
}

reconfigure_kwin() {
  if have qdbus6; then qdbus6 org.kde.KWin /KWin reconfigure >/dev/null 2>&1 || true; fi
}

do_apply() {
  local variant="$1"
  [[ "$variant" == ink || "$variant" == paper || "$variant" == carbon ]] || die "--apply takes ink, paper or carbon"
  have lookandfeeltool || die "lookandfeeltool not found (is this Plasma 6?)"
  save_previous
  local scheme
  case "$variant" in ink) scheme=InnerpulseInk ;; paper) scheme=InnerpulsePaper ;; carbon) scheme=InnerpulseCarbon ;; esac

  # The global theme sets colors, Plasma theme, window decoration, splash, cursor and icons. It does not
  # touch panels or widgets (no --resetLayout).
  lookandfeeltool -a "net.innerpulse.$variant" >/dev/null
  # Set the parts explicitly too, so a partial apply (or a cached setting) cannot leave a mix behind.
  plasma-apply-colorscheme "$scheme" >/dev/null || true
  plasma-apply-desktoptheme innerpulse >/dev/null || true
  kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key library org.kde.kwin.aurorae
  kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key theme "__aurorae__svg__innerpulse-$variant$DECO"
  scale_aurorae_animation
  kwriteconfig6 --file ksplashrc --group KSplash --key Theme net.innerpulse.ink
  kwriteconfig6 --file ksplashrc --group KSplash --key Engine KSplashQML
  # Widgets: Oxygen's glass (top-lit window gradient, raised glass buttons) recolored by the scheme, or Breeze.
  kwriteconfig6 --file kdeglobals --group KDE --key widgetStyle "$STYLE"
  # Oxygen lightens a window's ground toward its top. On warm Ink that turns the ink olive-brown, so Ink turns it
  # off; Paper and Carbon keep it.
  local gradient=true; [[ $variant == ink ]] && gradient=false
  kwriteconfig6 --file oxygenrc --group Common --key UseBackgroundGradient "$gradient"
  reconfigure_kwin

  # Wallpaper on every screen, and the same image behind the lock screen. The Exposure package carries both
  # grounds (Plasma shows the ink one under a dark scheme); Carbon has its own.
  local wp=innerpulse-exposure ground=images
  [[ $variant == ink ]] && ground=images_dark
  [[ $variant == carbon ]] && wp=innerpulse-carbon
  plasma-apply-wallpaperimage "$DATA/wallpapers/$wp" >/dev/null 2>&1 || true
  local lockimg="$DATA/wallpapers/$wp/contents/$ground/2560x1440.png"
  kwriteconfig6 --file kscreenlockerrc --group Greeter --group Wallpaper --group org.kde.image --group General --key Image "file://$lockimg"
  kwriteconfig6 --file kscreenlockerrc --group Greeter --group Wallpaper --group org.kde.image --group General --key PreviewImage "file://$lockimg"

  # Konsole: new windows open with the matching profile.
  kwriteconfig6 --file konsolerc --group 'Desktop Entry' --key DefaultProfile "innerpulse-$variant.profile"

  # Interface faces, only when the brand fonts are present (see --fonts). The interface takes the brand's
  # reading profile: Inter, because a desktop is read all day in small, dense type; Instrument Sans stays the
  # headline face of the brand's pages and documents. Title bars are Inter 600. Nothing below 9 pt (12 px), the
  # brand's 11 px type floor plus a little.
  local ui=""
  if has_font '^Inter(,|$)'; then ui="Inter"
  elif has_font '^Instrument Sans'; then ui="Instrument Sans"; fi
  if [[ -n "$ui" ]]; then
    kwriteconfig6 --file kdeglobals --group General --key font "$ui,10,-1,5,400,0,0,0,0,0,0,0,0,0,0,1"
    kwriteconfig6 --file kdeglobals --group General --key menuFont "$ui,10,-1,5,400,0,0,0,0,0,0,0,0,0,0,1"
    kwriteconfig6 --file kdeglobals --group General --key toolBarFont "$ui,10,-1,5,400,0,0,0,0,0,0,0,0,0,0,1"
    kwriteconfig6 --file kdeglobals --group General --key smallestReadableFont "$ui,9,-1,5,400,0,0,0,0,0,0,0,0,0,0,1"
    kwriteconfig6 --file kdeglobals --group WM --key activeFont "$ui,10,-1,5,600,0,0,0,0,0,0,0,0,0,0,1"
  fi
  if has_font '^JetBrains Mono'; then
    kwriteconfig6 --file kdeglobals --group General --key fixed "JetBrains Mono,10,-1,5,400,0,0,0,0,0,0,0,0,0,0,1"
  fi
  say "applied innerpulse $variant (previous settings saved in $STATE/previous.conf)"
}

do_launcher_icon() {
  have qdbus6 || die "--launcher-icon needs qdbus6"
  qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript '
    const launchers = ["org.kde.plasma.kickoff", "org.kde.plasma.kicker", "org.kde.plasma.kickerdash"];
    for (const p of panels()) for (const w of p.widgets()) {
      if (launchers.includes(w.type)) { w.currentConfigGroup = ["General"]; w.writeConfig("icon", "innerpulse"); }
    }' >/dev/null
  say "launcher icon set to the mark"
}

do_restore() {
  local f="$STATE/previous.conf"
  [[ -f "$f" ]] || { say "nothing to restore"; return; }
  # shellcheck disable=SC1090
  declare -A p; while IFS='=' read -r k v; do p[$k]="$v"; done < "$f"
  [[ -n "${p[lookandfeel]}" ]] && lookandfeeltool -a "${p[lookandfeel]}" >/dev/null 2>&1 || true
  [[ -n "${p[colorscheme]}" ]] && plasma-apply-colorscheme "${p[colorscheme]}" >/dev/null 2>&1 || true
  [[ -n "${p[plasmatheme]}" ]] && plasma-apply-desktoptheme "${p[plasmatheme]}" >/dev/null 2>&1 || true
  for pair in "decolib:library" "decotheme:theme"; do
    local k="${pair%%:*}" key="${pair##*:}"
    if [[ -n "${p[$k]}" ]]; then kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key "$key" "${p[$k]}"
    else kwriteconfig6 --file kwinrc --group org.kde.kdecoration2 --key "$key" --delete; fi
  done
  if [[ -n "${p[splash]}" ]]; then kwriteconfig6 --file ksplashrc --group KSplash --key Theme "${p[splash]}"
  else kwriteconfig6 --file ksplashrc --group KSplash --key Theme --delete; fi
  if [[ -n "${p[konsoleprofile]}" ]]; then kwriteconfig6 --file konsolerc --group 'Desktop Entry' --key DefaultProfile "${p[konsoleprofile]}"
  else kwriteconfig6 --file konsolerc --group 'Desktop Entry' --key DefaultProfile --delete; fi
  if [[ -v "p[oxygengradient]" ]]; then
    if [[ -n "${p[oxygengradient]}" ]]; then kwriteconfig6 --file oxygenrc --group Common --key UseBackgroundGradient "${p[oxygengradient]}"
    else kwriteconfig6 --file oxygenrc --group Common --key UseBackgroundGradient --delete; fi
  fi
  # (state saved by an older install.sh has no widgetstyle line; the global theme applied above sets it then)
  if [[ -v "p[widgetstyle]" ]]; then
    if [[ -n "${p[widgetstyle]}" ]]; then kwriteconfig6 --file kdeglobals --group KDE --key widgetStyle "${p[widgetstyle]}"
    else kwriteconfig6 --file kdeglobals --group KDE --key widgetStyle --delete; fi
  fi
  for k in font fixed menuFont toolBarFont smallestReadableFont activeFont; do
    [[ -v "p[$k]" ]] || continue # state saved by an older install.sh lacks the later keys
    local grp=General; [[ $k == activeFont ]] && grp=WM
    if [[ -n "${p[$k]}" ]]; then kwriteconfig6 --file kdeglobals --group "$grp" --key "$k" "${p[$k]}"
    else kwriteconfig6 --file kdeglobals --group "$grp" --key "$k" --delete; fi
  done
  reconfigure_kwin
  rm -f "$f"
  say "restored the settings saved before the last apply (wallpaper and lock screen left as they are)"
}

do_uninstall() {
  do_restore
  for rel in "${INSTALLED[@]}"; do rm -rf "${DATA:?}/$rel"; done
  rm -rf "$STATE"
  say "removed (fonts in $FONTDIR, if fetched, are left in place)"
}

apply="" fonts=0 icon=0 action=install STYLE=Oxygen DECO=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) apply=ink; case "${2:-}" in ink|paper|carbon) apply="$2"; shift ;; esac ;;
    --fonts) fonts=1 ;;
    --style) case "${2:-}" in oxygen) STYLE=Oxygen ;; breeze) STYLE=Breeze ;; *) die "--style takes oxygen or breeze" ;; esac; shift ;;
    --frosted-titlebar) DECO=-frosted ;;
    --launcher-icon) icon=1 ;;
    --restore) action=restore ;;
    --uninstall) action=uninstall ;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option: $1 (try --help)" ;;
  esac
  shift
done

case "$action" in
  restore) do_restore; exit 0 ;;
  uninstall) do_uninstall; exit 0 ;;
esac
# fonts first, so the Konsole profiles can name JetBrains Mono when it has just been fetched
(( fonts )) && do_fonts
do_install
[[ -n "$apply" ]] && do_apply "$apply"
(( icon )) && do_launcher_icon
exit 0
