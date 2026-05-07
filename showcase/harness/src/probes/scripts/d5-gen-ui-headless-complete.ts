/**
 * D5 — gen-UI (headless-complete) script.
 *
 * Probes the showcase's `/demos/headless-complete` page — a hand-rolled
 * chat surface (no `<CopilotChat />`) that exercises the full
 * generative-UI composition: per-tool renderers (WeatherCard,
 * StockCard), a frontend-only `useComponent` (HighlightNote), an MCP
 * server (Excalidraw), and a plain-text fallback path.
 *
 * The page exposes 5 suggestion chips (`[data-testid="headless-suggestions"]`)
 * with deterministic prompts. This probe clicks each chip in turn and
 * asserts the right rendering surface fires for each:
 *
 *   1. "Weather in Tokyo" → backend `get_weather` tool → WeatherCard
 *      (per-tool `useRenderTool`). Asserts the messages container shows
 *      "Weather" + "Tokyo".
 *   2. "AAPL stock price" → backend `get_stock_price` tool → StockCard
 *      (per-tool `useRenderTool`). Asserts the container shows "AAPL"
 *      and a `$` price marker.
 *   3. "Highlight a note" → frontend `highlight_note` tool → HighlightNote
 *      (frontend `useComponent`). Asserts the container shows the
 *      "Note" eyebrow and the highlighted text "meeting at 3pm".
 *   4. "Sketch a diagram" → Excalidraw MCP tool. The MCP path is more
 *      involved (server-side tool-call execution) so this turn
 *      asserts only that the assistant responded with a non-empty
 *      message — the conversation-runner's settle detection already
 *      pins the message arrival, this just confirms the MCP path
 *      didn't error out.
 *   5. "Largest continent" → plain-text reply. Asserts "asia" in the
 *      assistant text. Same fixture used by the headless-simple probe.
 *
 * All five turns use `preFill` to click the chip — the runner's normal
 * fill+press is a no-op because the chip dispatch already submitted
 * the message and the demo's `handleSubmit` guards empty input.
 */

import { registerD5Script } from "../helpers/d5-registry.js";
import type { D5BuildContext } from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

/**
 * Click a suggestion chip by its visible label, scoped to the
 * `[data-testid="headless-suggestions"]` row. Mirrors the helper in
 * `d5-gen-ui-headless.ts`; duplicated here to avoid a cross-script
 * import (each `d5-*.ts` is a self-contained loader entry).
 */
async function clickChip(page: Page, label: string): Promise<void> {
  const pageWithClick = page as Page & {
    click(selector: string, opts?: { timeout?: number }): Promise<void>;
  };
  if (typeof pageWithClick.click !== "function") {
    throw new Error(
      "headless-complete probe: page.click is not available — the " +
        "runner's Page shim must expose click() for chip-driven turns",
    );
  }
  const selector = `[data-testid="headless-suggestions"] >> text="${label}"`;
  await pageWithClick.click(selector, { timeout: 10_000 });
}

/**
 * Read the lowercase textContent of the messages container
 * (`[data-testid="headless-complete-messages"]`). Captures BOTH the
 * assistant's prose AND the rendered tool components (WeatherCard,
 * StockCard, HighlightNote) — unlike `readLastAssistantText` which
 * scopes to the prose child only.
 *
 * Returns the empty string when the container is missing or empty.
 */
async function readMessagesText(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: {
        querySelector(sel: string): { textContent: string | null } | null;
      };
    };
    const el = win.document.querySelector(
      '[data-testid="headless-complete-messages"]',
    );
    if (!el) return "";
    return (el.textContent || "").toLowerCase();
  });
}

/**
 * Count assistant message elements in the messages container. Used by
 * the Excalidraw best-effort assertion to confirm the MCP path
 * produced AT LEAST one assistant response (the runner's settle
 * detection already gated on this count growing, but we re-read here
 * to surface a clearer error if the response was an empty bubble).
 */
async function countAssistantMessages(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: {
        querySelectorAll(sel: string): { length: number };
      };
    };
    return win.document.querySelectorAll(
      '[data-testid="headless-complete-messages"] [data-message-role="assistant"]',
    ).length;
  });
}

