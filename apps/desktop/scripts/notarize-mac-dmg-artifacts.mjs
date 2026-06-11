import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const requiredNotarizationEnv = [
  "APPLE_API_KEY",
  "APPLE_API_KEY_ID",
  "APPLE_API_ISSUER"
];

function hasNotarizationEnvironment() {
  return requiredNotarizationEnv.every((name) => Boolean(process.env[name]));
}

function log(message) {
  console.log(`[notarize-dmg] ${message}`);
}

async function run(command, args, label) {
  log(label ?? `${command} ${args.join(" ")}`);
  const { stdout, stderr } = await execFileAsync(command, args, {
    maxBuffer: 1024 * 1024 * 20
  });
  if (stdout.trim()) {
    console.log(stdout.trim());
  }
  if (stderr.trim()) {
    console.error(stderr.trim());
  }
}

function resolveDmgArtifactPaths(buildResult) {
  return [
    ...new Set(
      (buildResult.artifactPaths ?? []).filter((filePath) =>
        filePath.endsWith(".dmg")
      )
    )
  ].sort();
}

async function notarizeDmg(dmgPath) {
  const displayName = path.basename(dmgPath);
  await run(
    "xcrun",
    [
      "notarytool",
      "submit",
      dmgPath,
      "--key",
      process.env.APPLE_API_KEY,
      "--key-id",
      process.env.APPLE_API_KEY_ID,
      "--issuer",
      process.env.APPLE_API_ISSUER,
      "--wait"
    ],
    `xcrun notarytool submit ${displayName} --wait`
  );
  await run("xcrun", ["stapler", "staple", "-v", dmgPath]);
  await run("xcrun", ["stapler", "validate", dmgPath]);
  await run("spctl", ["-a", "-vv", "-t", "install", dmgPath]);
}

export default async function notarizeMacDmgArtifacts(buildResult) {
  if (process.platform !== "darwin" || !hasNotarizationEnvironment()) {
    return [];
  }

  for (const dmgPath of resolveDmgArtifactPaths(buildResult)) {
    await notarizeDmg(dmgPath);
  }

  return [];
}
