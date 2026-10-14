# `snapcraft/pack`

Pack a snap with Snapcraft.

This action installs and configures LXD and Snapcraft before packing a snap project in the workspace.

## Usage

The `snapcraft/pack` action can be added to your repository's workflows with:

```yaml
jobs:
  # ...
  pack-snap:
    runs-on: ubuntu-latest
    steps:
      - uses: canonical/craft-actions/snapcraft/pack@v1
```

## Inputs

The behavior of the `snapcraft/pack` action can be customized with the following inputs:

| Input       | Description                                                                                      | Default                                 |
| ----------- | ------------------------------------------------------------------------------------------------ | --------------------------------------- |
| path        | The location of the snap project.                                                                | The root of the repository.             |
| verbosity   | The build verbosity level, which can be set to "quiet", "brief", "verbose", "debug", or "trace". | `"verbose"`                             |
| channel     | The channel to install Snapcraft from.                                                           | The default snap channel for Snapcraft. |
| revision    | The revision of Snapcraft to install. Overrides the `channel` option.                            | `""`                                    |
| lxd-channel | The channel to install LXD from.                                                                 | The default snap channel for LXD.       |
| test        | Run `snapcraft test` to execute tests after packing.                                             | `false`                                 |

## Outputs

| Output             | Description                                                       | Example                                 |
| ------------------ | ----------------------------------------------------------------- | --------------------------------------- |
| snaps              | A space-delimited list of the names of the packed snap artifacts. | "foo_amd64_1.0.snap foo_arm64_1.0.snap" |
| components         | A space-delimited list of the names of the packed components.     | "foo+comp_1.0.comp"                     |
| snapcraft-revision | The Snapcraft revision used.                                      | `"123"`                                 |
| lxd-revision       | The LXD revision used.                                            | `"123"`                                 |