function assertContainsAll(
  text: string,
  tokens: readonly string[],
  context: string,
): void {
  const missing = tokens.filter((t) => !text.includes(t.toLowerCase()));
  if (missing.length > 0) {
    throw new Error(
      `${context}: messages container missing tokens [${missing.join(
        ", ",
      )}]; container text (truncated): ${text.slice(0, 300)}`,
    );
  }
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "",
      preFill: async (page) => {
        console.debug(
          "[d5-gen-ui-headless-complete] turn 1: clicking 'Weather in Tokyo'",
        );
        await clickChip(page, "Weather in Tokyo");
      },
      // The WeatherCard renders eyebrow "Fetching weather" → "Weather"
      // once the tool result lands; the second leg can take a moment
      // because the agent narrates afterward. 60 s is generous but
      // matches the upper bound on slow CI shards.
      responseTimeoutMs: 60_000,
      assertions: async (page) => {
        const text = await readMessagesText(page);
        console.debug("[d5-gen-ui-headless-complete] weather text", {
          text: text.slice(0, 300),
        });
        assertContainsAll(
          text,
          ["weather", "tokyo"],
          "gen-ui-headless-complete weather",
        );
      },
    },
    {
      input: "",
      preFill: async (page) => {
        console.debug(
          "[d5-gen-ui-headless-complete] turn 2: clicking 'AAPL stock price'",
        );
        await clickChip(page, "AAPL stock price");
      },
      responseTimeoutMs: 60_000,
      assertions: async (page) => {
        const text = await readMessagesText(page);
        console.debug("[d5-gen-ui-headless-complete] stock text", {
          text: text.slice(0, 300),
        });
        // StockCard renders ticker uppercase ("AAPL") and price as
        // "$189.42". `aapl` + `$` is enough to distinguish a
        // rendered card from a plain-text fallback or a wrong tool.
        assertContainsAll(
          text,
          ["aapl", "$"],
          "gen-ui-headless-complete stock",
        );
      },
    },
    {
      input: "",
      preFill: async (page) => {
        console.debug(
          "[d5-gen-ui-headless-complete] turn 3: clicking 'Highlight a note'",
        );
        await clickChip(page, "Highlight a note");
      },
      responseTimeoutMs: 60_000,
      assertions: async (page) => {
        const text = await readMessagesText(page);
        console.debug("[d5-gen-ui-headless-complete] highlight text", {
          text: text.slice(0, 300),
        });
        // HighlightNote renders the eyebrow "Note" and the highlighted
        // text from the chip prompt ("meeting at 3pm").
        assertContainsAll(
          text,
          ["note", "meeting at 3pm"],
          "gen-ui-headless-complete highlight",
        );
      },
    },
    {
      input: "",
      preFill: async (page) => {
        console.debug(
          "[d5-gen-ui-headless-complete] turn 4: clicking 'Sketch a diagram'",
        );
        await clickChip(page, "Sketch a diagram");
      },
      // Excalidraw goes through MCP — the round-trip can be slower
      // than the in-runtime tool path. Bump the budget.
      responseTimeoutMs: 90_000,
      assertions: async (page) => {
        // Best-effort: the MCP path is server-side and the surface
        // depends on the Excalidraw MCP server actually responding.
        // We can't pin a specific render shape across integrations
        // here, so we assert that the messages container has at least
        // one assistant message and is non-empty. The runner's settle
        // detection already gated on assistant-count growth, this
        // re-check guards against the edge case of an empty assistant
        // bubble (which the AssistantBubble would null out anyway).
        const count = await countAssistantMessages(page);
        const text = await readMessagesText(page);
        console.debug("[d5-gen-ui-headless-complete] excalidraw signal", {
          assistantCount: count,
          textPreview: text.slice(0, 200),
        });
        if (count === 0) {
          throw new Error(
            "gen-ui-headless-complete excalidraw: no assistant messages in container",
          );
        }
        if (text.trim().length === 0) {
          throw new Error(
            "gen-ui-headless-complete excalidraw: messages container empty",
          );
        }
      },
    },
    {
      input: "",
      preFill: async (page) => {
        console.debug(
          "[d5-gen-ui-headless-complete] turn 5: clicking 'Largest continent'",
        );
        await clickChip(page, "Largest continent");
      },
      assertions: async (page) => {
        const text = await readMessagesText(page);
        console.debug("[d5-gen-ui-headless-complete] continent text", {
          text: text.slice(0, 300),
        });
        if (!text.includes("asia")) {
          throw new Error(
            `gen-ui-headless-complete continent: missing "asia"; container text: ${text.slice(
              0,
              200,
            )}`,
          );
        }
      },
    },
  ];
}

/**
 * Override the default `/demos/<featureType>` route. The hyphenated
 * feature type would resolve to `/demos/gen-ui-headless-complete`,
 * which doesn't exist — the actual showcase route is
 * `/demos/headless-complete`.
 */
function preNavigateRoute(): string {
  return "/demos/headless-complete";
}

registerD5Script({
  featureTypes: ["gen-ui-headless-complete"],
  fixtureFile: "gen-ui-headless-complete.json",
  buildTurns,
  preNavigateRoute,
});
