/**
 * Assembles the applet in the Cinnamon Spices layout
 * (https://github.com/linuxmint/cinnamon-spices-applets#file-structure):
 *
 *   build/spice/<uuid>/info.json, README.md, screenshot.png   <- spices/
 *   build/spice/<uuid>/files/<uuid>/...                       <- src/<uuid>/
 *
 * With a path to a clone of cinnamon-spices-applets, it also replaces <clone>/<uuid> with the
 * result, ready to commit there.
 *
 * Usage: node scripts/build-spice.js [path/to/cinnamon-spices-applets]
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const SPICES_DIR = path.join(ROOT, 'spices');
const OUT_DIR = path.join(ROOT, 'build', 'spice');

/** Website files in spices/, copied to the spice's root directory. */
const ROOT_FILES = ['info.json', 'README.md', 'screenshot.png'];

/**
 * @param {string} uuid
 * @returns {string[]} spice-relative paths that validate-spice requires
 */
function requiredFiles(uuid) {
    return [
        'info.json',
        'screenshot.png',
        `files/${uuid}/metadata.json`,
        `files/${uuid}/icon.png`,
        `files/${uuid}/applet.js`,
    ];
}

/**
 * Builds the spice directory.
 * @param {string} outDir - parent directory; the spice ends up in outDir/<uuid>
 * @returns {{uuid: string, spiceDir: string, missing: string[]}}
 */
function buildSpice(outDir) {
    const [uuid] = fs.readdirSync(SRC_DIR);
    const spiceDir = path.join(outDir, uuid);

    fs.rmSync(spiceDir, { recursive: true, force: true });
    // dereference: never copy symlinks into the spice.
    fs.cpSync(path.join(SRC_DIR, uuid), path.join(spiceDir, 'files', uuid), {
        recursive: true,
        dereference: true,
    });
    for (const file of ROOT_FILES) {
        const from = path.join(SPICES_DIR, file);
        if (fs.existsSync(from)) fs.copyFileSync(from, path.join(spiceDir, file));
    }

    const missing = requiredFiles(uuid).filter((file) => !fs.existsSync(path.join(spiceDir, file)));
    return { uuid, spiceDir, missing };
}

function main() {
    const spicesRepo = process.argv[2];
    const { uuid, spiceDir, missing } = buildSpice(OUT_DIR);
    console.log(`Built ${path.relative(process.cwd(), spiceDir)}`);

    if (missing.length > 0) {
        console.error(`Missing required files (add them to spices/ or src/${uuid}/):`);
        for (const file of missing) console.error(`  ${file}`);
        process.exit(1);
    }

    if (spicesRepo) {
        if (!fs.existsSync(path.join(spicesRepo, 'validate-spice'))) {
            console.error(`${spicesRepo} doesn't look like a cinnamon-spices-applets clone.`);
            process.exit(1);
        }
        const target = path.join(spicesRepo, uuid);
        fs.rmSync(target, { recursive: true, force: true });
        fs.cpSync(spiceDir, target, { recursive: true });
        console.log(`Copied to ${target}`);
        console.log(`Next: cd ${spicesRepo} && ./validate-spice ${uuid}`);
    }
}

if (require.main === module) main();

module.exports = { buildSpice };
