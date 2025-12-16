[![Tests](https://github.com/canonical/craft-actions/actions/workflows/test.yml/badge.svg)](https://github.com/canonical/craft-actions/actions/workflows/test.yml)

# Craft Actions

This monorepo contains GitHub actions for setting up craft tools and packing their artifacts.

## Contents

Actions related to snaps and [Snapcraft](https://snapcraft.io/):

- [Package a snap](snapcraft/pack/README.md), for installing Snapcraft in the environment and packing a snap.
- [Set up Snapcraft](snapcraft/setup/README.md), for installing Snapcraft in the environment.

Actions related to rocks and [Rockcraft](https://documentation.ubuntu.com/rockcraft/stable):

- [Package a rock](rockcraft-pack/README.md), for installing Rockcraft in the environment and packing a rock.

Actions related to charms and [Charmcraft](https://juju.is/):

- [Package a charm](charmcraft/pack/README.md), for installing Charmcraft in the environment and packing a charm.
- [Set up Charmcraft](charmcraft/setup/README.md), for installing Charmcraft in the environment.

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
