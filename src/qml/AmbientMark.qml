/*
    The innerpulse mark, live: the plate, the beat cut out of a solid ember tile, for screens where the viewer
    rests or waits (the splash, the lock screen, the logout prompt).

    The plate never moves. On load its slots open once, bar by bar from the left, in about a second; then every
    period one pulse of light passes through the slots, left to right, each slot lit with a sin² bump and going
    dark again. A pulse is over in (5·lag + width)·period, and between pulses nothing redraws, which matters under
    the lock screen's live blur. The slots are cut through, so between pulses they show whatever is behind.

    The mark holds still, slots open and dark, when animations are turned off, when it is drawn under 48 px, or
    when its owner clears `beating`. `period` is the ambient tempo unless the owner sets another (the splash runs
    at the working tempo); `settled` lets the pulse in flight finish and then holds the plate at rest.

    Give it a square size and a color. Values tagged with an @KEY@ comment are filled in by src/build.mjs from
    src/lib/mark.mjs; the literals here are the same values.
*/

import QtQuick
import QtQuick.Shapes
import org.kde.kirigami as Kirigami

Item {
    id: mark

    property color color: "#f43a2a"
    property color lamp: "#ffd9c2" /*@LAMP@*/
    property bool beating: true
    property bool settled: false
    property real period: 4.5 /*@AMBIENT@*/

    readonly property real stillUnder: 48 /*@STILL_UNDER@*/
    readonly property bool still: Kirigami.Units.longDuration <= 1 || width < stillUnder
    readonly property var restH: [12, 82.22, 51.83, 33.34, 56.13, 12] /*@REST_H@*/
    readonly property int beats: 5 /*@BEATS@*/
    readonly property real span: 92 /*@SPAN@*/
    readonly property real stroke: 22 /*@STROKE@*/
    readonly property real corner: 4 /*@CORNER@*/
    readonly property real minBar: 12
    readonly property real plate: 200 /*@PLATE@*/
    readonly property real plateCorner: 26 /*@PLATE_CORNER@*/
    readonly property real cut: 0.74 /*@CUT@*/
    readonly property real pulseWidth: 0.19 /*@PULSE_W@*/
    readonly property real lag: 0.0245 /*@LAG@*/
    readonly property real drawIn: 0.55 /*@DRAW_IN@*/
    readonly property real drawLag: 0.09 /*@DRAW_LAG@*/
    readonly property real pulseEnd: (beats * lag + pulseWidth) * period
    readonly property real openEnd: drawIn + beats * drawLag
    // px per plate unit
    readonly property real s: width / plate

    // seconds into the pulse in flight (0 is dark), and seconds into the opening (openEnd is open)
    property real t: 0
    property real o: still ? openEnd : 0
    property double pulseAt: 0
    property double openAt: 0

    // slot i's half-height in plate units, as the slots open
    function slotH(i) {
        const u = Math.min(1, Math.max(0, (o - i * drawLag) / drawIn));
        const h = minBar + (restH[i] - minBar) * (1 - Math.pow(1 - u, 3));
        return (h + stroke / 2) * cut;
    }
    // how lit slot i is, 0 … 1
    function lit(i) {
        const u = (t - i * lag * period) / (pulseWidth * period);
        return u > 0 && u < 1 ? Math.pow(Math.sin(Math.PI * u), 2) : 0;
    }
    function rr(x, y, w, h, r) {
        return "M" + (x + r) + " " + y + "h" + (w - 2 * r) + "a" + r + " " + r + " 0 0 1 " + r + " " + r +
               "v" + (h - 2 * r) + "a" + r + " " + r + " 0 0 1 " + (-r) + " " + r +
               "h" + (2 * r - w) + "a" + r + " " + r + " 0 0 1 " + (-r) + " " + (-r) +
               "v" + (2 * r - h) + "a" + r + " " + r + " 0 0 1 " + r + " " + (-r) + "z";
    }
    function slotX(i) { return (-span + 2 * span * i / beats - stroke / 2) * cut; }

    Component.onCompleted: {
        if (!still) {
            openAt = Date.now();
            opening.running = true;
        }
    }
    onStillChanged: if (still) { opening.running = false; o = openEnd; t = 0; }

    FrameAnimation {
        id: opening
        onTriggered: {
            const e = (Date.now() - mark.openAt) / 1000;
            if (e >= mark.openEnd) { running = false; mark.o = mark.openEnd; }
            else mark.o = e;
        }
    }
    // one pulse per period, the first a full period after the mark appears
    Timer {
        interval: mark.period * 1000
        repeat: true
        running: mark.beating && !mark.settled && !mark.still && mark.visible
        onTriggered: {
            mark.pulseAt = Date.now();
            pulse.running = true;
        }
    }
    FrameAnimation {
        id: pulse
        onTriggered: {
            const e = (Date.now() - mark.pulseAt) / 1000;
            if (e >= mark.pulseEnd) { running = false; mark.t = 0; }
            else mark.t = e;
        }
    }
    // turned off mid-pulse (and not by `settled`, which lets the pulse finish): go dark at once
    onBeatingChanged: if (!beating) { pulse.running = false; t = 0; }

    // the lamps, under the plate: one per slot, seen through it as the pulse passes
    Repeater {
        model: mark.beats + 1
        Rectangle {
            required property int index
            readonly property real h: mark.slotH(index)
            visible: opacity > 0
            opacity: mark.lit(index)
            x: mark.width / 2 + mark.slotX(index) * mark.s
            y: mark.height / 2 - h * mark.s
            width: mark.stroke * mark.cut * mark.s
            height: 2 * h * mark.s
            radius: mark.corner * mark.cut * mark.s
            color: mark.lamp
            antialiasing: true
        }
    }

    // the plate: the tile and its six slots as one even-odd path
    Shape {
        anchors.fill: parent
        preferredRendererType: Shape.CurveRenderer
        ShapePath {
            fillColor: mark.color
            strokeWidth: -1
            fillRule: ShapePath.OddEvenFill
            scale: Qt.size(mark.s, mark.s)
            PathSvg {
                path: {
                    const half = mark.plate / 2;
                    let d = mark.rr(0, 0, mark.plate, mark.plate, mark.plateCorner);
                    for (let i = 0; i <= mark.beats; i++) {
                        const h = mark.slotH(i);
                        d += mark.rr(half + mark.slotX(i), half - h, mark.stroke * mark.cut, 2 * h, mark.corner * mark.cut);
                    }
                    return d;
                }
            }
        }
    }
}
