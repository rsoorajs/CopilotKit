/**
 * D5 — byoc script.
 *
 * Covers `/demos/byoc-hashbrown` and `/demos/byoc-json-render`. The
 * driver routes via preNavigateRoute based on which demo is declared.
 * Each invocation tests one route — both routes share the assertion
 * pattern (transcript references the user-supplied component output).
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

export const HASHBROWN_KEYWORDS = ["hashbrown", "byoc"] as const;
export const JSON_KEYWORDS = ["json-render", "json"] as const;

export function buildTurns(ctx: D5BuildContext): ConversationTurn[] {
  // Default: both turns. The driver runs the script ONCE per featureType
  // per integration; both registry demos map to `byoc`, so a single run
  // exercises whichever demo was navigated to via preNavigateRoute. We
  // include both turns so the run validates either schema; aimock keys
  // on the unique substring per turn.
  return [
    {
      input: "render a byoc hashbrown",
      assertions: buildKeywordAssertion("byoc hashbrown", HASHBROWN_KEYWORDS),
    },
    {
      input: "render a byoc json",
      assertions: buildKeywordAssertion("byoc json-render", JSON_KEYWORDS),
    },
  ];
}

/** Pick the navigated demo: prefer hashbrown if available, else json-render. */
export function preNavigateRoute(
  _ft: D5FeatureType,
  ctx?: D5RouteContext,
): string {
  if (ctx?.demos && ctx.demos.includes("byoc-hashbrown")) {
    return "/demos/byoc-hashbrown";
  }
  if (ctx?.demos && ctx.demos.includes("byoc-json-render")) {
    return "/demos/byoc-json-render";
  }
  return "/demos/byoc-hashbrown";
}

registerD5Script({
  featureTypes: ["byoc"],
  fixtureFile: "byoc.json",
  buildTurns,
  preNavigateRoute,
});
