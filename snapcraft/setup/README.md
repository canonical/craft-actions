# `snapcraft/setup`

Install and configure Snapcraft, with LXD as the build provider. This action is useful in situations where
you need Snapcraft installed, but don't wish to run a full action such as "pack".

## Usage

The `snapcraft/setup` action can be added to your repository's workflows with:

```yaml
jobs:
  # ...
  setup-snapcraft:
    runs-on: ubuntu-latest
    steps:
      - uses: canonical/craft-actions/snapcraft/setup@v1
```

## Inputs

The behavior of the `snapcraft/setup` action can be customized with the following inputs:

| Input       | Description                                                           | Default                                 |
| ----------- | --------------------------------------------------------------------- | --------------------------------------- |
| channel     | The channel to install Snapcraft from.                                | The default snap channel for Snapcraft. |
| revision    | The revision of Snapcraft to install. Overrides the `channel` option. | `""`                                    |
| lxd-channel | The channel to install LXD from.                                      | The default snap channel for LXD.       |

## Outputs

| Output             | Description                  | Example |
| ------------------ | ---------------------------- | ------- |
| snapcraft-revision | The Snapcraft revision used. | `"123"` |
| lxd-revision       | The LXD revision used.       | `"123"` |
