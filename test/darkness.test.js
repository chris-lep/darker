const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Darkness = require('../src/darker@chris-lep/lib/darkness.js');

describe('clampLevel', () => {
    it('keeps values inside the range', () => {
        assert.equal(Darkness.clampLevel(0), 0);
        assert.equal(Darkness.clampLevel(0.5), 0.5);
        assert.equal(Darkness.clampLevel(Darkness.MAX_LEVEL), Darkness.MAX_LEVEL);
    });

    it('caps at MAX_LEVEL so the screen never goes fully black', () => {
        assert.equal(Darkness.MAX_LEVEL, 0.9);
        assert.equal(Darkness.clampLevel(1), Darkness.MAX_LEVEL);
        assert.equal(Darkness.clampLevel(42), Darkness.MAX_LEVEL);
    });

    it('clamps negatives to 0', () => {
        assert.equal(Darkness.clampLevel(-0.1), 0);
    });

    it('turns invalid input into 0', () => {
        for (const bad of [NaN, Infinity, -Infinity, undefined, null, '0.5', {}]) {
            assert.equal(Darkness.clampLevel(bad), 0, `input: ${String(bad)}`);
        }
    });
});

describe('slider mapping', () => {
    it('maps the full slider span to MAX_LEVEL..0 (right end = off)', () => {
        assert.equal(Darkness.sliderToLevel(0), Darkness.MAX_LEVEL);
        assert.equal(Darkness.sliderToLevel(1), 0);
        assert.equal(Darkness.sliderToLevel(0.5), Darkness.MAX_LEVEL / 2);
    });

    it('levelToSlider puts off at the right end', () => {
        assert.equal(Darkness.levelToSlider(0), 1);
        assert.equal(Darkness.levelToSlider(Darkness.MAX_LEVEL), 0);
    });

    it('clamps out-of-range slider values', () => {
        assert.equal(Darkness.sliderToLevel(-1), Darkness.MAX_LEVEL);
        assert.equal(Darkness.sliderToLevel(2), 0);
        assert.equal(Darkness.sliderToLevel(NaN), 0);
    });

    it('levelToSlider is the inverse of sliderToLevel', () => {
        for (const v of [0, 0.1, 0.25, 0.5, 0.75, 1]) {
            const roundTrip = Darkness.levelToSlider(Darkness.sliderToLevel(v));
            assert.ok(Math.abs(roundTrip - v) < 1e-12, `slider value: ${v}`);
        }
    });

    it('levelToSlider stays within [0, 1]', () => {
        assert.equal(Darkness.levelToSlider(5), 0);
        assert.equal(Darkness.levelToSlider(-5), 1);
    });
});

describe('levelToOpacity', () => {
    it('returns integer Clutter opacities', () => {
        assert.equal(Darkness.levelToOpacity(0), 0);
        assert.equal(Darkness.levelToOpacity(0.5), 128);
        assert.equal(Darkness.levelToOpacity(Darkness.MAX_LEVEL), 230);
        for (let i = 0; i <= 100; i++) {
            assert.ok(Number.isInteger(Darkness.levelToOpacity(i / 100)));
        }
    });

    it('never exceeds the opacity of MAX_LEVEL', () => {
        assert.equal(Darkness.levelToOpacity(1), Darkness.levelToOpacity(Darkness.MAX_LEVEL));
    });
});

describe('text helpers', () => {
    it('toPercent rounds to integers', () => {
        assert.equal(Darkness.toPercent(0.404), 40);
        assert.equal(Darkness.toPercent(0.405), 41);
        assert.equal(Darkness.toPercent(1), 90);
    });

    it('brightnessPercent is 100 while off and 10 at the cap', () => {
        assert.equal(Darkness.brightnessPercent(0), 100);
        assert.equal(Darkness.brightnessPercent(0.4), 60);
        assert.equal(Darkness.brightnessPercent(0.404), 60);
        assert.equal(Darkness.brightnessPercent(1), 10);
    });

    it('panelLabel is empty while off', () => {
        assert.equal(Darkness.panelLabel(0), '');
        assert.equal(Darkness.panelLabel(0.004), '');
    });

    it('panelLabel shows the brightness while active', () => {
        assert.equal(Darkness.panelLabel(0.4), '60%');
        assert.equal(Darkness.panelLabel(0.9), '10%');
    });

    it('tooltipText always describes the state', () => {
        assert.equal(Darkness.tooltipText(0), 'Darker: off');
        assert.equal(Darkness.tooltipText(0.4), 'Darker: 60% brightness');
    });

    it('resetLabel names full brightness', () => {
        assert.equal(Darkness.resetLabel(), 'Reset to 100%');
    });
});

