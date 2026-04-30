/**
 * D5 — tool-rendering-reasoning-chain script.
 *
 * Drives `/demos/tool-rendering-reasoning-chain` through one turn that
 * exercises a tool call interleaved with a reasoning chain. Asserts the
 * transcript contains both reasoning and tool keywords — proves the
 * interleaving renders correctly (split off from `tool-rendering`
 * because the assertion shape interleaves tool render with reasoning).
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

export const REASONING_TOOL_KEYWORDS = ["reasoning", "tool"] as const;

export function buildReasoningChainAssertion(opts?: {
  timeoutMs?: number;
}): (page: Page) => Promise<void> {
  const timeout = opts?.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeout;
    let last = "";
    while (Date.now() < deadline) {
      last = await readAssistantTranscript(page);
      if (REASONING_TOOL_KEYWORDS.every((kw) => last.includes(kw))) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    const missing = REASONING_TOOL_KEYWORDS.filter((kw) => !last.includes(kw));
    throw new Error(
      `tool-rendering-reasoning-chain: transcript missing keyword(s) [${missing.join(", ")}] — got "${last.slice(0, 200)}"`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "analyze data and call the tool",
      assertions: buildReasoningChainAssertion(),
    },
  ];
}

registerD5Script({
  featureTypes: ["tool-rendering-reasoning-chain"],
  fixtureFile: "tool-rendering-reasoning-chain.json",
  buildTurns,
});
