const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const appletDirs = fs.readdirSync(SRC_DIR);

describe('applet package', () => {
    it('contains exactly one applet directory', () => {
        assert.equal(appletDirs.length, 1);
    });

    const uuid = appletDirs[0];
    const appletDir = path.join(SRC_DIR, uuid);
    const meta = JSON.parse(fs.readFileSync(path.join(appletDir, 'metadata.json'), 'utf8'));

    it('metadata uuid matches the directory name (Cinnamon refuses to load otherwise)', () => {
        assert.equal(meta.uuid, uuid);
        assert.match(uuid, /^[a-z0-9-]+@[a-z0-9-]+$/);
    });

    it('metadata has the fields Cinnamon requires', () => {
        for (const key of ['uuid', 'name', 'description']) {
            assert.equal(typeof meta[key], 'string', key);
            assert.ok(meta[key].length > 0, key);
        }
    });

    it('metadata version matches package.json', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        assert.equal(meta.version, pkg.version);
    });

    it('is a single-instance applet', () => {
        assert.equal(meta['max-instances'], 1);
    });

    it('has an applet.js entry point defining main()', () => {
        const source = fs.readFileSync(path.join(appletDir, 'applet.js'), 'utf8');
        assert.match(source, /^function main\(/m);
    });

    it('applet.js does not assign module.exports (it would stop Cinnamon auto-exporting main)', () => {
        const source = fs.readFileSync(path.join(appletDir, 'applet.js'), 'utf8');
        assert.doesNotMatch(source, /module\.exports/);
    });
});
