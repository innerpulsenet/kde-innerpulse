/*
    innerpulse logout prompt: a thin wrapper around Plasma's own.

    The prompt itself (buttons, countdown, keyboard handling, the other-users warning) is Breeze's, loaded at
    run time from the system's copy, so nothing of it is copied here. This file adds the brand on top: the
    ink ground in place of Breeze's black, the countdown set in JetBrains Mono (its words and numbers are
    Breeze's, so it always says what will happen and when), and the mark above the avatar, beating at the
    ambient tempo while the choice waits (AmbientMark.qml; still when animations are turned off). Breeze's
    prompt is found through the data dirs, so a Plasma installed under another prefix works too. If it cannot
    be loaded, a plain screen says so and still offers Log Out, Restart and Shut Down; Escape goes back.

    The greeter connects to the signals below by name, so the wrapper declares them and passes the loaded
    prompt's signals through. Values tagged with an @KEY@ comment are filled in by src/build.mjs.
*/

import QtCore
import QtQuick
import QtQuick.Controls as QQC2
import org.kde.kirigami as Kirigami

Item {
    id: root
    Kirigami.Theme.inherit: false
    Kirigami.Theme.colorSet: Kirigami.Theme.Complementary
    height: screenGeometry.height
    width: screenGeometry.width

    signal logoutRequested()
    signal haltRequested()
    signal haltUpdateRequested()
    signal suspendRequested(int spdMethod)
    signal rebootRequested()
    signal rebootRequested2(int opt)
    signal rebootUpdateRequested()
    signal cancelRequested()
    signal lockScreenRequested()
    signal cancelSoftwareUpdateRequested()

    readonly property color ground: "#0a0908" /*@GROUND@*/
    readonly property color ember: "#f43a2a" /*@EMBER@*/
    readonly property color text1: "#ece7df" /*@TEXT@*/

    // Breeze's prompt, wherever the data dirs put it (/usr/share on most distributions, another prefix on some)
    readonly property string breeze: "plasma/look-and-feel/org.kde.breeze.desktop/contents/logout/Logout.qml"
    readonly property url breezeUrl: StandardPaths.locate(StandardPaths.GenericDataLocation, breeze)
    // what the greeter allows, when it says: Breeze reads the same two context properties
    readonly property bool mayLogout: typeof canLogout === "undefined" || canLogout
    readonly property bool mayShutdown: typeof maysd === "undefined" || maysd

    Loader {
        id: prompt
        anchors.fill: parent
        focus: true
        source: root.breezeUrl.toString() !== "" ? root.breezeUrl : "file:///usr/share/" + root.breeze
        onLoaded: {
            const p = item;
            p.logoutRequested.connect(root.logoutRequested);
            p.haltRequested.connect(root.haltRequested);
            p.haltUpdateRequested.connect(root.haltUpdateRequested);
            p.suspendRequested.connect(root.suspendRequested);
            p.rebootRequested.connect(root.rebootRequested);
            p.rebootRequested2.connect(root.rebootRequested2);
            p.rebootUpdateRequested.connect(root.rebootUpdateRequested);
            p.cancelRequested.connect(root.cancelRequested);
            p.lockScreenRequested.connect(root.lockScreenRequested);
            p.cancelSoftwareUpdateRequested.connect(root.cancelSoftwareUpdateRequested);
            // Restyle by shape, so a change in Breeze can only leave its own look in place, never break the prompt:
            // its dimming layer is the full-screen black rectangle, and the countdown is the first line of the
            // column under the avatar.
            for (const c of p.children) {
                if (c.color !== undefined && c.radius !== undefined && Qt.colorEqual(c.color, "black") && c.opacity > 0.8) {
                    c.color = root.ground;
                    c.opacity = 0.88;
                } else if (String(c).startsWith("QQuickColumnLayout") && c.children.length > 0) {
                    const countdown = c.children[0];
                    if (countdown.font !== undefined && countdown.text !== undefined) countdown.font.family = "JetBrains Mono";
                }
            }
        }
    }

    // above the avatar (Breeze's is 9 grid units tall, its foot on the vertical center), with no mouse area of
    // its own, so a click on it still cancels like a click anywhere else
    AmbientMark {
        visible: prompt.status === Loader.Ready
        width: Kirigami.Units.gridUnit * 5.5
        height: width
        anchors.horizontalCenter: parent.horizontalCenter
        y: root.height / 2 - Kirigami.Units.gridUnit * 10.5 - height
        color: root.ember
    }

    // Breeze's prompt is missing: say so, and still let the session end, or go back
    Rectangle {
        anchors.fill: parent
        visible: prompt.status === Loader.Error
        color: root.ground
        focus: visible
        Keys.onEscapePressed: root.cancelRequested()
        MouseArea {
            anchors.fill: parent
            onClicked: root.cancelRequested()
        }
        Column {
            anchors.centerIn: parent
            spacing: Kirigami.Units.gridUnit * 1.5

            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                width: Math.min(root.width - Kirigami.Units.gridUnit * 4, Kirigami.Units.gridUnit * 30)
                horizontalAlignment: Text.AlignHCenter
                wrapMode: Text.WordWrap
                color: root.text1
                font.family: "JetBrains Mono"
                text: "The logout prompt could not be loaded. Choose below, or press Escape or click elsewhere to go back."
            }
            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: Kirigami.Units.largeSpacing

                QQC2.Button {
                    text: "Log Out"
                    visible: root.mayLogout
                    onClicked: root.logoutRequested()
                }
                QQC2.Button {
                    text: "Restart"
                    visible: root.mayShutdown
                    onClicked: root.rebootRequested()
                }
                QQC2.Button {
                    text: "Shut Down"
                    visible: root.mayShutdown
                    onClicked: root.haltRequested()
                }
                QQC2.Button {
                    text: "Cancel"
                    onClicked: root.cancelRequested()
                }
            }
        }
    }
}
