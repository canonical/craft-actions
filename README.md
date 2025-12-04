[![Test the action](https://github.com/canonical/craft-actions/actions/workflows/test.yml/badge.svg)](https://github.com/canonical/craft-actions/actions/workflows/test.yml)

# Craft Actions

This project contains custom GitHub actions for Craft Applications, such as:

- [Charmcraft](https://juju.is/)
- [Snapcraft](https://snapcraft.io/)
- [Rockcraft](https://documentation.ubuntu.com/rockcraft/stable)

The following sections will break down the different actions available in this
repository and how to use them.

## snapcraft/setup

Set up Snapcraft on the runner.

### Usage

```yaml
steps:
  - uses: canonical/craft-actions/snapcraft/setup@main
  - run: |
    snapcraft --version
```

This installs and configures LXD and Snapcraft.

#### Inputs

##### `channel`

The channel to install the Snapcraft snap from. Defaults to `latest/stable`.

##### `revision`

The revision of the Snapcraft snap to install. Overrides the `channel` option.

##### `lxd-channel`

The channel to install the LXD snap from. Defaults to the current recommended channel for Snapcraft.

---

## snapcraft/pack

Set up Snapcraft and pack a snap.

### Usage

```yaml
steps:
  - uses: actions/checkout@v6
  - uses: canonical/craft-actions/snapcraft/pack@main
```

This will install and configure LXD and Snapcraft before packing the snap in the given directory.

#### Inputs

##### `path`

The location in your repository to run Snapcraft when packing. Defaults to the repository root.

In most simple cases, `snapcraft.yaml` is stored in the `snap/` directory at the repository root.

In repositories with more complex file hierarchies, the path could be elsewhere. For example, if your project
stores multiple build tool manifests in a `dist/` directory, and `snapcraft.yaml` is stored in `dist/snap/`,
you would want to run Snapcraft at `dist/` instead of the repository root.

```yaml
steps:
  - uses: actions/checkout@v6
  - uses: canonical/craft-actions/snapcraft/pack@main
    with:
      path: dist/
```

##### `verbosity`

Sets the build verbosity level for Snapcraft. Must be one of: "quiet", "brief", "verbose", "debug", or "trace" (the default).

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/charmcraft/pack@main
    with:
      verbosity: debug
```

##### `channel`

The channel to install the Snapcraft snap from. Defaults to `latest/stable`.

##### `revision`

The revision of the Snapcraft snap to install. Overrides the `channel` option.

##### `lxd-channel`

The channel to install the LXD snap from. Defaults to the current recommended channel for Snapcraft.

---

## rockcraft-pack

Can be used to build a rock (with Rockcraft). It expects a "rockcraft.yaml" file
to exist in its execution path.

### Usage

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/rockcraft-pack@main
```

This will install and configure LXD and Rockcraft, and then invoke `rockcraft`
to build a new rock, based on a "rockcraft.yaml" file located in the root of
the workspace.

You can also upload the resulting rock as a GitHub artifact as follows:

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/rockcraft-pack@main
    id: rockcraft
  - uses: actions/upload-artifact@v3
    with:
      name: rock
      path: ${{ steps.rockcraft.outputs.rock }}
```

Additionally, any following steps will already have Rockcraft available for
direct invocation through the shell.

#### Inputs

##### `path`

If your Rockcraft project ("rockcraft.yaml") is not located in the root of the
workspace, you can specify an alternative location via the `path` input
parameter.

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/rockcraft-pack@main
    with:
      path: path/to/rockcraft/project/
```

##### `verbosity`

This `verbosity` input parameter can be used to set the build verbosity level to one of 'quiet', 'brief', 'verbose', 'debug' or 'trace' (the default).

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/rockcraft-pack@main
    with:
      verbosity: debug
```

---

## charmcraft/setup

Set up Charmcraft on the runner.

### Usage

```yaml
steps:
  - uses: canonical/craft-actions/charmcraft/setup@main
  - run: |
    charmcraft --version
```

This will install and configure LXD and Charmcraft.

#### Inputs

##### `channel`

Select a channel for the Charmcraft snap to be installed from. Defaults to `latest/stable`

##### `revision`

Pin Charmcraft to a specific revision. Overrides the `channel` option.

##### `lxd-channel`

Select a channel for LXD to be installed from. Defaults to the current recommended channel for Charmcraft.

---

## charmcraft/pack

Set up Charmcraft and pack a charm, caching intermediate Python wheels to speed up builds.

### Usage

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: canonical/craft-actions/charmcraft/pack@main
```

This will install and configure LXD and Charmcraft, then pack a charm in the given directory.

#### Inputs

##### `path`

If your Charmcraft project ("charmcraft.yaml") is not located in the root of the
workspace, you can specify an alternative location via the `path` input
parameter.

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/charmcraft/pack@main
    with:
      path: path/to/project/
```

##### `verbosity`

This `verbosity` input parameter can be used to set the build verbosity level to one of 'quiet', 'brief', 'verbose', 'debug' or 'trace' (the default).

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/charmcraft/pack@main
    with:
      verbosity: debug
```

##### `channel`

Select a channel for the Charmcraft snap to be installed from. Defaults to `latest/stable`

##### `revision`

Pin Charmcraft to a specific revision. Overrides the `channel` option.

##### `lxd-channel`

Select a channel for LXD to be installed from. Defaults to the current recommended channel for Charmcraft.

---
## Committing code

Please follow these guidelines when committing code for this project:

- Use a topic with a colon to start the subject
- Separate subject from body with a blank line
- Limit the subject line to 50 characters
- Do not capitalize the subject line
- Do not end the subject line with a period
- Use the imperative mood in the subject line
- Wrap the body at 72 characters
- Use the body to explain what and why (instead of how)
