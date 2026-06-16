// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {CraftBuilder, CraftBuilderOptions} from './craft-builder'

export function readBaseInputs(channelInput = 'channel'): CraftBuilderOptions {
  return {
    projectRoot: core.getInput('path'),
    channel: core.getInput(channelInput) || 'stable',
    revision: core.getInput('revision') || '',
    verbosity: core.getInput('verbosity'),
    pro: core.getInput('pro') || '',
    runTests: core.getInput('test').toLowerCase() === 'true'
  }
}

export async function runPackAction(
  builder: CraftBuilder,
  outputName: string
): Promise<void> {
  try {
    if (!builder.revision) {
      core.info(
        `${builder.toolName} revision not provided. Installing from ${builder.channel}`
      )
    }
    await builder.pack()
    core.setOutput(outputName, await builder.outputArtifact())
  } catch (error) {
    core.setFailed((error as Error)?.message)
  }
}
