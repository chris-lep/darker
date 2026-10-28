UUID        := darker@chris-lep
SRC_DIR     := $(CURDIR)/src/$(UUID)
APPLETS_DIR := $(HOME)/.local/share/cinnamon/applets
TARGET      := $(APPLETS_DIR)/$(UUID)

.PHONY: help install uninstall reload test lint format check release icon pot spice

help:
	@echo "make install    Symlink the applet into $(APPLETS_DIR)"
	@echo "make uninstall  Remove the symlink"
	@echo "make reload     Reload the running applet in Cinnamon"
	@echo "make test       Run unit tests"
	@echo "make lint       Run ESLint"
	@echo "make format     Format all files with Prettier"
	@echo "make check      Lint + format check + tests"
	@echo "make release BUMP=patch|minor|major  Bump version, update CHANGELOG, commit and tag"
	@echo "make icon       Render assets/icon.svg to the applet's icon.png"
	@echo "make pot        Regenerate the translation template (po/$(UUID).pot)"
	@echo "make spice [SPICES_REPO=path]  Build the Cinnamon Spices layout in build/spice"
	@echo "                (and copy it into a cinnamon-spices-applets clone)"

install:
	@mkdir -p "$(APPLETS_DIR)"
	@if [ -e "$(TARGET)" ] && [ ! -L "$(TARGET)" ]; then \
		echo "Error: $(TARGET) exists and is not a symlink; remove it first." >&2; exit 1; \
	fi
	ln -sfn "$(SRC_DIR)" "$(TARGET)"
	@echo "Installed. Add it via right-click on the panel -> Applets -> Darker."

uninstall:
	@if [ -L "$(TARGET)" ]; then rm "$(TARGET)" && echo "Removed $(TARGET)"; \
	else echo "Nothing to remove (no symlink at $(TARGET))."; fi

reload:
	dbus-send --session --dest=org.Cinnamon.LookingGlass --type=method_call \
		/org/Cinnamon/LookingGlass org.Cinnamon.LookingGlass.ReloadExtension \
		string:'$(UUID)' string:'APPLET'

test:
	npm test

lint:
	npm run lint

format:
	npm run format

check:
	npm run check

release:
	@case "$(BUMP)" in patch|minor|major) ;; \
		*) echo "Usage: make release BUMP=patch|minor|major" >&2; exit 1;; esac
	npm version $(BUMP)
	@echo "Release committed and tagged. Publish with: git push --follow-tags"

# Needs python3-gi with GdkPixbuf's SVG loader (librsvg), both installed on Linux Mint.
icon:
	python3 -I -c 'import sys, gi; gi.require_version("GdkPixbuf", "2.0"); \
		from gi.repository import GdkPixbuf; \
		GdkPixbuf.Pixbuf.new_from_file_at_size(sys.argv[1], 128, 128).savev(sys.argv[2], "png", [], [])' \
		assets/icon.svg "$(SRC_DIR)/icon.png"

pot:
	node scripts/makepot.js

spice:
	node scripts/build-spice.js $(SPICES_REPO)
