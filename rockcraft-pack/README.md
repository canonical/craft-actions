# rockcraft-pack

When invoked, this action installs and configures LXD and Rockcraft before packing the rock
at the root of the repository.

## Usage

The rockcraft/pack action can be added to your repository's workflows with:

```yaml
- name: Package rock with Rockcraft
  uses: canonical/craft-actions/rockcraft-pack@main
```

### Inputs

The action can be catered to your project with the following inputs. Where applicable, inputs are listed with their default values.

```yaml
- name: Package rock with Rockcraft
  uses: canonical/craft-actions/rockcraft-pack@main
  with:
    # The channel to install the Rockcraft snap from.
    # Defaults to 'latest/stable'.
    rockcraft-channel: 'latest/stable'
    
    # The revision of the Rockcraft snap to install.
    # Overrides the 'rockcraft-channel' option.
    revision: ''
    
    # The location in your repository to run Rockcraft when packing.
    # 
    # In repositories with more complex file hierarchies, the path could be elsewhere. For example, if your project
    # stores multiple build tool manifests in a 'dist/' directory, and 'rockcraft.yaml' is stored in 'dist/rock/',
    # you'd run Rockcraft at 'dist/rock/' instead of the repository root.
    # 
    # Defaults to the repository root ('.').

    path: '.'
    
    # Sets the build verbosity level for Rockcraft. Must be one of: 'quiet', 'brief', 'verbose', 'debug', or 'trace'.
    # Defaults to 'trace'.
    verbosity: 'trace'
    
    # Whether to run 'rockcraft test' when packing the rock.
    # Defaults to false.
    test: false
    
    # Any Ubuntu Pro services to enable when packing the rock, as comma-separated values.
    # 
    # Usage of Ubuntu Pro services is currently experimental and only available when installing Rockcraft
    # from the 'latest/edge/pro-sources' channel.
    pro: ''
```

### Outputs

- `rock`: The name of the packed rock artifact.
