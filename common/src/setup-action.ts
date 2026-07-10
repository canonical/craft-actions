import * as core from "@actions/core";
import * as tools from "./tools.ts";
import * as http from "node:http";

export interface SetupOptions {
  channel: string;
  revision: string;
  lxdChannel: string;
}

export function readBaseInputs(): SetupOptions {
  return {
    channel: core.getInput("channel") || "latest/stable",
    revision: core.getInput("revision"),
    lxdChannel: core.getInput("lxd-channel") || "5.21/stable",
  };
}

export async function runSetupAction(toolName: string): Promise<void> {
  const options = readBaseInputs();
  try {
    core.startGroup(`Installing ${toolName} and its dependencies`);
    await tools.ensureSnapd();
    await tools.ensureLXD(options.lxdChannel);
    await tools.ensureCraftTool(toolName, options.channel, options.revision);
    await setOutputs(toolName);
  } catch (error) {
    core.setFailed((error as Error)?.message);
  } finally {
    core.endGroup();
  }
}

async function setOutputs(toolName: string): Promise<void> {
  core.setOutput("lxd-revision", await getSnapRevision("lxd"));
  core.setOutput(`${toolName}-revision`, await getSnapRevision(toolName));
}

export async function getSnapRevision(snap: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { socketPath: "/run/snapd.socket", path: `/v2/snaps/${snap}` },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("error", () =>
          reject(new Error("Unable to communicate with SnapD")),
        );
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            resolve(body.result.revision);
          } catch {
            reject(new Error("Unable to communicate with SnapD"));
          }
        });
      },
    );
    req.on("error", () =>
      reject(new Error("Unable to communicate with SnapD")),
    );
  });
}
