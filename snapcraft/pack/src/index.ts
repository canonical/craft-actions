import {
  CraftBuilder,
  CraftBuilderOptions,
} from "@craft-actions/common/craft-builder.ts";
import {
  readBaseInputs,
  runPackAction,
} from "@craft-actions/common/pack-action.ts";
import * as tools from "@craft-actions/common/tools.ts";

export class SnapcraftBuilder extends CraftBuilder {
  toolName = "snapcraft";
  artifactType = ".snap";
  secondaryArtifactOutputs = [
    { artifactType: ".comp", outputName: "components" },
  ];

  constructor(options: CraftBuilderOptions) {
    super(options);
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
  });

  void runPackAction(builder, "snap");
}
