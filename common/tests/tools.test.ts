import { vi, afterEach, test, expect } from "vitest";
import * as fs from "fs";
import * as core from "@actions/core";
import * as tools from "../src/tools.ts";
import * as http from "node:http";
import { Readable } from "node:stream";

vi.mock("node:http", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:http")>()),
  get: vi.fn(),
}));

vi.mock("@actions/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@actions/core")>()),
  info: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

test("ensureSnapd installs snapd if needed", async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (): Promise<void> => {
      throw new Error("not found");
    });
  const statMock = vi
    .spyOn(fs.promises, "stat")
    .mockImplementation(async (): Promise<fs.Stats> => {
      return { uid: 0, gid: 0 } as unknown as fs.Stats;
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => {
      return 0;
    });

  await tools.ensureSnapd();

  expect(accessMock).toHaveBeenCalled();
  expect(statMock).toHaveBeenCalled();
  expect(execMock).toHaveBeenNthCalledWith(1, [
    "sudo",
    "apt-get",
    "update",
    "-q",
  ]);
  expect(execMock).toHaveBeenNthCalledWith(2, [
    "sudo",
    "apt-get",
    "install",
    "-qy",
    "snapd",
  ]);
});

test("ensureSnapd is a no-op if snapd is installed", async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (): Promise<void> => {});
  const statMock = vi
    .spyOn(fs.promises, "stat")
    .mockImplementation(async (): Promise<fs.Stats> => {
      return { uid: 0, gid: 0 } as unknown as fs.Stats;
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => {
      return 0;
    });

  await tools.ensureSnapd();

  expect(accessMock).toHaveBeenCalled();
  expect(statMock).toHaveBeenCalled();
  expect(execMock).not.toHaveBeenCalled();
});

test("ensureSnapd fixes permissions on the root directory", async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (): Promise<void> => {});
  const statMock = vi
    .spyOn(fs.promises, "stat")
    .mockImplementation(async (): Promise<fs.Stats> => {
      return { uid: 500, gid: 0 } as unknown as fs.Stats;
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.ensureSnapd();

  expect(accessMock).toHaveBeenCalled();
  expect(statMock).toHaveBeenCalled();
  expect(execMock).toHaveBeenCalledWith(["sudo", "chown", "root:root", "/"]);
});

test("ensureLXD installs the snap version of LXD if needed", async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (): Promise<void> => {
      throw new Error("not found");
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (command: string[]): Promise<number> => {
      if (command?.[2] === "storage") return 1;
      return 0;
    });

  await tools.ensureLXD("5.21/stable");

  expect(accessMock).toHaveBeenCalled();
  expect(execMock).toHaveBeenNthCalledWith(1, [
    "sudo",
    "snap",
    "install",
    "lxd",
    "--channel",
    "5.21/stable",
    "--cohort",
    "+",
  ]);
  expect(execMock).toHaveBeenNthCalledWith(2, [
    "sudo",
    "snap",
    "set",
    "lxd",
    "daemon.group=adm",
  ]);
  expect(execMock).toHaveBeenNthCalledWith(4, [
    "sudo",
    "lxd",
    "init",
    "--auto",
  ]);
});

test("ensureLXD installs from the requested channel", async () => {
  vi.spyOn(fs.promises, "access").mockImplementation(
    async (): Promise<void> => {
      throw new Error("not found");
    },
  );
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.ensureLXD("latest/edge");

  expect(execMock).toHaveBeenCalledWith([
    "sudo",
    "snap",
    "install",
    "lxd",
    "--channel",
    "latest/edge",
    "--cohort",
    "+",
  ]);
});

test("configureProLXD configures lxd_guest_attach", async () => {
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.configureProLXD();

  expect(execMock).toHaveBeenNthCalledWith(1, [
    "sudo",
    "pro",
    "config",
    "set",
    "lxd_guest_attach=available",
  ]);
  expect(execMock).toHaveBeenNthCalledWith(2, [
    "sudo",
    "snap",
    "restart",
    "lxd",
  ]);
});

