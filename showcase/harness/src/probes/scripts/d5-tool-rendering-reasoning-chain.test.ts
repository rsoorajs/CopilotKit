import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import {
  buildTurns,
  REASONING_TOOL_KEYWORDS,
} from "./d5-tool-rendering-reasoning-chain.js";

describe("d5-tool-rendering-reasoning-chain script", () => {
  it("registers under featureType 'tool-rendering-reasoning-chain'", () => {
    const script = getD5Script("tool-rendering-reasoning-chain");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["tool-rendering-reasoning-chain"]);
    expect(script?.fixtureFile).toBe("tool-rendering-reasoning-chain.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "tool-rendering-reasoning-chain",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe("analyze data and call the tool");
  });

  it("REASONING_TOOL_KEYWORDS requires both reasoning and tool keywords", () => {
    expect(REASONING_TOOL_KEYWORDS).toContain("reasoning");
    expect(REASONING_TOOL_KEYWORDS).toContain("tool");
  });
});
