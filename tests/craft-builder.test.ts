// -*- mode: javascript; js-indent-level: 2 -*-

import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as exec from '@actions/exec'
import {CraftBuilder, CraftBuilderOptions} from '../src/craft-builder'
import * as tools from '../src/tools'

class TestBuilder extends CraftBuilder {
  toolName = 'test-tool'
  artifactType = '.charm'
}

function makeBuilder(
  overrides: Partial<CraftBuilderOptions> = {}
): TestBuilder {
  return new TestBuilder({
    projectRoot: '.',
    channel: 'stable',
    verbosity: '',
    revision: '',
    ...overrides
  })
}

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

afterEach(() => {
  jest.restoreAllMocks()
})

test('CraftBuilder expands tilde in project root', () => {
  expect(makeBuilder({projectRoot: '~'}).projectRoot).toBe(os.homedir())
  expect(makeBuilder({projectRoot: '~/foo/bar'}).projectRoot).toBe(
    path.join(os.homedir(), 'foo/bar')
  )
})

test('CraftBuilder throws on invalid verbosity', async () => {
  expect.assertions(1)

  mockSetup()

  await expect(makeBuilder({verbosity: 'not-valid'}).pack()).rejects.toThrow()
})

test('CraftBuilder allows empty verbosity', () => {
  expect(() => makeBuilder({verbosity: ''})).not.toThrow()
})

test('CraftBuilder.pack calls ensureSnapd, ensureLXD, and ensureCraftTool', async () => {
  expect.assertions(3)

  const {ensureSnapd, ensureLXD, ensureCraftTool} = mockSetup()

  await makeBuilder().pack()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureLXD).toHaveBeenCalled()
  expect(ensureCraftTool).toHaveBeenCalled()
})

test('CraftBuilder.pack passes channel to ensureCraftTool', async () => {
  expect.assertions(1)

  const {ensureCraftTool} = mockSetup()

  await makeBuilder({channel: 'test-channel', revision: ''}).pack()

  expect(ensureCraftTool).toHaveBeenCalledWith('test-tool', 'test-channel', '')
})

test('CraftBuilder.pack passes revision to ensureCraftTool', async () => {
  expect.assertions(1)

  const {ensureCraftTool} = mockSetup()

  await makeBuilder({revision: '42'}).pack()

  expect(ensureCraftTool).toHaveBeenCalledWith('test-tool', 'stable', '42')
})

test('CraftBuilder.pack calls ensureLXD without pro when pro is not set', async () => {
  expect.assertions(1)

  const {ensureLXD} = mockSetup()

  await makeBuilder().pack()

  expect(ensureLXD).toHaveBeenCalledWith(false)
})

test('CraftBuilder.pack calls ensureLXD with pro when pro is set', async () => {
  expect.assertions(1)

  const {ensureLXD} = mockSetup()
  jest
    .spyOn(tools, 'haveFlag')
    .mockImplementation(async (): Promise<boolean> => true)

  await makeBuilder({pro: 'esm-apps'}).pack()

  expect(ensureLXD).toHaveBeenCalledWith(true)
})

test('CraftBuilder.pack executes the correct base command', async () => {
  expect.assertions(1)

  const {execMock} = mockSetup()

  await makeBuilder({projectRoot: 'my-dir'}).pack()

  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    ['--preserve-env', '--user', 'ubuntu', 'test-tool', 'pack'],
    {cwd: 'my-dir'}
  )
})

test('CraftBuilder.pack executes test subcommand when runTests is true', async () => {
  expect.assertions(1)

  const {execMock} = mockSetup()
  jest.spyOn(tools, 'fileExists').mockReturnValue(true)
  jest
    .spyOn(tools, 'haveSubcommand')
    .mockImplementation(async (): Promise<boolean> => true)

  await makeBuilder({projectRoot: 'my-dir', runTests: true}).pack()

  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    ['--preserve-env', '--user', 'ubuntu', 'test-tool', 'test'],
    {cwd: 'my-dir'}
  )
})

test('CraftBuilder.pack fails when runTests is true and no spread.yaml is found', async () => {
  expect.assertions(1)

  mockSetup()
  jest.spyOn(tools, 'fileExists').mockReturnValue(false)

  await expect(
    makeBuilder({projectRoot: 'project-root', runTests: true}).pack()
  ).rejects.toThrow('Cannot run tests. Missing project-root/spread.yaml file.')
})

test('CraftBuilder.pack fails when runTests is true and tool has no test subcommand', async () => {
  expect.assertions(1)

  mockSetup()
  jest.spyOn(tools, 'fileExists').mockReturnValue(true)
  jest
    .spyOn(tools, 'haveSubcommand')
    .mockImplementation(async (): Promise<boolean> => false)

  await expect(makeBuilder({runTests: true}).pack()).rejects.toThrow(
    'Cannot run tests. test-tool test is not a valid command.'
  )
})

test('CraftBuilder.pack includes --verbosity flag when verbosity is set', async () => {
  expect.assertions(1)

  const {execMock} = mockSetup()

  await makeBuilder({verbosity: 'debug'}).pack()

  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    expect.arrayContaining(['--verbosity', 'debug']),
    expect.anything()
  )
})

test('CraftBuilder.pack omits --verbosity flag when verbosity is empty', async () => {
  expect.assertions(1)

  const {execMock} = mockSetup()

  await makeBuilder({verbosity: ''}).pack()

  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    expect.not.arrayContaining(['--verbosity']),
    expect.anything()
  )
})

test('CraftBuilder.pack includes --pro flag when pro is set', async () => {
  expect.assertions(1)

  const {execMock} = mockSetup()
  jest
    .spyOn(tools, 'haveFlag')
    .mockImplementation(async (): Promise<boolean> => true)

  await makeBuilder({pro: 'esm-apps,esm-infra'}).pack()

  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    expect.arrayContaining(['--pro=esm-apps,esm-infra']),
    expect.anything()
  )
})

test('CraftBuilder.pack fails when pro flag is not supported by tool', async () => {
  expect.assertions(1)

  mockSetup()
  jest
    .spyOn(tools, 'haveFlag')
    .mockImplementation(async (): Promise<boolean> => false)

  await expect(makeBuilder({pro: 'fips-updates'}).pack()).rejects.toThrow(
    'This test-tool version does not support --pro.'
  )
})

test('CraftBuilder.pack fails when pro argument is invalid', async () => {
  expect.assertions(1)

  mockSetup()
  jest
    .spyOn(tools, 'haveFlag')
    .mockImplementation(async (): Promise<boolean> => true)

  await expect(
    makeBuilder({pro: 'fips-updates another-command'}).pack()
  ).rejects.toThrow(
    "Invalid argument 'fips-updates another-command' in field 'pro'"
  )
})

test('CraftBuilder.findArtifacts throws when no matching files are found', async () => {
  expect.assertions(1)

  jest
    .spyOn(fs.promises, 'readdir')
    .mockResolvedValue(['other-file.txt'] as any)

  await expect(makeBuilder().findArtifacts('.charm')).rejects.toThrow(
    'No .charm files produced by build'
  )
})

test('CraftBuilder.findArtifacts returns all matching files', async () => {
  expect.assertions(1)

  jest
    .spyOn(fs.promises, 'readdir')
    .mockResolvedValue(['a.charm', 'b.charm', 'readme.txt'] as any)

  await expect(
    makeBuilder({projectRoot: 'project-root'}).findArtifacts('.charm')
  ).resolves.toEqual(['project-root/a.charm', 'project-root/b.charm'])
})
