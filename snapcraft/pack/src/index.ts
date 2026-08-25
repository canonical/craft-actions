import {
  CraftBuilder,
  CraftBuilderOptions,
} from "@craft-actions/common/craft-builder.ts";
import {
  readBaseInputs,
  runPackAction,
} from "@craft-actions/common/pack-action.ts";

export class SnapcraftBuilder extends CraftBuilder {
  toolName = "snapcraft";
  artifactType = ".snap";

  constructor(options: CraftBuilderOptions) {
    super(options);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new SnapcraftBuilder({
    ...readBaseInputs(),
  });

  void runPackAction(builder, "snap");
}
