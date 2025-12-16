# snapcraft/pack

This action installs and configures LXD and Snapcraft before packing the snap
at the root of the repository.

## Usage

The snapcraft/pack action can be added to your repository's workflows with:

```yaml
- name: Package snap with Snapcraft
  uses: canonical/craft-actions/snapcraft/pack@main
```

### Inputs

The action supports the following inputs.

```yaml
- name: Package snap with Snapcraft
  uses: canonical/craft-actions/snapcraft/pack@main
  with:
    # The channel to install the Snapcraft snap from.
    # Defaults to 'latest/stable'.
    channel: 'latest/stable'
    
    # The revision of the Snapcraft snap to install.
    # Overrides the 'channel' option.
    revision: ''

    # The channel to install the LXD snap from.
    # If unset or set to an empty string, the current recommended channel for Snapcraft is installed.
    lxd-channel: ''
    
    # The location in your repository to run Snapcraft when packing.
    # 
    # In most simple cases, 'snapcraft.yaml' is stored in the 'snap/' directory at the repository root.
    # 
    # In repositories with more complex file hierarchies, the path could be elsewhere. For example, if your project
    # stores multiple build tool manifests in a 'dist/' directory, and 'snapcraft.yaml' is stored in 'dist/snap/',
    # you'd run Snapcraft at 'dist/' instead of the repository root.
    #
    # Defaults to the repository root ('.').
    path: '.'
    
    # Sets the build verbosity level for Snapcraft. Must be one of: 'quiet', 'brief', 'verbose', 'debug', or 'trace'.
    # Defaults to 'trace'.
    verbosity: 'trace'
```

### Outputs

- `snap`: The name of the packed snap artifact.
- `components`: A space-delimited list of names of the packed components.
- `snapcraft-revision`: The revision of Snapcraft that was installed.
- `lxd-revision`: The revision of LXD that was installed.
