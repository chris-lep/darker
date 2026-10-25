# CLAUDE.md

Guidance for working on this repository.

## What this is

**Darker** (`darker@chris-lep`) is a Cinnamon panel applet that darkens the screen in
software. A black, non-reactive Clutter actor is placed on top of `global.stage`, and a
popup slider controls its opacity (0–90%). We deliberately don't use gamma or xrandr,
because that conflicts with Cinnamon's Night Light.

## Commands

```sh
make check     # npm run lint && npm run format:check && npm test — run before committing
make test      # node --test (built-in runner, no deps)
make lint      # ESLint (flat config: eslint.config.js)
make format    # Prettier
make install   # symlink src/darker@chris-lep into ~/.local/share/cinnamon/applets/
make reload    # reload the applet in the running Cinnamon via D-Bus (LookingGlass)
make release BUMP=patch|minor|major   # cut a release (see "Versioning and releases")
```

## Layout and architecture

```
src/darker@chris-lep/      # exactly what gets installed; folder name MUST equal metadata uuid
  metadata.json            # applet metadata (keep "version" in sync with package.json — tested)
  applet.js                # thin Cinnamon glue: panel icon/label, popup menu, slider, lifecycle
  lib/darkness.js          # pure logic (clamping, slider↔level↔opacity mapping, label texts)
  lib/overlay.js           # DarkOverlay: the stage actor + unredirect handling; deps injected
scripts/version.js         # npm "version" hook: syncs metadata.json, releases the CHANGELOG
test/                      # node:test unit tests (logic, overlay with fakes, metadata, release)
```

- **Put logic in `lib/darkness.js` and test it.** It has no imports, so Node can test it directly.
- **`lib/overlay.js` gets `{ Clutter, Meta, global }` injected.** Don't add `imports.*` to it;
  the tests use fakes (`test/overlay.test.js`). Extend the fakes when you use new APIs.
- **`applet.js` stays thin** and is only verified manually inside Cinnamon.
- Darkness is a "level" in `[0, MAX_LEVEL]` and is used directly as the overlay's alpha.
  `MAX_LEVEL = 0.9` is a safety cap so the screen can never go fully black.
- Level is intentionally **not persisted**: the applet always starts at 0% (a requirement).
- Scrolling (over the panel icon _and_ over the popup slider) goes up = brighter, down = darker,
  in 5% steps snapped to the grid (`stepLevel`, `scrollSteps`). The slider is subclassed
  (`DarknessSlider`) because the stock one scrolls the other way.
- While the overlay is visible, `Meta.disable_unredirect_for_display` is active, so fullscreen
  windows still get composited and darkened. Those calls are reference counted and **must stay
  paired**. `DarkOverlay` tracks this with a boolean, and `destroy()` restores it.

## Cinnamon gotchas

- **Module system:** Cinnamon's xlet loader (`/usr/share/cinnamon/js/misc/fileUtils.js`)
  provides a CommonJS-like `require`/`module.exports`. Two quirks:
    - `require()` paths resolve **relative to the applet root**, not to the calling file. So
      `lib/` modules must not `require` each other; pass values in instead.
    - If a file doesn't assign `module.exports`, its top-level declarations are auto-exported.
      `applet.js` relies on that to export `main()`, so **never assign `module.exports` in
      `applet.js`** (tested).
- **Cinnamon's Clutter/Meta are muffin's forks (`Clutter-0`, `Meta-0`), which are older than
  upstream GNOME.** Upstream docs can be wrong here. For example, the stage emits
  `actor-added`, not `child-added`, and using the wrong one crashed the applet once. Verify
  any new GI API against the real typelibs before relying on it:
    ```sh
    GI_TYPELIB_PATH=/usr/lib/x86_64-linux-gnu/muffin LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/muffin \
      cjs -c "imports.gi.versions.Clutter = '0'; const {GObject, Clutter} = imports.gi; \
      print(GObject.signal_lookup('actor-added', Clutter.Stage.\$gtype) !== 0)"
    ```
- **Module cache is keyed by file size.** After an edit, `make reload` may keep the old code
  if the file size didn't change. Restart Cinnamon (`Ctrl+Alt+Esc`) to be sure.
- `PopupSliderMenuItem.setValue()` does not emit `value-changed`. Only user interaction does.
- Cinnamon refuses to load the applet if `metadata.json` `uuid` doesn't match the folder name.
- `cinnamon-version` in metadata is a list of _minimum_ versions (`["6.6"]` means 6.6 or newer).
- Reference implementations live in `/usr/share/cinnamon/applets/` (e.g. `sound@cinnamon.org`,
  `nightlight@cinnamon.org`) and the Cinnamon JS API in `/usr/share/cinnamon/js/ui/`.

## Debugging

- Errors and `log()` output go to `~/.xsession-errors`.
- Looking Glass: `Alt+F2`, type `lg`. The "Extensions" tab can reload the applet, and
  "Log" shows errors.
- If the screen gets too dark, `Ctrl+Alt+Esc` restarts Cinnamon and resets the level to 0%.

## Versioning and releases

The project follows [Semantic Versioning](https://semver.org/). For an applet, the "public API"
is what users rely on: the UUID, the controls and their behavior, and the supported Cinnamon
versions.

- **MAJOR:** breaking changes, e.g. changing the UUID (users must re-add the applet), removing a
  feature or control, or raising the minimum Cinnamon version.
- **MINOR:** new features or noticeable behavior changes that keep everything existing working.
- **PATCH:** bug fixes, plus internal or docs-only changes worth shipping.
- While the version is **0.x**, SemVer allows anything to change. We still use MINOR for
  features and breaking changes and PATCH for fixes. Go to 1.0.0 once the behavior is
  considered stable (at the latest when submitting to Cinnamon Spices).

**Every user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md`, in the same
commit** (Keep a Changelog sections: Added, Changed, Deprecated, Removed, Fixed, Security).
Never edit `version` by hand.

To release (clean working tree required):

```sh
make release BUMP=minor   # = npm version minor
git push --follow-tags
```

`npm version` runs `make check` (preversion), bumps `package.json` and `package-lock.json`, runs
`scripts/version.js` (copies the version to `metadata.json`, moves the Unreleased entries under
`## [x.y.z] - date`, updates the compare links, and fails if Unreleased is empty), then commits
"Release vX.Y.Z" and creates the annotated tag `vX.Y.Z`. Tests check that `metadata.json`,
`package.json` and the CHANGELOG agree.

GitHub Releases are optional and created by hand **after** pushing. In the web UI, pick the
already-pushed tag and paste the version's CHANGELOG section as the notes. Don't let GitHub
create the tag: that makes a lightweight tag which clashes with the local annotated one.
(`v0.1.0` is a GitHub-created lightweight tag for that reason; all later tags come from
`npm version`.)

## Conventions

- 4-space indent, single quotes, 100-column width (Prettier enforces this). Run `make check`.
- User-visible strings are plain English (no gettext domain yet).
