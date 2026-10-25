/**
 * npm "version" lifecycle script, run by `npm version patch|minor|major` after npm has bumped
 * package.json and before it creates the release commit and tag. It:
 *   - copies the new version into the applet's metadata.json
 *   - moves the CHANGELOG's "Unreleased" entries under a new "## [x.y.z] - date" heading and
 *     updates the compare links at the bottom
 * Aborts (and with it the release) if the Unreleased section is empty.
 */
const fs = require('node:fs');
const path = require('node:path');

const REPO_URL = 'https://github.com/chris-lep/darker';

const UNRELEASED_HEADING = /^## \[Unreleased\][ \t]*$/m;
// End of the Unreleased body: the next release heading or the link reference block.
const SECTION_END = /^(## \[|\[[^\]]+\]: )/m;
const RELEASE_HEADING = /^## \[(\d+\.\d+\.\d+)\]/m;
const UNRELEASED_LINK = /^\[Unreleased\]: .*$/m;

/**
 * @param {string} text - CHANGELOG.md content
 * @param {string} version - new version, e.g. "0.2.0"
 * @param {string} date - release date as YYYY-MM-DD
 * @returns {string} the updated changelog
 */
function releaseChangelog(text, version, date) {
    const heading = UNRELEASED_HEADING.exec(text);
    if (!heading) throw new Error('CHANGELOG.md has no "## [Unreleased]" section');
    if (text.includes(`## [${version}]`)) {
        throw new Error(`CHANGELOG.md already has a section for ${version}`);
    }

    const bodyStart = heading.index + heading[0].length;
    const rest = text.slice(bodyStart);
    const endMatch = SECTION_END.exec(rest);
    const bodyEnd = endMatch ? bodyStart + endMatch.index : text.length;
    const body = text.slice(bodyStart, bodyEnd);
    if (body.trim() === '') {
        throw new Error(
            'Nothing to release: the "## [Unreleased]" section of CHANGELOG.md is empty',
        );
    }

    const previous = RELEASE_HEADING.exec(text.slice(bodyEnd));
    let result =
        text.slice(0, bodyStart) +
        `\n\n## [${version}] - ${date}\n` +
        body.replace(/^\n*/, '\n') +
        text.slice(bodyEnd);

    const versionLink = previous
        ? `[${version}]: ${REPO_URL}/compare/v${previous[1]}...v${version}`
        : `[${version}]: ${REPO_URL}/releases/tag/v${version}`;
    const links = `[Unreleased]: ${REPO_URL}/compare/v${version}...HEAD\n${versionLink}`;
    if (UNRELEASED_LINK.test(result)) {
        result = result.replace(UNRELEASED_LINK, links);
    } else {
        result = `${result.trimEnd()}\n\n${links}\n`;
    }
    return result;
}

/**
 * Replaces the "version" value in a metadata.json text, keeping its formatting.
 * @param {string} text
 * @param {string} version
 * @returns {string}
 */
function setMetadataVersion(text, version) {
    const pattern = /("version"\s*:\s*")[^"]*(")/g;
    const matches = text.match(pattern);
    if (!matches || matches.length !== 1) {
        throw new Error('metadata.json must contain exactly one "version" field');
    }
    return text.replace(pattern, `$1${version}$2`);
}

/** Today's date in local time as YYYY-MM-DD. */
function today() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function main() {
    const root = path.join(__dirname, '..');
    const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const metadataPath = path.join(root, 'src', 'darker@chris-lep', 'metadata.json');
    const changelogPath = path.join(root, 'CHANGELOG.md');

    const changelog = releaseChangelog(fs.readFileSync(changelogPath, 'utf8'), version, today());
    const metadata = setMetadataVersion(fs.readFileSync(metadataPath, 'utf8'), version);
    fs.writeFileSync(changelogPath, changelog);
    fs.writeFileSync(metadataPath, metadata);
    console.log(`Prepared release ${version}: updated metadata.json and CHANGELOG.md`);
}

if (require.main === module) {
    try {
        main();
    } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
}

module.exports = { releaseChangelog, setMetadataVersion };
