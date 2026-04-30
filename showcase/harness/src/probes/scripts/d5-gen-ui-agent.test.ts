import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import { buildTurns, AGENT_UI_KEYWORDS } from "./d5-gen-ui-agent.js";

describe("d5-gen-ui-agent script", () => {
  it("registers under featureType 'gen-ui-agent'", () => {
    const script = getD5Script("gen-ui-agent");
    expect(script).toBeDefined();
    expect(script?.fixtureFile).toBe("gen-ui-agent.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "gen-ui-agent",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe("have the agent emit a ui");
  });

  it("AGENT_UI_KEYWORDS contains 'emitted'", () => {
    expect(AGENT_UI_KEYWORDS).toContain("emitted");
  });
});
