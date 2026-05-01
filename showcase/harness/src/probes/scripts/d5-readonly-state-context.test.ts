import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import { buildTurns, CONTEXT_KEYWORDS } from "./d5-readonly-state-context.js";

describe("d5-readonly-state-context script", () => {
  it("registers under featureType 'readonly-state-context'", () => {
    const script = getD5Script("readonly-state-context");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["readonly-state-context"]);
    expect(script?.fixtureFile).toBe("readonly-state-context.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "readonly-state-context",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe("recall the user preference");
  });

  it("CONTEXT_KEYWORDS contains preference and context", () => {
    expect(CONTEXT_KEYWORDS).toEqual(["preference", "context"]);
  });
});
