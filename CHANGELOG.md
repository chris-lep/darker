# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- The scale now shows brightness instead of darkness: 100% is off and lower percentages are
  darker (down to 10%). The panel label, tooltip and reset item ("Reset to 100%") follow suit.
- The popup slider is reversed to match: right = brighter, like Cinnamon's brightness slider.

## [0.2.0] - 2026-10-25

### Added

- Scrolling over the panel icon changes the darkness in 5% steps (up = brighter, down = darker).

### Changed

- Scrolling over the popup slider now also goes up = brighter, matching the panel icon.

## [0.1.0] - 2026-10-25

### Added

- Panel applet with a popup slider that darkens the screen from 0% to 90% using a compositor overlay.
- The panel shows the percentage while active. The tooltip always shows the state.
- "Reset to 0%" menu item.
- Fullscreen windows are darkened too (unredirect is disabled while active).

[Unreleased]: https://github.com/chris-lep/darker/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/chris-lep/darker/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/chris-lep/darker/releases/tag/v0.1.0
