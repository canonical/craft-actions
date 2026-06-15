// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {RockcraftBuilder} from './rockcraft-pack'

async function run(): Promise<void> {
  try {
    const projectRoot = core.getInput('path')
    core.info(`Building rock in "${projectRoot}"...`)
    const pro = core.getInput('pro') || ''
    const rockcraftRevision = core.getInput('revision') || ''
    const rockcraftChannel = core.getInput('rockcraft-channel') || 'stable'
    const runTests = core.getInput('test').toLowerCase() === 'true'
    const ignore = core.getInput('ignore')
    if (rockcraftRevision.length < 1) {
      core.warning(
        `Rockcraft revision not provided. Installing from ${rockcraftChannel}`
      )
    }
    const rockcraftPackVerbosity = core.getInput('verbosity')

    const builder = new RockcraftBuilder({
      projectRoot,
      channel: rockcraftChannel,
      verbosity: rockcraftPackVerbosity,
      revision: rockcraftRevision,
      runTests,
      pro,
      ignore
    })
    await builder.pack()
    const rock = await builder.outputArtifact()
    core.setOutput('rock', rock)
  } catch (error) {
    core.setFailed((error as Error)?.message)
  }
}

void run()
