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

function makePage(opts: FakeOpts): {
  page: Page;
  /** Inject as the `click` option to `buildAuthAssertion` so the fake
   *  page's `clicked` flag flips when the assertion tries to sign out. */
  fakeClick: (p: Page, sel: string) => Promise<void>;
} {
  let clicked = false;
  const page: Page = {
    async waitForSelector() {
      if (!opts.signOutButtonVisible) {
        throw new Error("waitForSelector timeout (test fake)");
      }
    },
    async fill() {},
    async press() {},
    async evaluate() {
      // probeErrorSurfaceVisible polls this — returns true when the
      // error surface should be visible (after click + opts say yes).
      return (clicked && (opts.errorAfterClick ?? true)) as never;
    },
  };
  const fakeClick = async (_p: Page, _sel: string): Promise<void> => {
    clicked = true;
  };
  return { page, fakeClick };
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
    expect(SIGN_OUT_BUTTON_SELECTOR).toBe(
      '[data-testid="auth-sign-out-button"]',
    );
    expect(ERROR_BANNER_SELECTOR).toBe('[data-testid="auth-demo-error"]');
    expect(ERROR_BOUNDARY_SELECTOR).toBe(
      '[data-testid="auth-demo-chat-boundary"]',
    );
  });

  it("assertion fails when sign-out button is not visible", async () => {
    const { page, fakeClick } = makePage({ signOutButtonVisible: false });
    const assertion = buildAuthAssertion({
      signOutTimeoutMs: 50,
      click: fakeClick,
    });
    await expect(assertion(page)).rejects.toThrow(/sign-out button.*not visible/);
  });

  it("assertion fails when error surfaces never appear after sign-out", async () => {
    const { page, fakeClick } = makePage({
      signOutButtonVisible: true,
      errorAfterClick: false,
    });
    const assertion = buildAuthAssertion({
      signOutTimeoutMs: 50,
      click: fakeClick,
    });
    await expect(assertion(page)).rejects.toThrow(/neither.*appeared/);
  });

  it("assertion succeeds when error banner appears after sign-out", async () => {
    const { page, fakeClick } = makePage({
      signOutButtonVisible: true,
      errorAfterClick: true,
    });
    const assertion = buildAuthAssertion({ click: fakeClick });
    await expect(assertion(page)).resolves.toBeUndefined();
  });
});
