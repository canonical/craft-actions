// -*- mode: javascript; js-indent-level: 2 -*-

import * as os from 'os'
import * as path from 'path'
import * as exec from '@actions/exec'
import * as build from '../src/rockcraft-pack'
import * as tools from '../src/tools'

afterEach(() => {
  jest.restoreAllMocks()
})

test('RockcraftBuilder expands tilde in project root', () => {
  let builder = new build.RockcraftBuilder({
    projectRoot: '~',
    rockcraftChannel: 'edge',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1'
  })
  expect(builder.projectRoot).toBe(os.homedir())

  builder = new build.RockcraftBuilder({
    projectRoot: '~/foo/bar',
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1'
  })
  expect(builder.projectRoot).toBe(path.join(os.homedir(), 'foo/bar'))
})

test('RockcraftBuilder.pack runs a ROCK build', async () => {
  expect.assertions(4)

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

  const projectDir = 'project-root'
  const builder = new build.RockcraftBuilder({
    projectRoot: projectDir,
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'debug',
    rockcraftRevision: '1'
  })
  await builder.pack()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureLXD).toHaveBeenCalled()
  expect(ensureRockcraft).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith(
    'sg',
    ['lxd', '-c', 'rockcraft pack --verbosity debug'],
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
    rockcraftRevision: ''
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
    rockcraftRevision: '123'
  })
  await builder.pack()

  expect(ensureRockcraft).toHaveBeenCalledWith('channel', '123')
})

test('RockcraftBuilder.build can pass known verbosity', async () => {
  expect.assertions(2)

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
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1'
  })
  await builder.pack()

  expect(execMock).toHaveBeenCalledWith(
    'sg',
    ['lxd', '-c', 'rockcraft pack --verbosity trace'],
    expect.anything()
  )

  const badBuilder = () => {
    new build.RockcraftBuilder({
      projectRoot: '.',
      rockcraftChannel: 'stable',
      rockcraftPackVerbosity: 'fake-verbosity',
      rockcraftRevision: '1'
    })
  }
  expect(badBuilder).toThrowError()
})

test('RockcraftBuilder.outputRock fails if there are no ROCKs', async () => {
  expect.assertions(2)

  const projectDir = 'project-root'
  const builder = new build.RockcraftBuilder({
    projectRoot: projectDir,
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1'
  })

  const readdir = jest
    .spyOn(builder, '_readdir')
    .mockImplementation(
      async (path: string): Promise<string[]> => ['not-a-rock']
    )

  await expect(builder.outputRock()).rejects.toThrow(
    'No .rock files produced by build'
  )
  expect(readdir).toHaveBeenCalled()
})

test('RockcraftBuilder.outputRock returns the first ROCK', async () => {
  expect.assertions(2)

  const projectDir = 'project-root'
  const builder = new build.RockcraftBuilder({
    projectRoot: projectDir,
    rockcraftChannel: 'stable',
    rockcraftPackVerbosity: 'trace',
    rockcraftRevision: '1'
  })

  const readdir = jest
    .spyOn(builder, '_readdir')
    .mockImplementation(
      async (path: string): Promise<string[]> => ['one.rock', 'two.rock']
    )

  await expect(builder.outputRock()).resolves.toEqual('project-root/one.rock')
  expect(readdir).toHaveBeenCalled()
})
