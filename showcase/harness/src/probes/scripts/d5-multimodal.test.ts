import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import type { Page } from "../helpers/conversation-runner.js";
import {
  buildTurns,
  SAMPLE_IMAGE_BUTTON_SELECTOR,
  SAMPLE_PDF_BUTTON_SELECTOR,
} from "./d5-multimodal.js";

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

describe("d5-multimodal script", () => {
  it("registers under featureType 'multimodal'", () => {
    const script = getD5Script("multimodal");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["multimodal"]);
    expect(script?.fixtureFile).toBe("multimodal.json");
  });

  it("buildTurns produces two turns covering image + PDF", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "langgraph-python",
      featureType: "multimodal",
      baseUrl: "https://x.test",
    };
    const turns = buildTurns(ctx);
    expect(turns).toHaveLength(2);
    expect(turns[0]!.input).toBe("describe the sample image");
    expect(turns[1]!.input).toBe("summarize the sample document");
  });

  it("exposes the sample-button selectors", () => {
    expect(SAMPLE_IMAGE_BUTTON_SELECTOR).toBe(
      '[data-testid="multimodal-sample-image-button"]',
    );
    expect(SAMPLE_PDF_BUTTON_SELECTOR).toBe(
      '[data-testid="multimodal-sample-pdf-button"]',
    );
  });

  it("turn-1 assertion succeeds when transcript references 'image'", async () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "multimodal",
      baseUrl: "https://x.test",
    };
    const turns = buildTurns(ctx);
    await expect(
      turns[0]!.assertions!(
        makePage("the image attachment shows a small abstract test pattern"),
      ),
    ).resolves.toBeUndefined();
  });

  it("turn-1 assertion fails when transcript lacks 'image'", async () => {
    const ctx: D5BuildContext = {
      integrationSlug: "x",
      featureType: "multimodal",
      baseUrl: "https://x.test",
    };
    const turns = buildTurns(ctx);
    // The internal poll deadline is 5s; raise the vitest timeout so
    // the assertion has time to exhaust its budget and throw the
    // missing-keyword error.
    await expect(
      turns[0]!.assertions!(makePage("nothing here")),
    ).rejects.toThrow(/missing keyword "image"/);
  }, 8_000);
});
