/**
 * A black, click-through actor covering the whole stage (all monitors), drawn by Cinnamon's
 * compositor. Its opacity determines how much the screen is darkened.
 *
 * Cinnamon dependencies (Clutter, Meta, global) are injected so this class can be
 * unit-tested in Node with fakes.
 */
class DarkOverlay {
    /**
     * @param {object} deps
     * @param {object} deps.Clutter - imports.gi.Clutter
     * @param {object} deps.Meta - imports.gi.Meta
     * @param {object} deps.global - Cinnamon's global object
     */
    constructor({ Clutter, Meta, global }) {
        this._Meta = Meta;
        this._display = global.display;
        this._stage = global.stage;
        this._unredirectDisabled = false;

        this._actor = new Clutter.Actor({
            name: 'darker-overlay',
            reactive: false,
            visible: false,
            opacity: 0,
            background_color: new Clutter.Color({ red: 0, green: 0, blue: 0, alpha: 255 }),
        });
        // Follow the stage size so monitor/resolution changes are handled automatically.
        this._actor.add_constraint(
            new Clutter.BindConstraint({
                source: this._stage,
                coordinate: Clutter.BindCoordinate.ALL,
                offset: 0,
            }),
        );

        // Direct child of the stage, above uiGroup (windows, panels, menus) and top_window_group.
        this._stage.add_child(this._actor);
        // Stay topmost if anything else is added to the stage later.
        this._childAddedId = this._stage.connect('child-added', () => this._raise());
    }

    /**
     * @param {number} opacity - Clutter opacity, integer 0..255; 0 hides the overlay
     */
    setOpacity(opacity) {
        if (!this._actor) return;

        this._actor.opacity = opacity;
        if (opacity > 0) {
            this._raise();
            this._actor.show();
        } else {
            this._actor.hide();
        }
        this._setUnredirectDisabled(opacity > 0);
    }

    /** Removes the overlay and restores compositor state. Safe to call more than once. */
    destroy() {
        if (!this._actor) return;

        this._setUnredirectDisabled(false);
        this._stage.disconnect(this._childAddedId);
        this._actor.destroy();
        this._actor = null;
    }

    _raise() {
        this._stage.set_child_above_sibling(this._actor, null);
    }

    /**
     * Fullscreen windows (videos, games) are normally "unredirected", i.e. they bypass the
     * compositor, and the overlay would not be drawn over them. Disable that while darkening.
     * The Meta calls are reference counted, so they must stay strictly paired.
     */
    _setUnredirectDisabled(disabled) {
        if (disabled === this._unredirectDisabled) return;

        if (disabled) this._Meta.disable_unredirect_for_display(this._display);
        else this._Meta.enable_unredirect_for_display(this._display);
        this._unredirectDisabled = disabled;
    }
}

module.exports = { DarkOverlay };
