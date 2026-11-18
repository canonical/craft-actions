import { vi, afterEach, beforeEach, test, expect } from "vitest";
import * as build from "../src/index.ts";
import * as tools from "@craft-actions/common/tools.ts";

beforeEach(() => {
  // Craft variables in the developer/CI environment would leak into the argv.
  for (const key of Object.keys(process.env)) {
    if (key.includes("CRAFT_")) {
      vi.stubEnv(key, undefined);
    }
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function mockSetup(user = "ubuntu") {
  return {
    shellUser: vi
      .spyOn(tools, "shellUser")
      .mockImplementation((): string => user),
    execMock: vi
      .spyOn(tools, "runCommand")
      .mockImplementation(async (): Promise<number> => 0),
  };
}

function makeBuilder(
  overrides: Partial<build.RockcraftBuilderOptions> = {},
): build.RockcraftBuilder {
  return new build.RockcraftBuilder({
    projectRoot: ".",
    channel: "stable",
    verbosity: "",
    revision: "",
    runTests: false,
    pro: "",
    ignore: "",
    ...overrides,
  });
}

test("RockcraftBuilder.build can ignore unmaintained", async () => {
  const { execMock } = mockSetup();

  await makeBuilder({ ignore: "unmaintained", verbosity: "trace" }).pack();

  expect(execMock).toHaveBeenCalledWith(
    [
      "sudo",
      "--user",
      "ubuntu",
      "env",
      "rockcraft",
      "pack",
      "--verbosity",
      "trace",
      "--ignore=unmaintained",
    ],
    { cwd: "." },
  );
});
