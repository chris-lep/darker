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
    it('maps the full slider span to 0..MAX_LEVEL', () => {
        assert.equal(Darkness.sliderToLevel(0), 0);
        assert.equal(Darkness.sliderToLevel(1), Darkness.MAX_LEVEL);
        assert.equal(Darkness.sliderToLevel(0.5), Darkness.MAX_LEVEL / 2);
    });

    it('clamps out-of-range slider values', () => {
        assert.equal(Darkness.sliderToLevel(-1), 0);
        assert.equal(Darkness.sliderToLevel(2), Darkness.MAX_LEVEL);
        assert.equal(Darkness.sliderToLevel(NaN), 0);
    });

    it('levelToSlider is the inverse of sliderToLevel', () => {
        for (const v of [0, 0.1, 0.25, 0.5, 0.75, 1]) {
            const roundTrip = Darkness.levelToSlider(Darkness.sliderToLevel(v));
            assert.ok(Math.abs(roundTrip - v) < 1e-12, `slider value: ${v}`);
        }
    });

    it('levelToSlider stays within [0, 1]', () => {
        assert.equal(Darkness.levelToSlider(5), 1);
        assert.equal(Darkness.levelToSlider(-5), 0);
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

    it('panelLabel is empty while off', () => {
        assert.equal(Darkness.panelLabel(0), '');
        assert.equal(Darkness.panelLabel(0.004), '');
    });

    it('panelLabel shows the percentage while active', () => {
        assert.equal(Darkness.panelLabel(0.4), '40%');
        assert.equal(Darkness.panelLabel(0.9), '90%');
    });

    it('tooltipText always describes the state', () => {
        assert.equal(Darkness.tooltipText(0), 'Darker: off');
        assert.equal(Darkness.tooltipText(0.4), 'Darker: 40%');
    });
});
