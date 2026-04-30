import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import { buildTurns, preNavigateRoute, OPEN_KEYWORDS, ADVANCED_KEYWORDS } from "./d5-gen-ui-open.js";

describe("d5-gen-ui-open script", () => {
  it("registers under featureType 'gen-ui-open'", () => {
    const script = getD5Script("gen-ui-open");
    expect(script).toBeDefined();
    expect(script?.fixtureFile).toBe("gen-ui-open.json");
  });

  it("buildTurns produces two turns covering basic + advanced", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "gen-ui-open",
      baseUrl: "https://x.test",
    };
    const turns = buildTurns(ctx);
    expect(turns).toHaveLength(2);
    expect(turns[0]!.input).toBe("render an open gen-ui element");
    expect(turns[1]!.input).toBe("continue the advanced gen-ui flow");
  });

  it("preNavigateRoute prefers /demos/open-gen-ui-advanced when available", () => {
    expect(
      preNavigateRoute("gen-ui-open", {
        demos: ["open-gen-ui", "open-gen-ui-advanced"],
      }),
    ).toBe("/demos/open-gen-ui-advanced");
  });

  it("preNavigateRoute falls back to /demos/open-gen-ui without advanced demo", () => {
    expect(preNavigateRoute("gen-ui-open", { demos: ["open-gen-ui"] })).toBe(
      "/demos/open-gen-ui",
    );
  });

  it("OPEN_KEYWORDS and ADVANCED_KEYWORDS are populated", () => {
    expect(OPEN_KEYWORDS.length).toBeGreaterThan(0);
    expect(ADVANCED_KEYWORDS).toContain("advanced");
  });
});
