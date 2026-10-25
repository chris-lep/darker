const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const { Clutter, Meta } = imports.gi;

// Cinnamon resolves xlet require() paths relative to the applet root, not the calling file.
const Darkness = require('./lib/darkness.js');
const { DarkOverlay } = require('./lib/overlay.js');

const ICON_NAME = 'xsi-display-brightness-symbolic';

// The stock slider scrolls "up = higher value = darker". Route its scroll events through the
// applet so scrolling up means brighter everywhere.
class DarknessSlider extends PopupMenu.PopupSliderMenuItem {
    constructor(onScroll) {
        super(0);
        this._onScroll = onScroll;
    }

    _onScrollEvent(_actor, event) {
        return this._onScroll(event);
    }
}

class DarkerApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);

        this.set_applet_icon_symbolic_name(ICON_NAME);
        this._overlay = new DarkOverlay({ Clutter, Meta, global });

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this._slider = new DarknessSlider((event) => this._onScroll(event));
        this._slider.connect('value-changed', (_slider, value) =>
            this._setLevel(Darkness.sliderToLevel(value)),
        );
        this.menu.addMenuItem(this._slider);

        const resetItem = new PopupMenu.PopupMenuItem('Reset to 0%');
        resetItem.connect('activate', () => this._setLevel(0));
        this.menu.addMenuItem(resetItem);

        this.actor.connect('scroll-event', (_actor, event) => this._onScroll(event));

        // Always start undarkened.
        this._setLevel(0);
    }

    _setLevel(level) {
        this._level = Darkness.clampLevel(level);
        this._overlay.setOpacity(Darkness.levelToOpacity(this._level));
        this._slider.setValue(Darkness.levelToSlider(this._level));
        this.set_applet_label(Darkness.panelLabel(this._level));
        this.set_applet_tooltip(Darkness.tooltipText(this._level));
    }

    _onScroll(event) {
        const steps = Darkness.scrollSteps(event.get_scroll_direction(), Clutter.ScrollDirection);
        if (steps === 0) return Clutter.EVENT_PROPAGATE;

        this._setLevel(Darkness.stepLevel(this._level, steps));
        return Clutter.EVENT_STOP;
    }

    on_applet_clicked() {
        this.menu.toggle();
    }

    on_applet_removed_from_panel() {
        this._overlay.destroy();
        this.menu.destroy();
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new DarkerApplet(metadata, orientation, panelHeight, instanceId);
}
