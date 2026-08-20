import { vi, afterEach, beforeEach, test, expect } from "vitest";
import * as core from "@actions/core";
import { readBaseInputs, runPackAction } from "../src/pack-action.ts";
import * as setupAction from "../src/setup-action.ts";
import { CraftBuilder } from "../src/craft-builder.ts";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

let tempOutputPath: string;

beforeEach(() => {
  tempOutputPath = path.join(os.tmpdir(), "github_output_test");
  fs.writeFileSync(tempOutputPath, ""); // Make sure it's empty
  vi.stubEnv("GITHUB_OUTPUT", tempOutputPath);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  if (fs.existsSync(tempOutputPath)) {
    fs.unlinkSync(tempOutputPath);
  }
});

function assertOutput(real: string, expected: [string, string]): void {
  const [key, value] = expected;
  const escapedValue = value.replace(/\./g, "\\.");
  const regex = new RegExp(
    `${key}<<gh[a]?delimiter_.*\n${escapedValue}\ngh[a]?delimiter_.*`,
  );
  expect(real).toMatch(regex);
}

function mockInputs(inputs: Record<string, string>) {
  for (const [key, value] of Object.entries(inputs)) {
    vi.stubEnv(`INPUT_${key.toUpperCase()}`, value);
  }
}

function mockSetupAction() {
  return vi
    .spyOn(setupAction, "runSetupAction")
    .mockImplementation(async (): Promise<void> => {});
}

// Minimal stub matching the CraftBuilder interface needed by runPackAction.
function makeStubBuilder(
  overrides: Partial<{
    toolName: string;
    channel: string;
    revision: string;
    artifactType: string;
    projectRoot: string;
    pack: () => Promise<void>;
    findArtifacts: (ext: string) => Promise<string[]>;
  }> = {},
) {
  return {
    toolName: "test-tool",
    channel: "stable",
    revision: "",
    artifactType: ".charm",
    projectRoot: "project-root",
    pack: vi.fn(async () => {}),
    findArtifacts: vi.fn(async () => ["project-root/output.charm"]),
    ...overrides,
  } as unknown as CraftBuilder;
}

// readBaseInputs

test("readBaseInputs reads standard inputs", () => {
  mockInputs({
    path: "my-project",
    channel: "edge",
    revision: "42",
    verbosity: "debug",
    pro: "esm-apps",
    test: "true",
  });

  expect(readBaseInputs()).toEqual({
    projectRoot: "my-project",
    channel: "edge",
    revision: "42",
    verbosity: "debug",
    pro: "esm-apps",
    runTests: true,
  });
});

test("readBaseInputs defaults channel to stable when empty", () => {
  mockInputs({ path: "." });

  expect(readBaseInputs()).toMatchObject({ channel: "stable" });
});

test("readBaseInputs uses a custom channel input name", () => {
  mockInputs({ "rockcraft-channel": "candidate" });

  expect(readBaseInputs("rockcraft-channel")).toMatchObject({
    channel: "candidate",
  });
});

test('readBaseInputs parses runTests as false when input is not "true"', () => {
  mockInputs({ test: "false" });

  expect(readBaseInputs()).toMatchObject({ runTests: false });
});

// runPackAction

test("runPackAction calls runSetupAction with the tool name", async () => {
  const runSetup = mockSetupAction();
  const builder = makeStubBuilder({ revision: "1" });

  await runPackAction(builder, "charm");

  expect(runSetup).toHaveBeenCalledWith("test-tool");
});

test("runPackAction calls pack and sets output", async () => {
  mockSetupAction();
  const builder = makeStubBuilder({ revision: "1" });

  await runPackAction(builder, "charm");

  expect(builder.pack).toHaveBeenCalled();
  assertOutput(fs.readFileSync(tempOutputPath, "utf8"), [
    "charm",
    "project-root/output.charm",
  ]);
});

test("runPackAction calls setFailed on error", async () => {
  mockSetupAction();
  const setFailed = vi.spyOn(core, "setFailed").mockImplementation(() => {});
  const builder = makeStubBuilder({
    revision: "1",
    pack: vi.fn(async () => {
      throw new Error("pack failed");
    }),
  });

  await runPackAction(builder, "charm");

  expect(setFailed).toHaveBeenCalledWith("pack failed");
});

test("runPackAction warns when multiple artifacts are found", async () => {
  mockSetupAction();
  const warning = vi.spyOn(core, "warning").mockImplementation(() => {});
  const builder = makeStubBuilder({
    revision: "1",
    findArtifacts: vi.fn(async () => [
      "project-root/a.charm",
      "project-root/b.charm",
    ]),
  });

  await runPackAction(builder, "charm");

  expect(warning).toHaveBeenCalled();
});

test("runPackAction does not warn when only one artifact is found", async () => {
  mockSetupAction();
  const warning = vi.spyOn(core, "warning").mockImplementation(() => {});
  const builder = makeStubBuilder({ revision: "1" });

  await runPackAction(builder, "charm");

  expect(warning).not.toHaveBeenCalled();
});
