[![Test the action](https://github.com/canonical/craft-actions/actions/workflows/test.yml/badge.svg)](https://github.com/canonical/craft-actions/actions/workflows/test.yml)

# Craft Actions

This project contains custom GitHub actions for Craft Applications, such as:

- [Charmcraft](https://juju.is/)
- [Snapcraft](https://snapcraft.io/)
- [Rockcraft](https://canonical-rockcraft.readthedocs-hosted.com/en/latest/)

The following sections will break down the different actions available in this
repository and how to use them.

## rockcraft-pack

Can be used to build a ROCK (with Rockcraft). It expects a "rockcraft.yaml" file
to exist in its execution path.

### Usage

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/rockcraft-pack@main
```

This will install and configure LXD and Rockcraft, and then invoke `rockcraft`
to build a new ROCK, based on a "rockcraft.yaml" file located in the root of
the workingspace.

You can also upload the resulting ROCK as a GitHub artifact as follows:

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/rockcraft-pack@main
    id: rockcraft
  - uses: actions/upload-artifact@v3
    with:
      name: rock
      path: ${{ steps.rockcraft.outputs.rock }}
```

Additionally, the following steps will already have Rockcraft available for
direct invocation through the shell.

#### Inputs

##### `path`

If your Rockcraft project ("rockcraft.yaml") is not located in the root of the
workspace, you can specify an alternative location via the `path` input
parameter.

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/rockcraft-pack@main
    with:
      path: path/to/rockcraft/project/
```

##### `verbosity`

This `verbosity` input parameter can be used to set the build verbosity level to one of 'quiet', 'brief', 'verbose', 'debug' or 'trace' (the default).

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: canonical/craft-actions/rockcraft-pack@main
    with:
      verbosity: debug
```

---

## Committing code

Please follow these guidelines when committing code for this project:

- Use a topic with a colon to start the subject
- Separate subject from body with a blank line
- Limit the subject line to 50 characters
- Do not capitalize the subject line
- Do not end the subject line with a period
- Use the imperative mood in the subject line
- Wrap the body at 72 characters
- Use the body to explain what and why (instead of how)
