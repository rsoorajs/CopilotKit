/**
 * D5 — frontend-tools-async script.
 *
 * Drives `/demos/frontend-tools-async` through one turn that exercises an
 * async frontend tool. The assertion waits longer than the sync variant
 * to allow async settlement, then verifies the transcript references the
 * resolved metric.
 */

import {
  registerD5Script,
  type D5BuildContext,
} from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

const TRANSCRIPT_TIMEOUT_MS = 10_000;

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

export const ASYNC_TOOL_KEYWORDS = ["async", "metric", "resolved"] as const;

export function buildAsyncToolsAssertion(opts?: {
  timeoutMs?: number;
}): (page: Page) => Promise<void> {
  const timeout = opts?.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeout;
    let last = "";
    while (Date.now() < deadline) {
      last = await readAssistantTranscript(page);
      if (ASYNC_TOOL_KEYWORDS.some((kw) => last.includes(kw))) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    throw new Error(
      `frontend-tools-async: transcript missing async-tool keyword (any of ${ASYNC_TOOL_KEYWORDS.join(", ")}) — got "${last.slice(0, 200)}"`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "fetch the async metric",
      assertions: buildAsyncToolsAssertion(),
      responseTimeoutMs: 45_000,
    },
  ];
}

registerD5Script({
  featureTypes: ["frontend-tools-async"],
  fixtureFile: "frontend-tools-async.json",
  buildTurns,
});
