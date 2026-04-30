import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import {
  buildTurns,
  RENDERED_KEYWORDS,
  COMPLETE_KEYWORDS,
} from "./d5-gen-ui-interrupt.js";

describe("d5-gen-ui-interrupt script", () => {
  it("registers under featureType 'gen-ui-interrupt'", () => {
    const script = getD5Script("gen-ui-interrupt");
    expect(script).toBeDefined();
    expect(script?.fixtureFile).toBe("gen-ui-interrupt.json");
  });

  it("buildTurns produces two turns covering render + complete", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "gen-ui-interrupt",
      baseUrl: "https://x.test",
    };
    const turns = buildTurns(ctx);
    expect(turns).toHaveLength(2);
    expect(turns[0]!.input).toBe("request the gen-ui interrupt");
    expect(turns[1]!.input).toBe("confirm the gen-ui choice");
  });

  it("RENDERED_KEYWORDS and COMPLETE_KEYWORDS are populated", () => {
    expect(RENDERED_KEYWORDS.length).toBeGreaterThan(0);
    expect(COMPLETE_KEYWORDS).toContain("resumed");
  });
});
