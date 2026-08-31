import * as fs from "fs";
import * as path from "path";
import * as tools from "./tools.ts";

export interface CraftBuilderOptions {
  projectRoot: string;
  channel: string;
  revision: string;
  verbosity: string;
  pro?: string;
  runTests?: boolean;
}

export interface SecondaryArtifactOutput {
  artifactType: string;
  outputName: string;
}

export abstract class CraftBuilder {
  projectRoot: string;
  channel: string;
  revision: string;
  verbosity: string;
  pro: string;
  runTests: boolean;

  abstract toolName: string;
  abstract artifactType: string;

  /**
   * Whether a single pack run may produce multiple primary artifacts.
   * When true, all artifacts are reported space-joined under the output
   * name passed to runPackAction, instead of only the first.
   */
  supportsMultiplePrimaryArtifacts = false;

  secondaryArtifactOutputs: SecondaryArtifactOutput[] = [];

  constructor(options: CraftBuilderOptions) {
    this.projectRoot = tools.expandHome(options.projectRoot);
    this.channel = options.channel;
    this.revision = options.revision;
    this.verbosity = options.verbosity;
    this.pro = options.pro ?? "";
    this.runTests = options.runTests ?? false;
  }

  protected async buildPackArgs(): Promise<string[]> {
    const args: string[] = [];

    if (this.pro) {
      args.push(`--pro=${this.pro}`);
    }

    if (this.verbosity) {
      args.push("--verbosity", this.verbosity);
    }

    return args;
  }

  protected async buildCommand(): Promise<string[]> {
    return [this.toolName, this.runTests ? "test" : "pack"];
  }

  protected async doPack(): Promise<void> {
    const command = await this.buildCommand();
    const packArgs = await this.buildPackArgs();
    await tools.runCommand(
      [
        "sudo",
        "--preserve-env",
        "--user",
        tools.shellUser(),
        ...command,
        ...packArgs,
      ],
      { cwd: this.projectRoot },
    );
  }

  async pack(): Promise<void> {
    if (this.pro) {
      await tools.configureProLXD();
    }
    await this.doPack();
  }

  async #readdir(dir: string): Promise<string[]> {
    return await fs.promises.readdir(dir);
  }

  async findArtifacts(extension: string): Promise<string[]> {
    const files = await this.#readdir(this.projectRoot);
    const artifacts = files
      .filter((name) => name.endsWith(extension))
      .sort()
      .map((name) => path.join(this.projectRoot, name));

    return artifacts;
  }
}
