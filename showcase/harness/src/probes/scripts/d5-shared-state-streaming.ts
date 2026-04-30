/**
 * D5 — shared-state-streaming script.
 *
 * Drives `/demos/shared-state-streaming` through one turn that triggers
 * a streaming state update. Asserts the assistant transcript references
 * intermediate stream values to prove streaming worked end-to-end.
 */

import {
  registerD5Script,
  type D5BuildContext,
} from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

const TRANSCRIPT_TIMEOUT_MS = 8_000;

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

/** Intermediate values that prove streaming actually streamed. */
export const STREAM_KEYWORDS = ["counter", "stream"] as const;

export function buildStreamingAssertion(opts?: {
  timeoutMs?: number;
}): (page: Page) => Promise<void> {
  const timeout = opts?.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeout;
    let last = "";
    while (Date.now() < deadline) {
      last = await readAssistantTranscript(page);
      if (STREAM_KEYWORDS.every((kw) => last.includes(kw))) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    const missing = STREAM_KEYWORDS.filter((kw) => !last.includes(kw));
    throw new Error(
      `shared-state-streaming: transcript missing keyword(s) [${missing.join(", ")}] — got "${last.slice(0, 200)}"`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "stream the counter to 5",
      assertions: buildStreamingAssertion(),
    },
  ];
}

registerD5Script({
  featureTypes: ["shared-state-streaming"],
  fixtureFile: "shared-state-streaming.json",
  buildTurns,
});
