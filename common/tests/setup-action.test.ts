import { vi, afterEach, beforeEach, test, expect } from "vitest";
import * as core from "@actions/core";
import * as http from "node:http";
import * as tools from "../src/tools.ts";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";
import {
  readBaseInputs,
  runSetupAction,
  getSnapRevision,
} from "../src/setup-action.ts";

vi.mock("node:http", () => ({ get: vi.fn() }));
vi.mock("@actions/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@actions/core")>()),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
  setFailed: vi.fn(),
}));

let tempOutputPath: string;

beforeEach(() => {
  tempOutputPath = path.join(os.tmpdir(), "github_output_test_setup");
  fs.writeFileSync(tempOutputPath, "");
  vi.stubEnv("GITHUB_OUTPUT", tempOutputPath);
});

afterEach(() => {
  vi.resetAllMocks();
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

function mockToolFunctions() {
  return {
    ensureSnapd: vi
      .spyOn(tools, "ensureSnapd")
      .mockImplementation(async (): Promise<void> => {}),
    ensureLXD: vi
      .spyOn(tools, "ensureLXD")
      .mockImplementation(async (): Promise<void> => {}),
    ensureCraftTool: vi
      .spyOn(tools, "ensureCraftTool")
      .mockImplementation(async (): Promise<void> => {}),
  };
}

function mockHttpGet(revision: string) {
  vi.mocked(http.get).mockImplementation(
    (_options: unknown, callback?: unknown) => {
      const cb = callback as (res: object) => void;
      const chunks: Buffer[] = [
        Buffer.from(JSON.stringify({ result: { revision } })),
      ];
      cb({
        statusCode: 200,
        on: (event: string, handler: (...args: unknown[]) => void) => {
          if (event === "data") chunks.forEach((c) => handler(c));
          if (event === "end") handler();
        },
      });
      return { on: () => {} } as unknown as http.ClientRequest;
    },
  );
}

// readBaseInputs

test("readBaseInputs reads channel input", () => {
  mockInputs({ channel: "edge" });

  expect(readBaseInputs()).toMatchObject({ channel: "edge" });
});

test("readBaseInputs defaults channel to latest/stable when empty", () => {
  mockInputs({});

  expect(readBaseInputs()).toMatchObject({ channel: "latest/stable" });
});

test("readBaseInputs reads revision input", () => {
  mockInputs({ revision: "42" });

  expect(readBaseInputs()).toMatchObject({ revision: "42" });
});

test("readBaseInputs reads lxd-channel input", () => {
  mockInputs({ "lxd-channel": "latest/edge" });

  expect(readBaseInputs()).toMatchObject({ lxdChannel: "latest/edge" });
});

test("readBaseInputs defaults lxd-channel to 5.21/stable when empty", () => {
  mockInputs({});

  expect(readBaseInputs()).toMatchObject({ lxdChannel: "5.21/stable" });
});

// runSetupAction

test("runSetupAction calls ensureSnapd, ensureLXD, and ensureCraftTool", async () => {
  mockInputs({ channel: "stable", "lxd-channel": "5.21/stable", revision: "" });
  mockHttpGet("123");
  const { ensureSnapd, ensureLXD, ensureCraftTool } = mockToolFunctions();

  await runSetupAction("rockcraft");

  expect(ensureSnapd).toHaveBeenCalled();
  expect(ensureLXD).toHaveBeenCalledWith("5.21/stable");
  expect(ensureCraftTool).toHaveBeenCalledWith("rockcraft", "stable", "");
});

test("runSetupAction passes lxd-channel to ensureLXD", async () => {
  mockInputs({ "lxd-channel": "latest/edge" });
  mockHttpGet("123");
  const { ensureLXD } = mockToolFunctions();

  await runSetupAction("rockcraft");

  expect(ensureLXD).toHaveBeenCalledWith("latest/edge");
});

test("runSetupAction sets lxd-revision and tool revision outputs", async () => {
  mockInputs({});
  mockHttpGet("123");
  mockToolFunctions();

  await runSetupAction("rockcraft");

  const realOutput = fs.readFileSync(tempOutputPath, "utf8");
  assertOutput(realOutput, ["lxd-revision", "123"]);
  assertOutput(realOutput, ["rockcraft-revision", "123"]);
});

test("runSetupAction calls setFailed on error", async () => {
  mockInputs({});
  const setFailed = vi.mocked(core.setFailed);
  mockToolFunctions();
  vi.spyOn(tools, "ensureSnapd").mockImplementation(async () => {
    throw new Error("snapd failed");
  });

  await expect(runSetupAction("rockcraft")).rejects.toThrow("snapd failed");

  expect(setFailed).toHaveBeenCalledWith("snapd failed");
});

test("runSetupAction calls endGroup even on error", async () => {
  mockInputs({});
  const endGroup = vi.mocked(core.endGroup);
  mockToolFunctions();
  vi.spyOn(tools, "ensureSnapd").mockImplementation(async () => {
    throw new Error("snapd failed");
  });

  await expect(runSetupAction("rockcraft")).rejects.toThrow("snapd failed");

  expect(endGroup).toHaveBeenCalled();
});

// getSnapRevision

test("getSnapRevision returns the revision from snapd", async () => {
  mockHttpGet("4813");

  await expect(getSnapRevision("rockcraft")).resolves.toBe("4813");
});

test("getSnapRevision rejects on malformed JSON", async () => {
  vi.mocked(http.get).mockImplementation(
    (_options: unknown, callback?: unknown) => {
      const cb = callback as (res: object) => void;
      const req = { on: () => {} };
      cb({
        on: (event: string, handler: (...args: unknown[]) => void) => {
          if (event === "data") handler(Buffer.from("not json"));
          if (event === "end") handler();
        },
      });
      return req as unknown as http.ClientRequest;
    },
  );

  await expect(getSnapRevision("rockcraft")).rejects.toThrow(
    "Unable to communicate with SnapD",
  );
});

test("getSnapRevision rejects on response stream error", async () => {
  vi.mocked(http.get).mockImplementation(
    (_options: unknown, callback?: unknown) => {
      const cb = callback as (res: object) => void;
      const req = { on: () => {} };
      cb({
        on: (event: string, handler: (...args: unknown[]) => void) => {
          if (event === "error") handler(new Error("stream error"));
        },
      });
      return req as unknown as http.ClientRequest;
    },
  );

  await expect(getSnapRevision("rockcraft")).rejects.toThrow(
    "Unable to communicate with SnapD",
  );
});

test("getSnapRevision rejects on connection error", async () => {
  vi.mocked(http.get).mockImplementation(() => {
    const req = {
      on: (event: string, handler: (...args: unknown[]) => void) => {
        if (event === "error")
          handler(new Error("connect ENOENT /run/snapd.socket"));
      },
    };
    return req as unknown as http.ClientRequest;
  });

  await expect(getSnapRevision("rockcraft")).rejects.toThrow(
    "Unable to communicate with SnapD",
  );
});
