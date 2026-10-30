/*
    The innerpulse mark at the ambient tempo, for screens where the viewer rests: the lock screen and the
    logout prompt.

    Six bars at rest; every 4.5 s one pulse passes through them left to right, each bar rising with a sin²
    bump and settling. A pulse is over in (5·lag + width)·period ≈ 1.4 s, and between pulses nothing redraws,
    which matters under the lock screen's live blur. The mark holds still at rest when animations are turned
    off, or when its owner clears `beating`.

    Give it a square size (its 220-unit box) and a color. Values tagged with an @KEY@ comment are filled in by
    src/build.mjs from src/lib/mark.mjs; the literals here are the same values.
*/

import QtQuick
import org.kde.kirigami as Kirigami

Item {
    id: mark

    property color color: "#f43a2a"
    property bool beating: true

    readonly property bool still: Kirigami.Units.longDuration <= 1
    readonly property var restH: [12, 76.74, 56.21, 42, 82.16, 12] /*@REST_H@*/
    readonly property int beats: 5 /*@BEATS@*/
    readonly property real span: 92 /*@SPAN@*/
    readonly property real stroke: 22 /*@STROKE@*/
    readonly property real corner: 4 /*@CORNER@*/
    readonly property real box: 220 /*@BOX@*/
    readonly property real period: 4.5 /*@AMBIENT@*/
    readonly property real rise: 16 /*@RISE@*/
    readonly property real pulseWidth: 0.19 /*@PULSE_W@*/
    readonly property real lag: 0.0245 /*@LAG@*/
    readonly property real pulseEnd: (beats * lag + pulseWidth) * period
    readonly property real s: width / box

    // seconds into the pulse in flight; 0 is at rest
    property real t: 0
    property double pulseAt: 0

    function heightAt(i, t) {
        const h = restH[i];
        const u = (t - i * lag * period) / (pulseWidth * period);
        return u > 0 && u < 1 ? h + rise * Math.pow(Math.sin(Math.PI * u), 2) : h;
    }

    // one pulse per period, the first a full period after the mark appears
    Timer {
        interval: mark.period * 1000
        repeat: true
        running: mark.beating && !mark.still && mark.visible
        onTriggered: {
            mark.pulseAt = Date.now();
            pulse.running = true;
        }
        onRunningChanged: {
            if (!running) {
                pulse.running = false;
                mark.t = 0;
            }
        }
    }
    FrameAnimation {
        id: pulse
        onTriggered: {
            const e = (Date.now() - mark.pulseAt) / 1000;
            if (e >= mark.pulseEnd) {
                pulse.running = false;
                mark.t = 0;
            } else {
                mark.t = e;
            }
        }
    }

    Repeater {
        model: mark.beats + 1
        Rectangle {
            required property int index
            readonly property real h: mark.heightAt(index, mark.t)
            readonly property real cx: -mark.span + 2 * mark.span * index / mark.beats
            x: mark.width / 2 + (cx - mark.stroke / 2) * mark.s
            y: mark.height / 2 - (h + mark.stroke / 2) * mark.s
            width: mark.stroke * mark.s
            height: (2 * h + mark.stroke) * mark.s
            radius: mark.corner * mark.s
            color: mark.color
            antialiasing: true
        }
    }
}
