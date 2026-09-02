import { vi, afterEach, beforeEach, test, expect } from "vitest";
import * as core from "@actions/core";
import { readBaseInputs, runPackAction } from "../src/pack-action.ts";
import * as setupAction from "../src/setup-action.ts";
import { CraftBuilder, ArtifactOutput } from "../src/craft-builder.ts";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

vi.mock("@actions/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@actions/core")>()),
  setFailed: vi.fn(),
  warning: vi.fn(),
}));

let tempOutputPath: string;

beforeEach(() => {
  tempOutputPath = path.join(os.tmpdir(), "github_output_test");
  fs.writeFileSync(tempOutputPath, ""); // Make sure it's empty
  vi.stubEnv("GITHUB_OUTPUT", tempOutputPath);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  if (fs.existsSync(tempOutputPath)) {
    fs.unlinkSync(tempOutputPath);
  }
});

function assertOutput(real: string, expected: [string, string]): void {
  const [key, value] = expected;
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    artifactOutput: ArtifactOutput;
    projectRoot: string;
    secondaryArtifactOutputs: ArtifactOutput[];
    pack: () => Promise<void>;
    findArtifacts: (ext: string) => Promise<string[]>;
  }> = {},
) {
  return {
    toolName: "test-tool",
    channel: "stable",
    revision: "",
    artifactOutput: { artifactType: ".charm", outputName: "charm" },
    projectRoot: "project-root",
    secondaryArtifactOutputs: [],
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

  await runPackAction(builder);

  expect(runSetup).toHaveBeenCalledWith("test-tool");
});

test("runPackAction calls pack and sets output", async () => {
  mockSetupAction();
  const builder = makeStubBuilder({ revision: "1" });

  await runPackAction(builder);

  expect(builder.pack).toHaveBeenCalled();
  assertOutput(fs.readFileSync(tempOutputPath, "utf8"), [
    "charm",
    "project-root/output.charm",
  ]);
});

test("runPackAction calls setFailed on error", async () => {
  mockSetupAction();
  const setFailed = vi.mocked(core.setFailed);
  const builder = makeStubBuilder({
    revision: "1",
    pack: vi.fn(async () => {
      throw new Error("pack failed");
    }),
  });

  await runPackAction(builder);

  expect(setFailed).toHaveBeenCalledWith("pack failed");
});

test("runPackAction joins multiple primary artifacts into one output", async () => {
  mockSetupAction();
  const builder = makeStubBuilder({
    artifactOutput: { artifactType: ".charm", outputName: "charms" },
    findArtifacts: vi.fn(async () => [
      "project-root/a.charm",
      "project-root/b.charm",
    ]),
  });

  await runPackAction(builder);

  assertOutput(fs.readFileSync(tempOutputPath, "utf8"), [
    "charms",
    "project-root/a.charm project-root/b.charm",
  ]);
});

test("runPackAction fails when no primary artifacts are found", async () => {
  mockSetupAction();
  const setFailed = vi.mocked(core.setFailed);
  const builder = makeStubBuilder({
    artifactOutput: { artifactType: ".snap", outputName: "snaps" },
    findArtifacts: vi.fn(async () => []),
  });

  await runPackAction(builder);

  expect(setFailed).toHaveBeenCalledWith("No .snap files produced by build");
});

test("runPackAction correctly yields multiple secondary artifacts", async () => {
  mockSetupAction();
  const builder = makeStubBuilder({
    artifactOutput: { artifactType: ".snap", outputName: "snaps" },
    findArtifacts: vi.fn(async (artifactType: string) => {
      if (artifactType === ".snap") {
        return ["example.snap"];
      }

      if (artifactType === ".comp") {
        return ["a.comp", "b.comp"];
      }

      return [];
    }),
    secondaryArtifactOutputs: [
      { artifactType: ".comp", outputName: "components" },
    ],
  });

  await runPackAction(builder);

  assertOutput(fs.readFileSync(tempOutputPath, "utf8"), [
    "components",
    "a.comp b.comp",
  ]);
});

test("runPackAction sets empty component output", async () => {
  mockSetupAction();
  const builder = makeStubBuilder({
    artifactOutput: { artifactType: ".snap", outputName: "snaps" },
    findArtifacts: vi.fn(async (artifactType: string) => {
      if (artifactType === ".snap") {
        return ["example.snap"];
      }

      return [];
    }),
    secondaryArtifactOutputs: [
      { artifactType: ".comp", outputName: "components" },
    ],
  });

  await runPackAction(builder);

  assertOutput(fs.readFileSync(tempOutputPath, "utf8"), ["components", ""]);
});
