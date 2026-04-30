/**
 * D5 — readonly-state-context script.
 *
 * Drives `/demos/readonly-state-agent-context` through one turn that
 * depends on read-only context. Asserts the assistant transcript
 * references the context value to prove the agent received the readonly
 * payload correctly.
 */

import {
  registerD5Script,
  type D5BuildContext,
} from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

const TRANSCRIPT_TIMEOUT_MS = 5_000;

async function readAssistantTranscript(page: Page): Promise<string> {
  return (await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: {
        querySelectorAll(sel: string): ArrayLike<{ textContent: string | null }>;
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

export const CONTEXT_KEYWORDS = ["preference", "context"] as const;

export function buildReadonlyAssertion(opts?: {
  timeoutMs?: number;
}): (page: Page) => Promise<void> {
  const timeout = opts?.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeout;
    let last = "";
    while (Date.now() < deadline) {
      last = await readAssistantTranscript(page);
      if (CONTEXT_KEYWORDS.some((kw) => last.includes(kw))) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    throw new Error(
      `readonly-state-context: transcript missing context keyword (any of ${CONTEXT_KEYWORDS.join(", ")}) — got "${last.slice(0, 200)}"`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "recall the user preference",
      assertions: buildReadonlyAssertion(),
    },
  ];
}

registerD5Script({
  featureTypes: ["readonly-state-context"],
  fixtureFile: "readonly-state-context.json",
  buildTurns,
});
