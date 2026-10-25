const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { DarkOverlay } = require('../src/darker@chris-lep/lib/overlay.js');

/** Minimal fakes for the parts of Clutter, Meta and Cinnamon's global that DarkOverlay uses. */
function createFakes() {
    class FakeActor {
        constructor(props) {
            Object.assign(this, props);
            this.constraints = [];
            this.destroyed = false;
        }
        add_constraint(c) {
            this.constraints.push(c);
        }
        show() {
            this.visible = true;
        }
        hide() {
            this.visible = false;
        }
        destroy() {
            this.destroyed = true;
        }
    }

    // Signals that exist on Cinnamon's (muffin) ClutterStage. Like GObject, connecting to any
    // other name throws. Verify additions against the real typelib (see CLAUDE.md).
    const STAGE_SIGNALS = ['actor-added'];

    const stage = {
        children: [],
        handlers: new Map(),
        nextId: 1,
        add_child(actor) {
            this.children.push(actor);
            for (const [, h] of this.handlers) if (h.signal === 'actor-added') h.cb(this, actor);
        },
        set_child_above_sibling(actor, sibling) {
            assert.equal(sibling, null);
            this.children = this.children.filter((a) => a !== actor).concat(actor);
        },
        connect(signal, cb) {
            if (!STAGE_SIGNALS.includes(signal)) {
                throw new Error(`No signal '${signal}' on object 'MetaStage'`);
            }
            const id = this.nextId++;
            this.handlers.set(id, { signal, cb });
            return id;
        },
        disconnect(id) {
            assert.ok(this.handlers.delete(id), `unknown handler id ${id}`);
        },
        top() {
            return this.children[this.children.length - 1];
        },
    };

    const display = { name: 'display' };
    const Meta = {
        unredirectDisabledCount: 0,
        disable_unredirect_for_display(d) {
            assert.equal(d, display);
            this.unredirectDisabledCount++;
        },
        enable_unredirect_for_display(d) {
            assert.equal(d, display);
            this.unredirectDisabledCount--;
        },
    };

    const Clutter = {
        Actor: FakeActor,
        Color: class {
            constructor(c) {
                Object.assign(this, c);
            }
        },
        BindConstraint: class {
            constructor(props) {
                Object.assign(this, props);
            }
        },
        BindCoordinate: { ALL: 'ALL' },
    };

    return { Clutter, Meta, global: { stage, display }, stage };
}

describe('DarkOverlay', () => {
    let fakes;
    let overlay;

    beforeEach(() => {
        fakes = createFakes();
        overlay = new DarkOverlay(fakes);
    });

    const actor = () => overlay._actor;

    it('adds a hidden, non-reactive black actor bound to the stage', () => {
        assert.equal(fakes.stage.top(), actor());
        assert.equal(actor().visible, false);
        assert.equal(actor().reactive, false);
        assert.equal(actor().opacity, 0);
        assert.deepEqual(
            {
                r: actor().background_color.red,
                g: actor().background_color.green,
                b: actor().background_color.blue,
            },
            { r: 0, g: 0, b: 0 },
        );
        assert.equal(actor().constraints.length, 1);
        assert.equal(actor().constraints[0].source, fakes.stage);
        assert.equal(actor().constraints[0].coordinate, 'ALL');
    });

    it('shows the actor with the given opacity', () => {
        overlay.setOpacity(128);
        assert.equal(actor().visible, true);
        assert.equal(actor().opacity, 128);
    });

    it('hides the actor at opacity 0', () => {
        overlay.setOpacity(128);
        overlay.setOpacity(0);
        assert.equal(actor().visible, false);
        assert.equal(actor().opacity, 0);
    });

    it('disables unredirect exactly once while active', () => {
        assert.equal(fakes.Meta.unredirectDisabledCount, 0);
        overlay.setOpacity(10);
        overlay.setOpacity(50);
        overlay.setOpacity(200);
        assert.equal(fakes.Meta.unredirectDisabledCount, 1);
        overlay.setOpacity(0);
        overlay.setOpacity(0);
        assert.equal(fakes.Meta.unredirectDisabledCount, 0);
    });

    it('stays on top when other actors are added to the stage', () => {
        const other = { name: 'other' };
        fakes.stage.add_child(other);
        assert.equal(fakes.stage.top(), actor());
    });

    it('destroy restores unredirect and disconnects from the stage', () => {
        const a = actor();
        overlay.setOpacity(100);
        overlay.destroy();
        assert.equal(fakes.Meta.unredirectDisabledCount, 0);
        assert.equal(a.destroyed, true);
        assert.equal(fakes.stage.handlers.size, 0);
    });

    it('destroy is idempotent and setOpacity is a no-op afterwards', () => {
        overlay.destroy();
        assert.doesNotThrow(() => overlay.destroy());
        assert.doesNotThrow(() => overlay.setOpacity(100));
        assert.equal(fakes.Meta.unredirectDisabledCount, 0);
    });
});
