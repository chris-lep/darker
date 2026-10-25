const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { releaseChangelog, setMetadataVersion } = require('../scripts/version.js');

const REPO = 'https://github.com/chris-lep/darker';
const ROOT = path.join(__dirname, '..');

const changelog = (unreleasedBody) => `# Changelog

Intro text.

## [Unreleased]
${unreleasedBody}
## [0.1.0] - 2026-10-25

### Added

- First feature.

[Unreleased]: ${REPO}/compare/v0.1.0...HEAD
[0.1.0]: ${REPO}/releases/tag/v0.1.0
`;

describe('releaseChangelog', () => {
    it('moves Unreleased entries under the new version and updates links', () => {
        const input = changelog('\n### Added\n\n- Scrolling.\n');
        assert.equal(
            releaseChangelog(input, '0.2.0', '2026-11-01'),
            `# Changelog

Intro text.

## [Unreleased]

## [0.2.0] - 2026-11-01

### Added

- Scrolling.

## [0.1.0] - 2026-10-25

### Added

- First feature.

[Unreleased]: ${REPO}/compare/v0.2.0...HEAD
[0.2.0]: ${REPO}/compare/v0.1.0...v0.2.0
[0.1.0]: ${REPO}/releases/tag/v0.1.0
`,
        );
    });

    it('handles the very first release (no previous version, no links yet)', () => {
        const input = '# Changelog\n\n## [Unreleased]\n\n### Added\n\n- Everything.\n';
        assert.equal(
            releaseChangelog(input, '0.1.0', '2026-10-25'),
            '# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-10-25\n\n### Added\n\n- Everything.\n' +
                `\n[Unreleased]: ${REPO}/compare/v0.1.0...HEAD\n` +
                `[0.1.0]: ${REPO}/releases/tag/v0.1.0\n`,
        );
    });

    it('refuses to release an empty Unreleased section', () => {
        assert.throws(() => releaseChangelog(changelog('\n'), '0.2.0', '2026-11-01'), /empty/);
    });

    it('refuses a version that already exists', () => {
        const input = changelog('\n### Fixed\n\n- Bug.\n');
        assert.throws(() => releaseChangelog(input, '0.1.0', '2026-11-01'), /already/);
    });

    it('requires an Unreleased section', () => {
        assert.throws(() => releaseChangelog('# Changelog\n', '0.2.0', '2026-11-01'), /Unreleased/);
    });
});

describe('setMetadataVersion', () => {
    it('replaces the version and keeps formatting', () => {
        const input = '{\n    "uuid": "x@y",\n    "version": "0.1.0",\n    "a": ["6.6"]\n}\n';
        assert.equal(
            setMetadataVersion(input, '0.2.0'),
            '{\n    "uuid": "x@y",\n    "version": "0.2.0",\n    "a": ["6.6"]\n}\n',
        );
    });

    it('requires exactly one version field', () => {
        assert.throws(() => setMetadataVersion('{}', '1.0.0'), /exactly one/);
    });
});

describe('repository CHANGELOG.md', () => {
    const text = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
    const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    it('has an Unreleased section', () => {
        assert.match(text, /^## \[Unreleased\]$/m);
    });

    it('documents the current package version, with a link', () => {
        assert.match(
            text,
            new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm'),
        );
        assert.match(text, new RegExp(`^\\[${version.replaceAll('.', '\\.')}\\]: ${REPO}/`, 'm'));
    });
});
