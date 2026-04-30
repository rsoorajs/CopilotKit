import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import { buildTurns, FRONTEND_TOOL_KEYWORDS } from "./d5-frontend-tools.js";

describe("d5-frontend-tools script", () => {
  it("registers under featureType 'frontend-tools'", () => {
    const script = getD5Script("frontend-tools");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["frontend-tools"]);
    expect(script?.fixtureFile).toBe("frontend-tools.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "frontend-tools",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe("switch theme to dark mode");
  });

  it("FRONTEND_TOOL_KEYWORDS includes 'dark mode'", () => {
    expect(FRONTEND_TOOL_KEYWORDS).toContain("dark mode");
  });
});
