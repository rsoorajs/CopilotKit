import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import type { Page } from "../helpers/conversation-runner.js";
import {
  buildTurns,
  buildChatCssAssertion,
  validateChatCss,
  USER_BUBBLE_SELECTOR,
  ASSISTANT_BUBBLE_SELECTOR,
} from "./d5-chat-css.js";

function makePage(probe: unknown, opts: { throwOnWait?: boolean } = {}): Page {
  return {
    async waitForSelector() {
      if (opts.throwOnWait)
        throw new Error("waitForSelector timeout (test fake)");
    },
    async fill() {},
    async press() {},
    async evaluate() {
      return probe as never;
    },
  };
}

describe("d5-chat-css script", () => {
  it("registers under featureType 'chat-css' with the canonical fixture file", () => {
    const script = getD5Script("chat-css");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["chat-css"]);
    expect(script?.fixtureFile).toBe("chat-css.json");
  });

  it("buildTurns produces one turn whose input matches the fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "langgraph-python",
      featureType: "chat-css",
      baseUrl: "https://example.test",
    };
    const turns = buildTurns(ctx);
    expect(turns).toHaveLength(1);
    expect(turns[0]!.input).toBe("verify the css theme rendering");
  });

  it("exposes the bubble selectors", () => {
    expect(USER_BUBBLE_SELECTOR).toBe(
      ".copilotKitMessage.copilotKitUserMessage",
    );
    expect(ASSISTANT_BUBBLE_SELECTOR).toBe(
      ".copilotKitMessage.copilotKitAssistantMessage",
    );
  });

  describe("validateChatCss", () => {
    it("returns null when both bubbles carry the expected RGB anchors", () => {
      expect(
        validateChatCss({
          userBg:
            "linear-gradient(135deg, rgb(255, 0, 110) 0%, rgb(194, 24, 91) 100%) rgba(0, 0, 0, 0)",
          assistantBg: "rgb(253, 224, 71)",
        }),
      ).toBeNull();
    });

    it("returns error when user bubble missing red anchor", () => {
      expect(
        validateChatCss({
          userBg: "rgb(0, 0, 255)",
          assistantBg: "rgb(253, 224, 71)",
        }),
      ).toMatch(/red\/pink anchor/);
    });

    it("returns error when assistant bubble missing yellow anchor", () => {
      expect(
        validateChatCss({
          userBg: "rgb(255, 0, 110)",
          assistantBg: "rgb(255, 255, 255)",
        }),
      ).toMatch(/yellow\/amber anchor/);
    });

    it("returns error when bubbles missing entirely", () => {
      expect(validateChatCss({ userBg: null, assistantBg: null })).toMatch(
        /user bubble.*not found/,
      );
    });
  });

  it("assertion fails when assistant bubble selector never appears", async () => {
    const assertion = buildChatCssAssertion({ waitTimeoutMs: 50 });
    await expect(
      assertion(makePage(null, { throwOnWait: true })),
    ).rejects.toThrow(/assistant bubble selector/);
  });

  it("assertion succeeds when computed colors match", async () => {
    const assertion = buildChatCssAssertion();
    await expect(
      assertion(
        makePage({
          userBg:
            "linear-gradient(135deg, rgb(255, 0, 110) 0%, rgb(194, 24, 91) 100%)",
          assistantBg: "rgb(253, 224, 71)",
        }),
      ),
    ).resolves.toBeUndefined();
  });
});
