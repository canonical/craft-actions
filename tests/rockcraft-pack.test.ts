// -*- mode: javascript; js-indent-level: 2 -*-

import * as os from 'os'
import * as path from 'path'
import * as exec from '@actions/exec'
import * as build from '../src/rockcraft-pack'
import * as tools from '../src/tools'
import * as fs from 'fs'

afterEach(() => {
  jest.restoreAllMocks()
})

test('RockcraftBuilder expands tilde in project root', () => {
  let builder = new build.RockcraftBuilder({
    projectRoot: '~',
    rockcraftChannel: 'edge',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1',
    envFile: ''
  })
  expect(builder.projectRoot).toBe(os.homedir())

  builder = new build.RockcraftBuilder({
    projectRoot: '~/foo/bar',
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1',
    envFile: ''
  })
  expect(builder.projectRoot).toBe(path.join(os.homedir(), 'foo/bar'))
})

test('RockcraftBuilder.pack runs a rock build', async () => {
  expect.assertions(5)

  const user = 'ubuntu'

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureRockcraft = jest
    .spyOn(tools, 'ensureRockcraft')
    .mockImplementation(async (channel): Promise<void> => {})
  const shellUser = jest
    .spyOn(tools, 'shellUser')
    .mockImplementation((): string => user)
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const projectDir = 'project-root'
  const builder = new build.RockcraftBuilder({
    projectRoot: projectDir,
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'debug',
    rockcraftRevision: '1',
    envFile: 'my-env-file'
  })
  await builder.pack()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureLXD).toHaveBeenCalled()
  expect(ensureRockcraft).toHaveBeenCalled()
  expect(shellUser).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith(
    'bash',
    [
      '-c',
      'source my-env-file && sudo --preserve-env --user ' +
        user +
        ' rockcraft pack --verbosity debug'
    ],
    {
      cwd: projectDir
    }
  )
})

test('RockcraftBuilder.build can set the Rockcraft channel', async () => {
  expect.assertions(1)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureRockcraft = jest
    .spyOn(tools, 'ensureRockcraft')
    .mockImplementation(async (channel): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const builder = new build.RockcraftBuilder({
    projectRoot: '.',
    rockcraftChannel: 'test-channel',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '',
    envFile: ''
  })
  await builder.pack()

  expect(ensureRockcraft).toHaveBeenCalledWith('test-channel', '')
})

test('RockcraftBuilder.build can set the Rockcraft revision', async () => {
  expect.assertions(1)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureRockcraft = jest
    .spyOn(tools, 'ensureRockcraft')
    .mockImplementation(async (channel): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const builder = new build.RockcraftBuilder({
    projectRoot: '.',
    rockcraftChannel: 'channel',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '123',
    envFile: ''
  })
  await builder.pack()

  expect(ensureRockcraft).toHaveBeenCalledWith('channel', '123')
})

test('RockcraftBuilder.build can pass known verbosity', async () => {
  expect.assertions(2)

  const user = 'ubuntu'

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureRockcraft = jest
    .spyOn(tools, 'ensureRockcraft')
    .mockImplementation(async (channel): Promise<void> => {})
  const shellUser = jest
    .spyOn(tools, 'shellUser')
    .mockImplementation((): string => user)
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const builder = new build.RockcraftBuilder({
    projectRoot: '.',
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1',
    envFile: ''
  })
  await builder.pack()

  expect(execMock).toHaveBeenCalledWith(
    'bash',
    [
      '-c',
      'sudo --preserve-env --user ' + user + ' rockcraft pack --verbosity trace'
    ],
    expect.anything()
  )

  const badBuilder = () => {
    new build.RockcraftBuilder({
      projectRoot: '.',
      rockcraftChannel: 'stable',
      rockcraftPackVerbosity: 'fake-verbosity',
      rockcraftRevision: '1',
      envFile: ''
    })
  }
  expect(badBuilder).toThrow()
})

test('RockcraftBuilder.outputRock fails if there are no rocks', async () => {
  expect.assertions(2)

  const projectDir = 'project-root'
  const builder = new build.RockcraftBuilder({
    projectRoot: projectDir,
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1',
    envFile: ''
  })

  const readdir = jest
    .spyOn(fs.promises, 'readdir')
    .mockResolvedValue(['not-a-rock' as unknown as fs.Dirent])

  await expect(builder.outputRock()).rejects.toThrow(
    'No .rock files produced by build'
  )
  expect(readdir).toHaveBeenCalled()
})

test('RockcraftBuilder.outputRock returns the first rock', async () => {
  expect.assertions(2)

  const projectDir = 'project-root'
  const builder = new build.RockcraftBuilder({
    projectRoot: projectDir,
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1',
    envFile: ''
  })

  const readdir = jest
    .spyOn(fs.promises, 'readdir')
    .mockResolvedValue(['one.rock', 'two.rock'] as unknown as fs.Dirent[])

  await expect(builder.outputRock()).resolves.toEqual('project-root/one.rock')
  expect(readdir).toHaveBeenCalled()
})
