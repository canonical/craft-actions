# `rockcraft/pack`

Pack a rock with Rockcraft.

This action installs and configures LXD and Rockcraft before packing a rock project in the workspace.

## Usage

The `rockcraft/pack` action can be added to your repository's workflows with:

```yaml
jobs:
  # ...
  pack-rock:
    runs-on: ubuntu-latest
    steps:
      - uses: canonical/craft-actions/rockcraft/pack@v1
```

## Inputs

The behavior of the `rockcraft/pack` action can be customized with the following inputs:

| Input       | Description                                                                                      | Default                                 |
| ----------- | ------------------------------------------------------------------------------------------------ | --------------------------------------- |
| path        | The location of the rock project.                                                                | The root of the repository.             |
| verbosity   | The build verbosity level, which can be set to "quiet", "brief", "verbose", "debug", or "trace". | `"verbose"`                             |
| channel     | The channel to install Rockcraft from.                                                           | The default snap channel for Rockcraft. |
| revision    | The revision of Rockcraft to install. Overrides the `channel` option.                            | `""`                                    |
| lxd-channel | The channel to install LXD from.                                                                 | The default snap channel for LXD.       |
| test        | Run `rockcraft test` to execute tests after packing.                                             | `false`                                 |
| pro         | The Ubuntu Pro services to enable when packing the rock.                                         | `""`                                    |
| ignore      | Bypass a restriction to use an unsupported feature.                                              | `""`                                    |

## Outputs

| Output             | Description                                                       | Example                                 |
| ------------------ | ----------------------------------------------------------------- | --------------------------------------- |
| rocks              | A space-delimited list of the names of the packed rock artifacts. | "foo_amd64_1.0.rock foo_arm64_1.0.rock" |
| rockcraft-revision | The Rockcraft revision used.                                      | `"123"`                                 |
| lxd-revision       | The LXD revision used.                                            | `"123"`                                 |
