// -*- mode: javascript; js-indent-level: 2 -*-

import {build} from 'esbuild'

const entryPoints = ['src/rockcraft-pack-action.ts']

await build({
  entryPoints,
  platform: 'node',
  target: 'node24',
  bundle: true,
  entryNames: '[name]/index',
  outdir: 'dist'
})
