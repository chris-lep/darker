/**
 * Pure logic for the Darker applet: no Cinnamon/GI imports, so it can be unit-tested in Node.
 *
 * A "level" is the darkness in [0, MAX_LEVEL], where 0 means no darkening and 1 would be
 * a fully black screen. It is used directly as the overlay's alpha.
 */

/** Hard cap so the screen can never be blacked out completely. */
const MAX_LEVEL = 0.9;

/** Clutter opacity of a fully opaque actor. */
const MAX_OPACITY = 255;

/** Darkness change per mouse-wheel step, in percent. Scrolling snaps to multiples of it. */
const SCROLL_STEP_PERCENT = 5;

/**
 * Clamps a level to [0, MAX_LEVEL]. Anything that is not a finite number becomes 0.
 * @param {number} level
 * @returns {number}
 */
function clampLevel(level) {
    if (typeof level !== 'number' || !Number.isFinite(level)) return 0;
    return Math.min(Math.max(level, 0), MAX_LEVEL);
}

/**
 * Maps a slider position in [0, 1] to a level. The whole slider spans 0..MAX_LEVEL.
 * @param {number} value
 * @returns {number}
 */
function sliderToLevel(value) {
    return clampLevel(value * MAX_LEVEL);
}

/**
 * Inverse of sliderToLevel.
 * @param {number} level
 * @returns {number}
 */
function levelToSlider(level) {
    return clampLevel(level) / MAX_LEVEL;
}

/**
 * Converts a level to a Clutter opacity (integer 0..255).
 * @param {number} level
 * @returns {number}
 */
function levelToOpacity(level) {
    return Math.round(clampLevel(level) * MAX_OPACITY);
}

/**
 * Level as a rounded integer percentage.
 * @param {number} level
 * @returns {number}
 */
function toPercent(level) {
    return Math.round(clampLevel(level) * 100);
}

/**
 * Text shown next to the panel icon: empty while off, so only the icon is visible.
 * @param {number} level
 * @returns {string}
 */
function panelLabel(level) {
    const percent = toPercent(level);
    return percent === 0 ? '' : `${percent}%`;
}

/**
 * Tooltip of the panel icon.
 * @param {number} level
 * @returns {string}
 */
function tooltipText(level) {
    const percent = toPercent(level);
    return percent === 0 ? 'Darker: off' : `Darker: ${percent}%`;
}

/**
 * Moves a level by whole scroll steps, snapping to the SCROLL_STEP_PERCENT grid:
 * from 37%, one step darker gives 40% and one step brighter gives 35%.
 * @param {number} level
 * @param {number} steps - positive = darker, negative = brighter
 * @returns {number}
 */
function stepLevel(level, steps) {
    const gridIndex = toPercent(level) / SCROLL_STEP_PERCENT;
    if (steps > 0) return clampLevel(((Math.floor(gridIndex) + steps) * SCROLL_STEP_PERCENT) / 100);
    if (steps < 0) return clampLevel(((Math.ceil(gridIndex) + steps) * SCROLL_STEP_PERCENT) / 100);
    return clampLevel(level);
}

/**
 * Maps a Clutter scroll direction to darkness steps: up = brighter (like Cinnamon's
 * brightness applet), down = darker. Other directions (left, right, smooth) are ignored.
 * @param {number} direction - value of Clutter.ScrollDirection
 * @param {object} ScrollDirection - the Clutter.ScrollDirection enum (injected to stay pure)
 * @returns {number} -1, 0 or 1
 */
function scrollSteps(direction, ScrollDirection) {
    if (direction === ScrollDirection.UP) return -1;
    if (direction === ScrollDirection.DOWN) return 1;
    return 0;
}

module.exports = {
    MAX_LEVEL,
    MAX_OPACITY,
    SCROLL_STEP_PERCENT,
    clampLevel,
    stepLevel,
    scrollSteps,
    sliderToLevel,
    levelToSlider,
    levelToOpacity,
    toPercent,
    panelLabel,
    tooltipText,
};
