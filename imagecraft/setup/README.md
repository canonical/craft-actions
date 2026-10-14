# `imagecraft/setup`

Install and configure Imagecraft, with LXD as the build provider. This action is useful in situations where
you need Imagecraft installed, but don't wish to run a full action such as "pack".

## Usage

The `imagecraft/setup` action can be added to your repository's workflows with:

```yaml
jobs:
  # ...
  setup-imagecraft:
    runs-on: ubuntu-latest
    steps:
      - uses: canonical/craft-actions/imagecraft/setup@v1
```

## Inputs

The behavior of the `imagecraft/setup` action can be customized with the following inputs:

| Input       | Description                                                            | Default                                  |
| ----------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| channel     | The channel to install Imagecraft from.                                | The default snap channel for Imagecraft. |
| revision    | The revision of Imagecraft to install. Overrides the `channel` option. | `""`                                     |
| lxd-channel | The channel to install LXD from.                                       | The default snap channel for LXD.        |

## Outputs

| Output              | Description                   | Example |
| ------------------- | ----------------------------- | ------- |
| imagecraft-revision | The Imagecraft revision used. | `"123"` |
| lxd-revision        | The LXD revision used.        | `"123"` |
