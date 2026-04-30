import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import {
  buildTurns,
  preNavigateRoute,
  HASHBROWN_KEYWORDS,
  JSON_KEYWORDS,
} from "./d5-byoc.js";

describe("d5-byoc script", () => {
  it("registers under featureType 'byoc'", () => {
    const script = getD5Script("byoc");
    expect(script).toBeDefined();
    expect(script?.fixtureFile).toBe("byoc.json");
  });

  it("buildTurns produces two turns covering hashbrown + json", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "byoc",
      baseUrl: "https://x.test",
    };
    const turns = buildTurns(ctx);
    expect(turns).toHaveLength(2);
    expect(turns[0]!.input).toBe("render a byoc hashbrown");
    expect(turns[1]!.input).toBe("render a byoc json");
  });

  it("preNavigateRoute prefers hashbrown when available", () => {
    expect(
      preNavigateRoute("byoc", {
        demos: ["byoc-hashbrown", "byoc-json-render"],
      }),
    ).toBe("/demos/byoc-hashbrown");
  });

  it("preNavigateRoute uses json-render when hashbrown is absent", () => {
    expect(preNavigateRoute("byoc", { demos: ["byoc-json-render"] })).toBe(
      "/demos/byoc-json-render",
    );
  });

  it("keyword sets are populated", () => {
    expect(HASHBROWN_KEYWORDS).toContain("hashbrown");
    expect(JSON_KEYWORDS).toContain("json");
  });
});
