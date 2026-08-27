import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as os from "os";
import * as http from "node:http";
// Necessary for proper testing -- otherwise mocks ignored.
import * as self from "./tools.ts";

export function expandHome(p: string): string {
  if (p === "~" || p.startsWith("~/")) {
    p = os.homedir() + p.slice(1);
  }
  return p;
}

export function shellUser(): string {
  return os.userInfo().username;
}

export function fileExists(path: string): boolean {
  return fs.existsSync(path);
}

async function haveExecutable(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path, fs.constants.X_OK);
  } catch {
    return false;
  }
  return true;
}

export async function haveSubcommand(
  tool: string,
  subcommand: string,
): Promise<boolean> {
  return (
    (await self.runCommand([tool, subcommand, "-h"], {
      ignoreReturnCode: true,
    })) === 0
  );
}

export async function ensureSnapd(): Promise<void> {
  const haveSnapd = await haveExecutable("/usr/bin/snap");
  if (!haveSnapd) {
    core.info("Installing snapd...");
    await self.runCommand(["sudo", "apt-get", "update", "-q"]);
    await self.runCommand(["sudo", "apt-get", "install", "-qy", "snapd"]);
  }
  // The Github worker environment has weird permissions on the root,
  // which trip up snap-confine.
  const root = await fs.promises.stat("/");
  if (root.uid !== 0 || root.gid !== 0) {
    await self.runCommand(["sudo", "chown", "root:root", "/"]);
  }
}

export async function ensureLXDNetwork(): Promise<void> {
  const mobyPackages: string[] = [
    "moby-buildx",
    "moby-engine",
    "moby-cli",
    "moby-compose",
    "moby-containerd",
    "moby-runc",
  ];
  const installedPackages: string[] = [];
  const options = { silent: true, ignoreReturnCode: true };
  for (const mobyPackage of mobyPackages) {
    if ((await self.runCommand(["dpkg", "-l", mobyPackage], options)) === 0) {
      installedPackages.push(mobyPackage);
    }
  }
  core.info(
    `Installed docker related packages might interfere with LXD networking: ${installedPackages}`,
  );
  // Removing docker is the best option, but some pipelines depend on it.
  // https://linuxcontainers.org/lxd/docs/master/howto/network_bridge_firewalld/#prevent-issues-with-lxd-and-docker
  // https://github.com/canonical/lxd-cloud/blob/f20a64a8af42485440dcbfd370faf14137d2f349/test/includes/lxd.sh#L13-L23
  await self.runCommand(["sudo", "iptables", "-P", "FORWARD", "ACCEPT"]);
}

export async function ensureLXD(lxdChannel: string): Promise<void> {
  const haveDebLXD = await haveExecutable("/usr/bin/lxd");
  if (haveDebLXD) {
    core.info("Removing legacy .deb packaged LXD...");
    await self.runCommand([
      "sudo",
      "apt-get",
      "remove",
      "-qy",
      "lxd",
      "lxd-client",
    ]);
  }

  // Install the requested version of LXD
  const haveSnapLXD = await haveExecutable("/snap/bin/lxd");
  if (!haveSnapLXD) {
    core.info("Installing LXD...");
    await self.runCommand([
      "sudo",
      "snap",
      "install",
      "lxd",
      "--channel",
      lxdChannel,
      "--cohort",
      "+",
    ]);
  }

  // `usermod` would require a new user session to take effect, but the runner
  // user is already a member of "adm".
  core.info("Setting daemon group on LXD snap to adm...");
  await self.runCommand(["sudo", "snap", "set", "lxd", "daemon.group=adm"]);

  // Don't double-init LXD. Everything else in setup is reasonably idempotent,
  // but `lxd init` does extra work.
  const isInitialized =
    (await self.runCommand(["sudo", "lxc", "storage", "show", "default"], {
      ignoreReturnCode: true,
      silent: true,
    })) === 0;
  if (!isInitialized) {
    core.info("Initialising LXD...");
    await self.runCommand(["sudo", "lxd", "init", "--auto"]);
  }
  await ensureLXDNetwork();
}

export async function configureProLXD(): Promise<void> {
  core.info("Configuring LXD for pro builds");
  await self.runCommand([
    "sudo",
    "pro",
    "config",
    "set",
    "lxd_guest_attach=available",
  ]);
  await self.runCommand(["sudo", "snap", "restart", "lxd"]);
}

export async function ensureCraftTool(
  name: string,
  channel: string,
  revision: string,
): Promise<void> {
  const haveSnap = await haveExecutable(`/snap/bin/${name}`);
  core.info(`Installing ${name}...`);
  await self.runCommand([
    "sudo",
    "snap",
    haveSnap ? "refresh" : "install",
    revision.length > 0 ? "--revision" : "--channel",
    revision.length > 0 ? revision : channel,
    "--classic",
    name,
  ]);
}

export async function runCommand(
  command: string[],
  options?: exec.ExecOptions,
): Promise<number> {
  return exec.exec(command[0], command.slice(1), options);
}

interface SnapdResponse {
  result: unknown;
}

export async function fetchSnapd(path: string): Promise<SnapdResponse> {
  if (!path.startsWith("/")) {
    throw new Error(`API path must start with a '/', got: ${path}.`);
  }

  return new Promise((resolve, reject) => {
    const request = http.get(
      { socketPath: "/run/snapd.socket", path },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("error", (error) => {
          reject(
            new Error(`Unable to communicate with Snapd: ${error.message}`),
          );
        });

        response.on("data", (chunk: Buffer) => chunks.push(chunk));

        response.on("end", () => {
          let body: unknown;

          try {
            body = JSON.parse(Buffer.concat(chunks).toString());
          } catch (error) {
            reject(
              new Error(
                `Invalid JSON response from Snapd API at ${path}: ${(error as Error).message}`,
              ),
            );
            return;
          }

          if (
            !isRecord(body) ||
            !("result" in body) ||
            response.statusCode !== 200
          ) {
            reject(new Error(`Snapd API request failed for ${path}`));
            return;
          }

          resolve({ result: body.result });
        });
      },
    );

    request.on("error", (error) => {
      reject(new Error(`Unable to communicate with Snapd: ${error.message}`));
    });
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
