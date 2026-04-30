/**
 * D5 — agent-config script.
 *
 * Drives `/demos/agent-config`, which forwards `tone`, `expertise`, and
 * `responseLength` from the frontend (CopilotKit `properties`) to the
 * agent's per-turn system-prompt builder. The aimock-canned response
 * for this demo references those config keys verbatim ("tone",
 * "expertise", "responseLength") so the D5 assertion can verify the
 * agent received and acknowledged the configuration shape.
 *
 * One turn is enough — the assertion just confirms a substantive
 * response that mentions the config keywords. A future enhancement
 * could split into multiple turns toggling the config controls and
 * asserting style differences, but that requires fixture variants
 * keyed on the config payload.
 */

import {
  registerD5Script,
  type D5BuildContext,
} from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

const TRANSCRIPT_TIMEOUT_MS = 5_000;
/** Keywords the canned response must mention to prove the system-prompt
 *  builder consumed the configured properties. Updated together with
 *  `agent-config.json`. */
export const CONFIG_KEYWORDS = ["tone", "expertise", "responselength"] as const;

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
    // Lowercase + strip whitespace for substring matching of camelCase
    // tokens like "responseLength" -> "responselength".
    return acc.toLowerCase().replace(/\s+/g, "");
  })) as string;
}

export function buildAgentConfigAssertion(opts?: {
  timeoutMs?: number;
}): (page: Page) => Promise<void> {
  const timeout = opts?.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeout;
    let last = "";
    while (Date.now() < deadline) {
      last = await readAssistantTranscript(page);
      if (CONFIG_KEYWORDS.every((kw) => last.includes(kw))) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    const missing = CONFIG_KEYWORDS.filter((kw) => !last.includes(kw));
    throw new Error(
      `agent-config: assistant transcript missing config keyword(s) [${missing.join(", ")}] — got "${last.slice(0, 200)}"`,
    );
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "introduce yourself per your config",
      assertions: buildAgentConfigAssertion(),
    },
  ];
}

registerD5Script({
  featureTypes: ["agent-config"],
  fixtureFile: "agent-config.json",
  buildTurns,
});
