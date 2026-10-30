/*
    innerpulse Lock: its one setting, in System Settings → Screen Locking → Appearance.
*/

import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import org.kde.kirigami as Kirigami

Kirigami.FormLayout {
    id: root
    twinFormLayouts: parentLayout

    property alias cfg_BeatOnLock: beat.checked
    property alias formLayout: root

    QQC2.CheckBox {
        id: beat
        Kirigami.FormData.label: "Mark:"
        text: "Beat every 4.5 s while locked"
    }
    QQC2.Label {
        Layout.maximumWidth: Kirigami.Units.gridUnit * 24
        wrapMode: Text.WordWrap
        opacity: 0.7
        text: "The mark holds still when animations are turned off. Under the password prompt the lock screen blurs it into a soft glow; turn the beat off to keep that glow still."
    }
}
