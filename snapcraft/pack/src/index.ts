import * as core from "@actions/core";
import {
  CraftBuilder,
  CraftBuilderOptions,
} from "@craft-actions/common/craft-builder.ts";
import {
  readBaseInputs,
  runPackAction,
} from "@craft-actions/common/pack-action.ts";
import * as tools from "@craft-actions/common/tools.ts";

export interface SnapcraftBuilderOptions extends CraftBuilderOptions {
  buildInfo?: boolean;
}

export class SnapcraftBuilder extends CraftBuilder {
  toolName = "snapcraft";
  artifactOutput = { artifactType: ".snap", outputName: "snaps" };
  secondaryArtifactOutputs = [
    { artifactType: ".comp", outputName: "components" },
  ];

  buildInfo: boolean;

  constructor(options: SnapcraftBuilderOptions) {
    super(options);
    this.buildInfo = options.buildInfo ?? false;
  }

  protected override buildEnv(): Record<string, string> {
    return this.buildInfo
      ? { SNAPCRAFT_BUILD_INFO: "1", SNAPCRAFT_IMAGE_INFO: "1" }
      : {};
  }

  protected override async buildCommand(): Promise<string[]> {
    // Don't bother checking if the current version can run tests for now
    if (this.runTests) {
      return super.buildCommand();
    }

    const { result } = await tools.fetchSnapd(`/v2/snaps/${this.toolName}`);

    if (!tools.isRecord(result) || typeof result.version !== "string") {
      throw new Error(`Unable to locate installation of snap ${this.toolName}`);
    }

    const snapcraftVersion = result.version;
    const [snapcraftMajor] = snapcraftVersion.split(".", 1);

    if (!/^\d+$/.test(snapcraftMajor)) {
      throw new Error(
        `Snapd returned an invalid Snapcraft version: ${result.version}`,
      );
    }

    return Number(snapcraftMajor) < 8 ? [this.toolName] : super.buildCommand();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new SnapcraftBuilder({
    ...readBaseInputs(),
    buildInfo: core.getInput("build-info").toLowerCase() === "true",
  });

  void runPackAction(builder);
}
