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
```

## Layout and architecture

```
src/darker@chris-lep/      # exactly what gets installed; folder name MUST equal metadata uuid
  metadata.json            # applet metadata (keep "version" in sync with package.json — tested)
  applet.js                # thin Cinnamon glue: panel icon/label, popup menu, slider, lifecycle
  lib/darkness.js          # pure logic (clamping, slider↔level↔opacity mapping, label texts)
  lib/overlay.js           # DarkOverlay: the stage actor + unredirect handling; deps injected
test/                      # node:test unit tests (logic, overlay with fakes, package metadata)
```

- **Put logic in `lib/darkness.js` and test it.** It has no imports, so Node can test it directly.
- **`lib/overlay.js` gets `{ Clutter, Meta, global }` injected.** Don't add `imports.*` to it;
  the tests use fakes (`test/overlay.test.js`). Extend the fakes when you use new APIs.
- **`applet.js` stays thin** and is only verified manually inside Cinnamon.
- Darkness is a "level" in `[0, MAX_LEVEL]` and is used directly as the overlay's alpha.
  `MAX_LEVEL = 0.9` is a safety cap so the screen can never go fully black.
- Level is intentionally **not persisted**: the applet always starts at 0% (a requirement).
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

## Conventions

- 4-space indent, single quotes, 100-column width (Prettier enforces this). Run `make check`.
- User-visible strings are plain English (no gettext domain yet).
- Update `CHANGELOG.md`, and bump `version` in both `package.json` and `metadata.json` together.
