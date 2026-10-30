/*
    innerpulse splash screen.

    Ink ground and the mark, standing where the Exposure wallpaper's resting mark will be (centered instead on
    a portrait screen, which crops that mark away), with the wordmark under it and a working line at the foot.
    The mark fades in at rest, holds one still beat, then beats at the working tempo, one pulse every 2.4 s,
    while Plasma starts. The line states what is happening and how long it has taken. When start-up is done
    the wordmark and the line fade, the pulse in flight finishes and the mark settles to rest where the
    wallpaper's mark will appear, so the handoff to the desktop keeps it in place. With animations turned off
    the mark holds still throughout and the timer counts whole seconds.

    Values tagged with an @KEY@ comment are the brand's, filled in by src/build.mjs from src/lib/mark.mjs,
    palette.mjs and wallpaper-art.mjs; the literals here are the same values, so this file also runs as it is.
*/

import QtQuick
import org.kde.kirigami as Kirigami

Rectangle {
    id: root
    color: "#0a0908" /*@GROUND@*/

    property int stage

    readonly property bool still: Kirigami.Units.longDuration <= 1
    readonly property color ember: "#f43a2a" /*@EMBER@*/
    readonly property color text1: "#ece7df" /*@TEXT@*/
    readonly property color text3: "#8e877d" /*@TEXT3@*/

    // the mark in its own box: six bars, x = -span … span, stroke wide with machined corners
    readonly property var restH: [12, 76.74, 56.21, 42, 82.16, 12] /*@REST_H@*/
    readonly property int beats: 5 /*@BEATS@*/
    readonly property real span: 92 /*@SPAN@*/
    readonly property real stroke: 22 /*@STROKE@*/
    readonly property real corner: 4 /*@CORNER@*/
    readonly property real box: 220 /*@BOX@*/
    // the beat, at the working tempo: each bar rises with a sin² bump, lag after the bar to its left
    readonly property real period: 2.4 /*@WORKING@*/
    readonly property real rise: 16 /*@RISE@*/
    readonly property real pulseWidth: 0.19 /*@PULSE_W@*/
    readonly property real lag: 0.0245 /*@LAG@*/
    // one still beat after the content appears, so the fade-in (400 ms) is over before the first pulse
    readonly property real hold: 0.6

    // where the Exposure wallpaper's resting mark sits in its 2560 × 1440 composition, and its box in px
    readonly property real artW: 2560 /*@ART_W@*/
    readonly property real artH: 1440 /*@ART_H@*/
    readonly property real markX: 0.67 /*@EXPOSURE_X@*/
    readonly property real markY: 0.45 /*@EXPOSURE_Y@*/
    readonly property real markBox: 560 /*@EXPOSURE_BOX@*/
    // the wallpaper's scale under Plasma's default fill, "Scaled and cropped"
    readonly property real k: Math.max(width / artW, height / artH)
    // where that puts the mark's center on this screen
    readonly property real artCx: width / 2 + (markX - 0.5) * artW * k
    readonly property real artCy: height / 2 + (markY - 0.5) * artH * k
    // A portrait screen crops the wallpaper's mark away (or nearly), so there the mark has no place to hold:
    // it stands centered instead, 2 grid units above the middle, at a size the screen's width can carry.
    readonly property bool centered: width < height || artCx < 0 || artCx > width || artCy < 0 || artCy > height
    readonly property real margin: Kirigami.Units.gridUnit

    // seconds since the splash appeared, from the wall clock, so the readout stays true however long start-up takes
    property real t: 0
    property double startedAt: Date.now()
    // when the content faded in: the beat counts from here
    property real shownAt: -1
    // when start-up finished (stage 5), on the same clock as the beat
    property real settleAt: -1
    FrameAnimation {
        running: !root.still
        onTriggered: root.t = (Date.now() - root.startedAt) / 1000
    }
    // with animations off nothing redraws per frame: the readout steps once a second
    Timer {
        interval: 1000
        repeat: true
        running: root.still
        onTriggered: root.t = (Date.now() - root.startedAt) / 1000
    }

    onStageChanged: {
        if (stage === 2) {
            shownAt = t;
            fadeIn.running = true;
        } else if (stage === 5) {
            settleAt = shownAt < 0 ? 0 : t - shownAt;
            fadeChrome.running = true;
        }
    }

    function heightAt(i, time) {
        const h = restH[i];
        if (still || time < hold) return h;
        const beat = time - hold;
        // start-up is done: the pulse in flight finishes, then the mark holds at rest
        if (settleAt >= 0 && Math.floor(beat / period) > Math.floor((settleAt - hold) / period)) return h;
        const T = beat % period;
        const u = (T - i * lag * period) / (pulseWidth * period);
        return u > 0 && u < 1 ? h + rise * Math.pow(Math.sin(Math.PI * u), 2) : h;
    }

    Item {
        id: content
        anchors.fill: parent
        opacity: 0

        Item {
            id: mark
            readonly property real size: root.centered ? Math.min(root.markBox * root.k, Math.min(root.width, root.height) * 0.4)
                                                       : root.markBox * root.k
            readonly property real s: size / root.box
            width: size; height: size
            // on the wallpaper's mark, kept whole inside a grid-unit margin; or centered
            x: root.centered ? (root.width - size) / 2
                             : Math.max(root.margin, Math.min(root.width - size - root.margin, root.artCx - size / 2))
            y: root.centered ? root.height / 2 - Kirigami.Units.gridUnit * 2 - size / 2
                             : Math.max(root.margin, Math.min(root.height - size - root.margin, root.artCy - size / 2))

            Repeater {
                model: root.beats + 1
                Rectangle {
                    required property int index
                    readonly property real h: root.shownAt < 0 ? root.restH[index] : root.heightAt(index, root.t - root.shownAt)
                    readonly property real cx: -root.span + 2 * root.span * index / root.beats
                    x: mark.size / 2 + (cx - root.stroke / 2) * mark.s
                    y: mark.size / 2 - (h + root.stroke / 2) * mark.s
                    width: root.stroke * mark.s
                    height: (2 * h + root.stroke) * mark.s
                    radius: root.corner * mark.s
                    color: root.ember
                    antialiasing: true
                }
            }
        }

        // The wordmark and the working line fade when start-up is done; the mark stays for the handoff.
        Item {
            id: chrome
            anchors.fill: parent

            Image {
                id: wordmark
                source: "images/wordmark.svg"
                x: Math.max(root.margin, Math.min(root.width - width - root.margin, mark.x + (mark.width - width) / 2))
                y: mark.y + mark.height + Kirigami.Units.gridUnit * 1.5
                // the outlined wordmark, 790 × 120 units, set at 1.6 grid units of cap height
                sourceSize.height: Kirigami.Units.gridUnit * 2.2
                fillMode: Image.PreserveAspectFit
                asynchronous: true
                smooth: true
            }

            // The working line: verb, then the facts. Mono, tertiary gray, nothing a reader needs below 11 px.
            // It stands under the mark, at the foot.
            Row {
                x: Math.max(Kirigami.Units.gridUnit, Math.min(root.width - width - Kirigami.Units.gridUnit, mark.x + (mark.width - width) / 2))
                anchors.bottom: parent.bottom
                anchors.bottomMargin: Kirigami.Units.gridUnit * 3
                spacing: Kirigami.Units.largeSpacing

                Text {
                    text: "Starting Plasma…"
                    color: root.text1
                    font.family: "JetBrains Mono"
                    font.pixelSize: Math.max(12, Kirigami.Units.gridUnit * 0.72)
                    font.weight: Font.Medium
                    Accessible.role: Accessible.StaticText
                    Accessible.name: text
                }
                Text {
                    text: "(" + (root.still ? Math.floor(root.t) : root.t.toFixed(1)) + " s)"
                    color: root.text3
                    font.family: "JetBrains Mono"
                    font.pixelSize: Math.max(12, Kirigami.Units.gridUnit * 0.72)
                    font.features: { "tnum": 1 }
                }
            }
        }
    }

    OpacityAnimator {
        id: fadeIn
        target: content
        from: 0; to: 1
        duration: root.still ? 0 : 400
        easing.type: Easing.OutCubic
    }
    OpacityAnimator {
        id: fadeChrome
        target: chrome
        from: 1; to: 0
        duration: root.still ? 0 : 300
        easing.type: Easing.InCubic
    }
}
