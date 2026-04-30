import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import {
  buildTurns,
  RAISED_KEYWORDS,
  RESOLVED_KEYWORDS,
} from "./d5-interrupt-headless.js";

describe("d5-interrupt-headless script", () => {
  it("registers under featureType 'interrupt-headless'", () => {
    const script = getD5Script("interrupt-headless");
    expect(script).toBeDefined();
    expect(script?.fixtureFile).toBe("interrupt-headless.json");
  });

  it("buildTurns produces two turns covering raise + resolve", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "interrupt-headless",
      baseUrl: "https://x.test",
    };
    const turns = buildTurns(ctx);
    expect(turns).toHaveLength(2);
    expect(turns[0]!.input).toBe("trigger the headless interrupt");
    expect(turns[1]!.input).toBe("resolve the interrupt with yes");
  });

  it("RAISED_KEYWORDS and RESOLVED_KEYWORDS are populated", () => {
    expect(RAISED_KEYWORDS.length).toBeGreaterThan(0);
    expect(RESOLVED_KEYWORDS.length).toBeGreaterThan(0);
  });
});
