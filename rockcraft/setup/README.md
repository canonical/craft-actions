# `rockcraft/setup`

Install and configure Rockcraft, with LXD as the build provider. This action is useful in situations where
you need Rockcraft installed, but don't wish to run a full action such as "pack".

## Usage

The `rockcraft/setup` action can be added to your repository's workflows with:

```yaml
jobs:
  # ...
  setup-rockcraft:
    runs-on: ubuntu-latest
    steps:
      - uses: canonical/craft-actions/rockcraft/setup@v1
```

## Inputs

The behavior of the `rockcraft/setup` action can be customized with the following inputs:

| Input       | Description                                                           | Default                                 |
| ----------- | --------------------------------------------------------------------- | --------------------------------------- |
| channel     | The channel to install Rockcraft from.                                | The default snap channel for Rockcraft. |
| revision    | The revision of Rockcraft to install. Overrides the `channel` option. | `""`                                    |
| lxd-channel | The channel to install LXD from.                                      | The default snap channel for LXD.       |

## Outputs

| Output             | Description                  | Example |
| ------------------ | ---------------------------- | ------- |
| rockcraft-revision | The Rockcraft revision used. | `"123"` |
| lxd-revision       | The LXD revision used.       | `"123"` |
