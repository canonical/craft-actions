import * as core from "@actions/core";
import { CraftBuilder, CraftBuilderOptions } from "./craft-builder";

export function readBaseInputs(channelInput = "channel"): CraftBuilderOptions {
  return {
    projectRoot: core.getInput("path"),
    channel: core.getInput(channelInput) || "stable",
    revision: core.getInput("revision") || "",
    verbosity: core.getInput("verbosity"),
    pro: core.getInput("pro") || "",
    runTests: core.getInput("test").toLowerCase() === "true",
  };
}

export async function runPackAction(
  builder: CraftBuilder,
  outputName: string,
): Promise<void> {
  try {
    if (!builder.revision) {
      core.info(
        `${builder.toolName} revision not provided. Installing from ${builder.channel}`,
      );
    }
    await builder.pack();
    const artifacts = await builder.findArtifacts(builder.artifactType);
    if (artifacts.length > 1) {
      core.warning(
        `Multiple ${builder.artifactType} files found in ${builder.projectRoot}`,
      );
    }
    core.setOutput(outputName, artifacts[0]);
  } catch (error) {
    core.setFailed((error as Error)?.message);
  }
}
