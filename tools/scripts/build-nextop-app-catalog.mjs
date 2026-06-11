#!/usr/bin/env node
import { pathToFileURL } from "node:url";

export {
  buildNextopAppCatalog,
  main
} from "../../packages/workspace/app-release-tools/bin/build-nextop-app-catalog.mjs";

import { main } from "../../packages/workspace/app-release-tools/bin/build-nextop-app-catalog.mjs";

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
