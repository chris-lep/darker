/**
 * Regenerates the applet's translation template, po/<uuid>.pot, like Cinnamon's
 * cinnamon-xlet-makepot (which needs python3-polib): xgettext over all .js files with the
 * keyword `_`, plus the translatable metadata.json fields (Cinnamon translates the applet's
 * name and description in the applet's text domain).
 *
 * Usage: node scripts/makepot.js  (needs xgettext from the gettext package)
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const METADATA_FIELDS = ['name', 'description'];
const COPYRIGHT = 'Copyright (C) 2026 chris-lep';

/**
 * @param {string} dir
 * @returns {string[]} .js files below dir, relative to it, sorted
 */
function findJsFiles(dir) {
    return fs
        .readdirSync(dir, { recursive: true })
        .filter((file) => file.endsWith('.js'))
        .sort();
}

/**
 * @param {string} text
 * @returns {string} text as a quoted PO string
 */
function poString(text) {
    return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * PO entries for the translatable metadata fields that xgettext doesn't already contain.
 * @param {object} metadata - parsed metadata.json
 * @param {string} pot - xgettext output
 * @returns {string}
 */
function metadataEntries(metadata, pot) {
    return METADATA_FIELDS.filter((field) => metadata[field])
        .filter((field) => !pot.includes(`\nmsgid ${poString(metadata[field])}\n`))
        .map(
            (field) =>
                `\n#. metadata.json->${field}\nmsgid ${poString(metadata[field])}\nmsgstr ""\n`,
        )
        .join('');
}

/**
 * Replaces xgettext's generic header comment and charset with the project's. The per-language
 * fields (PO-Revision-Date, Last-Translator, Language-Team, Language) stay as placeholders:
 * translators fill them in their .po files.
 * @param {string} pot - xgettext output
 * @param {string} uuid
 * @returns {string}
 */
function fillHeader(pot, uuid) {
    return pot
        .replace(
            /^# SOME DESCRIPTIVE TITLE\.$/m,
            `# Translation template for the Darker applet (${uuid}).`,
        )
        .replace(/^# Copyright \(C\) YEAR .*$/m, `# ${COPYRIGHT}`)
        .replace(/^# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR\.\n/m, '')
        .replace('charset=CHARSET', 'charset=UTF-8');
}

function main() {
    const [uuid] = fs.readdirSync(SRC_DIR);
    const appletDir = path.join(SRC_DIR, uuid);
    const potPath = path.join(appletDir, 'po', `${uuid}.pot`);
    fs.mkdirSync(path.dirname(potPath), { recursive: true });

    execFileSync(
        'xgettext',
        [
            '--language=JavaScript',
            '--from-code=UTF-8',
            '--keyword=_',
            '--add-comments=Translators:',
            `--package-name=${uuid}`,
            '--msgid-bugs-address=https://github.com/chris-lep/darker/issues',
            `--output=${potPath}`,
            ...findJsFiles(appletDir),
        ],
        { cwd: appletDir, stdio: 'inherit' },
    );

    const metadata = JSON.parse(fs.readFileSync(path.join(appletDir, 'metadata.json'), 'utf8'));
    const pot = fillHeader(fs.readFileSync(potPath, 'utf8'), uuid);
    fs.writeFileSync(potPath, pot + metadataEntries(metadata, pot));
    console.log(`Wrote ${path.relative(process.cwd(), potPath)}`);
}

if (require.main === module) main();

module.exports = { poString, metadataEntries, fillHeader };
