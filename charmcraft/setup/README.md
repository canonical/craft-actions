# `charmcraft/setup`

Install and configure Charmcraft, with LXD as the build provider. This action is useful in situations where
you need Charmcraft installed, but don't wish to run a full action such as "pack".

## Usage

The `charmcraft/setup` action can be added to your repository's workflows with:

```yaml
jobs:
  # ...
  setup-charmcraft:
    runs-on: ubuntu-latest
    steps:
      - uses: canonical/craft-actions/charmcraft/setup@v1
```

## Inputs

The behavior of the `charmcraft/setup` action can be customized with the following inputs:

| Input       | Description                                                            | Default                                  |
| ----------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| channel     | The channel to install Charmcraft from.                                | The default snap channel for Charmcraft. |
| revision    | The revision of Charmcraft to install. Overrides the `channel` option. | `""`                                     |
| lxd-channel | The channel to install LXD from.                                       | The default snap channel for LXD.        |

## Outputs

| Output              | Description                   | Example |
| ------------------- | ----------------------------- | ------- |
| charmcraft-revision | The Charmcraft revision used. | `"123"` |
| lxd-revision        | The LXD revision used.        | `"123"` |
