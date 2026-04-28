import * as fs from "node:fs";
import * as path from "node:path";

export interface PinViolation {
  integration: string;
  dep: string;
  pinned: string;
  reason: "stale" | "floating-tag" | "non-exact";
}

export interface ValidateOptions {
  expectedVersion: string;
  integrationsDir: string;
}

const STABLE_SEMVER = /^\d+\.\d+\.\d+$/;
const PRE_RELEASE = /-/;
const COPILOTKIT_SCOPE = "@copilotkit/";

export function validatePins({
  expectedVersion,
  integrationsDir,
}: ValidateOptions): PinViolation[] {
  const violations: PinViolation[] = [];
  const entries = fs.readdirSync(integrationsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(integrationsDir, entry.name, "package.json");
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const allDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };

    for (const [dep, value] of Object.entries(allDeps)) {
      if (!dep.startsWith(COPILOTKIT_SCOPE)) continue;
      const pinned = value as string;

      // Pre-release pins (e.g. 0.0.0-ag-ui-pre-x) are intentional opt-outs.
      if (PRE_RELEASE.test(pinned)) continue;

      if (!STABLE_SEMVER.test(pinned)) {
        violations.push({
          integration: entry.name,
          dep,
          pinned,
          reason: pinned === "latest" || pinned === "next" ? "floating-tag" : "non-exact",
        });
        continue;
      }

      if (pinned !== expectedVersion) {
        violations.push({
          integration: entry.name,
          dep,
          pinned,
          reason: "stale",
        });
      }
    }
  }

  return violations;
}

export function formatViolations(
  violations: PinViolation[],
  expectedVersion: string,
): string {
  if (violations.length === 0) return "";
  const lines = violations.map(
    (v) =>
      `  [${v.reason}] ${v.integration}: ${v.dep}@${v.pinned} (expected ${expectedVersion})`,
  );
  return `Found ${violations.length} stale pin(s):\n${lines.join("\n")}`;
}
