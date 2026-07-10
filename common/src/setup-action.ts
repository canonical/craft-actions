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
    await tools.ensureCraftTool(
      toolName,
      options.channel,
      options.revision,
    );
  } catch (error) {
    core.setFailed((error as Error)?.message);
  } finally {
    core.endGroup();
  }
}
