/**
 * D5 — gen-ui-declarative script.
 *
 * Drives `/demos/declarative-gen-ui` and asserts the assistant transcript
 * references the declarative-rendering keywords.
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
      if (f.length > 0) { nodes = f; break; }
    }
    let acc = "";
    for (let i = 0; i < nodes.length; i++) acc += " " + (nodes[i]!.textContent ?? "");
    return acc.toLowerCase();
  })) as string;
}

export const DECLARATIVE_KEYWORDS = ["declarative", "card"] as const;

export function buildDeclarativeAssertion(opts?: { timeoutMs?: number }) {
  const timeout = opts?.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeout;
    let last = "";
    while (Date.now() < deadline) {
      last = await readAssistantTranscript(page);
      if (DECLARATIVE_KEYWORDS.some((kw) => last.includes(kw))) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    throw new Error(
      `gen-ui-declarative: transcript missing keyword (any of ${DECLARATIVE_KEYWORDS.join(", ")}) — got "${last.slice(0, 200)}"`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    { input: "render the declarative card", assertions: buildDeclarativeAssertion() },
  ];
}

registerD5Script({
  featureTypes: ["gen-ui-declarative"],
  fixtureFile: "gen-ui-declarative.json",
  buildTurns,
});
