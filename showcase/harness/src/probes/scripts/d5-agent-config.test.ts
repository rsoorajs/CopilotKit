import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import type { Page } from "../helpers/conversation-runner.js";
import {
  buildTurns,
  buildAgentConfigAssertion,
  CONFIG_KEYWORDS,
} from "./d5-agent-config.js";

function makePage(transcript: string): Page {
  return {
    async waitForSelector() {},
    async fill() {},
    async press() {},
    async evaluate() {
      return transcript as never;
    },
  };
}

describe("d5-agent-config script", () => {
  it("registers under featureType 'agent-config'", () => {
    const script = getD5Script("agent-config");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["agent-config"]);
    expect(script?.fixtureFile).toBe("agent-config.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "langgraph-python",
      featureType: "agent-config",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe(
      "introduce yourself per your config",
    );
  });

  it("CONFIG_KEYWORDS lists the three forwarded properties", () => {
    expect(CONFIG_KEYWORDS).toEqual(["tone", "expertise", "responselength"]);
  });

  it("assertion fails when transcript missing keywords", async () => {
    const assertion = buildAgentConfigAssertion({ timeoutMs: 50 });
    await expect(assertion(makePage("just plain text"))).rejects.toThrow(
      /missing config keyword/,
    );
  });

  it("assertion succeeds when transcript contains all keywords", async () => {
    const assertion = buildAgentConfigAssertion();
    // Real evaluate strips whitespace + lowercases inside the browser; the
    // test fake bypasses that, so we pass the post-processed shape.
    await expect(
      assertion(
        makePage("operatingwiththeconfiguredtoneexpertiseandresponselength"),
      ),
    ).resolves.toBeUndefined();
  });
});
