// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {readBaseInputs, runPackAction} from '../src/pack-action'
import {CraftBuilder} from '../src/craft-builder'

afterEach(() => {
  jest.restoreAllMocks()
})

function mockInputs(inputs: Record<string, string>) {
  jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
    return inputs[name] ?? ''
  })
}

// Minimal stub matching the CraftBuilder interface needed by runPackAction.
function makeStubBuilder(
  overrides: Partial<{
    toolName: string
    channel: string
    revision: string
    pack: () => Promise<void>
    outputArtifact: () => Promise<string>
  }> = {}
) {
  return {
    toolName: 'test-tool',
    channel: 'stable',
    revision: '',
    pack: jest.fn(async () => {}),
    outputArtifact: jest.fn(async () => 'project-root/output.charm'),
    ...overrides
  } as unknown as CraftBuilder
}

// readBaseInputs

test('readBaseInputs reads standard inputs', () => {
  mockInputs({
    path: 'my-project',
    channel: 'edge',
    revision: '42',
    verbosity: 'debug',
    pro: 'esm-apps',
    test: 'true'
  })

  expect(readBaseInputs()).toEqual({
    projectRoot: 'my-project',
    channel: 'edge',
    revision: '42',
    verbosity: 'debug',
    pro: 'esm-apps',
    runTests: true
  })
})

test('readBaseInputs defaults channel to stable when empty', () => {
  mockInputs({path: '.'})

  expect(readBaseInputs()).toMatchObject({channel: 'stable'})
})

test('readBaseInputs uses a custom channel input name', () => {
  mockInputs({'rockcraft-channel': 'candidate'})

  expect(readBaseInputs('rockcraft-channel')).toMatchObject({
    channel: 'candidate'
  })
})

test('readBaseInputs parses runTests as false when input is not "true"', () => {
  mockInputs({test: 'false'})

  expect(readBaseInputs()).toMatchObject({runTests: false})
})

// runPackAction

test('runPackAction calls pack and sets output', async () => {
  expect.assertions(2)

  const setOutput = jest.spyOn(core, 'setOutput').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  const builder = makeStubBuilder({revision: '1'})

  await runPackAction(builder, 'charm')

  expect(builder.pack).toHaveBeenCalled()
  expect(setOutput).toHaveBeenCalledWith('charm', 'project-root/output.charm')
})

test('runPackAction logs info when revision is not set', async () => {
  expect.assertions(1)

  const info = jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'setOutput').mockImplementation(() => {})
  const builder = makeStubBuilder({revision: ''})

  await runPackAction(builder, 'charm')

  expect(info).toHaveBeenCalled()
})

test('runPackAction does not log info when revision is set', async () => {
  expect.assertions(1)

  const info = jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'setOutput').mockImplementation(() => {})
  const builder = makeStubBuilder({revision: '42'})

  await runPackAction(builder, 'charm')

  expect(info).not.toHaveBeenCalled()
})

test('runPackAction calls setFailed on error', async () => {
  expect.assertions(1)

  const setFailed = jest.spyOn(core, 'setFailed').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  const builder = makeStubBuilder({
    revision: '1',
    pack: jest.fn(async () => {
      throw new Error('pack failed')
    })
  })

  await runPackAction(builder, 'charm')

  expect(setFailed).toHaveBeenCalledWith('pack failed')
})
