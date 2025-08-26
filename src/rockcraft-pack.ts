// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import * as tools from './tools'

const allowedVerbosity = ['quiet', 'brief', 'verbose', 'debug', 'trace']

interface RockcraftBuilderOptions {
  projectRoot: string
  rockcraftChannel: string
  rockcraftPackVerbosity: string
  rockcraftRevision: string
  runRockcraftTest: boolean
  buildPro: string
}

export class RockcraftBuilder {
  projectRoot: string
  rockcraftChannel: string
  rockcraftPackVerbosity: string
  rockcraftRevision: string
  runRockcraftTest: boolean
  buildPro: string

  constructor(options: RockcraftBuilderOptions) {
    this.projectRoot = tools.expandHome(options.projectRoot)
    this.rockcraftChannel = options.rockcraftChannel
    this.rockcraftRevision = options.rockcraftRevision
    this.runRockcraftTest = options.runRockcraftTest
    this.buildPro = options.buildPro

    if (allowedVerbosity.includes(options.rockcraftPackVerbosity)) {
      this.rockcraftPackVerbosity = options.rockcraftPackVerbosity
    } else {
      throw new Error(
        'Invalid verbosity "${options.rockcraftPackVerbosity}".' +
          'Allowed values are ${allowedVerbosity.join(", ")}.'
      )
    }
  }

  async pack(): Promise<void> {
    core.startGroup('Installing Rockcraft plus dependencies')
    await tools.ensureSnapd()
    await tools.ensureLXD()
    await tools.ensureRockcraft(this.rockcraftChannel, this.rockcraftRevision)
    core.endGroup()

    let rockcraft = 'rockcraft pack'
    let rockcraftPackArgs = ''

    if (this.runRockcraftTest) {
      const testFile = `${this.projectRoot}/spread.yaml`

      if (!tools.fileExists(testFile)) {
        throw new Error(`Cannot run tests. Missing ${testFile} file.`)
      } else if (!(await tools.haveRockcraftTest())) {
        throw new Error(
          'Cannot run tests. rockcraft test is not a valid command.'
        )
      } else {
        rockcraft = 'rockcraft test'
      }
    }

    if (this.buildPro) {
      if (!(await tools.haveProFlag())) {
        throw new Error(
          'Cannot build pro rock. This rockcraft version does not support pro.'
        )
      }
      if (!/^[a-z,-]+$/.test(this.buildPro)) {
        throw new Error('Malformed pro string')
      }
      rockcraftPackArgs = `${rockcraftPackArgs} --pro=${this.buildPro}`
    }

    if (this.rockcraftPackVerbosity) {
      rockcraftPackArgs = `${rockcraftPackArgs} --verbosity ${this.rockcraftPackVerbosity}`
    }

    rockcraft = `${rockcraft} ${rockcraftPackArgs.trim()}`
    await exec.exec(
      'sudo',
      ['--preserve-env', '--user', tools.shellUser(), ...rockcraft.split(' ')],
      {
        cwd: this.projectRoot
      }
    )
  }

  // This wrapper is for the benefit of the tests, due to the crazy
  // typing of fs.promises.readdir()
  async #readdir(dir: string): Promise<string[]> {
    return await fs.promises.readdir(dir)
  }

  async outputRock(): Promise<string> {
    const files = await this.#readdir(this.projectRoot)
    const rocks = files.filter(name => name.endsWith('.rock'))

    if (rocks.length === 0) {
      throw new Error('No .rock files produced by build')
    }
    if (rocks.length > 1) {
      core.warning(`Multiple rocks found in ${this.projectRoot}`)
    }
    return path.join(this.projectRoot, rocks[0])
  }
}
