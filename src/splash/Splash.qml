/*
    innerpulse splash screen.

    The carbon ground and the plate, centered a little above the middle, with the wordmark under it and a working
    line at the foot. The plate fades in, its slots open once, and while Plasma starts a pulse of light passes
    through them at the working tempo, one every 2.4 s (AmbientMark.qml). The line states what is happening and
    how long it has taken. When start-up is done the pulse in flight finishes and the whole screen fades. With
    animations turned off the plate holds still, slots open and dark, and the timer counts whole seconds.

    Values tagged with an @KEY@ comment are the brand's, filled in by src/build.mjs from src/lib/mark.mjs,
    palette.mjs and preview.mjs; the literals here are the same values, so this file also runs as it is.
*/

import QtQuick
import org.kde.kirigami as Kirigami

Rectangle {
    id: root
    color: "#0b0d10" /*@GROUND@*/

    property int stage

    readonly property bool still: Kirigami.Units.longDuration <= 1
    readonly property color ember: "#f43a2a" /*@EMBER@*/
    readonly property color text1: "#e3e6e9" /*@TEXT@*/
    readonly property color text3: "#8f949b" /*@TEXT3@*/
    // the plate's size, and how far its center sits above the middle, in grid units
    readonly property real plateGu: 9 /*@SPLASH_PLATE@*/
    readonly property real liftGu: 2 /*@SPLASH_LIFT@*/

    // seconds since the splash appeared, from the wall clock, so the readout stays true however long start-up takes
    property real t: 0
    property double startedAt: Date.now()
    FrameAnimation {
        running: !root.still && root.stage < 5
        onTriggered: root.t = (Date.now() - root.startedAt) / 1000
    }
    // with animations off nothing redraws per frame: the readout steps once a second
    Timer {
        interval: 1000
        repeat: true
        running: root.still && root.stage < 5
        onTriggered: root.t = (Date.now() - root.startedAt) / 1000
    }

    onStageChanged: {
        if (stage === 2) fadeIn.running = true;
        else if (stage === 5) fadeOut.running = true;
    }

    Item {
        id: content
        anchors.fill: parent
        opacity: 0

        Loader {
            id: mark
            // the plate is created when the content appears, so its slots open in view
            active: root.stage >= 2
            readonly property real size: Math.min(Kirigami.Units.gridUnit * root.plateGu, Math.min(root.width, root.height) * 0.4)
            width: size; height: size
            x: (root.width - size) / 2
            y: root.height / 2 - Kirigami.Units.gridUnit * root.liftGu - size / 2
            sourceComponent: AmbientMark {
                color: root.ember
                period: 2.4 /*@WORKING@*/
                settled: root.stage >= 5
            }
        }

        Image {
            id: wordmark
            source: "images/wordmark.svg"
            anchors.horizontalCenter: parent.horizontalCenter
            // clear space: a quarter of the plate, plus a grid unit
            y: mark.y + mark.height + mark.size / 4 + Kirigami.Units.gridUnit
            // the outlined wordmark, 790 × 120 units
            sourceSize.height: Kirigami.Units.gridUnit * 2.2
            fillMode: Image.PreserveAspectFit
            asynchronous: true
            smooth: true
        }

        // The working line: verb, then the facts. Mono, tertiary gray, nothing a reader needs below 11 px.
        Row {
            anchors.horizontalCenter: parent.horizontalCenter
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
