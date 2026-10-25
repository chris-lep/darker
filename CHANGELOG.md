# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/chris-lep/darker/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/chris-lep/darker/releases/tag/v0.1.0
