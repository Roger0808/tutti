import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "index.ts",
    "workbench/index": "workbench/index.ts"
  },
  external: ["react", "react-dom"],
  format: ["esm"],
  sourcemap: true
});
