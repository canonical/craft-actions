# Contributing to Craft Actions

Craft Actions welcomes fixes, tests, and documentation improvements. This guide covers the pnpm workflow used in this repository.

## Review the project expectations

Please follow the [Ubuntu Code of Conduct](https://ubuntu.com/community/ethos/code-of-conduct) and review the [Canonical Contributor License Agreement](https://ubuntu.com/legal/contributors) before contributing. Craft Actions is licensed under [GPL-3.0](LICENSE).

Check the [issue tracker](https://github.com/canonical/craft-actions/issues) before starting work. If an issue already covers your change, check its comments and linked pull requests to avoid duplicating someone else's work. For a larger change, discuss the approach with the maintainers first.

## Set up for development

Fork the repository and clone your fork. Add the Canonical repository as `upstream`, then create a branch from the latest `main`:

```sh
git clone https://github.com/<your-username>/craft-actions.git
cd craft-actions
git remote add upstream https://github.com/canonical/craft-actions.git
git fetch upstream
git switch -c issue-<number>-<short-description> upstream/main
```

Use Node.js 26, as in the [CI workflow](.github/workflows/test.yaml), and the pnpm version declared in `package.json`. Install the workspace dependencies with:

```sh
pnpm install
```

The workspace packages live under `common/`, `charmcraft/`, `imagecraft/`, `rockcraft/`, and `snapcraft/`. Each action has its own README. Start with the package relevant to your change.

## Make and check a change

Keep a pull request focused on one issue. Add or update tests for behavior changes, and update an action's README when its inputs, outputs, or usage change.

Run the checks used by CI:

```sh
pnpm run format-check
pnpm run lint
pnpm run test
pnpm run build
```

The build produces checked-in action bundles. If it changes them, review and commit the generated files with your source change. After committing, run `pnpm run build` and `git diff --exit-code` again to confirm the bundles match the source.

## Open a pull request

Commit your work on the topic branch and push it to your fork. Link the issue in the pull request, explain the behavior you changed, and include the relevant checks you ran. The `main` branch is for active development, so base your pull request on the current upstream `main`.

Respond to review comments on the same pull request and keep its branch up to date with upstream changes that affect your work.
