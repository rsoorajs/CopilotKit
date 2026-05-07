/**
 * D5 — gen-UI (headless) script.
 *
 * Probes the showcase's `/demos/headless-simple` page. The page exposes
 * a row of suggestion chips (`[data-testid="headless-suggestions"]`)
 * whose buttons dispatch deterministic prompts directly to the agent's
 * `send()` handler — the same code path the textarea+Enter flow uses,
 * just without the typing.
 *
 * Two turns (both chip-driven):
 *   1. Click "Profile card" → agent emits `show_card({title, body})` →
 *      frontend `useComponent` materialises a `ShowCard` React component
 *      (titled card with body paragraph). Asserts the gen-UI cascade
 *      finds the rendered component AND the assistant narration
 *      mentions "card" or "ada".
 *   2. Click "Largest continent" → agent returns plain text "Asia is
 *      the largest continent…". Asserts the assistant text contains
 *      "asia".
 *
 * Both turns use `preFill` to click the chip — the runner's normal
 * fill+press is a guarded no-op because the chip click already
 * submitted the message and the demo's `send()` rejects empty input.
 *
 * Acceptance for the headless tier (NOT the custom tier):
 *   - Turn 1: the custom-rendered ShowCard must be present in the DOM
 *     with at least one child element (NOT just text). Empty wrappers
 *     are explicitly rejected by the selector cascade in
 *     `_gen-ui-shared.ts`.
 *   - Turn 2: the deterministic continent fixture lives in
 *     `aimock/feature-parity.json` ("What is the largest continent?" →
 *     "Asia is the largest continent — about 30% of Earth's land area,
 *     home to over 4.6 billion people.") so the substring `asia` is
 *     reliable across integrations.
 *
 * The custom-tier script (`d5-gen-ui-custom.ts`) layers a STRUCTURAL
 * match on top -- for `render_pie_chart` it asserts an SVG with
 * multiple drawing children, which is what makes "custom" stricter
 * than "headless".
 */

import { registerD5Script } from "../helpers/d5-registry.js";
import type { D5BuildContext } from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";
import {
  readLastAssistantText,
  waitForGenUiComponent,
} from "./_gen-ui-shared.js";

/**
 * Click a suggestion chip by its visible label, scoped to the
 * `[data-testid="headless-suggestions"]` row so the click can't pick
 * up an unrelated button on the page. The runner's structural Page
 * shim doesn't expose `click()` (Playwright's real Page does); the
 * driver's wrapper passes it through, so we narrow at call time.
 */
async function clickChip(page: Page, label: string): Promise<void> {
  const pageWithClick = page as Page & {
    click(selector: string, opts?: { timeout?: number }): Promise<void>;
  };
  if (typeof pageWithClick.click !== "function") {
    throw new Error(
      "headless probe: page.click is not available — the runner's Page " +
        "shim must expose click() for chip-driven turns",
    );
  }
  // Playwright's `text=` engine matches button text. The visible
  // label on the chip is the suggestion's `title` field
  // (e.g. "Profile card", "Largest continent").
  const selector = `[data-testid="headless-suggestions"] >> text="${label}"`;
  await pageWithClick.click(selector, { timeout: 10_000 });
}

/**
 * Minimum childElementCount required after the cascade resolves. The
 * `ShowCard` implementation in `headless-simple/page.tsx` renders two
 * divs (title + body), so requiring `>= 1` rejects empty wrappers
 * without coupling to the exact ShowCard layout.
 */
const MIN_CHILDREN = 1;

/**
 * Lower-case tokens we expect to find in the assistant's text after
 * the ShowCard render. Accept EITHER "card" OR "ada" — see the file
 * header for the rationale (combined-message edge case in headless).
 */
