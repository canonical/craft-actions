# `imagecraft/pack`

Build an image with Imagecraft.

This action installs and configures LXD and Imagecraft before building an image project in the workspace.

## Usage

The `imagecraft/pack` action can be added to your repository's workflows with:

```yaml
jobs:
  # ...
  build-image:
    runs-on: ubuntu-latest
    steps:
      - uses: canonical/craft-actions/imagecraft/pack@v1
```

## Inputs

The behavior of the `imagecraft/pack` action can be customized with the following inputs:

| Input       | Description                                                                                      | Default                                  |
| ----------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| path        | The location of the image project.                                                               | The root of the repository.              |
| verbosity   | The build verbosity level, which can be set to "quiet", "brief", "verbose", "debug", or "trace". | `"debug"`                                |
| channel     | The channel to install Imagecraft from.                                                          | The default snap channel for Imagecraft. |
| revision    | The revision of Imagecraft to install. Overrides the `channel` option.                           | `""`                                     |
| lxd-channel | The channel to install LXD from.                                                                 | The default snap channel for LXD.        |

## Outputs

| Output              | Description                                              | Example                               |
| ------------------- | -------------------------------------------------------- | ------------------------------------- |
| images              | A space-delimited list of the names of the built images. | "foo_amd64_1.0.img foo_arm64_1.0.img" |
| imagecraft-revision | The Imagecraft revision used.                            | `"123"`                               |
| lxd-revision        | The LXD revision used.                                   | `"123"`                               |
