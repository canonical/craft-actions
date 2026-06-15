// -*- mode: javascript; js-indent-level: 2 -*-

import * as exec from '@actions/exec'
import * as build from '../src/rockcraft-pack'
import * as tools from '../src/tools'
import * as fs from 'fs'

afterEach(() => {
  jest.restoreAllMocks()
})

function mockSetup(user = 'ubuntu') {
  return {
    ensureSnapd: jest
      .spyOn(tools, 'ensureSnapd')
      .mockImplementation(async (): Promise<void> => {}),
    ensureLXD: jest
      .spyOn(tools, 'ensureLXD')
      .mockImplementation(async (): Promise<void> => {}),
    ensureCraftTool: jest
      .spyOn(tools, 'ensureCraftTool')
      .mockImplementation(async (): Promise<void> => {}),
    shellUser: jest
      .spyOn(tools, 'shellUser')
      .mockImplementation((): string => user),
    execMock: jest
      .spyOn(exec, 'exec')
      .mockImplementation(
        async (program: string, args?: string[]): Promise<number> => 0
      )
  }
}

function makeBuilder(
  overrides: Partial<build.RockcraftBuilderOptions> = {}
): build.RockcraftBuilder {
  return new build.RockcraftBuilder({
    projectRoot: '.',
    channel: 'stable',
    verbosity: '',
    revision: '',
    runTests: false,
    pro: '',
    ignore: '',
    ...overrides
  })
}

test('RockcraftBuilder.build can ignore unmaintained', async () => {
  expect.assertions(1)

  const {execMock} = mockSetup()
  jest
    .spyOn(tools, 'haveFlag')
    .mockImplementation(async (): Promise<boolean> => true)

  await makeBuilder({ignore: 'unmaintained', verbosity: 'trace'}).pack()

  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    [
      '--preserve-env',
      '--user',
      'ubuntu',
      'rockcraft',
      'pack',
      '--verbosity',
      'trace',
      '--ignore=unmaintained'
    ],
    {cwd: '.'}
  )
})

test('RockcraftBuilder.build fails if ignore flag is not supported', async () => {
  expect.assertions(1)

  mockSetup()
  jest
    .spyOn(tools, 'haveFlag')
    .mockImplementation(async (): Promise<boolean> => false)

  await expect(makeBuilder({ignore: 'unmaintained'}).pack()).rejects.toThrow(
    'This rockcraft version does not support --ignore.'
  )
})

test('RockcraftBuilder.pack fails if test is set to true and no spread.yaml is found', async () => {
  expect.assertions(1)

  mockSetup()
  jest.spyOn(tools, 'fileExists').mockImplementation((): boolean => false)

  await expect(
    makeBuilder({projectRoot: 'project-root', runTests: true}).pack()
  ).rejects.toThrow('Cannot run tests. Missing project-root/spread.yaml file.')
})

test('RockcraftBuilder.pack fails if test is set to true and rockcraft test is invalid', async () => {
  expect.assertions(1)

  mockSetup()
  jest
    .spyOn(tools, 'haveSubcommand')
    .mockImplementation(async (): Promise<boolean> => false)
  jest.spyOn(tools, 'fileExists').mockImplementation((): boolean => true)

  await expect(
    makeBuilder({projectRoot: 'project-root', runTests: true}).pack()
  ).rejects.toThrow('Cannot run tests. rockcraft test is not a valid command.')
})

