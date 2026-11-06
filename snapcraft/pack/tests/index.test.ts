import { afterEach, expect, test, vi } from "vitest";
import { SnapcraftBuilder, SnapcraftBuilderOptions } from "../src/index.ts";
import * as tools from "@craft-actions/common/tools.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeBuilder(
  overrides: Partial<SnapcraftBuilderOptions> = {},
): SnapcraftBuilder {
  return new SnapcraftBuilder({
    projectRoot: ".",
    channel: "stable",
    revision: "",
    verbosity: "",
    runTests: false,
    ...overrides,
  });
}

function mockCommandExecution() {
  vi.spyOn(tools, "shellUser").mockReturnValue("ubuntu");

  return vi.spyOn(tools, "runCommand").mockResolvedValue(0);
}

function mockSnapcraftVersion(version: string) {
  return vi.spyOn(tools, "fetchSnapd").mockResolvedValue({
    result: { version },
  });
}

test("uses bare snapcraft for versions below 8", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("7.5.9");

  await makeBuilder().pack();

  expect(runCommand).toHaveBeenCalledWith(
    ["sudo", "--preserve-env", "--user", "ubuntu", "snapcraft"],
    { cwd: "." },
  );
});

test("uses snapcraft pack for version 8 and later", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");

  await makeBuilder().pack();

  expect(runCommand).toHaveBeenCalledWith(
    ["sudo", "--preserve-env", "--user", "ubuntu", "snapcraft", "pack"],
    { cwd: "." },
  );
});

test("uses snapcraft test without checking the installed version", async () => {
  const runCommand = mockCommandExecution();
  const fetchSnapd = vi.spyOn(tools, "fetchSnapd");

  await makeBuilder({ runTests: true }).pack();

  expect(fetchSnapd).not.toHaveBeenCalled();
  expect(runCommand).toHaveBeenCalledWith(
    ["sudo", "--preserve-env", "--user", "ubuntu", "snapcraft", "test"],
    { cwd: "." },
  );
});

test("sets SNAPCRAFT_BUILD_INFO and SNAPCRAFT_IMAGE_INFO when buildInfo is true", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");

  await makeBuilder({ buildInfo: true }).pack();

  expect(runCommand).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      env: expect.objectContaining({
        SNAPCRAFT_BUILD_INFO: "1",
        SNAPCRAFT_IMAGE_INFO: "1",
      }),
    }),
  );
});

test("omits env override when buildInfo is false", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");

  await makeBuilder().pack();

  expect(runCommand).toHaveBeenCalledWith(
    ["sudo", "--preserve-env", "--user", "ubuntu", "snapcraft", "pack"],
    { cwd: "." },
  );
});
