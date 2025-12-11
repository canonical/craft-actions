# get-snap-revision

Get the revision number of an installed snap in your workflow.

## Usage

### Get the revision of a snap

```yaml
# See the 'Details' section below for an explanation of this workaround
- name: Set up workaround
  uses: actions/checkout@v6
  env: 
    GITHUB_REF: ${{ github.action_ref }}
  with:
    repository: 'canonical/craft-actions'
    ref: ${{ env.GITHUB_REF }}
    path: _tmp_craft-actions
    sparse-checkout: |
      _common/
      
- uses: ./_tmp_craft-actions/_common/get-snap-revision
  name: Get Snapcraft revision
  id: snapcraft-revision
  with:
    snap: 'snapcraft'
    
- shell: bash
  run: |
    rm -rf ./_tmp_craft-actions
```

### Inputs

```yaml
- name: canonical/craft-actions/_common/get-snap-revision@main
  with:
    # The snap to inspect.
    # This input is required.
    snap:
```

### Outputs
- `revision`: The revision number of the inspected snap.

## Details

Some Craft Actions reference one another. To make sure that `craft-actions/A@work/fix-bug` calls
`craft-actions/B@work/fix-bug` instead of `craft-actions/B@main`, the current repository reference
needs to be reused. Due to certain [limitations of GitHub Actions](https://github.com/actions/runner/issues/895),
this is not possible using contexts such as `${{ github.action_ref }}`.

For additional context, refer to [this comment](https://github.com/canonical/craft-actions/pull/45#discussion_r2586507869).
