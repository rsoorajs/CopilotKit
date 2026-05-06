/**
 * D5 — beautiful-chat script.
 *
 * Drives `/demos/beautiful-chat` (langgraph-python) through 7 of the 9
 * suggestion pills, asserting per-pill render fingerprints in the live
 * DOM. Each `ConversationTurn` corresponds to one pill, dispatched as a
 * unique D5-prefixed user message that aimock matches via the
 * `harness/fixtures/d5/beautiful-chat.json` fixture (bundled into
 * `showcase/aimock/d5-all.json`).
 *
 * Out-of-scope by design (track in a follow-up):
 *   - Excalidraw Diagram (MCP App): depends on `mcp.excalidraw.com`
 *     reachability — turning D5 reliability into a third-party uptime
 *     bet is the wrong tradeoff for a scheduled probe.
 *   - Calculator App (Open Generative UI): renders inside a sandboxed
 *     iframe, which makes Playwright assertions cross-frame-fragile.
 *     The `generateSandboxedUi` render path is already covered by
 *     `d5-gen-ui-open` on a different demo route, so this surface
 *     duplicates coverage rather than catching new regressions.
 *
 * Turn ordering is load-bearing for state safety:
 *   1. Toggle Theme — cheap warm-up; flips `html.dark`. No assertion
 *      depends on theme color, so the flip doesn't pollute later turns.
 *   2. Pie Chart — controlled-gen-UI `pieChart` component (frontend
 *      `useComponent`). Asserts inline SVG slices.
 *   3. Bar Chart — controlled-gen-UI `barChart`. Asserts recharts
 *      bar rectangles.
 *   4. Search Flights — A2UI fixed-schema `search_flights` →
 *      FlightCard surface (the #4668 fix path).
 *   5. Schedule Meeting — HITL `scheduleTime` → MeetingTimePicker. The
 *      assertion CLICKS a slot button to resolve the HITL pause —
 *      otherwise the agent stays paused and turn 6's chat input is
 *      ambiguous (resume vs new-message).
 *   6. Sales Dashboard — A2UI dynamic `generate_a2ui` → secondary LLM
 *      `render_a2ui` → dashboard tree. Heaviest turn (~90s cold-start
 *      budget). Placed after Schedule Meeting so its DOM additions
 *      don't fight earlier text-fingerprint assertions.
 *   7. Task Manager — `enableAppMode` + `manage_todos`. MUST be last:
 *      flips the layout to App pane, which collapses the chat surface
 *      to `w-1/3` and could break subsequent input dispatch on small
 *      viewports.
 *
 * On any turn failure the conversation runner records the 1-based
 * `failure_turn` and short-circuits the rest — failure messages call
 * out the failing pill so the dashboard's drilldown points right at
 * the regressed surface. Settle behaviour: the runner waits on
 * assistant-message DOM count plateau, which works correctly even when
 * a turn's primary signal is a tool-driven render rather than a chat
 * bubble (turns 1, 5, 7 in particular).
 */

import { registerD5Script } from "../helpers/d5-registry.js";
import type { D5BuildContext } from "../helpers/d5-registry.js";
import type {
  ConversationTurn,
  Page as ConversationPage,
} from "../helpers/conversation-runner.js";

/**
 * Extension of the runner's structural Page type with the methods this
 * probe needs beyond the runner's minimal surface — same pattern as
 * `_hitl-shared.ts`. Real Playwright Page exposes both natively; the
 * runner's minimal type intentionally excludes them so unit tests can
 * pass scripted fakes without spinning up chromium. The Schedule
 * Meeting turn needs `.click()` to resolve the HITL pause.
 */
interface Page extends ConversationPage {
  click(selector: string, opts?: { timeout?: number }): Promise<void>;
}

/** Long budget for the FIRST visible signal in a tool-driven render —
 *  covers cold-start tax (Playwright launch, Next.js hydrate, agent
 *  rehydrate). Sales Dashboard's secondary-LLM stage gets its own
 *  longer budget below. */
const FIRST_SIGNAL_TIMEOUT_MS = 60_000;
/** Tighter budget once the surface is mounted — sibling assertions
 *  should land within a few hundred ms. 5s leaves headroom for slow
 *  Windows CI agents. */
