import {vi, afterEach, test, expect} from 'vitest'
import * as exec from '@actions/exec'
import * as build from '../src/rockcraft-pack'
import * as tools from '../src/tools'
import * as fs from 'fs'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockSetup(user = 'ubuntu') {
  return {
    ensureSnapd: vi
      .spyOn(tools, 'ensureSnapd')
      .mockImplementation(async (): Promise<void> => {}),
    ensureLXD: vi
      .spyOn(tools, 'ensureLXD')
      .mockImplementation(async (): Promise<void> => {}),
    ensureCraftTool: vi
      .spyOn(tools, 'ensureCraftTool')
      .mockImplementation(async (): Promise<void> => {}),
    shellUser: vi
      .spyOn(tools, 'shellUser')
      .mockImplementation((): string => user),
    execMock: vi
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
