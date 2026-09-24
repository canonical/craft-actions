import { CraftBuilder } from "@craft-actions/common/craft-builder.ts";
import {
  readBaseInputs,
  runPackAction,
} from "@craft-actions/common/pack-action.ts";

export class ImagecraftBuilder extends CraftBuilder {
  toolName = "imagecraft";
  artifactOutput = { artifactType: ".img", outputName: "images" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new ImagecraftBuilder({
    ...readBaseInputs(),
    // no test command on imagecraft yet
    runTests: false,
  });

  void runPackAction(builder);
}
