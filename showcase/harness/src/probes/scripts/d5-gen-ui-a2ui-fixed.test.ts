import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import { buildTurns, A2UI_KEYWORDS } from "./d5-gen-ui-a2ui-fixed.js";

describe("d5-gen-ui-a2ui-fixed script", () => {
  it("registers under featureType 'gen-ui-a2ui-fixed'", () => {
    const script = getD5Script("gen-ui-a2ui-fixed");
    expect(script).toBeDefined();
    expect(script?.fixtureFile).toBe("gen-ui-a2ui-fixed.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "gen-ui-a2ui-fixed",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe("render the a2ui schema");
  });

  it("A2UI_KEYWORDS contains 'a2ui'", () => {
    expect(A2UI_KEYWORDS).toContain("a2ui");
  });
});
