// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {RockcraftBuilder} from './rockcraft-pack'

async function run(): Promise<void> {
  try {
    const projectRoot = core.getInput('path')
    core.info(`Building rock in "${projectRoot}"...`)
    const rockcraftRevision = core.getInput('revision')
    const rockcraftChannel = core.getInput('rockcraft-channel') || 'stable'
    if (rockcraftRevision.length < 1) {
      core.warning(
        `Rockcraft revision not provided. Installing from ${rockcraftChannel}`
      )
    }
    const rockcraftPackVerbosity = core.getInput('verbosity')
    const lxdChannel = core.getInput('lxd-channel') || 'stable'

    const builder = new RockcraftBuilder({
      projectRoot,
      rockcraftChannel,
      rockcraftPackVerbosity,
      rockcraftRevision,
      lxdChannel
    })
    await builder.pack()
    const rock = await builder.outputRock()
    core.setOutput('rock', rock)
  } catch (error) {
    core.setFailed((error as Error)?.message)
  }
}

void run()
