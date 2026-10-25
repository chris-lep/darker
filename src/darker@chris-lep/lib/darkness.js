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

module.exports = {
    MAX_LEVEL,
    MAX_OPACITY,
    clampLevel,
    sliderToLevel,
    levelToSlider,
    levelToOpacity,
    toPercent,
    panelLabel,
    tooltipText,
};
