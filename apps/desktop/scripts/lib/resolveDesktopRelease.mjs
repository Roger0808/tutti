import {
  normalizeReleaseTag,
  normalizeReleaseVersion,
  parseReleaseTag
} from "./releaseConfig.mjs";

function parseStableVersion(value) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

export function parseReleaseVersion(value) {
  const normalized = normalizeReleaseVersion(value);
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-rc\.(0|[1-9]\d*))?$/.exec(
      normalized
    );
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    rc: match[4] === undefined ? null : Number(match[4])
  };
}

export function formatReleaseVersion(version) {
  const stable = `${version.major}.${version.minor}.${version.patch}`;
  return version.rc === null ? stable : `${stable}-rc.${version.rc}`;
}

export function isReleaseCandidateVersion(version) {
  return parseReleaseVersion(formatReleaseVersion(version))?.rc !== null;
}

function toStableVersion(version) {
  return {
    major: version.major,
    minor: version.minor,
    patch: version.patch,
    rc: null
  };
}

function compareStableVersions(left, right) {
  return (
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch
  );
}

function bumpStableVersion(currentVersion, strategy) {
  if (strategy === "patch" || strategy === "patch_rc") {
    return {
      major: currentVersion.major,
      minor: currentVersion.minor,
      patch: currentVersion.patch + 1,
      rc: null
    };
  }
  if (strategy === "minor" || strategy === "minor_rc") {
    return {
      major: currentVersion.major,
      minor: currentVersion.minor + 1,
      patch: 0,
      rc: null
    };
  }
  if (strategy === "major" || strategy === "major_rc") {
    return {
      major: currentVersion.major + 1,
      minor: 0,
      patch: 0,
      rc: null
    };
  }
  return null;
}

function resolveLatestStableVersion(currentVersion, tags) {
  let latestVersion = toStableVersion(currentVersion);

  for (const tag of tags) {
    const parsedVersion = parseReleaseVersion(tag);
    if (!parsedVersion || parsedVersion.rc !== null) {
      continue;
    }
    if (compareStableVersions(parsedVersion, latestVersion) > 0) {
      latestVersion = toStableVersion(parsedVersion);
    }
  }

  return latestVersion;
}

function resolveNextRcVersion(baseVersion, tags) {
  let highestRc = -1;

  for (const tag of tags) {
    const parsedVersion = parseReleaseVersion(tag);
    if (
      !parsedVersion ||
      parsedVersion.rc === null ||
      compareStableVersions(parsedVersion, baseVersion) !== 0
    ) {
      continue;
    }

    highestRc = Math.max(highestRc, parsedVersion.rc);
  }

  return {
    ...baseVersion,
    rc: highestRc + 1
  };
}

function parseExplicitReleaseTag(tag) {
  const parsedTag = parseReleaseTag(tag);
  return parsedTag ? parseReleaseVersion(parsedTag) : null;
}

export function resolveDesktopRelease({
  currentVersion,
  explicitTag = "",
  explicitVersion = "",
  strategy,
  tags = []
}) {
  const parsedCurrentVersion = parseReleaseVersion(currentVersion);
  if (!parsedCurrentVersion) {
    throw new Error(
      `Unsupported package.json version: ${currentVersion || "(empty)"}`
    );
  }

  let releaseVersion;
  if (
    strategy === "patch" ||
    strategy === "minor" ||
    strategy === "major" ||
    strategy === "patch_rc" ||
    strategy === "minor_rc" ||
    strategy === "major_rc"
  ) {
    const latestStableVersion = resolveLatestStableVersion(
      parsedCurrentVersion,
      tags
    );
    const bumpedVersion = bumpStableVersion(latestStableVersion, strategy);
    if (!bumpedVersion) {
      throw new Error(`Unsupported strategy: ${strategy}`);
    }
    releaseVersion = strategy.endsWith("_rc")
      ? resolveNextRcVersion(bumpedVersion, tags)
      : bumpedVersion;
  } else if (strategy === "explicit_version") {
    releaseVersion = parseReleaseVersion(explicitVersion);
    if (!releaseVersion) {
      throw new Error(
        `Invalid release version: ${explicitVersion || "(empty)"}`
      );
    }
  } else if (strategy === "explicit_tag") {
    releaseVersion = parseExplicitReleaseTag(explicitTag);
    if (!releaseVersion) {
      throw new Error(`Invalid release tag: ${explicitTag || "(empty)"}`);
    }
  } else {
    throw new Error(`Unsupported strategy: ${strategy}`);
  }

  const version = formatReleaseVersion(releaseVersion);
  const prerelease = releaseVersion.rc !== null;
  return {
    makeLatest: !prerelease,
    prerelease,
    tag: normalizeReleaseTag(version),
    version
  };
}

export {
  compareStableVersions,
  parseStableVersion,
  resolveLatestStableVersion,
  resolveNextRcVersion
};
