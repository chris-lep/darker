// Checks for the Cinnamon Spices requirements that validate-spice and the Spices reviewers
// enforce (https://github.com/linuxmint/cinnamon-spices-applets).
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildSpice } = require('../scripts/build-spice.js');
const { poString, metadataEntries, fillHeader } = require('../scripts/makepot.js');

const ROOT = path.join(__dirname, '..');
const [uuid] = fs.readdirSync(path.join(ROOT, 'src'));
const appletDir = path.join(ROOT, 'src', uuid);
const meta = JSON.parse(fs.readFileSync(path.join(appletDir, 'metadata.json'), 'utf8'));
const potPath = path.join(appletDir, 'po', `${uuid}.pot`);

/** All files below dir, relative to it. */
const listFiles = (dir) =>
    fs
        .readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.relative(dir, path.join(entry.parentPath ?? entry.path, entry.name)))
        .sort();

/** Strings passed to _('...') in the applet's sources. */
function translatableStrings() {
    return listFiles(appletDir)
        .filter((file) => file.endsWith('.js'))
        .flatMap((file) => {
            const source = fs.readFileSync(path.join(appletDir, file), 'utf8');
            return [...source.matchAll(/\b_\('((?:[^'\\]|\\.)*)'\)/g)].map((m) => m[1]);
        });
}

describe('Spices metadata rules', () => {
    it('has no fields that validate-spice forbids', () => {
        for (const field of ['icon', 'dangerous', 'last-edited']) {
            assert.equal(field in meta, false, field);
        }
    });

    it('uses only ASCII in metadata values', () => {
        for (const [field, value] of Object.entries(meta)) {
            assert.match(JSON.stringify(value), /^[\x20-\x7e]*$/, field);
        }
    });

    it('info.json names the GitHub author, without whitespace', () => {
        const info = JSON.parse(fs.readFileSync(path.join(ROOT, 'spices', 'info.json'), 'utf8'));
        assert.equal(info.author, uuid.split('@')[1]);
    });
});

describe('icon.png', () => {
    const png = fs.readFileSync(path.join(appletDir, 'icon.png'));

    it('is a square PNG', () => {
        assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG');
        const width = png.readUInt32BE(16);
        const height = png.readUInt32BE(20);
        assert.equal(width, height);
        assert.ok(width >= 48, `${width}px`);
    });
});

describe('translations', () => {
    it('applet.js binds the text domain of its own uuid', () => {
        const source = fs.readFileSync(path.join(appletDir, 'applet.js'), 'utf8');
        assert.match(source, new RegExp(`^const UUID = '${uuid}';$`, 'm'));
    });

    it('the .pot template is up to date (run `make pot` otherwise)', () => {
        const pot = fs.readFileSync(potPath, 'utf8');
        const strings = translatableStrings();
        assert.ok(strings.length > 0);
        for (const text of [...strings, meta.name, meta.description]) {
            assert.ok(pot.includes(`\nmsgid ${poString(text)}\n`), text);
        }
    });

    it('ships no compiled translations', () => {
        assert.deepEqual(
            listFiles(appletDir).filter((file) => file.endsWith('.mo')),
            [],
        );
    });

    it('metadataEntries adds name and description once, escaped', () => {
        const entries = metadataEntries({ name: 'A "B"', description: 'C' }, '\nmsgid "C"\n');
        assert.equal(entries, '\n#. metadata.json->name\nmsgid "A \\"B\\""\nmsgstr ""\n');
    });

    it('the .pot header has no generic xgettext placeholders', () => {
        const header = fs.readFileSync(potPath, 'utf8').split('\nmsgid "', 2)[0];
        for (const generic of [
            'SOME DESCRIPTIVE TITLE',
            'COPYRIGHT HOLDER',
            'FIRST AUTHOR',
            'CHARSET',
        ]) {
            assert.equal(header.includes(generic), false, generic);
        }
    });

    it('fillHeader keeps the per-language fields for translators', () => {
        const pot = '# SOME DESCRIPTIVE TITLE.\n"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"\n';
        assert.equal(
            fillHeader(pot, 'x@y'),
            '# Translation template for the Darker applet (x@y).\n' +
                '"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"\n',
        );
    });
});

describe('buildSpice', () => {
    it('produces the Spices layout with the applet under files/<uuid>/', (t) => {
        const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'darker-spice-'));
        t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

        const { spiceDir } = buildSpice(outDir);

        assert.equal(spiceDir, path.join(outDir, uuid));
        assert.deepEqual(fs.readdirSync(path.join(spiceDir, 'files')), [uuid]);
        assert.deepEqual(listFiles(path.join(spiceDir, 'files', uuid)), listFiles(appletDir));
        for (const file of ['info.json', 'README.md']) {
            assert.ok(fs.existsSync(path.join(spiceDir, file)), file);
        }
        // Website files stay out of the installed applet.
        assert.equal(fs.existsSync(path.join(spiceDir, 'files', uuid, 'info.json')), false);
    });
});
