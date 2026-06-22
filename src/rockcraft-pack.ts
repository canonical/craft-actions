// -*- mode: javascript; js-indent-level: 2 -*-

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
      args.push(`--ignore=${this.ignore}`)
    }

    return args
  }
}
