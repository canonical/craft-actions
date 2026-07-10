import { vi, afterEach, test, expect } from "vitest";
import * as core from "@actions/core";
import * as http from "node:http";
import * as tools from "../src/tools.ts";
import {
  readBaseInputs,
  runSetupAction,
  getSnapRevision,
} from "../src/setup-action.ts";

vi.mock("node:http", () => ({ get: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
});

function mockInputs(inputs: Record<string, string>) {
  vi.spyOn(core, "getInput").mockImplementation((name: string) => {
    return inputs[name] ?? "";
  });
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
  expect.assertions(3);

  mockInputs({ channel: "stable", "lxd-channel": "5.21/stable", revision: "" });
  vi.spyOn(core, "startGroup").mockImplementation(() => {});
  vi.spyOn(core, "endGroup").mockImplementation(() => {});
  vi.spyOn(core, "setOutput").mockImplementation(() => {});
  mockHttpGet("123");
  const { ensureSnapd, ensureLXD, ensureCraftTool } = mockToolFunctions();

  await runSetupAction("rockcraft");

  expect(ensureSnapd).toHaveBeenCalled();
  expect(ensureLXD).toHaveBeenCalledWith("5.21/stable");
  expect(ensureCraftTool).toHaveBeenCalledWith("rockcraft", "stable", "");
});

test("runSetupAction passes lxd-channel to ensureLXD", async () => {
  expect.assertions(1);

  mockInputs({ "lxd-channel": "latest/edge" });
  vi.spyOn(core, "startGroup").mockImplementation(() => {});
  vi.spyOn(core, "endGroup").mockImplementation(() => {});
  vi.spyOn(core, "setOutput").mockImplementation(() => {});
  mockHttpGet("123");
  const { ensureLXD } = mockToolFunctions();

  await runSetupAction("rockcraft");

  expect(ensureLXD).toHaveBeenCalledWith("latest/edge");
});

test("runSetupAction sets lxd-revision and tool revision outputs", async () => {
  expect.assertions(2);

  mockInputs({});
  vi.spyOn(core, "startGroup").mockImplementation(() => {});
  vi.spyOn(core, "endGroup").mockImplementation(() => {});
  const setOutput = vi.spyOn(core, "setOutput").mockImplementation(() => {});
  mockHttpGet("123");
  mockToolFunctions();

  await runSetupAction("rockcraft");

  expect(setOutput).toHaveBeenCalledWith("lxd-revision", "123");
  expect(setOutput).toHaveBeenCalledWith("rockcraft-revision", "123");
});

test("runSetupAction calls setFailed on error", async () => {
  expect.assertions(1);

  mockInputs({});
  vi.spyOn(core, "startGroup").mockImplementation(() => {});
  vi.spyOn(core, "endGroup").mockImplementation(() => {});
  const setFailed = vi.spyOn(core, "setFailed").mockImplementation(() => {});
  mockToolFunctions();
  vi.spyOn(tools, "ensureSnapd").mockImplementation(async () => {
    throw new Error("snapd failed");
  });

  await runSetupAction("rockcraft");

  expect(setFailed).toHaveBeenCalledWith("snapd failed");
});

test("runSetupAction calls endGroup even on error", async () => {
  expect.assertions(1);

  mockInputs({});
  vi.spyOn(core, "startGroup").mockImplementation(() => {});
  const endGroup = vi.spyOn(core, "endGroup").mockImplementation(() => {});
  vi.spyOn(core, "setFailed").mockImplementation(() => {});
  mockToolFunctions();
  vi.spyOn(tools, "ensureSnapd").mockImplementation(async () => {
    throw new Error("snapd failed");
  });

  await runSetupAction("rockcraft");

  expect(endGroup).toHaveBeenCalled();
});

// getSnapRevision

test("getSnapRevision returns the revision from snapd", async () => {
  expect.assertions(1);

  mockHttpGet("4813");

  await expect(getSnapRevision("rockcraft")).resolves.toBe("4813");
});

test("getSnapRevision rejects on malformed JSON", async () => {
  expect.assertions(1);

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
  expect.assertions(1);

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
  expect.assertions(1);

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
