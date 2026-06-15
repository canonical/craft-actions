// -*- mode: javascript; js-indent-level: 2 -*-

import * as tools from './tools'
import {CraftBuilder, CraftBuilderOptions} from './craft-builder'

export interface RockcraftBuilderOptions extends CraftBuilderOptions {
  ignore: string
}

export class RockcraftBuilder extends CraftBuilder {
  toolName = 'rockcraft'
  artifactType = '.rock'
  ignore: string

  constructor(options: RockcraftBuilderOptions) {
    super(options)
    this.ignore = options.ignore
  }

  protected async buildPackArgs(): Promise<string[]> {
    const args = await super.buildPackArgs()

    if (this.ignore) {
      tools.validateArgument(this.ignore, 'ignore')
      if (!(await tools.haveFlag(this.toolName, '--ignore'))) {
        throw new Error(
          `This ${this.toolName} version does not support --ignore.`
        )
      }
      args.push(`--ignore=${this.ignore}`)
    }

    return args
  }
}
