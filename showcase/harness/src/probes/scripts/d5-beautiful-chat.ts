/**
 * D5 — beautiful-chat script.
 *
 * Drives `/demos/beautiful-chat` through one user turn that triggers the
 * `search_flights` tool against the LangGraph backend at
 * `showcase/integrations/langgraph-python/src/agents/beautiful_chat.py`.
 * The tool emits an `a2ui_operations` container with one literal-children
 * `FlightCard` per flight (see `_build_flight_components` in that module),
 * and the renderer registered in
 * `showcase/integrations/langgraph-python/src/app/demos/declarative-generative-ui/renderers.tsx`
 * paints each card inline.
 *
 * Why this surface (vs Sales Dashboard, Pie Chart, Toggle Theme):
 *   - `search_flights` is a single-turn tool call. The Sales Dashboard pill
 *     is a two-stage flow (`generate_a2ui` → secondary LLM bound to
 *     `render_a2ui`) that takes 90s+ on cold starts and depends on a
 *     second fixture matching the sub-call — too much surface area for a
 *     first probe.
 *   - Pie/Bar Chart depend on Controlled Generative UI components
 *     registered via `useComponent`, which is a different code path than
 *     A2UI fixed-schema (covered by `d5-gen-ui-a2ui-fixed`).
 *   - Toggle Theme exercises only frontend tools, already covered by
 *     `d5-frontend-tools` against a different demo.
 *
 * Acceptance:
 *   - `United Airlines` literal text is visible (canonical fixture flight 1)
 *   - `Delta` literal text is visible (canonical fixture flight 2)
 *   - `$349` and `$289` price literals are visible
 *
 * Assertion text targets aimock-fixture content directly (not LLM output)
 * so it's stable across runs. The assertion uses a generous timeout for
 * the first selector — the A2UI tool round-trip can take ~30-60s on a
 * cold start when langgraph rehydrates the agent module.
 *
 * Fixture (`showcase/harness/fixtures/d5/beautiful-chat.json`) uses the
 * `hasToolResult` matcher to disambiguate the pre-tool-call turn (returns
 * the `search_flights` toolCall) from the post-tool-call turn (returns
 * narration that lets the agent close the conversation). Mirrors the
 * pattern in `showcase/harness/fixtures/d5/gen-ui-headless.json`.
 */

import {
  registerD5Script,
  type D5BuildContext,
} from "../helpers/d5-registry.js";
import type { ConversationTurn, Page } from "../helpers/conversation-runner.js";

/** Seconds budget for the A2UI tool round-trip on cold-start integrations. */
const FLIGHT_SURFACE_TIMEOUT_MS = 60_000;
/** Tighter budget for sibling assertions once the first card has rendered. */
const SIBLING_ASSERTION_TIMEOUT_MS = 5_000;

/** Canonical user prompt used by both the dispatched chat-input message and
 *  the aimock fixture's substring matcher. Unique enough to avoid colliding
 *  with the `flights from SFO to JFK` entry in `feature-parity.json`. */
const PROMPT = "d5 beautiful-chat probe: search flights from SFO to JFK";

export function buildAssertions(opts?: {
  flightSurfaceTimeoutMs?: number;
  siblingTimeoutMs?: number;
}): (page: Page) => Promise<void> {
  const flightTimeout =
    opts?.flightSurfaceTimeoutMs ?? FLIGHT_SURFACE_TIMEOUT_MS;
  const siblingTimeout = opts?.siblingTimeoutMs ?? SIBLING_ASSERTION_TIMEOUT_MS;
  return async (page: Page): Promise<void> => {
    // United is the first flight in the fixture; wait for it to land. If
    // the A2UI surface never renders, this is the assertion that fires.
    try {
      await page.waitForSelector("text=United Airlines", {
        state: "visible",
        timeout: flightTimeout,
      });
    } catch {
      throw new Error(
        `beautiful-chat: expected FlightCard for "United Airlines" to render within ${flightTimeout}ms — A2UI surface did not paint`,
      );
    }
    // Once the surface is mounted, the rest of the literals are siblings
    // in the same render — short timeout is fine. Each is asserted
    // separately so a regression that loses (e.g.) only the price text
    // points at the right field rather than failing the whole probe on
    // a single combined selector.
    for (const literal of ["Delta", "$349", "$289"]) {
      try {
        await page.waitForSelector(`text=${literal}`, {
          state: "visible",
          timeout: siblingTimeout,
        });
      } catch {
        throw new Error(
          `beautiful-chat: FlightCard rendered "United Airlines" but "${literal}" was not found within ${siblingTimeout}ms — surface partially painted`,
        );
      }
    }
  };
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: PROMPT,
      assertions: buildAssertions(),
    },
  ];
}

/** Override the default `/demos/<featureType>` route. The literal feature
 *  type matches the catalog ID, so the route is unambiguous, but kept
 *  explicit for parity with the chat-css/chat-slots overrides. */
function preNavigateRoute(): string {
  return "/demos/beautiful-chat";
}

registerD5Script({
  featureTypes: ["beautiful-chat"],
  fixtureFile: "beautiful-chat.json",
  buildTurns,
  preNavigateRoute,
});
