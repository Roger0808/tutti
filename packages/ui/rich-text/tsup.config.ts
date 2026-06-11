import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "editor/index": "src/editor/index.ts",
    "plugins/index": "src/plugins/index.ts",
    "types/index": "src/types/index.ts"
  },
  format: ["esm"],
  sourcemap: true
});
