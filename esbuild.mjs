import { build, context } from "esbuild";

const config = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  minify: true,
};

if (process.argv[process.argv.length - 1] == "dev") {
  context({ ...config,minify: false }).then((ctx) => ctx.watch());
} else {
  build(config);
}
