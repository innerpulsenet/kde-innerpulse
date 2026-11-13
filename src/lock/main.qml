/*
    innerpulse Lock: the lock screen's wallpaper, with the live mark.

    The ground is the lock composition (wallpapers/innerpulse-lock, or innerpulse-lock-carbon): the variant's
    ground with the plate at rest, low and to the right, clear of the clock, the avatar, the password field and
    the footer. Over its resting plate this plugin draws the plate itself, live (AmbientMark.qml): a pulse of light
    through its slots at the ambient tempo, so the one place the viewer simply waits is the one place the mark is
    alive. The live plate covers the resting one exactly.

    The mark holds still when animations are turned off, or with BeatOnLock off (the lock screen blurs its
    wallpaper while the password prompt is up, which turns the pulse into a soft glow).

    This plugin is for the lock screen only; install.sh never sets it on the desktop. Values tagged with an @KEY@
    comment are filled in by src/build.mjs.
*/

import QtQuick
import org.kde.plasma.plasmoid

WallpaperItem {
    id: root

    // the mark's color on each ground: the ember, deeper on paper (src/lib/palette.mjs)
    readonly property var marks: ({ "ink": "#f43a2a", "paper": "#cf2a1c", "carbon": "#f43a2a" }) /*@LOCK_MARKS@*/
    readonly property var grounds: ({ "ink": "#0a0908", "paper": "#f4f1ec", "carbon": "#0b0d10" }) /*@LOCK_GROUNDS@*/
    // the renditions each ground ships in, smallest first
    readonly property var sizes: [[1920, 1080], [2560, 1440], [3840, 2160]] /*@SIZES@*/
    readonly property string variant: root.marks[root.configuration.Variant] ? root.configuration.Variant : "ink"

    // where the resting plate sits in the 2560 × 1440 composition, and its size in px (wallpaper.mjs LOCK_MARK)
    readonly property real artW: 2560 /*@ART_W@*/
    readonly property real artH: 1440 /*@ART_H@*/
    readonly property real markX: 0.72 /*@LOCK_X@*/
    readonly property real markY: 0.8 /*@LOCK_Y@*/
    readonly property real markSize: 176 /*@LOCK_SIZE@*/
    // the composition's scale and offset under a centered crop, the fill the ground uses
    readonly property real k: Math.max(width / artW, height / artH)
    readonly property real ox: (width - artW * k) / 2
    readonly property real oy: (height - artH * k) / 2

    // Image names the folder of renditions (…/contents/images/); take the smallest that covers the screen
    readonly property url ground: {
        let dir = String(root.configuration.Image || "");
        if (dir === "" || /\.(png|jpe?g)$/i.test(dir)) return dir;
        if (!dir.endsWith("/")) dir += "/";
        const dpr = Screen.devicePixelRatio || 1;
        let pick = sizes[sizes.length - 1];
        for (const s of sizes) {
            if (s[0] >= width * dpr && s[1] >= height * dpr) { pick = s; break; }
        }
        return dir + pick[0] + "x" + pick[1] + ".png";
    }

    Rectangle {
        anchors.fill: parent
        color: root.grounds[root.variant]
    }

    Image {
        anchors.fill: parent
        source: root.ground
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        smooth: true
    }

    AmbientMark {
        width: root.markSize * root.k
        height: width
        x: root.ox + root.markX * root.artW * root.k - width / 2
        y: root.oy + root.markY * root.artH * root.k - height / 2
        color: root.marks[root.variant]
        beating: root.configuration.BeatOnLock !== false
    }
}
