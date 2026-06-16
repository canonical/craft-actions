// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import * as tools from './tools'

export const allowedVerbosity = ['quiet', 'brief', 'verbose', 'debug', 'trace']

export interface CraftBuilderOptions {
  projectRoot: string
  channel: string
  revision: string
  verbosity: string
  pro?: string
  runTests?: boolean
}

export abstract class CraftBuilder {
  projectRoot: string
  channel: string
  revision: string
  verbosity: string
  pro: string
  runTests: boolean

  abstract toolName: string
  abstract artifactType: string

  constructor(options: CraftBuilderOptions) {
    this.projectRoot = tools.expandHome(options.projectRoot)
    this.channel = options.channel
    this.revision = options.revision
    this.pro = options.pro ?? ''
    this.runTests = options.runTests ?? false

    if (!options.verbosity || allowedVerbosity.includes(options.verbosity)) {
      this.verbosity = options.verbosity ?? ''
    } else {
      throw new Error(
        `Invalid verbosity "${options.verbosity}". ` +
          `Allowed values are ${allowedVerbosity.join(', ')}.`
      )
    }
  }

  protected async buildPackArgs(): Promise<string[]> {
    const args: string[] = []

    if (this.pro) {
      tools.validateArgument(this.pro, 'pro')
      if (!(await tools.haveFlag(this.toolName, '--pro'))) {
        throw new Error(`This ${this.toolName} version does not support --pro.`)
      }
      args.push(`--pro=${this.pro}`)
    }

    if (this.verbosity) {
      tools.validateArgument(this.verbosity, 'verbosity')
      args.push('--verbosity', this.verbosity)
    }

    return args
  }

  protected async doPack(subcommand: 'pack' | 'test'): Promise<void> {
    const packArgs = await this.buildPackArgs()
    await exec.exec(
      'sudo',
      [
        '--preserve-env',
        '--user',
        tools.shellUser(),
        this.toolName,
        subcommand,
        ...packArgs
      ],
      {cwd: this.projectRoot}
    )
  }

  private async resolvePackSubcommand(): Promise<'pack' | 'test'> {
    if (!this.runTests) return 'pack'

    const testFile = `${this.projectRoot}/spread.yaml`
    if (!tools.fileExists(testFile)) {
      throw new Error(`Cannot run tests. Missing ${testFile} file.`)
    }
    if (!(await tools.haveSubcommand(this.toolName, 'test'))) {
      throw new Error(
        `Cannot run tests. ${this.toolName} test is not a valid command.`
      )
    }
    return 'test'
  }

  async pack(): Promise<void> {
    core.startGroup(`Installing ${this.toolName} plus dependencies`)
    await tools.ensureSnapd()
    await tools.ensureLXD(!!this.pro)
    await tools.ensureCraftTool(this.toolName, this.channel, this.revision)
    core.endGroup()
    await this.doPack(await this.resolvePackSubcommand())
  }

  async #readdir(dir: string): Promise<string[]> {
    return await fs.promises.readdir(dir)
  }

  async findArtifacts(extension: string): Promise<string[]> {
    const files = await this.#readdir(this.projectRoot)
    const artifacts = files
      .filter(name => name.endsWith(extension))
      .map(name => path.join(this.projectRoot, name))

    if (artifacts.length === 0) {
      throw new Error(`No ${extension} files produced by build`)
    }
    return artifacts
  }
}
