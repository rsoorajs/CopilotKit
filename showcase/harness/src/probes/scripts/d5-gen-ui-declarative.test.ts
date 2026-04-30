import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import { buildTurns, DECLARATIVE_KEYWORDS } from "./d5-gen-ui-declarative.js";

describe("d5-gen-ui-declarative script", () => {
  it("registers under featureType 'gen-ui-declarative'", () => {
    const script = getD5Script("gen-ui-declarative");
    expect(script).toBeDefined();
    expect(script?.fixtureFile).toBe("gen-ui-declarative.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "gen-ui-declarative",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe("render the declarative card");
  });

  it("DECLARATIVE_KEYWORDS contains 'declarative'", () => {
    expect(DECLARATIVE_KEYWORDS).toContain("declarative");
  });
});
