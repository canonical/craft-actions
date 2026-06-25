import * as esbuild from "esbuild";

const [entryPoint, outfile] = process.argv.slice(2);

if (!entryPoint || !outfile) {
  console.error("Usage: node build.mjs <entryPoint> <outfile>");
  process.exit(1);
}

await esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  outfile,
  banner: {
    js: "import { createRequire as __require__ } from 'module'; globalThis.require = __require__(import.meta.url);",
  },
});
