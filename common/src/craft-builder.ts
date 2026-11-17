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

export interface ArtifactOutput {
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
  abstract artifactOutput: ArtifactOutput;

  secondaryArtifactOutputs: ArtifactOutput[] = [];

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

  // Overridden by subclasses to inject tool-specific environment variables.
  protected buildEnv(): Record<string, string> {
    return {};
  }

  // sudo-rs (Ubuntu 26.04+) ignores --preserve-env, so the craft variables have
  // to be passed to the tool explicitly. Match the generic CRAFT_ prefix and
  // the tool's own prefix (SNAPCRAFT_, ROCKCRAFT_, ...).
  protected craftEnv(): Record<string, string> {
    const toolPrefix = `${this.toolName.toUpperCase()}_`;
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (
        value !== undefined &&
        (key.startsWith("CRAFT_") || key.startsWith(toolPrefix))
      ) {
        env[key] = value;
      }
    }
    return { ...env, ...this.buildEnv() };
  }

  protected async doPack(): Promise<void> {
    const command = await this.buildCommand();
    const packArgs = await this.buildPackArgs();
    const env = this.craftEnv();
    await tools.runCommand(
      [
        "sudo",
        "--user",
        tools.shellUser(),
        "env",
        ...Object.entries(env).map(([key, value]) => `${key}=${value}`),
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

  async findArtifacts(extension: string): Promise<string[]> {
    const files = await fs.promises.readdir(this.projectRoot);
    const artifacts = files
      .filter((name) => name.endsWith(extension))
      .sort()
      .map((name) => path.join(this.projectRoot, name));

    return artifacts;
  }
}
