/**
 * D5 — reasoning-display script.
 *
 * Covers BOTH `/demos/agentic-chat-reasoning` and
 * `/demos/reasoning-default-render` via preNavigateRoute. The driver
 * runs one feature per featureType per integration, so the registered
 * type ('reasoning-display') gets one run regardless of how many
 * registry IDs map to it. The default route is `agentic-chat-reasoning`
 * — the alternate route is informational only at the catalog level
 * (see open question Q5 in `.claude/specs/lgp-d5-coverage.md`).
 *
 * Assertion (two-stage):
 *   1. A reasoning-role message must render. The integration is
 *      free to use the custom `data-testid="reasoning-block"` banner
 *      OR CopilotKit's default reasoning card — either selector wins.
 *      This is the strong signal that AG-UI REASONING_MESSAGE_* events
 *      reached the frontend; without it, "reasoning" appearing in plain
 *      text would falsely pass.
 *   2. AND the assistant transcript contains a reasoning-flavored
 *      keyword as a soft sanity check, in case an integration emits
 *      reasoning role messages without populating their content.
 */

import {
  registerD5Script,
  type D5BuildContext,
  type D5FeatureType,
  type D5RouteContext,
} from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

const TRANSCRIPT_TIMEOUT_MS = 5_000;

async function readAssistantTranscript(page: Page): Promise<string> {
  return (await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: {
        querySelectorAll(
          sel: string,
        ): ArrayLike<{ textContent: string | null }>;
      };
    };
    const sels = [
      '[data-testid="copilot-assistant-message"]',
      '[role="article"]:not([data-message-role="user"])',
      '[data-message-role="assistant"]',
    ];
    let nodes: ArrayLike<{ textContent: string | null }> = { length: 0 };
    for (const s of sels) {
      const f = win.document.querySelectorAll(s);
      if (f.length > 0) {
        nodes = f;
        break;
      }
    }
    let acc = "";
    for (let i = 0; i < nodes.length; i++) {
      acc += " " + (nodes[i]!.textContent ?? "");
    }
    return acc.toLowerCase();
  })) as string;
}

async function hasReasoningMessage(page: Page): Promise<boolean> {
  return (await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: {
        querySelector(sel: string): unknown;
      };
    };
    // Custom amber banner used by the agentic-chat-reasoning cell, OR the
    // default CopilotChatReasoningMessage card used by the
    // reasoning-default-render cell. Either selector proves a reasoning
    // role message reached the DOM.
    const sels = [
      '[data-testid="reasoning-block"]',
      '[data-message-role="reasoning"]',
      '[data-testid="copilot-reasoning-message"]',
    ];
    return sels.some((s) => win.document.querySelector(s) !== null);
  })) as boolean;
}

export const REASONING_KEYWORDS = ["reasoning", "step", "thinking"] as const;

export function buildReasoningAssertion(opts?: {
  timeoutMs?: number;
}): (page: Page) => Promise<void> {
  const timeout = opts?.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeout;
    let last = "";
    let sawReasoningMessage = false;
    while (Date.now() < deadline) {
      sawReasoningMessage =
        sawReasoningMessage || (await hasReasoningMessage(page));
      last = await readAssistantTranscript(page);
      const sawKeyword = REASONING_KEYWORDS.some((kw) => last.includes(kw));
      if (sawReasoningMessage && sawKeyword) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    if (!sawReasoningMessage) {
      throw new Error(
        `reasoning-display: no reasoning-role message rendered — expected [data-testid="reasoning-block"] or [data-message-role="reasoning"] within ${timeout}ms`,
      );
    }
    throw new Error(
      `reasoning-display: transcript missing reasoning keyword (any of ${REASONING_KEYWORDS.join(", ")}) — got "${last.slice(0, 200)}"`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "show your reasoning step by step",
      assertions: buildReasoningAssertion(),
    },
  ];
}

/** Force the route to a real demo path. Default `/demos/reasoning-display`
 *  doesn't exist; we pick `agentic-chat-reasoning` as the canonical
 *  reasoning surface. Per Q5 in the coverage doc this may split later. */
export function preNavigateRoute(
  _ft: D5FeatureType,
  ctx?: D5RouteContext,
): string {
  // If the integration declares only `reasoning-default-render`, prefer that route.
  if (
    ctx?.demos &&
    ctx.demos.includes("reasoning-default-render") &&
    !ctx.demos.includes("agentic-chat-reasoning")
  ) {
    return "/demos/reasoning-default-render";
  }
  return "/demos/agentic-chat-reasoning";
}

registerD5Script({
  featureTypes: ["reasoning-display"],
  fixtureFile: "reasoning-display.json",
  buildTurns,
  preNavigateRoute,
});
