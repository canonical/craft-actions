# charmcraft/pack

When invoked, this action installs and configures LXD and Charmcraft before packing the charm
at the root of the repository.

## Usage

The charmcraft/pack action can be added to your repository's workflows with:

```yaml
- name: Package charm with Charmcraft
  uses: canonical/craft-actions/charmcraft/pack@main
```

### Inputs

The action can be catered to your project with the following inputs. Where applicable, inputs are listed with their default values.

```yaml
- name: Package charm with Charmcraft
  uses: canonical/craft-actions/charmcraft/pack@main
  with:
    # The channel to install the Charmcraft snap from.
    # Defaults to 'latest/stable'
    channel: 'latest/stable'
    
    # The revision of the Charmcraft snap to install.
    # Overrides the 'channel' option.
    revision: ''

    # The channel to install the LXD snap from.
    # If unset or set to an empty string, the current recommended channel for Charmcraft is installed.
    lxd-channel: ''
    
    # The location in your repository to run Charmcraft when packing.
    # 
    # In repositories with more complex file hierarchies, the path could be elsewhere. For example, if your project
    # stores multiple build tool manifests in a 'dist/' directory, and 'charmcraft.yaml' is stored in 'dist/charm/',
    # you'd run Charmcraft at 'dist/charm/' instead of the repository root.
    # 
    # Defaults to the repository root ('.').
    path: '.'
    
    # Sets the build verbosity level for Charmcraft. Must be one of: 'quiet', 'brief', 'verbose', 'debug', or 'trace'.
    # Defaults to 'trace'.
    verbosity: 'trace'
```

### Outputs

- `charms`: A space-delimited list of names of the packed charm artifacts.
- `charmcraft-revision`: The revision of Charmcraft that was installed.
- `lxd-revision`: The revision of LXD that was installed.
