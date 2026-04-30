import { describe, it, expect } from "vitest";
import { getD5Script, type D5BuildContext } from "../helpers/d5-registry.js";
import type { Page } from "../helpers/conversation-runner.js";
import {
  buildTurns,
  buildAuthAssertion,
  SIGN_OUT_BUTTON_SELECTOR,
  ERROR_BANNER_SELECTOR,
  ERROR_BOUNDARY_SELECTOR,
} from "./d5-auth.js";

interface FakeOpts {
  signOutButtonVisible?: boolean;
  errorAfterClick?: boolean;
}

function makePage(opts: FakeOpts): Page & { click: (s: string) => Promise<void> } {
  let clicked = false;
  return {
    async waitForSelector() {
      if (!opts.signOutButtonVisible) {
        throw new Error("waitForSelector timeout (test fake)");
      }
    },
    async fill() {},
    async press() {},
    async evaluate() {
      // After click, simulate the error surface appearing.
      return (clicked && (opts.errorAfterClick ?? true)) as never;
    },
    async click() {
      clicked = true;
    },
  };
}

describe("d5-auth script", () => {
  it("registers under featureType 'auth'", () => {
    const script = getD5Script("auth");
    expect(script).toBeDefined();
    expect(script?.featureTypes).toEqual(["auth"]);
    expect(script?.fixtureFile).toBe("auth.json");
  });

  it("buildTurns input matches fixture", () => {
    const ctx: D5BuildContext = {
      integrationSlug: "langgraph-python",
      featureType: "auth",
      baseUrl: "https://x.test",
    };
    expect(buildTurns(ctx)[0]!.input).toBe("auth check turn 1");
  });

  it("exposes the sign-out + error selectors", () => {
    expect(SIGN_OUT_BUTTON_SELECTOR).toBe('[data-testid="auth-sign-out-button"]');
    expect(ERROR_BANNER_SELECTOR).toBe('[data-testid="auth-demo-error"]');
    expect(ERROR_BOUNDARY_SELECTOR).toBe(
      '[data-testid="auth-demo-chat-boundary"]',
    );
  });

  it("assertion fails when sign-out button is not visible", async () => {
    const assertion = buildAuthAssertion({ signOutTimeoutMs: 50 });
    await expect(
      assertion(makePage({ signOutButtonVisible: false })),
    ).rejects.toThrow(/sign-out button.*not visible/);
  });

  it("assertion fails when error surfaces never appear after sign-out", async () => {
    const assertion = buildAuthAssertion({ signOutTimeoutMs: 50 });
    await expect(
      assertion(
        makePage({ signOutButtonVisible: true, errorAfterClick: false }),
      ),
    ).rejects.toThrow(/neither.*appeared/);
  });

  it("assertion succeeds when error banner appears after sign-out", async () => {
    const assertion = buildAuthAssertion();
    await expect(
      assertion(
        makePage({ signOutButtonVisible: true, errorAfterClick: true }),
      ),
    ).resolves.toBeUndefined();
  });
});
