# Changelog

<!--
Changelog template:

## X.Y.Z (YYYY-MM-DD)

New features:

Bug fixes:

Documentation:

For a complete list of commits, check out the [X.Y.Z] release on GitHub.
-->

## 1.1.0 (2026-11-18)

New features:

- `snapcraft/pack`: add a `build-info` input to pass build information to
  Snapcraft.

Bug fixes:

- Craft environment variables are now passed to sudo explicitly.

Documentation:

- Add a contribution guide.

## 1.0.0 (2026-10-22)

Breaking changes:

- `setup` actions now install craft tools from the default snap channel
  reported by snapd, rather than a hardcoded channel.
- Default verbosity is now `debug` instead of the previous higher default.
- The `setup-lxd` action installs LXD from the default channel from snapd.
- The `pack` actions now allow multiple primary artifacts, changing the
  artifact outputs.

New features:

- Add `setup` actions for each supported craft.
- Rewrite `snapcraft/pack` and `charmcraft/pack` as Node-based actions.
- Add the `imagecraft/pack` action.

Documentation:

- Add READMEs for each action.

## 0.1.1 (2026-07-10)

Bug fixes:

- Use a new workaround for using other actions.

<!-- Release links -->

[1.1.0]: https://github.com/canonical/craft-actions/releases/tag/v1.1.0
[1.0.0]: https://github.com/canonical/craft-actions/releases/tag/v1.0.0
[0.1.1]: https://github.com/canonical/craft-actions/releases/tag/v0.1.1
