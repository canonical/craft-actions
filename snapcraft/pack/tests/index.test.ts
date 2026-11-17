import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SnapcraftBuilder, SnapcraftBuilderOptions } from "../src/index.ts";
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

function makeBuilder(
  overrides: Partial<SnapcraftBuilderOptions> = {},
): SnapcraftBuilder {
  return new SnapcraftBuilder({
    projectRoot: ".",
    channel: "stable",
    revision: "",
    verbosity: "",
    runTests: false,
    // Opt out so tests that don't care about build info keep exact assertions.
    buildInfo: false,
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
    ["sudo", "--user", "ubuntu", "env", "snapcraft"],
    { cwd: "." },
  );
});

test("uses snapcraft pack for version 8 and later", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");

  await makeBuilder().pack();

  expect(runCommand).toHaveBeenCalledWith(
    ["sudo", "--user", "ubuntu", "env", "snapcraft", "pack"],
    { cwd: "." },
  );
});

test("uses snapcraft test without checking the installed version", async () => {
  const runCommand = mockCommandExecution();
  const fetchSnapd = vi.spyOn(tools, "fetchSnapd");

  await makeBuilder({ runTests: true }).pack();

  expect(fetchSnapd).not.toHaveBeenCalled();
  expect(runCommand).toHaveBeenCalledWith(
    ["sudo", "--user", "ubuntu", "env", "snapcraft", "test"],
    { cwd: "." },
  );
});

function packEnv(
  runCommand: ReturnType<typeof mockCommandExecution>,
): Record<string, string> {
  const [command] = runCommand.mock.calls[0];
  const env: Record<string, string> = {};
  for (const arg of command) {
    const separator = arg.indexOf("=");
    if (separator > 0) {
      env[arg.slice(0, separator)] = arg.slice(separator + 1);
    }
  }
  return env;
}

test("passes snapcraft-prefixed environment variables", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");
  vi.stubEnv("SNAPCRAFT_BUILD_ENVIRONMENT", "lxd");
  vi.stubEnv("FOOCRAFT_SECRET", "leak");

  await makeBuilder({ buildInfo: false }).pack();

  expect(runCommand).toHaveBeenCalledWith(
    [
      "sudo",
      "--user",
      "ubuntu",
      "env",
      "SNAPCRAFT_BUILD_ENVIRONMENT=lxd",
      "snapcraft",
      "pack",
    ],
    { cwd: "." },
  );
});

test("enables build info by default", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");

  const builder = new SnapcraftBuilder({
    projectRoot: ".",
    channel: "stable",
    revision: "",
    verbosity: "",
    runTests: false,
  });
  await builder.pack();

  expect(packEnv(runCommand)).toEqual(
    expect.objectContaining({ SNAPCRAFT_BUILD_INFO: "1" }),
  );
});

test("sets SNAPCRAFT_BUILD_INFO and image info when buildInfo is true", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");
  vi.stubEnv("GITHUB_REPOSITORY", "canonical/foo");
  vi.stubEnv("GITHUB_RUN_ID", "123");

  await makeBuilder({ buildInfo: true }).pack();

  expect(packEnv(runCommand)).toEqual(
    expect.objectContaining({
      SNAPCRAFT_BUILD_INFO: "1",
      SNAPCRAFT_IMAGE_INFO: JSON.stringify({
        "build-request-id": "gh-123",
        build_url: "https://github.com/canonical/foo/actions/runs/123",
      }),
    }),
  );
});

test("keeps only the run id in image info without a repository", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");
  vi.stubEnv("GITHUB_REPOSITORY", "");
  vi.stubEnv("GITHUB_RUN_ID", "123");

  await makeBuilder({ buildInfo: true }).pack();

  expect(packEnv(runCommand).SNAPCRAFT_IMAGE_INFO).toBe(
    JSON.stringify({ "build-request-id": "gh-123" }),
  );
});

test("sends an empty image info without GitHub run metadata", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");
  vi.stubEnv("GITHUB_REPOSITORY", "");
  vi.stubEnv("GITHUB_RUN_ID", "");

  await makeBuilder({ buildInfo: true }).pack();

  expect(packEnv(runCommand).SNAPCRAFT_IMAGE_INFO).toBe("{}");
});

test("omits env override when buildInfo is false", async () => {
  const runCommand = mockCommandExecution();
  mockSnapcraftVersion("8.14.2");

  await makeBuilder({ buildInfo: false }).pack();

  expect(runCommand).toHaveBeenCalledWith(
    ["sudo", "--user", "ubuntu", "env", "snapcraft", "pack"],
    { cwd: "." },
  );
  expect(runCommand.mock.calls[0][0]).not.toContain("SNAPCRAFT_BUILD_INFO=1");
});
