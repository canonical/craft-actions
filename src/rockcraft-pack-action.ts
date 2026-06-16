// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {RockcraftBuilder} from './rockcraft-pack'
import {readBaseInputs, runPackAction} from './pack-action'

const builder = new RockcraftBuilder({
  ...readBaseInputs('rockcraft-channel'),
  ignore: core.getInput('ignore')
})

void runPackAction(builder, 'rock')
