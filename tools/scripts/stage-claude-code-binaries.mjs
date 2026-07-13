#!/usr/bin/env node
// Stages zstd-compressed Claude Code native binaries for CDN publishing.
//
// The desktop bundle no longer vendors @anthropic-ai/claude-agent-sdk-<platform>
// (~230MB per platform); tuttid downloads the binary at runtime from
// <cdn>/claude-code/<claudeVersion>/claude-<platform>.zst (see
// services/tuttid/service/agentstatus/claude_binary.go). This script prepares
// exactly that layout from the npm packages pinned by the sidecar:
//
//   1. Resolve the pinned @anthropic-ai/claude-agent-sdk version from
//      packages/agent/claude-sdk-sidecar/package.json.
//   2. npm-pack the SDK, read manifest.json (claude version + per-platform
//      sha256/size of the raw binaries).
//   3. For each platform package: npm-pack, extract the binary, verify its
//      sha256 against the SDK manifest, compress with zstd.
//   4. Emit <out>/<claudeVersion>/claude-<platform>.zst plus a copy of the
//      SDK manifest for observability.
//
// Usage: node tools/scripts/stage-claude-code-binaries.mjs [--out <dir>] [--platforms a,b,c]

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-x64",
  "linux-arm64",
  "win32-x64",
  "win32-arm64"
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

function log(message) {
  process.stderr.write(`[stage-claude-code-binaries] ${message}\n`);
}

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0 || index + 1 >= process.argv.length) {
    return undefined;
  }
  return process.argv[index + 1];
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function npmPack(packageSpec, destination) {
  const output = execFileSync(
    "npm",
    ["pack", packageSpec, "--json", "--pack-destination", destination],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
  );
  const filename = JSON.parse(output)[0]?.filename;
  if (typeof filename !== "string" || filename.length === 0) {
    throw new Error(`npm pack did not return a filename for ${packageSpec}`);
  }
  return join(destination, filename);
}

function extractFromTarball(tarball, memberPath, destinationDir) {
  execFileSync(
    "tar",
    ["-xzf", tarball, "--strip-components=1", "-C", destinationDir, memberPath],
    { stdio: "inherit" }
  );
}

const sidecarPackage = JSON.parse(
  readFileSync(
    join(repoRoot, "packages", "agent", "claude-sdk-sidecar", "package.json"),
    "utf8"
  )
);
const sdkVersion =
  sidecarPackage.dependencies?.["@anthropic-ai/claude-agent-sdk"];
if (typeof sdkVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(sdkVersion)) {
  throw new Error(
    `sidecar must pin an exact @anthropic-ai/claude-agent-sdk version, got: ${sdkVersion}`
  );
}

const outRoot = resolve(
  argValue("--out") ?? join(repoRoot, "dist", "claude-code")
);
const platforms = (argValue("--platforms") ?? DEFAULT_PLATFORMS.join(","))
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const stagingDir = mkdtempSync(join(tmpdir(), "claude-code-stage-"));
try {
  log(`packing @anthropic-ai/claude-agent-sdk@${sdkVersion} for its manifest`);
  const sdkTarball = npmPack(
    `@anthropic-ai/claude-agent-sdk@${sdkVersion}`,
    stagingDir
  );
  const sdkDir = join(stagingDir, "sdk");
  mkdirSync(sdkDir, { recursive: true });
  extractFromTarball(sdkTarball, "package/manifest.json", sdkDir);
  const manifestPath = join(sdkDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const claudeVersion = manifest.version;
  if (typeof claudeVersion !== "string" || claudeVersion.length === 0) {
    throw new Error("SDK manifest.json does not declare a claude version");
  }

  const versionDir = join(outRoot, claudeVersion);
  mkdirSync(versionDir, { recursive: true });
  copyFileSync(manifestPath, join(versionDir, "manifest.json"));

  const staged = [];
  for (const platform of platforms) {
    const platformManifest = manifest.platforms?.[platform];
    if (!platformManifest?.binary || !platformManifest?.checksum) {
      throw new Error(`SDK manifest has no platform entry for ${platform}`);
    }
    const packageSpec = `@anthropic-ai/claude-agent-sdk-${platform}@${sdkVersion}`;
    log(`packing ${packageSpec}`);
    const tarball = npmPack(packageSpec, stagingDir);
    const extractDir = join(stagingDir, platform);
    mkdirSync(extractDir, { recursive: true });
    extractFromTarball(
      tarball,
      `package/${platformManifest.binary}`,
      extractDir
    );
    const binaryPath = join(extractDir, platformManifest.binary);
    const checksum = sha256File(binaryPath);
    if (checksum.toLowerCase() !== platformManifest.checksum.toLowerCase()) {
      throw new Error(
        `sha256 mismatch for ${platform}: got ${checksum}, manifest says ${platformManifest.checksum}`
      );
    }
    const outputPath = join(versionDir, `claude-${platform}.zst`);
    log(`compressing ${platform} binary`);
    execFileSync("zstd", ["-19", "-T0", "-f", "-o", outputPath, binaryPath], {
      stdio: "inherit"
    });
    rmSync(tarball, { force: true });
    rmSync(extractDir, { recursive: true, force: true });
    staged.push({ platform, path: outputPath });
  }

  process.stdout.write(
    JSON.stringify(
      {
        sdkVersion,
        claudeVersion,
        outRoot,
        files: staged.map(({ platform, path }) => ({ platform, path }))
      },
      null,
      2
    ) + "\n"
  );
} finally {
  rmSync(stagingDir, { recursive: true, force: true });
}
