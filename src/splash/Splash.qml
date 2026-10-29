/*
    innerpulse splash screen.

    Ink ground, the mark at the center, the wordmark under it and a working line at the foot: the mark takes
    its reading once (each bar grows from its stub to its rest, left to right, about a second), then beats at
    the working tempo, one pulse every 2.4 s, while Plasma starts. The line under it states what is happening
    and how long it has taken. Everything holds still when animations are turned off.

    Geometry and timing are the brand’s (src/lib/mark.mjs): six bars, 22 units wide with 4-unit corners,
    spread across x = -92 … 92 in a 220-unit box; the beat lifts each bar 16 units with a sin² bump.
*/

import QtQuick
import org.kde.kirigami as Kirigami

Rectangle {
    id: root
    color: "#0a0908"

    property int stage

    readonly property bool still: Kirigami.Units.longDuration <= 1
    readonly property color ember: "#f43a2a"
    readonly property var restH: [12, 76.74, 56.21, 42, 82.16, 12]

    // seconds since the splash appeared: drives the draw-in, the beat and the elapsed readout
    property real t: 0
    // when the content faded in: the mark takes its reading from here, so the draw-in is never missed
    property real shownAt: -1
    NumberAnimation on t {
        running: true
        from: 0; to: 600; duration: 600000
        loops: 1
    }

    onStageChanged: {
        if (stage === 2) {
            shownAt = t;
            fadeIn.running = true;
        } else if (stage === 5) {
            fadeOut.running = true;
        }
    }

    function heightAt(i, time) {
        const h = restH[i];
        if (still) return h;
        // the draw-in: each bar from its stub to its rest, eased out, 0.09 s after the bar to its left
        const drawIn = 0.55, drawLag = 0.09, total = drawIn + 5 * drawLag;
        if (time < total) {
            const u = Math.min(1, Math.max(0, (time - i * drawLag) / drawIn));
            return 12 + (h - 12) * (1 - Math.pow(1 - u, 3));
        }
        // the beat, at the working tempo
        const period = 2.4, width = 0.19, lag = 0.0245, rise = 16;
        const T = (time - total) % period;
        const u = (T - i * lag * period) / (width * period);
        return u > 0 && u < 1 ? h + rise * Math.pow(Math.sin(Math.PI * u), 2) : h;
    }

    Item {
        id: content
        anchors.fill: parent
        opacity: 0

        Item {
            id: mark
            readonly property real size: Kirigami.Units.gridUnit * 11
            readonly property real s: size / 220
            width: size; height: size
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.verticalCenter: parent.verticalCenter
            anchors.verticalCenterOffset: -Kirigami.Units.gridUnit * 2

            Repeater {
                model: 6
                Rectangle {
                    required property int index
                    readonly property real h: root.shownAt < 0 ? 12 : root.heightAt(index, root.t - root.shownAt)
                    readonly property real cx: -92 + 184 * index / 5
                    x: mark.size / 2 + (cx - 11) * mark.s
                    y: mark.size / 2 - (h + 11) * mark.s
                    width: 22 * mark.s
                    height: (2 * h + 22) * mark.s
                    radius: 4 * mark.s
                    color: root.ember
                    antialiasing: true
                }
            }
        }

        Image {
            id: wordmark
            source: "images/wordmark.svg"
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: mark.bottom
            anchors.topMargin: Kirigami.Units.gridUnit * 1.5
            // the outlined wordmark, 790 × 120 units, set at 1.6 grid units of cap height
            sourceSize.height: Kirigami.Units.gridUnit * 2.2
            fillMode: Image.PreserveAspectFit
            asynchronous: true
            smooth: true
        }

        // The working line: verb, then the facts. Mono, tertiary grey, nothing a reader needs below 11 px.
        Row {
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.bottom: parent.bottom
            anchors.bottomMargin: Kirigami.Units.gridUnit * 3
            spacing: Kirigami.Units.largeSpacing

            Text {
                text: "Starting Plasma…"
                color: "#ece7df"
                font.family: "JetBrains Mono"
                font.pixelSize: Math.max(12, Kirigami.Units.gridUnit * 0.72)
                font.weight: Font.Medium
                Accessible.role: Accessible.StaticText
                Accessible.name: text
            }
            Text {
                text: "(" + root.t.toFixed(1) + " s)"
                color: "#8e877d"
                font.family: "JetBrains Mono"
                font.pixelSize: Math.max(12, Kirigami.Units.gridUnit * 0.72)
                font.features: { "tnum": 1 }
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
        id: fadeOut
        target: content
        from: 1; to: 0
        duration: root.still ? 0 : 300
        easing.type: Easing.InCubic
    }
}
