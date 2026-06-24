import { vi, afterEach, test, expect } from "vitest";
import * as core from "@actions/core";
import { readBaseInputs, runPackAction } from "../src/pack-action";
import { CraftBuilder } from "../src/craft-builder";

afterEach(() => {
  vi.restoreAllMocks();
});

function mockInputs(inputs: Record<string, string>) {
  vi.spyOn(core, "getInput").mockImplementation((name: string) => {
    return inputs[name] ?? "";
  });
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

test("runPackAction calls pack and sets output", async () => {
  expect.assertions(2);

  const setOutput = vi.spyOn(core, "setOutput").mockImplementation(() => {});
  vi.spyOn(core, "info").mockImplementation(() => {});
  const builder = makeStubBuilder({ revision: "1" });

  await runPackAction(builder, "charm");

  expect(builder.pack).toHaveBeenCalled();
  expect(setOutput).toHaveBeenCalledWith("charm", "project-root/output.charm");
});

test("runPackAction logs info when revision is not set", async () => {
  expect.assertions(1);

  const info = vi.spyOn(core, "info").mockImplementation(() => {});
  vi.spyOn(core, "setOutput").mockImplementation(() => {});
  const builder = makeStubBuilder({ revision: "" });

  await runPackAction(builder, "charm");

  expect(info).toHaveBeenCalled();
});

test("runPackAction does not log info when revision is set", async () => {
  expect.assertions(1);

  const info = vi.spyOn(core, "info").mockImplementation(() => {});
  vi.spyOn(core, "setOutput").mockImplementation(() => {});
  const builder = makeStubBuilder({ revision: "42" });

  await runPackAction(builder, "charm");

  expect(info).not.toHaveBeenCalled();
});

test("runPackAction calls setFailed on error", async () => {
  expect.assertions(1);

  const setFailed = vi.spyOn(core, "setFailed").mockImplementation(() => {});
  vi.spyOn(core, "info").mockImplementation(() => {});
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
  expect.assertions(1);

  vi.spyOn(core, "setOutput").mockImplementation(() => {});
  vi.spyOn(core, "info").mockImplementation(() => {});
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
  expect.assertions(1);

  vi.spyOn(core, "setOutput").mockImplementation(() => {});
  vi.spyOn(core, "info").mockImplementation(() => {});
  const warning = vi.spyOn(core, "warning").mockImplementation(() => {});
  const builder = makeStubBuilder({ revision: "1" });

  await runPackAction(builder, "charm");

  expect(warning).not.toHaveBeenCalled();
});
