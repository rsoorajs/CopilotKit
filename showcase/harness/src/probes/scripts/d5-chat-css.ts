/**
 * D5 — chat-css script.
 *
 * Drives `/demos/chat-customization-css` through one user turn and
 * verifies the demo's CSS theme is actually applied in the browser by
 * reading computed styles on the user-message and assistant-message
 * bubbles. The demo (see
 * `showcase/integrations/langgraph-python/src/app/demos/chat-customization-css/theme.css`)
 * paints user bubbles with a hot-pink gradient (`#ff006e` → `#c2185b`)
 * and assistant bubbles with amber (`#fde047`). A failure here means
 * either the CSS import broke, the `chat-css-demo-scope` wrapper class
 * was lost, or the upstream `.copilotKit*` class names drifted.
 *
 * Assertions look for the substantive theme color signature:
 *   - user bubble's background contains `255, 0, 110` (the pink/red rgb
 *     anchor) — gradient resolves to either `linear-gradient(...)` or to
 *     a flattened color depending on browser
 *   - assistant bubble's background resolves to `rgb(253, 224, 71)` (amber)
 *
 * One turn matches the recorded fixture (`chat-css.json`).
 */

import { registerD5Script } from "../helpers/d5-registry.js";
import type { D5BuildContext, D5FeatureType } from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

/** Default `/demos/<featureType>` would be `/demos/chat-css` which does
 *  not exist — the actual route uses the registry-id `chat-customization-css`. */
export function preNavigateRoute(_ft: D5FeatureType): string {
  return "/demos/chat-customization-css";
}

/** User-bubble selector used by both the runner's settle poll and the
 *  computed-style probe. */
export const USER_BUBBLE_SELECTOR = ".copilotKitMessage.copilotKitUserMessage";
/** Assistant-bubble selector. */
export const ASSISTANT_BUBBLE_SELECTOR =
  ".copilotKitMessage.copilotKitAssistantMessage";

/** Hot-pink rgb anchor present in the user-bubble gradient (#ff006e). */
const USER_RGB_FRAGMENT = "255, 0, 110";
/** Amber rgb on the assistant bubble (#fde047). */
const ASSISTANT_RGB_FRAGMENT = "253, 224, 71";

const PROBE_TIMEOUT_MS = 5_000;

/**
 * Probe-result shape: per-bubble computed background string. `null` means
 * the selector didn't match, which the assertion treats as
 * "missing bubble" — distinct from "matched but wrong color".
 */
export interface ChatCssProbeResult {
  userBg: string | null;
  assistantBg: string | null;
}

/** Read computed `background` / `background-color` for both bubbles
 *  inside the demo scope.
 *
 *  Notes on the page.evaluate body shape:
 *  - We do NOT declare local const-arrows or TS interfaces inside the
 *    evaluated function. tsx (esbuild) injects a `__name(fn, "fn")`
 *    helper to attach names for error stack frames; that helper is
 *    not defined in the browser, so any tagged-name emit causes
 *    `ReferenceError: __name is not defined` at evaluate time.
 *  - Inline-only style (single returns, no helpers) keeps the
 *    transpiled output free of __name calls. */
export async function probeChatCss(page: Page): Promise<ChatCssProbeResult> {
  return (await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: { querySelector(sel: string): unknown };
      getComputedStyle(el: unknown): {
        background?: string;
        backgroundColor?: string;
      };
    };
    const userEl = win.document.querySelector(
      ".copilotKitMessage.copilotKitUserMessage",
    );
    const assistantEl = win.document.querySelector(
      ".copilotKitMessage.copilotKitAssistantMessage",
    );
    const userBg = userEl
      ? `${win.getComputedStyle(userEl).background ?? ""} ${win.getComputedStyle(userEl).backgroundColor ?? ""}`.trim()
      : null;
    const assistantBg = assistantEl
      ? `${win.getComputedStyle(assistantEl).background ?? ""} ${win.getComputedStyle(assistantEl).backgroundColor ?? ""}`.trim()
      : null;
    return { userBg, assistantBg };
  })) as ChatCssProbeResult;
}

/** Validate the probe — returns null on pass, error string on fail. */
export function validateChatCss(probe: ChatCssProbeResult): string | null {
  if (probe.userBg === null) {
    return `chat-css: user bubble (${USER_BUBBLE_SELECTOR}) not found in DOM`;
  }
  if (probe.assistantBg === null) {
    return `chat-css: assistant bubble (${ASSISTANT_BUBBLE_SELECTOR}) not found in DOM`;
  }
  if (!probe.userBg.includes(USER_RGB_FRAGMENT)) {
    return `chat-css: user bubble background missing red/pink anchor (${USER_RGB_FRAGMENT}) — got "${probe.userBg.slice(0, 200)}"`;
  }
  if (!probe.assistantBg.includes(ASSISTANT_RGB_FRAGMENT)) {
    return `chat-css: assistant bubble background missing yellow/amber anchor (${ASSISTANT_RGB_FRAGMENT}) — got "${probe.assistantBg.slice(0, 200)}"`;
  }
  return null;
}

export function buildChatCssAssertion(opts?: {
  waitTimeoutMs?: number;
}): (page: Page) => Promise<void> {
  const waitTimeout = opts?.waitTimeoutMs ?? PROBE_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    try {
      await page.waitForSelector(ASSISTANT_BUBBLE_SELECTOR, {
        state: "visible",
        timeout: waitTimeout,
      });
    } catch {
      throw new Error(
        `chat-css: assistant bubble selector ${ASSISTANT_BUBBLE_SELECTOR} did not appear within ${waitTimeout}ms — chat surface may have failed to render`,
      );
    }
    const probe = await probeChatCss(page);
    const err = validateChatCss(probe);
    if (err) throw new Error(err);
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "verify the css theme rendering",
      assertions: buildChatCssAssertion(),
    },
  ];
}

registerD5Script({
  featureTypes: ["chat-css"],
  fixtureFile: "chat-css.json",
  buildTurns,
  preNavigateRoute,
});