test("ensureLXD removes the apt version of LXD", async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (): Promise<void> => {
      return;
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.ensureLXD("5.21/stable");

  expect(accessMock).toHaveBeenCalled();
  expect(execMock).toHaveBeenNthCalledWith(1, [
    "sudo",
    "apt-get",
    "remove",
    "-qy",
    "lxd",
    "lxd-client",
  ]);
});

test("ensureLXD is not refreshed if LXD is installed", async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (filename: fs.PathLike): Promise<void> => {
      if (filename === "/snap/bin/lxd") {
        return;
      }
      throw new Error("not found");
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.ensureLXD("5.21/stable");

  expect(accessMock).toHaveBeenCalled();
  expect(execMock).not.toHaveBeenNthCalledWith(3, [
    "sudo",
    "snap",
    "install",
    "lxd",
    "--channel",
    "5.21/stable",
    "--cohort",
    "+",
  ]);
});

test('ensureLXD still calls "lxd init" if LXD is installed', async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (filename: fs.PathLike): Promise<void> => {
      if (filename === "/snap/bin/lxd") {
        return;
      }
      throw new Error("not found");
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (command: string[]): Promise<number> => {
      if (command?.[2] === "storage") return 1;
      return 0;
    });

  await tools.ensureLXD("5.21/stable");

  expect(accessMock).toHaveBeenCalled();
  expect(execMock).toHaveBeenNthCalledWith(1, [
    "sudo",
    "snap",
    "set",
    "lxd",
    "daemon.group=adm",
  ]);
  expect(execMock).toHaveBeenNthCalledWith(3, [
    "sudo",
    "lxd",
    "init",
    "--auto",
  ]);
});

test("ensureLXD skips lxd init if already initialized", async () => {
  vi.spyOn(fs.promises, "access").mockImplementation(
    async (): Promise<void> => {
      throw new Error("not found");
    },
  );
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.ensureLXD("5.21/stable");

  expect(execMock).not.toHaveBeenCalledWith(["sudo", "lxd", "init", "--auto"]);
});

test("ensureCraftTool installs a craft tool if needed", async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (): Promise<void> => {
      throw new Error("not found");
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.ensureCraftTool("rockcraft", "edge", "");

  expect(accessMock).toHaveBeenCalled();
  expect(execMock).toHaveBeenNthCalledWith(1, [
    "sudo",
    "snap",
    "install",
    "--channel",
    "edge",
    "--classic",
    "rockcraft",
  ]);

  await tools.ensureCraftTool("snapcraft", "stable", "1234");

  expect(accessMock).toHaveBeenCalled();
  expect(execMock).toHaveBeenNthCalledWith(2, [
    "sudo",
    "snap",
    "install",
    "--revision",
    "1234",
    "--classic",
    "snapcraft",
  ]);
});

test("ensureCraftTool refreshes if the tool is already installed", async () => {
  const accessMock = vi
    .spyOn(fs.promises, "access")
    .mockImplementation(async (): Promise<void> => {
      return;
    });
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.ensureCraftTool("rockcraft", "edge", "");

  expect(accessMock).toHaveBeenCalled();
  expect(execMock).toHaveBeenNthCalledWith(1, [
    "sudo",
    "snap",
    "refresh",
    "--channel",
    "edge",
    "--classic",
    "rockcraft",
  ]);
});

