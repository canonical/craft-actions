[![Tests](https://github.com/canonical/craft-actions/actions/workflows/test.yml/badge.svg)](https://github.com/canonical/craft-actions/actions/workflows/test.yml)

# Craft Actions

A collection of GitHub actions for testing, packing, and distributing software with the craft apps.

To use these actions, pin them to the latest release, `@v1`. The `main` branch is being used for active
development and may introduce breaking changes at any time.

## Snap actions

- [Set up Snapcraft](snapcraft/setup/README.md)
- [Pack a snap](snapcraft/pack/README.md)

## Rock actions

- [Set up Rockcraft](rockcraft/setup/README.md)
- [Pack a rock](rockcraft/pack/README.md)

## Charm actions

- [Set up Charmcraft](charmcraft/setup/README.md)
- [Pack a charm](charmcraft/pack/README.md)

## Image actions

- [Set up Imagecraft](imagecraft/setup/README.md)
- [Pack an image](imagecraft/pack/README.md)

## Using packed artifacts in publish workflows

The pack actions create local artifacts; they do not publish them to stores or registries. Use a later workflow
job to publish them, and pass them between jobs with workflow artifacts. For example, after packing a snap:

```yaml
jobs:
  pack:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: canonical/craft-actions/snapcraft/pack@v1
        with:
          path: dist
      - uses: actions/upload-artifact@v7
        with:
          name: snap
          path: dist/*.snap

  publish:
    needs: pack
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v7
        with:
          name: snap
      # Add the appropriate authenticated publishing command for your destination.
```

Use the output names documented on each pack action when you need to reference its artifact paths in a workflow.

## Deprecated actions

- [Pack a rock with the legacy `rockcraft-pack` action](rockcraft-pack/README.md). Use
  [`rockcraft/pack`](rockcraft/pack/README.md) for new workflows.

## Community and support

You can report any issues or bugs on the project's [GitHub repository](https://github.com/canonical/craft-actions/issues).

Craft Actions is covered by the [Ubuntu Code of Conduct](https://ubuntu.com/community/ethos/code-of-conduct).

## Contribute to Craft Actions

Craft Actions is open source and part of the Canonical family. We would love your help.

If you're interested, start with the [contribution guide](CONTRIBUTING.md).

We welcome any suggestions and help with the docs. The [Canonical Open Documentation Academy](https://github.com/canonical/open-documentation-academy)
is the hub for doc development, including Craft Actions docs. No prior coding experience is required.

## License and copyright

Craft Actions is released under the [GPL-3.0 license](LICENSE).

© 2022-2026 Canonical Ltd.
