# `charmcraft/pack`

Pack a charm with Charmcraft.

This action installs and configures LXD and Charmcraft before packing a charm project in the workspace.

## Usage

The `charmcraft/pack` action can be added to your repository's workflows with:

```yaml
jobs:
  # ...
  pack-charm:
    runs-on: ubuntu-latest
    steps:
      - uses: canonical/craft-actions/charmcraft/pack@v1
```

## Inputs

The behavior of the `charmcraft/pack` action can be customized with the following inputs:

| Input       | Description                                                                                      | Default                                  |
| ----------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| path        | The location of the charm project.                                                               | The root of the repository.              |
| verbosity   | The build verbosity level, which can be set to "quiet", "brief", "verbose", "debug", or "trace". | `"verbose"`                              |
| channel     | The channel to install Charmcraft from.                                                          | The default snap channel for Charmcraft. |
| revision    | The revision of Charmcraft to install. Overrides the `channel` option.                           | `""`                                     |
| lxd-channel | The channel to install LXD from.                                                                 | The default snap channel for LXD.        |
| test        | Run `charmcraft test` to execute tests after packing.                                            | `false`                                  |

## Outputs

| Output              | Description                                                        | Example                                   |
| ------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| charms              | A space-delimited list of the names of the packed charm artifacts. | "foo_amd64_1.0.charm foo_arm64_1.0.charm" |
| charmcraft-revision | The Charmcraft revision used.                                      | `"123"`                                   |
| lxd-revision        | The LXD revision used.                                             | `"123"`                                   |