describe('translation', () => {
    const german = {
        '%d%%': '%d %%',
        'Darker: off': 'Darker: aus',
        'Darker: %d%% brightness': 'Darker: %d %% Helligkeit',
        'Reset to %d%%': 'Auf %d %% zurücksetzen',
    };
    const translate = (text) => german[text] ?? text;

    it('formatPercent fills %d and unescapes %%', () => {
        assert.equal(Darkness.formatPercent('%d%%', 60), '60%');
        assert.equal(Darkness.formatPercent('%%%d %%', 5), '%5 %');
        assert.equal(Darkness.formatPercent('no placeholder', 5), 'no placeholder');
    });

    it('labels use the injected gettext function', () => {
        assert.equal(Darkness.panelLabel(0.4, translate), '60 %');
        assert.equal(Darkness.panelLabel(0, translate), '');
        assert.equal(Darkness.tooltipText(0, translate), 'Darker: aus');
        assert.equal(Darkness.tooltipText(0.4, translate), 'Darker: 60 % Helligkeit');
        assert.equal(Darkness.resetLabel(translate), 'Auf 100 % zurücksetzen');
    });
});

describe('stepLevel', () => {
    const percentAfter = (percent, steps) =>
        Darkness.toPercent(Darkness.stepLevel(percent / 100, steps));

    it('moves by SCROLL_STEP_PERCENT on the grid', () => {
        assert.equal(Darkness.SCROLL_STEP_PERCENT, 5);
        assert.equal(percentAfter(40, 1), 45);
        assert.equal(percentAfter(40, -1), 35);
        assert.equal(percentAfter(0, 1), 5);
    });

    it('snaps off-grid levels to the next grid point in the scroll direction', () => {
        assert.equal(percentAfter(37, 1), 40);
        assert.equal(percentAfter(37, -1), 35);
        assert.equal(percentAfter(1, -1), 0);
        assert.equal(percentAfter(89, 1), 90);
    });

    it('supports multiple steps at once', () => {
        assert.equal(percentAfter(40, 3), 55);
        assert.equal(percentAfter(40, -3), 25);
    });

    it('stays within 0..MAX_LEVEL', () => {
        assert.equal(Darkness.stepLevel(0, -1), 0);
        assert.equal(Darkness.stepLevel(Darkness.MAX_LEVEL, 1), Darkness.MAX_LEVEL);
        assert.equal(Darkness.stepLevel(0.88, 5), Darkness.MAX_LEVEL);
    });

    it('returns exact grid values (no floating point drift)', () => {
        let level = 0;
        for (let i = 0; i < 18; i++) level = Darkness.stepLevel(level, 1);
        assert.equal(level, Darkness.MAX_LEVEL);
        for (let i = 0; i < 18; i++) level = Darkness.stepLevel(level, -1);
        assert.equal(level, 0);
    });

    it('zero steps only clamps', () => {
        assert.equal(Darkness.stepLevel(0.37, 0), 0.37);
        assert.equal(Darkness.stepLevel(2, 0), Darkness.MAX_LEVEL);
    });
});

describe('scrollSteps', () => {
    // Same values as Cinnamon's Clutter.ScrollDirection.
    const ScrollDirection = { UP: 0, DOWN: 1, LEFT: 2, RIGHT: 3, SMOOTH: 4 };

    it('scroll up = brighter, scroll down = darker', () => {
        assert.equal(Darkness.scrollSteps(ScrollDirection.UP, ScrollDirection), -1);
        assert.equal(Darkness.scrollSteps(ScrollDirection.DOWN, ScrollDirection), 1);
    });

    it('ignores horizontal and smooth scrolling', () => {
        for (const d of ['LEFT', 'RIGHT', 'SMOOTH']) {
            assert.equal(Darkness.scrollSteps(ScrollDirection[d], ScrollDirection), 0, d);
        }
    });
});
