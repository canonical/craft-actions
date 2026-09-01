import { CraftBuilder } from "@craft-actions/common/craft-builder.ts";
import {
  readBaseInputs,
  runPackAction,
} from "@craft-actions/common/pack-action.ts";

export class CharmcraftBuilder extends CraftBuilder {
  toolName = "charmcraft";
  artifactOutput = { artifactType: ".charm", outputName: "charms" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new CharmcraftBuilder({
    ...readBaseInputs(),
  });

  void runPackAction(builder);
}
