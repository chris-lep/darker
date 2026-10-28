# Darker

A Cinnamon panel applet that darkens the screen **in software** using a slider. It's for night
work on displays whose lowest backlight brightness is still too bright.

It doesn't touch the backlight or the display's gamma. Instead it draws a semi-transparent,
click-through black layer over everything on screen, inside Cinnamon's compositor.

## Features

- Slider in the panel popup, from 100% (off) down to 10% brightness (capped so the screen can never
  go fully black)
- Scroll over the panel icon to adjust in 5% steps
- The panel shows just an icon while off, and the current brightness (e.g. `60%`) while active
- Covers all monitors, panels, menus, and fullscreen video
- Works together with **Night Light**
- No external tools, no background processes
- Always starts at 100% (off) after login or a Cinnamon restart

## Why an overlay instead of gamma?

Tools like `xrandr --brightness` darken by changing the display's gamma ramps. Cinnamon's
Night Light also controls the gamma ramps, so the two would keep overwriting each other. An
overlay drawn by the compositor avoids that. It needs no subprocesses and would also work
under Wayland.

## Requirements

- Linux Mint / Cinnamon 6.6 or newer

## Installation

```sh
git clone https://github.com/chris-lep/darker.git
cd darker
make install        # symlinks src/darker@chris-lep into ~/.local/share/cinnamon/applets/
```

Then right-click the panel → **Applets**, select **Darker** and click **+**. You might need
to restart Cinnamon first (`Ctrl+Alt+Esc`) before it appears in the list.

The applet is symlinked, not copied, so keep the cloned folder. `git pull` followed by a
Cinnamon restart updates it.

To remove it, take it off the panel and run `make uninstall`.

## Usage

Click the panel icon and drag the slider, or scroll over the icon: up = brighter, down =
darker, in 5% steps. **Reset to 100%** turns darkening off.

If the screen ever gets too dark to see: restarting Cinnamon (`Ctrl+Alt+Esc`) or removing
the applet always brings it back to normal.

## Known limitations

- **The mouse cursor isn't darkened.** It's drawn separately by the hardware.
- **Screenshots are darkened.** Screenshot tools capture the composited image, overlay included.
- **Fullscreen apps aren't darkened if "Disable compositing for full-screen windows" is on** (System
  Settings → General; off by default), because those windows then bypass the compositor.
- It only works inside a Cinnamon session (it's part of the compositor, not a standalone program).

## Development

Requires Node.js ≥ 20 for the tooling. The applet itself has no build step.

```sh
npm install      # dev tools only (ESLint, Prettier)
make check       # lint + format check + unit tests
make test        # unit tests only (node --test, no dependencies needed)
make format      # auto-format
make reload      # reload the running applet after editing
make pot         # update the translation template after changing UI texts
make spice       # build the Cinnamon Spices package in build/spice/
```

Changes are listed in [CHANGELOG.md](CHANGELOG.md). Versions follow
[Semantic Versioning](https://semver.org/), and releases are tagged `vX.Y.Z`.

See [CLAUDE.md](CLAUDE.md) for architecture notes and Cinnamon-specific gotchas.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
