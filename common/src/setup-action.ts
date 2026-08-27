import * as core from "@actions/core";
import * as tools from "./tools.ts";

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
    // Re-throw the error so it can bubble up from actions that depend on this setup
    throw error;
  } finally {
    core.endGroup();
  }
}

async function setOutputs(toolName: string): Promise<void> {
  core.setOutput("lxd-revision", await getSnapRevision("lxd"));
  core.setOutput(`${toolName}-revision`, await getSnapRevision(toolName));
}

export async function getSnapRevision(snap: string): Promise<string> {
  const { result } = await tools.fetchSnapd(`/v2/snaps/${snap}`);

  if (!tools.isRecord(result) || typeof result.revision !== "string") {
    throw new Error(`Unable to locate installation of snap ${snap}.`);
  }

  return result.revision;
}
