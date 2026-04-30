import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import { buildTurns, STREAM_KEYWORDS } from "./d5-shared-state-streaming.js";

describe("d5-shared-state-streaming script", () => {
  it("registers under featureType 'shared-state-streaming'", () => {
    const script = getD5Script("shared-state-streaming");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["shared-state-streaming"]);
    expect(script?.fixtureFile).toBe("shared-state-streaming.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "shared-state-streaming",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe("stream the counter to 5");
  });

  it("STREAM_KEYWORDS includes 'counter' and 'stream'", () => {
    expect(STREAM_KEYWORDS).toEqual(["counter", "stream"]);
  });
});
