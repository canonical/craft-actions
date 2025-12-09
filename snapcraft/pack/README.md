# snapcraft/pack

Set up Snapcraft and pack a snap.

## Usage

```yaml
- name: Package snap with Snapcraft
  uses: canonical/craft-actions/snapcraft/pack@main
```

This installs and configures LXD and Snapcraft, then packs the snap
at the root of the repository.

### Inputs

All inputs and their defaults.

```yaml
- name: Package snap with Snapcraft
  uses: canonical/craft-actions/snapcraft/pack@main
  with:
    # The channel to install the Snapcraft snap from.
    channel: 'latest/stable'
    
    # The revision of the Snapcraft snap to install.
    # Overrides the `channel` option.
    revision: ''

    # The channel to install the LXD snap from.
    # If left blank, defaults to the current recommended channel for Snapcraft.
    lxd-channel: ''
    
    # The location in your repository to run Snapcraft when packing. Defaults to the repository root.
    # 
    # In most simple cases, `snapcraft.yaml` is stored in the `snap/` directory at the repository root.
    # 
    # In repositories with more complex file hierarchies, the path could be elsewhere. For example, if your project
    # stores multiple build tool manifests in a `dist/` directory, and `snapcraft.yaml` is stored in `dist/snap/`,
    # you would want to run Snapcraft at `dist/` instead of the repository root.
    path: '.'
    
    # Sets the build verbosity level for Snapcraft. Must be one of: "quest", "brief", "verbose', "debug", or "trace" (the default).
    verbosity: 'trace'
```

### Outputs

- `snap`: The name of the packed snap artifact.
- `components`: A space-delimited list of names of the packed components.
- `snapcraft-revision`: The revision of Snapcraft that was installed.
- `lxd-revision`: The revision of LXD that was installed.
