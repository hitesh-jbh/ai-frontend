const fs = require("fs");
const os = require("os");
const path = require("path");

const GRADLE_CACHES_DIR = path.join(os.homedir(), ".gradle", "caches");
const NEEDLES = [
  // RN 0.81+ (seen in graphicsConversions.h)
  'return std::format("{}%", dimension.value);',
];

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip a few very large / irrelevant dirs quickly
      if (entry.name === "modules-2") continue;
      yield* walk(full);
    } else if (entry.isFile() && entry.name === "graphicsConversions.h") {
      yield full;
    }
  }
}

function patchFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const matchedNeedle = NEEDLES.find((n) => src.includes(n));
  if (!matchedNeedle) return false;

  const replaced = src.replace(
    matchedNeedle,
    [
      "std::array<char, 64> buffer{};",
      'std::snprintf(buffer.data(), buffer.size(), "%g%%", dimension.value);',
      "return std::string(buffer.data());",
    ].join("\n      ")
  );

  if (replaced === src) return false;
  fs.writeFileSync(filePath, replaced, "utf8");
  return true;
}

function main() {
  if (!fs.existsSync(GRADLE_CACHES_DIR)) {
    console.log(`[patch] Gradle caches not found at ${GRADLE_CACHES_DIR}`);
    return;
  }

  let patchedCount = 0;
  let scanned = 0;

  for (const filePath of walk(GRADLE_CACHES_DIR)) {
    scanned += 1;
    // Only patch the React Android prefab header copies.
    if (
      !filePath.includes(`${path.sep}transforms${path.sep}`) ||
      !filePath.includes(`${path.sep}prefab${path.sep}modules${path.sep}`) ||
      !filePath.includes(`${path.sep}reactnative${path.sep}include${path.sep}`) ||
      !filePath.includes(`${path.sep}react${path.sep}renderer${path.sep}core${path.sep}`) ||
      !filePath.includes(`react-android-`)
    ) {
      continue;
    }
    if (patchFile(filePath)) patchedCount += 1;
  }

  if (patchedCount > 0) {
    console.log(
      `[patch] Patched std::format in ${patchedCount} file(s) (scanned ${scanned}).`
    );
  } else {
    console.log(`[patch] No std::format occurrences found to patch.`);
  }
}

main();

