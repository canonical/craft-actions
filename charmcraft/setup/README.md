# charmcraft/setup

When invoked, this action installs and configures LXD and Charmcraft.

## Usage

The snapcraft/pack action can be added to your repository's workflows with:

```yaml
- name: Set up Charmcraft
  uses: canonical/craft-actions/charmcraft/setup@main
```

### Inputs

All inputs and their defaults.

```yaml
- name: Set up Charmcraft
  uses: canonical/craft-actions/charmcraft/setup@main
  with:
    # The channel to install the Charmcraft snap from.
    # Defaults to 'latest/stable'.
    channel: 'latest/stable'
    
    # The revision of the Charmcraft snap to install.
    # Overrides the 'channel' option.
    revision: ''

    # The channel to install the LXD snap from.
    # If left blank, defaults to the current recommended channel for Charmcraft.
    lxd-channel: ''
```

### Outputs

- `charmcraft-revision`: The revision of Charmcraft that was installed.
- `lxd-revision`: The revision of LXD that was installed.
