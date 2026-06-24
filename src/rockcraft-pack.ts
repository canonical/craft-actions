import * as core from "@actions/core";
import { CraftBuilder, CraftBuilderOptions } from "./craft-builder";
import { readBaseInputs, runPackAction } from "./pack-action";

export interface RockcraftBuilderOptions extends CraftBuilderOptions {
  ignore: string;
}

export class RockcraftBuilder extends CraftBuilder {
  toolName = "rockcraft";
  artifactType = ".rock";
  ignore: string;

  constructor(options: RockcraftBuilderOptions) {
    super(options);
    this.ignore = options.ignore;
  }

  protected async buildPackArgs(): Promise<string[]> {
    const args = await super.buildPackArgs();

    if (this.ignore) {
      args.push(`--ignore=${this.ignore}`);
    }

    return args;
  }
}

if (require.main === module) {
  const builder = new RockcraftBuilder({
    ...readBaseInputs("rockcraft-channel"),
    ignore: core.getInput("ignore"),
  });

  void runPackAction(builder, "rock");
}