test("ensureLXDNetwork sets up iptables and warns about Docker", async () => {
  const infoMock = vi.mocked(core.info);

  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (command: string[]): Promise<number> => {
      if (command != undefined && command[2] == "moby-runc") {
        return 0;
      } else {
        return 1;
      }
    });

  await tools.ensureLXDNetwork();

  expect(infoMock).toHaveBeenCalledWith(
    "Installed docker related packages might interfere with LXD networking: moby-runc",
  );
  expect(execMock).toHaveBeenNthCalledWith(1, ["dpkg", "-l", "moby-buildx"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(2, ["dpkg", "-l", "moby-engine"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(3, ["dpkg", "-l", "moby-cli"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(4, ["dpkg", "-l", "moby-compose"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(
    5,
    ["dpkg", "-l", "moby-containerd"],
    { ignoreReturnCode: true, silent: true },
  );
  expect(execMock).toHaveBeenNthCalledWith(6, ["dpkg", "-l", "moby-runc"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(7, [
    "sudo",
    "iptables",
    "-P",
    "FORWARD",
    "ACCEPT",
  ]);
});

test("ensureLXDNetwork sets up iptables and warns only about installed packages", async () => {
  const infoMock = vi.mocked(core.info);
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await tools.ensureLXDNetwork();

  expect(infoMock).toHaveBeenCalledWith(
    "Installed docker related packages might interfere with LXD networking: " +
      "moby-buildx,moby-engine,moby-cli,moby-compose,moby-containerd,moby-runc",
  );
  expect(execMock).toHaveBeenNthCalledWith(1, ["dpkg", "-l", "moby-buildx"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(2, ["dpkg", "-l", "moby-engine"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(3, ["dpkg", "-l", "moby-cli"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(4, ["dpkg", "-l", "moby-compose"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(
    5,
    ["dpkg", "-l", "moby-containerd"],
    { ignoreReturnCode: true, silent: true },
  );
  expect(execMock).toHaveBeenNthCalledWith(6, ["dpkg", "-l", "moby-runc"], {
    ignoreReturnCode: true,
    silent: true,
  });
  expect(execMock).toHaveBeenNthCalledWith(7, [
    "sudo",
    "iptables",
    "-P",
    "FORWARD",
    "ACCEPT",
  ]);
});

test("haveSubcommand returns true if the subcommand is available", async () => {
  const execMock = vi
    .spyOn(tools, "runCommand")
    .mockImplementation(async (): Promise<number> => 0);

  await expect(tools.haveSubcommand("rockcraft", "test")).resolves.toBe(true);
  expect(execMock).toHaveBeenCalledWith(["rockcraft", "test", "-h"], {
    ignoreReturnCode: true,
  });
});

test("haveSubcommand returns false if the subcommand is not available", async () => {
  vi.spyOn(tools, "runCommand").mockImplementation(
    async (): Promise<number> => 1,
  );

  await expect(tools.haveSubcommand("rockcraft", "test")).resolves.toBe(false);
});

/* Constructs a mock HTTP response with a given body and status code. */
function mockSnapdResponse(body: string, statusCode = 200): void {
  vi.mocked(http.get).mockImplementation(
    (_options: unknown, callback?: unknown) => {
      const response = Object.assign(Readable.from([Buffer.from(body)]), {
        statusCode,
      });

      (callback as (response: http.IncomingMessage) => void)(
        response as http.IncomingMessage,
      );

      return { on: vi.fn() } as unknown as http.ClientRequest;
    },
  );
}

test("fetchSnapd returns a successful result", async () => {
  const expected = { result: { revision: "123" } };
  mockSnapdResponse(JSON.stringify(expected));

  await expect(tools.fetchSnapd("/v2/snaps/snapcraft")).resolves.toEqual(
    expected,
  );
});

test("fetchSnapd rejects paths without a leading slash", async () => {
  await expect(tools.fetchSnapd("v2/snaps/snapcraft")).rejects.toThrow(
    "API path must start with a '/'",
  );

  expect(http.get).not.toHaveBeenCalled();
});

test("fetchSnapd rejects invalid JSON", async () => {
  mockSnapdResponse("not JSON");

  await expect(tools.fetchSnapd("/v2/snaps/snapcraft")).rejects.toThrow(
    "Invalid JSON response from Snapd API at /v2/snaps/snapcraft",
  );
});

test("fetchSnapd rejects unsuccessful HTTP responses", async () => {
  mockSnapdResponse(JSON.stringify({ result: {} }), 404);

  await expect(tools.fetchSnapd("/v2/snaps/snapcraft")).rejects.toThrow(
    "Snapd API request failed for /v2/snaps/snapcraft",
  );
});

test("fetchSnapd rejects responses without a result", async () => {
  mockSnapdResponse(JSON.stringify({ wee: "snaw" }));

  await expect(tools.fetchSnapd("/v2/snaps/snapcraft")).rejects.toThrow(
    "Snapd API request failed for /v2/snaps/snapcraft",
  );
});

test("isRecord identifies non-null objects", () => {
  expect(tools.isRecord({})).toBe(true);
  expect(tools.isRecord({ one: "two" })).toBe(true);
  expect(tools.isRecord(null)).toBe(false);
  expect(tools.isRecord("boop")).toBe(false);
});
