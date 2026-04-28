import { afterEach, describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  validatePins,
  formatViolations,
} from "../validate-integration-pins.js";

function makePkg(deps: Record<string, string>): string {
  return JSON.stringify({ name: "fixture", dependencies: deps });
}

function setupFixture(
  integrations: Record<string, Record<string, string>>,
): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "validate-pins-"));
  for (const [name, deps] of Object.entries(integrations)) {
    const dir = path.join(root, name);
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "package.json"), makePkg(deps));
  }
  return root;
}

describe("validatePins", () => {
  let fixtureDir: string;

  afterEach(() => {
    if (fixtureDir) fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  it("returns no violations when every @copilotkit/* dep matches the expected version", () => {
    fixtureDir = setupFixture({
      adk: { "@copilotkit/react-core": "1.56.4" },
      mastra: {
        "@copilotkit/react-core": "1.56.4",
        "@copilotkit/runtime": "1.56.4",
      },
    });
    const violations = validatePins({
      expectedVersion: "1.56.4",
      integrationsDir: fixtureDir,
    });
    expect(violations).toEqual([]);
  });

  it("flags stale exact-pinned versions", () => {
    fixtureDir = setupFixture({
      adk: { "@copilotkit/react-core": "1.55.2" },
      "mcp-apps": { "@copilotkit/runtime": "1.52.1" },
    });
    const violations = validatePins({
      expectedVersion: "1.56.4",
      integrationsDir: fixtureDir,
    });
    expect(violations).toHaveLength(2);
    expect(violations.every((v) => v.reason === "stale")).toBe(true);
  });

  it("flags floating dist-tag pins like 'latest' and 'next'", () => {
    fixtureDir = setupFixture({
      "a2a-middleware": { "@copilotkit/react-core": "latest" },
      showcase: { "@copilotkit/react-ui": "next" },
    });
    const violations = validatePins({
      expectedVersion: "1.56.4",
      integrationsDir: fixtureDir,
    });
    expect(violations).toHaveLength(2);
    expect(violations.every((v) => v.reason === "floating-tag")).toBe(true);
  });

  it("ignores intentional pre-release pins (e.g. ag-ui pre-release tags)", () => {
    fixtureDir = setupFixture({
      "agent-spec": {
        "@copilotkit/react-core": "0.0.0-mme-ag-ui-0-0-46-20260227141603",
      },
    });
    const violations = validatePins({
      expectedVersion: "1.56.4",
      integrationsDir: fixtureDir,
    });
    expect(violations).toEqual([]);
  });

  it("ignores non-@copilotkit dependencies entirely", () => {
    fixtureDir = setupFixture({
      adk: {
        "@copilotkit/react-core": "1.56.4",
        next: "16.1.1",
        "@ag-ui/client": "0.0.52",
      },
    });
    const violations = validatePins({
      expectedVersion: "1.56.4",
      integrationsDir: fixtureDir,
    });
    expect(violations).toEqual([]);
  });

  it("checks devDependencies too", () => {
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-pins-dev-"));
    const dir = path.join(fixtureDir, "adk");
    fs.mkdirSync(dir);
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "adk",
        devDependencies: { "@copilotkit/react-core": "1.55.2" },
      }),
    );
    const violations = validatePins({
      expectedVersion: "1.56.4",
      integrationsDir: fixtureDir,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].dep).toBe("@copilotkit/react-core");
  });

  it("skips integrations without a package.json", () => {
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-pins-skip-"));
    fs.mkdirSync(path.join(fixtureDir, "agentcore"));
    const violations = validatePins({
      expectedVersion: "1.56.4",
      integrationsDir: fixtureDir,
    });
    expect(violations).toEqual([]);
  });
});

describe("formatViolations", () => {
  it("returns an empty string when there are no violations", () => {
    expect(formatViolations([], "1.56.4")).toBe("");
  });

  it("formats violations with reason, dep, and expected version", () => {
    const out = formatViolations(
      [
        { integration: "adk", dep: "@copilotkit/react-core", pinned: "1.55.2", reason: "stale" },
        { integration: "a2a-middleware", dep: "@copilotkit/runtime", pinned: "latest", reason: "floating-tag" },
      ],
      "1.56.4",
    );
    expect(out).toContain("Found 2 stale pin(s)");
    expect(out).toContain("[stale] adk: @copilotkit/react-core@1.55.2");
    expect(out).toContain("[floating-tag] a2a-middleware: @copilotkit/runtime@latest");
    expect(out).toContain("expected 1.56.4");
  });
});

describe("live tree", () => {
  it("examples/integrations/* @copilotkit pins match the monorepo release version", () => {
    const repoRoot = path.resolve(__dirname, "..", "..");
    const reactCorePkg = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "packages", "react-core", "package.json"),
        "utf8",
      ),
    );
    const expectedVersion = reactCorePkg.version;
    const violations = validatePins({
      expectedVersion,
      integrationsDir: path.join(repoRoot, "examples", "integrations"),
    });
    if (violations.length > 0) {
      console.error(formatViolations(violations, expectedVersion));
    }
    expect(violations).toEqual([]);
  });
});