const SIBLING_TIMEOUT_MS = 5_000;
/** Sales Dashboard's first signal — `generate_a2ui` invokes a
 *  secondary LLM bound to `render_a2ui`, doubling the round-trip cost.
 *  The e2e equivalent uses 90s; we match. */
const DASHBOARD_FIRST_SIGNAL_TIMEOUT_MS = 90_000;

/**
 * Turn 1 — Toggle Theme.
 *
 * The `toggleTheme` frontend tool flips `document.documentElement.class`
 * between "dark" / "light". The runner has no assistant-message growth
 * to settle on (frontend-tool calls render as in-transcript tool cards
 * without a text bubble), so the runner's settle plateaus quickly and
 * the assertion runs.
 *
 * Mirrors the e2e signal (`html.dark` class flip) — strictly stronger
 * than asserting on a chat-bubble selector that `beautiful-chat`'s
 * tool-call transcripts don't emit.
 */
/**
 * DOM-side helpers — inline `page.evaluate` closures that read a
 * single piece of state from the browser context. We use the same
 * `globalThis as unknown as { document: ... }` pattern as
 * `d5-chat-css.ts` so the harness's Node-only tsconfig (no DOM lib)
 * still typechecks. Each helper is a fresh arrow per call so esbuild
 * doesn't emit a named `__name(fn, "...")` wrapper that would fail in
 * the browser context — see the inline-only-style note in
 * `d5-chat-css.ts`'s `probeChatCss` body.
 */
async function readIsHtmlDark(page: ConversationPage): Promise<boolean> {
  return await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: {
        documentElement: { classList: { contains(s: string): boolean } };
      };
    };
    return win.document.documentElement.classList.contains("dark");
  });
}
async function readSvgCircleCount(page: ConversationPage): Promise<number> {
  return await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: { querySelectorAll(sel: string): { length: number } };
    };
    return win.document.querySelectorAll("svg circle").length;
  });
}
async function readRechartsContainerCount(
  page: ConversationPage,
): Promise<number> {
  return await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: { querySelectorAll(sel: string): { length: number } };
    };
    return win.document.querySelectorAll(".recharts-responsive-container")
      .length;
  });
}
async function readRechartsBarCount(page: ConversationPage): Promise<number> {
  return await page.evaluate(() => {
    const win = globalThis as unknown as {
      document: { querySelectorAll(sel: string): { length: number } };
    };
    return win.document.querySelectorAll(".recharts-bar-rectangle").length;
  });
}

async function assertToggleTheme(page: ConversationPage): Promise<void> {
  const initiallyDark = await readIsHtmlDark(page);

  // Poll until the class flips. The runner has already waited for the
  // assistant-message settle, so the tool call has fired — we just
  // need to observe the side effect. Read via `evaluate` so the DOM
  // check is synchronous on the browser side without invoking
  // Playwright's auto-wait machinery.
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const isDark = await readIsHtmlDark(page);
    if (isDark !== initiallyDark) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(
    `beautiful-chat/toggle-theme: html.dark class did not flip from ${initiallyDark ? "dark" : "light"} within 30s — toggleTheme tool did not fire`,
  );
}

/**
 * Turn 2 — Pie Chart (controlled gen-UI).
 *
 * Frontend `useComponent` registered as `pieChart` renders an inline
 * SVG with one background `<circle>` plus one per data slice. The
 * fixture supplies 4 slices, so >= 3 circles confirms the component
 * mounted and at least some slices rendered (>= 3 instead of 5
 * accommodates partial-render races without sacrificing the signal).
 */
async function assertPieChart(page: ConversationPage): Promise<void> {
  const deadline = Date.now() + FIRST_SIGNAL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if ((await readSvgCircleCount(page)) >= 3) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `beautiful-chat/pie-chart: expected >= 3 svg circles within ${FIRST_SIGNAL_TIMEOUT_MS}ms (pieChart component did not render)`,
  );
}

/**
 * Turn 3 — Bar Chart (controlled gen-UI).
 *
 * `BarChart` wraps recharts' `<ResponsiveContainer>`. Asserts both the
 * container mounted AND >= 2 bar rectangles rendered. The container
 * alone could be a stub; the bars confirm data flowed through.
 */
