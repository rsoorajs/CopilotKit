/**
 * D5 — auth script.
 *
 * Drives `/demos/auth` through one user turn, then in the post-settle
 * assertion clicks the sign-out button and waits for the auth-error
 * surface to render. The demo (see
 * `showcase/integrations/langgraph-python/src/app/demos/auth/page.tsx`)
 * authenticates by default. After sign-out the next runtime request
 * 401s, surfacing as `[data-testid="auth-demo-error"]` (red banner) or
 * `[data-testid="auth-demo-chat-boundary"]` (chat error boundary). The
 * assertion passes if EITHER surface appears — proves the auth gate
 * actually rejects post-sign-out activity.
 *
 * One conversation turn is enough: the auth state flip happens entirely
 * inside the assertion, so the runner doesn't need a turn 2 to observe
 * it. (A second turn would race the runner's fill/press against a
 * possibly-replaced chat surface.)
 */

import {
  registerD5Script,
  type D5BuildContext,
} from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

export const SIGN_OUT_BUTTON_SELECTOR = '[data-testid="auth-sign-out-button"]';
export const ERROR_BANNER_SELECTOR = '[data-testid="auth-demo-error"]';
export const ERROR_BOUNDARY_SELECTOR =
  '[data-testid="auth-demo-chat-boundary"]';

const POST_SIGN_OUT_TIMEOUT_MS = 8_000;
const POLL_INTERVAL_MS = 200;

/** Probe whether either error surface is currently visible. */
async function probeErrorSurfaceVisible(page: Page): Promise<boolean> {
  return (await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: {
        querySelector(sel: string): unknown;
      };
    };
    return Boolean(
      win.document.querySelector('[data-testid="auth-demo-error"]') ||
      win.document.querySelector('[data-testid="auth-demo-chat-boundary"]'),
    );
  })) as boolean;
}

export interface AuthAssertionOpts {
  /** Override the post-sign-out wait. Tests use a short value. */
  signOutTimeoutMs?: number;
  /** Click handler injection — page.click() isn't on the structural Page
   * type the runner uses. We expose a hook here so tests can simulate
   * the click without a real Playwright page. */
  click?: (page: Page, selector: string) => Promise<void>;
}

/** Default click implementation: assumes the underlying Page has a
 *  `click()` method (real Playwright Page satisfies this). Uses
 *  `force: true` to bypass actionability checks — the dev `<cpk-web-inspector>`
 *  overlay intercepts pointer events on the auth demo, making a normal
 *  click time out even though the button is visible and enabled. */
const defaultClick = async (page: Page, selector: string): Promise<void> => {
  // Real playwright.Page has click(); structurally we cast through.
  const clickable = page as unknown as {
    click: (
      sel: string,
      opts?: { timeout?: number; force?: boolean },
    ) => Promise<void>;
  };
  if (typeof clickable.click !== "function") {
    throw new Error(
      "auth: page does not support click() — cannot simulate sign-out",
    );
  }
  await clickable.click(selector, { timeout: 5_000, force: true });
};

export function buildAuthAssertion(
  opts: AuthAssertionOpts = {},
): (page: Page) => Promise<void> {
  const timeout = opts.signOutTimeoutMs ?? POST_SIGN_OUT_TIMEOUT_MS;
  const click = opts.click ?? defaultClick;
  return async (page: Page): Promise<void> => {
    // Step 1 — click sign-out. If the button isn't present, the demo
    // already lost auth state somehow (or rendered in unauthenticated
    // mode by accident), which is a red.
    try {
      await page.waitForSelector(SIGN_OUT_BUTTON_SELECTOR, {
        state: "visible",
        timeout: 5_000,
      });
    } catch {
      throw new Error(
        `auth: sign-out button ${SIGN_OUT_BUTTON_SELECTOR} not visible — demo did not load in authenticated state`,
      );
    }
    await click(page, SIGN_OUT_BUTTON_SELECTOR);

    // Step 2 — trigger a chat send while signed-out. The auth demo does
    // not auto-refetch /info on header change, so the 401 surface only
    // appears after the next outgoing request. Filling+pressing the
    // chat input is the cheapest way to force one — the request 401s
    // and the demo's onError handler renders the error banner.
    try {
      await page.fill(
        '[data-testid="copilot-chat-textarea"]',
        "post-signout probe",
        { timeout: 2_000 },
      );
      await page.press(
        '[data-testid="copilot-chat-textarea"]',
        "Enter",
        { timeout: 2_000 },
      );
    } catch {
      // Chat input may have already been replaced by the error
      // boundary — that itself satisfies the assertion. Fall through
      // to the surface poll below.
    }

    // Step 3 — wait for either error surface. The probe-send above
    // should 401 within a few hundred ms; budget covers slow CI.
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await probeErrorSurfaceVisible(page)) return;
      await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    throw new Error(
      `auth: after clicking sign-out and triggering a probe send, neither ${ERROR_BANNER_SELECTOR} nor ${ERROR_BOUNDARY_SELECTOR} appeared within ${timeout}ms — auth gate may have regressed`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "auth check turn 1",
      assertions: buildAuthAssertion(),
    },
  ];
}

registerD5Script({
  featureTypes: ["auth"],
  fixtureFile: "auth.json",
  buildTurns,
});