const PROFILE_FOLLOWUP_TOKENS_PRIMARY = ["card"] as const;
const PROFILE_FOLLOWUP_TOKENS_SECONDARY = ["ada"] as const;

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      // Empty input + chip click via preFill. The chip's onClick
      // submits the message directly; the runner's fill+press is a
      // no-op because the demo's `send()` guards empty input.
      input: "",
      preFill: async (page) => {
        console.debug(
          "[d5-gen-ui-headless] turn 1: clicking 'Profile card' chip",
        );
        await clickChip(page, "Profile card");
      },
      assertions: async (page) => {
        // 1. Cascade-find the rendered ShowCard component. Throws on
        //    timeout with a descriptive error.
        console.debug("[d5-gen-ui-headless] waiting for gen-UI component");
        const matchedSelector = await waitForGenUiComponent(page);
        console.debug("[d5-gen-ui-headless] gen-UI component found", {
          matchedSelector,
        });

        // 2. Structural check: the matched node has children (i.e. the
        //    ShowCard's title + body actually rendered, not just an
        //    empty wrapper).
        const childCount = await readChildCountForSelector(
          page,
          matchedSelector,
        );
        console.debug("[d5-gen-ui-headless] child count check", {
          matchedSelector,
          childCount,
          minRequired: MIN_CHILDREN,
        });
        if (childCount < MIN_CHILDREN) {
          throw new Error(
            `gen-ui-headless: matched component ${matchedSelector} has ${childCount} children (expected >= ${MIN_CHILDREN})`,
          );
        }

        // 3. Token-level narration check. Require at least one
        //    primary OR one secondary token.
        const text = (await readLastAssistantText(page)).toLowerCase();
        console.debug("[d5-gen-ui-headless] follow-up text check", {
          primaryTokens: [...PROFILE_FOLLOWUP_TOKENS_PRIMARY],
          secondaryTokens: [...PROFILE_FOLLOWUP_TOKENS_SECONDARY],
          assistantText: text.slice(0, 300),
        });
        const primaryMissing = PROFILE_FOLLOWUP_TOKENS_PRIMARY.filter(
          (tok) => !text.includes(tok),
        );
        const secondaryMissing = PROFILE_FOLLOWUP_TOKENS_SECONDARY.filter(
          (tok) => !text.includes(tok),
        );
        if (primaryMissing.length > 0 && secondaryMissing.length > 0) {
          throw new Error(
            `gen-ui-headless: assistant follow-up missing tokens (need at least one of [${[
              ...PROFILE_FOLLOWUP_TOKENS_PRIMARY,
              ...PROFILE_FOLLOWUP_TOKENS_SECONDARY,
            ].join(", ")}]); last assistant text: ${text.slice(0, 200)}`,
          );
        }
        console.debug("[d5-gen-ui-headless] turn 1 assertions passed");
      },
    },
    {
      input: "",
      preFill: async (page) => {
        console.debug(
          "[d5-gen-ui-headless] turn 2: clicking 'Largest continent' chip",
        );
        await clickChip(page, "Largest continent");
      },
      assertions: async (page) => {
        // The aimock fixture returns "Asia is the largest continent…".
        // Asserting on the lowercase token "asia" is robust to wording
        // drift while still pinning the deterministic answer.
        const text = (await readLastAssistantText(page)).toLowerCase();
        console.debug("[d5-gen-ui-headless] continent text check", {
          assistantText: text.slice(0, 300),
        });
        if (!text.includes("asia")) {
          throw new Error(
            `gen-ui-headless: continent reply missing "asia"; last assistant text: ${text.slice(
              0,
              200,
            )}`,
          );
        }
        console.debug("[d5-gen-ui-headless] turn 2 assertions passed");
      },
    },
  ];
}

/**
 * Read the child element count of the node matching `selector`.
 *
 * Uses a pre-baked function source with the selector interpolated via
 * JSON.stringify so the page-side query reads the SAME node the
 * cascade matched on the Node side. This eliminates a class of races
 * where an in-page re-lookup resolved a different (more-generic) node.
 *
 * The function is constructed as a plain closure via `new Function` so
 * Playwright serializes just the body source, not Node-side bindings.
 */
async function readChildCountForSelector(
  page: { evaluate<R>(fn: () => R): Promise<R> },
  selector: string,
): Promise<number> {
  const encoded = JSON.stringify(selector);
  // Build the source with selector pre-baked. We rely on `new Function`
  // because the structural Page.evaluate signature is `() => R` — no
  // arg-pass — and we still need the resolved selector to land in the
  // browser context.
  // Use querySelectorAll and find the LAST matching node with children.
  // The first assistant message may be an empty wrapper; the rendered
  // gen-UI component appears in a later message. Fall back to the last
  // node's childElementCount if none have children.
  const fn = new Function(`
    var win = globalThis;
    var nodes = win.document.querySelectorAll(${encoded});
    if (nodes.length === 0) return 0;
    var best = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].childElementCount > best) {
        best = nodes[i].childElementCount;
      }
    }
    return best;
  `) as () => number;
  return await page.evaluate(fn);
}

/**
 * Override the default `/demos/<featureType>` route. The fixture is
 * recorded against `/demos/headless-simple` (the actual showcase route
 * that wires the `show_card` `useComponent`), not the literal feature
 * type. Mirrors the mcp-apps -> /demos/subagents pattern documented in
 * the registry comments.
 */
function preNavigateRoute(): string {
  return "/demos/headless-simple";
}

registerD5Script({
  featureTypes: ["gen-ui-headless"],
  fixtureFile: "gen-ui-headless.json",
  buildTurns,
  preNavigateRoute,
});
