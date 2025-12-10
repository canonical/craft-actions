# charmcraft/pack

Set up Charmcraft and pack a charm.

## Usage

```yaml
- name: Package charm with Charmcraft
  uses: canonical/craft-actions/charmcraft/pack@main
```

This installs and configures LXD and Charmcraft, then packs the charm
at the root of the repository.

### Inputs

All inputs and their defaults.

```yaml
- name: Package charm with Charmcraft
  uses: canonical/craft-actions/charmcraft/pack@main
  with:
    # The channel to install the Charmcraft snap from.
    channel: 'latest/stable'
    
    # The revision of the Charmcraft snap to install.
    # Overrides the `channel` option.
    revision: ''

    # The channel to install the LXD snap from.
    # If left blank, defaults to the current recommended channel for Charmcraft.
    lxd-channel: ''
    
    # The location in your repository to run Charmcraft when packing. Defaults to the repository root.
    # 
    # In repositories with more complex file hierarchies, the path could be elsewhere. For example, if your project
    # stores multiple build tool manifests in a `dist/` directory, and `charmcraft.yaml` is stored in `dist/charm/`,
    # you would want to run Charmcraft at `dist/charm/` instead of the repository root.
    path: '.'
    
    # Sets the build verbosity level for Charmcraft. Must be one of: "quiet", "brief", "verbose", "debug", or "trace" (the default).
    verbosity: 'trace'
```

### Outputs

- `charms`: A space-delimited list of names of the packed charm artifacts.
- `charmcraft-revision`: The revision of Charmcraft that was installed.
- `lxd-revision`: The revision of LXD that was installed.
