# snapcraft/setup

When invoked, this action installs and configures LXD and Snapcraft.

## Usage

The snapcraft/setup action can be added to your repository's workflows with:

```yaml
- name: Set up Snapcraft
  uses: canonical/craft-actions/snapcraft/setup@main
```

### Inputs

All inputs and their defaults.

```yaml
- name: Set up Snapcraft
  uses: canonical/craft-actions/snapcraft/setup@main
  with:
    # The channel to install the Snapcraft snap from.
    # Defaults to 'latest/stable'.
    channel: 'latest/stable'
    
    # The revision of the Snapcraft snap to install.
    # Overrides the 'channel' option.
    revision: ''

    # The channel to install the LXD snap from.
    # If unset or set to an empty string, defaults to the current recommended channel for Snapcraft.
    lxd-channel: ''
```

### Outputs

- `snapcraft-revision`: The revision of Snapcraft that was installed.
- `lxd-revision`: The revision of LXD that was installed.
