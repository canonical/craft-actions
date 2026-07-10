import * as core from "@actions/core";
import { CraftBuilder, CraftBuilderOptions } from "./craft-builder.ts";
import { runSetupAction } from "./setup-action.ts";

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
    await runSetupAction(builder.toolName);
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