async function assertBarChart(page: ConversationPage): Promise<void> {
  // First: the recharts container must mount. This is the heavy step.
  const containerDeadline = Date.now() + FIRST_SIGNAL_TIMEOUT_MS;
  let containerSeen = false;
  while (Date.now() < containerDeadline) {
    if ((await readRechartsContainerCount(page)) > 0) {
      containerSeen = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!containerSeen) {
    throw new Error(
      `beautiful-chat/bar-chart: .recharts-responsive-container did not mount within ${FIRST_SIGNAL_TIMEOUT_MS}ms`,
    );
  }
  // Then: bar rectangles within sibling timeout (recharts paints them
  // synchronously after layout).
  const barsDeadline = Date.now() + 15_000;
  while (Date.now() < barsDeadline) {
    if ((await readRechartsBarCount(page)) >= 2) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(
    `beautiful-chat/bar-chart: container mounted but < 2 bar rectangles within 15s (data wiring broken)`,
  );
}

/**
 * Turn 4 — Search Flights (A2UI fixed-schema).
 *
 * The `search_flights` tool emits an `a2ui_operations` container with
 * literal-children FlightCards. The fixture is byte-equal to PR #4668's
 * canonical 2-flight payload, so the literals (United/$349, Delta/$289)
 * are stable visual fingerprints unaffected by LLM wording drift.
 */
async function assertSearchFlights(page: ConversationPage): Promise<void> {
  // Wait for the FIRST flight card to mount — this is the surface-
  // mounted signal. After that, sibling literals should follow within
  // sibling timeout.
  await waitForText(page, "United Airlines", FIRST_SIGNAL_TIMEOUT_MS);
  for (const literal of ["Delta", "$349", "$289"]) {
    await waitForText(page, literal, SIBLING_TIMEOUT_MS);
  }
}

/**
 * Turn 5 — Schedule Meeting (HITL).
 *
 * `scheduleTime` is registered via `useHumanInTheLoop`, which renders
 * `MeetingTimePicker` and pauses the agent until the user clicks a
 * slot OR declines. We assert the picker mounted (selection-state
 * heading text), then CLICK a slot to resolve the HITL — without that,
 * subsequent turns would type into a chat input while the agent is
 * paused, which CopilotKit's runtime treats ambiguously.
 *
 * After click, `respond("Meeting scheduled for ...")` fires; the agent
 * resumes and emits a closing assistant message, which causes the
 * runner's settle to advance.
 */
async function assertScheduleMeeting(page: ConversationPage): Promise<void> {
  // Selection-state heading — picker is mounted and showing slots.
  await waitForText(
    page,
    "Pick a time that works for you",
    FIRST_SIGNAL_TIMEOUT_MS,
  );

  // Narrow to the click-capable Page shape. Real Playwright Page
  // exposes click() natively; the runner's minimal type omits it so
  // unit tests can pass scripted fakes. Mirrors the runtime guard in
  // d5-hitl-text-input — fail loudly here rather than letting the
  // cast hide a missing method when something hands us a different
  // page implementation.
  const pageWithClick = page as unknown as Page;
  if (typeof (pageWithClick as { click?: unknown }).click !== "function") {
    throw new Error(
      "beautiful-chat/schedule-meeting: page is missing click() — cannot resolve HITL slot",
    );
  }

  // Click the first default slot ("Tomorrow"). The picker's default
  // timeSlots array (meeting-time-picker.tsx) starts with
  // `{ date: "Tomorrow", time: "2:00 PM", duration: "30 min" }`.
  // Playwright's `:has-text()` pseudo-selector finds the slot button
  // by visible text without needing role-based queries.
  const tomorrowSelector = 'button:has-text("Tomorrow")';
  await page.waitForSelector(tomorrowSelector, {
    state: "visible",
    timeout: SIBLING_TIMEOUT_MS,
  });
  await pageWithClick.click(tomorrowSelector, {
    timeout: SIBLING_TIMEOUT_MS,
  });

  // Confirmed-state heading appears after `respond(...)` fires and the
  // selectedSlot state propagates — typically synchronous in React.
  await waitForText(page, "Meeting Scheduled", SIBLING_TIMEOUT_MS);
}

/**
 * Turn 6 — Sales Dashboard (A2UI dynamic).
 *
 * `generate_a2ui` invokes a secondary LLM bound to `render_a2ui`. The
 * fixture covers BOTH legs:
 *   - Primary: `userMessage` substring match → `generate_a2ui` toolCall
 *   - Secondary: `toolName: "render_a2ui"` match → `render_a2ui` with
 *     a 3-metric + 2-chart dashboard tree against the
 *     `copilotkit://app-dashboard-catalog` catalog.
 *
 * Visual fingerprint: a Metric label "Total Revenue" + a recharts
 * container (the embedded Pie/Bar wrappers). Cold-start budget is
 * 90s — both LLM calls are sequential.
 */
async function assertSalesDashboard(page: ConversationPage): Promise<void> {
  await waitForText(page, "Total Revenue", DASHBOARD_FIRST_SIGNAL_TIMEOUT_MS);
  // Recharts container check — the dashboard's pie + bar are both
  // wrapped in a ResponsiveContainer. Earlier turns also painted
  // recharts content (Bar Chart, possibly Pie Chart embedded in
  // dashboard) — count is cumulative, so >= 1 is enough to confirm
  // dashboard's chart wrapping rendered.
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if ((await readRechartsContainerCount(page)) > 0) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(
    `beautiful-chat/sales-dashboard: "Total Revenue" appeared but recharts container missing — dashboard tree partial`,
  );
}

/**
 * Turn 7 — Task Manager (shared state).
 *
 * `enableAppMode` flips the layout (chat shrinks to w-1/3, App pane
 * unhides). `manage_todos` populates state.todos which the App-pane
 * `TodoList` renders. The fixture supplies 3 specific todos; we assert
 * the "To Do" column heading + at least one of the canonical titles.
 *
 * Must be last: the App-pane layout breaks chat-input dispatch on
 * narrow viewports (max-lg:hidden). Subsequent turns would silently
 * fail to fill the input.
 */
async function assertTaskManager(page: ConversationPage): Promise<void> {
  // "To Do" column heading is the App-pane mount signal.
  await waitForText(page, "To Do", FIRST_SIGNAL_TIMEOUT_MS);
  // Canonical todo title from the fixture. Asserting one is enough —
  // the runtime renders all-or-none from a single state update.
  await waitForText(page, "Read CopilotKit docs", SIBLING_TIMEOUT_MS);
}

/**
 * Wait for a literal text node to be visible. Wraps Playwright's
 * `waitForSelector` with a friendlier error so the failure_turn entry
 * carries a descriptive message — the conversation runner surfaces
 * the thrown message verbatim into the probe's signal blob, which is
 * what the dashboard's drilldown displays.
 */
async function waitForText(
  page: ConversationPage,
  text: string,
  timeoutMs: number,
): Promise<void> {
  try {
    await page.waitForSelector(`text=${text}`, {
      state: "visible",
      timeout: timeoutMs,
    });
  } catch {
    throw new Error(
      `beautiful-chat: expected text "${text}" to appear within ${timeoutMs}ms`,
    );
  }
}

export function buildTurns(_ctx: D5BuildContext): ConversationTurn[] {
  return [
    {
      input: "d5 beautiful-chat probe: toggle the theme",
      assertions: assertToggleTheme,
    },
    {
      input:
        "d5 beautiful-chat probe: pie chart of revenue distribution by category",
      assertions: assertPieChart,
    },
    {
      input: "d5 beautiful-chat probe: bar chart of expenses by category",
      assertions: assertBarChart,
    },
    {
      input: "d5 beautiful-chat probe: search flights from SFO to JFK",
      assertions: assertSearchFlights,
    },
    {
      input:
        "d5 beautiful-chat probe: schedule a 30-minute meeting to learn about CopilotKit",
      assertions: assertScheduleMeeting,
    },
    {
      input: "d5 beautiful-chat probe: sales dashboard with metrics and charts",
      assertions: assertSalesDashboard,
    },
    {
      input: "d5 beautiful-chat probe: enable app mode and add three todos",
      assertions: assertTaskManager,
    },
  ];
}

function preNavigateRoute(): string {
  return "/demos/beautiful-chat";
}

registerD5Script({
  featureTypes: ["beautiful-chat"],
  fixtureFile: "beautiful-chat.json",
  buildTurns,
  preNavigateRoute,
});
