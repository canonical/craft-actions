// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {RockcraftBuilder} from './rockcraft-pack'

async function run(): Promise<void> {
  try {
    const projectRoot = core.getInput('path')
    core.info(`Building rock in "${projectRoot}"...`)
    const rockcraftRevision = core.getInput('revision') || ''
    const additionalOpts = core.getInput('additional-options') || ''
    const rockcraftChannel = core.getInput('rockcraft-channel') || 'stable'
    const runRockcraftTest = core.getInput('test').toLowerCase() === 'true'
    if (rockcraftRevision.length < 1) {
      core.warning(
        `Rockcraft revision not provided. Installing from ${rockcraftChannel}`
      )
    }
    const rockcraftPackVerbosity = core.getInput('verbosity')

    const builder = new RockcraftBuilder({
      projectRoot,
      rockcraftChannel,
      rockcraftPackVerbosity,
      rockcraftRevision,
      runRockcraftTest,
      additionalOpts
    })
    await builder.pack()
    const rock = await builder.outputRock()
    core.setOutput('rock', rock)
  } catch (error) {
    core.setFailed((error as Error)?.message)
  }
}

void run()
