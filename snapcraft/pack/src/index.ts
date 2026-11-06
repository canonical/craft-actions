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
    this.buildInfo = options.buildInfo ?? true;
  }

  protected override buildEnv(): Record<string, string> {
    if (!this.buildInfo) {
      return {};
    }

    // Snapcraft rejects a non-dict SNAPCRAFT_IMAGE_INFO, so serialize an object.
    const imageInfo: Record<string, string> = {};
    const { GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
    if (GITHUB_REPOSITORY && GITHUB_RUN_ID) {
      imageInfo.build_url = `https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
    }

    return {
      SNAPCRAFT_BUILD_INFO: "1",
      SNAPCRAFT_IMAGE_INFO: JSON.stringify(imageInfo),
    };
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
    buildInfo: core.getInput("build-info").toLowerCase() !== "false",
  });

  void runPackAction(builder);
}
