import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import { buildTurns, ASYNC_TOOL_KEYWORDS } from "./d5-frontend-tools-async.js";

describe("d5-frontend-tools-async script", () => {
  it("registers under featureType 'frontend-tools-async'", () => {
    const script = getD5Script("frontend-tools-async");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["frontend-tools-async"]);
    expect(script?.fixtureFile).toBe("frontend-tools-async.json");
  });

  it("buildTurns input matches fixture and bumps responseTimeoutMs for async settle", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "frontend-tools-async",
      baseUrl: "https://x.test",
    };
    const turn = buildTurns(ctx)[0]!;
    expect(turn.input).toBe("fetch the async metric");
    expect(turn.responseTimeoutMs).toBeGreaterThan(30_000);
  });

  it("ASYNC_TOOL_KEYWORDS includes 'async'", () => {
    expect(ASYNC_TOOL_KEYWORDS).toContain("async");
  });
});
