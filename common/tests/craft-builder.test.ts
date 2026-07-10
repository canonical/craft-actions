import { vi, afterEach, test, expect } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as exec from "@actions/exec";
import { CraftBuilder, CraftBuilderOptions } from "../src/craft-builder.ts";
import * as tools from "../src/tools.ts";

class TestBuilder extends CraftBuilder {
  toolName = "test-tool";
  artifactType = ".charm";
}

function makeBuilder(
  overrides: Partial<CraftBuilderOptions> = {},
): TestBuilder {
  return new TestBuilder({
    projectRoot: ".",
    channel: "stable",
    verbosity: "",
    revision: "",
    ...overrides,
  });
}

function mockSetup(user = "ubuntu") {
  return {
    configureProLXD: vi
      .spyOn(tools, "configureProLXD")
      .mockImplementation(async (): Promise<void> => {}),
    shellUser: vi
      .spyOn(tools, "shellUser")
      .mockImplementation((): string => user),
    execMock: vi
      .spyOn(exec, "exec")
      .mockImplementation(async (): Promise<number> => 0),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

test("CraftBuilder expands tilde in project root", () => {
  expect(makeBuilder({ projectRoot: "~" }).projectRoot).toBe(os.homedir());
  expect(makeBuilder({ projectRoot: "~/foo/bar" }).projectRoot).toBe(
    path.join(os.homedir(), "foo/bar"),
  );
});

test("CraftBuilder allows empty verbosity", () => {
  expect(() => makeBuilder({ verbosity: "" })).not.toThrow();
});

test("CraftBuilder.pack calls configureProLXD when pro is set", async () => {
  expect.assertions(1);

  const { configureProLXD } = mockSetup();

  await makeBuilder({ pro: "esm-apps" }).pack();

  expect(configureProLXD).toHaveBeenCalled();
});

test("CraftBuilder.pack does not call configureProLXD when pro is not set", async () => {
  expect.assertions(1);

  const { configureProLXD } = mockSetup();

  await makeBuilder().pack();

  expect(configureProLXD).not.toHaveBeenCalled();
});

test("CraftBuilder.pack executes the correct base command", async () => {
  expect.assertions(1);

  const { execMock } = mockSetup();

  await makeBuilder({ projectRoot: "my-dir" }).pack();

  expect(execMock).toHaveBeenCalledWith(
    "sudo",
    ["--preserve-env", "--user", "ubuntu", "test-tool", "pack"],
    { cwd: "my-dir" },
  );
});

test("CraftBuilder.pack executes test subcommand when runTests is true", async () => {
  expect.assertions(1);

  const { execMock } = mockSetup();

  await makeBuilder({ projectRoot: "my-dir", runTests: true }).pack();

  expect(execMock).toHaveBeenCalledWith(
    "sudo",
    ["--preserve-env", "--user", "ubuntu", "test-tool", "test"],
    { cwd: "my-dir" },
  );
});

test("CraftBuilder.pack includes --verbosity flag when verbosity is set", async () => {
  expect.assertions(1);

  const { execMock } = mockSetup();

  await makeBuilder({ verbosity: "debug" }).pack();

  expect(execMock).toHaveBeenCalledWith(
    "sudo",
    expect.arrayContaining(["--verbosity", "debug"]),
    expect.anything(),
  );
});

test("CraftBuilder.pack omits --verbosity flag when verbosity is empty", async () => {
  expect.assertions(1);

  const { execMock } = mockSetup();

  await makeBuilder({ verbosity: "" }).pack();

  expect(execMock).toHaveBeenCalledWith(
    "sudo",
    expect.not.arrayContaining(["--verbosity"]),
    expect.anything(),
  );
});

test("CraftBuilder.pack includes --pro flag when pro is set", async () => {
  expect.assertions(1);

  const { execMock } = mockSetup();

  await makeBuilder({ pro: "esm-apps,esm-infra" }).pack();

  expect(execMock).toHaveBeenCalledWith(
    "sudo",
    expect.arrayContaining(["--pro=esm-apps,esm-infra"]),
    expect.anything(),
  );
});

test("CraftBuilder.findArtifacts throws when no matching files are found", async () => {
  expect.assertions(1);

  vi.spyOn(fs.promises, "readdir").mockResolvedValue([
    "other-file.txt",
  ] as never);

  await expect(makeBuilder().findArtifacts(".charm")).rejects.toThrow(
    "No .charm files produced by build",
  );
});

test("CraftBuilder.findArtifacts returns all matching files", async () => {
  expect.assertions(1);

  vi.spyOn(fs.promises, "readdir").mockResolvedValue([
    "a.charm",
    "b.charm",
    "readme.txt",
  ] as never);

  await expect(
    makeBuilder({ projectRoot: "project-root" }).findArtifacts(".charm"),
  ).resolves.toEqual(["project-root/a.charm", "project-root/b.charm"]);
});
