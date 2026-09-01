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

export async function runPackAction(builder: CraftBuilder): Promise<void> {
  try {
    await runSetupAction(builder.toolName);
    await builder.pack();
    const artifacts = await builder.findArtifacts(
      builder.artifactOutput.artifactType,
    );
    if (artifacts.length === 0) {
      throw new Error(
        `No ${builder.artifactOutput.artifactType} files produced by build`,
      );
    }

    core.setOutput(builder.artifactOutput.outputName, artifacts.join(" "));

    for (const secondary of builder.secondaryArtifactOutputs) {
      const artifacts = await builder.findArtifacts(secondary.artifactType);

      // Don't handle the empty case, the output must always be set to something
      core.setOutput(secondary.outputName, artifacts.join(" "));
    }
  } catch (error) {
    core.setFailed((error as Error)?.message);
  }
}
