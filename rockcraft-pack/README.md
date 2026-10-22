# `rockcraft-pack` (deprecated)

This legacy action installs and configures LXD and Rockcraft, then packs the rock project. It is deprecated; use
[`rockcraft/pack`](../rockcraft/pack/README.md) for new workflows.

## Usage

```yaml
steps:
  - uses: canonical/craft-actions/rockcraft-pack@v1
```

## Inputs

| Input             | Description                                                                                       | Default   |
| ----------------- | ------------------------------------------------------------------------------------------------- | --------- |
| path              | The location of the Rockcraft project.                                                            | `.`       |
| verbosity         | Pack verbosity: `quiet`, `brief`, `verbose`, `debug`, or `trace`.                                  | `verbose` |
| rockcraft-channel | The channel to install Rockcraft from.                                                            | `stable`  |
| revision          | The Rockcraft revision to install. Overrides `rockcraft-channel`.                                 | `""`      |
| test              | Run `rockcraft test` after packing.                                                                | `false`   |
| pro               | Ubuntu Pro services to enable when packing.                                                       | `""`      |
| ignore            | Bypass a restriction to use an unsupported feature, such as an unmaintained base.                 | `""`      |

## Outputs

| Output | Description                                        | Example |
| ------ | -------------------------------------------------- | ------- |
| rock   | The file names of packed rock artifacts, separated by spaces. | `foo_amd64_1.0.rock` |
