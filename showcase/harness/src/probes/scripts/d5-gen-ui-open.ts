/**
 * D5 — gen-ui-open script.
 *
 * Covers `/demos/open-gen-ui` and `/demos/open-gen-ui-advanced` via
 * preNavigateRoute. Two turns — first asserts the basic open-shape
 * render, second asserts the advanced flow continues correctly. The
 * `hasToolResult`-style disambiguation isn't needed because each turn's
 * userMessage substring is unique.
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
    for (let i = 0; i < nodes.length; i++)
      acc += " " + (nodes[i]!.textContent ?? "");
    return acc.toLowerCase();
  })) as string;
}

function buildKeywordAssertion(
  label: string,
  keywords: readonly string[],
  timeoutMs = TRANSCRIPT_TIMEOUT_MS,
) {
  return async (page: Page): Promise<void> => {
    const deadline = Date.now() + timeoutMs;
    let last = "";
    while (Date.now() < deadline) {
      last = await readAssistantTranscript(page);
      if (keywords.some((kw) => last.includes(kw))) return;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    throw new Error(
      `${label}: transcript missing keyword (any of ${keywords.join(", ")}) — got "${last.slice(0, 200)}"`,
    );
  };
}

export const OPEN_KEYWORDS = ["open gen-ui", "open"] as const;
export const ADVANCED_KEYWORDS = ["advanced"] as const;

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "render an open gen-ui element",
      assertions: buildKeywordAssertion("gen-ui-open turn 1", OPEN_KEYWORDS),
    },
    {
      input: "continue the advanced gen-ui flow",
      assertions: buildKeywordAssertion(
        "gen-ui-open turn 2",
        ADVANCED_KEYWORDS,
      ),
    },
  ];
}

/** Default to /demos/open-gen-ui-advanced when both demos are declared
 *  (the advanced route covers the basic flow as turn 1). Fallback to
 *  /demos/open-gen-ui when the advanced demo isn't declared. */
export function preNavigateRoute(
  _ft: D5FeatureType,
  ctx?: D5RouteContext,
): string {
  if (ctx?.demos && ctx.demos.includes("open-gen-ui-advanced")) {
    return "/demos/open-gen-ui-advanced";
  }
  return "/demos/open-gen-ui";
}

registerD5Script({
  featureTypes: ["gen-ui-open"],
  fixtureFile: "gen-ui-open.json",
  buildTurns,
  preNavigateRoute,
});
