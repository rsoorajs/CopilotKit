/**
 * D5 — frontend-tools script.
 *
 * Drives `/demos/frontend-tools` through one user turn that triggers a
 * frontend tool call (theme change). The assertion verifies the
 * assistant transcript references the tool's effect — proving the tool
 * was dispatched client-side and the agent saw the result.
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

export const FRONTEND_TOOL_KEYWORDS = ["dark mode", "change_theme"] as const;

export function buildFrontendToolsAssertion(opts?: {
  timeoutMs?: number;
}): (page: Page) => Promise<void> {
  const timeout = opts?.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeout;
    let last = "";
    while (Date.now() < deadline) {
      last = await readAssistantTranscript(page);
      if (FRONTEND_TOOL_KEYWORDS.some((kw) => last.includes(kw))) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    throw new Error(
      `frontend-tools: assistant transcript missing tool-effect keyword (any of ${FRONTEND_TOOL_KEYWORDS.join(", ")}) — got "${last.slice(0, 200)}"`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "switch theme to dark mode",
      assertions: buildFrontendToolsAssertion(),
    },
  ];
}

registerD5Script({
  featureTypes: ["frontend-tools"],
  fixtureFile: "frontend-tools.json",
  buildTurns,
});
