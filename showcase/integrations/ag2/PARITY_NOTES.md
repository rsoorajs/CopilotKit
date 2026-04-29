# AG2 Parity Notes

Status of AG2 showcase demos relative to the langgraph-python canonical set.

## Ported

### Batch 1 — Frontend variants over the shared ConversableAgent

These demos reuse the existing `src/agents/agent.py` (one `ConversableAgent`
wrapped with `AGUIStream`). The runtime route registers each agent name,
all pointing to the same HTTP backend.

- `prebuilt-sidebar` — `<CopilotSidebar />` docked layout
- `prebuilt-popup` — `<CopilotPopup />` floating launcher
- `chat-slots` — slot-overridden `<CopilotChat />` (welcomeScreen, disclaimer, assistantMessage)
- `chat-customization-css` — scoped CSS theming of built-in classes
- `headless-simple` — bespoke chat built on `useAgent` / `useComponent`
- `readonly-state-agent-context` — `useAgentContext` read-only context
- `reasoning-default-render` — built-in `CopilotChatReasoningMessage` (no custom slot)
- `tool-rendering-default-catchall` — `useDefaultRenderTool()` (built-in card)
- `tool-rendering-custom-catchall` — single branded wildcard renderer
- `frontend-tools` — `useFrontendTool` with sync handler (change_background)
- `frontend-tools-async` — `useFrontendTool` with async handler (notes-card)
- `hitl-in-app` — async `useFrontendTool` + app-level modal (approval-dialog)

### Previously ported (kept)

- `agentic-chat`, `hitl-in-chat`, `tool-rendering`, `gen-ui-tool-based`,
  `gen-ui-agent`, `shared-state-streaming`

### Batch 3 — Headless complete + manifest-only entries

- `cli-start` — informational manifest entry (copy-paste starter command).
- `gen-ui-tool-based` — already shipped; manifest entry added.
- `headless-complete` — TRULY headless chat re-composed from low-level
  hooks (`useRenderToolCall`, `useRenderActivityMessage`,
  `useRenderCustomMessages`). Backend: dedicated AG2
  `ConversableAgent` (`agents/headless_complete.py`) mounted at
  `/headless-complete/` with `get_weather` + `get_stock_price` tools;
  `highlight_note` is registered on the frontend via `useComponent`.

### Batch 4 — A2UI / OGUI / MCP + reasoning ports (this batch)

Each demo gets its own AG2 sub-app mounted at a named path, plus
(where required) its own dedicated `/api/copilotkit-*` runtime route so
the runtime middleware config doesn't leak into other cells.

- `declarative-gen-ui` — A2UI Dynamic Schema. Backend
  (`src/agents/a2ui_dynamic.py`) owns the `generate_a2ui` tool, which
  invokes a secondary OpenAI client bound to `render_a2ui` and returns
  an `a2ui_operations` container. Runtime route at
  `api/copilotkit-declarative-gen-ui/route.ts` with
  `a2ui.injectA2UITool: false`.
- `a2ui-fixed-schema` — A2UI Fixed Schema. Backend
  (`src/agents/a2ui_fixed.py`) ships `flight_schema.json` and exposes a
  `display_flight(origin, destination, airline, price)` tool that emits
  `a2ui_operations` directly. Runtime route at
  `api/copilotkit-a2ui-fixed-schema/route.ts` with
  `a2ui.injectA2UITool: false`.
- `mcp-apps` — Backend (`src/agents/mcp_apps_agent.py`) is a no-tools
  ConversableAgent; the runtime route at
  `api/copilotkit-mcp-apps/route.ts` configures
  `mcpApps.servers` pointing at the public Excalidraw MCP server, and
  the runtime middleware injects MCP tools at request time.
- `open-gen-ui`, `open-gen-ui-advanced` — Backends are no-tools
  ConversableAgents (`src/agents/open_gen_ui_agent.py` and
  `src/agents/open_gen_ui_advanced_agent.py`). Shared runtime route at
  `api/copilotkit-ogui/route.ts` enables
  `openGenerativeUI: { agents: [...] }` so the runtime middleware
  converts streamed `generateSandboxedUi` tool calls into
  `open-generative-ui` activity events.
- `agentic-chat-reasoning`, `tool-rendering-reasoning-chain` — Frontend
  ports of the LangGraph reasoning cells. The custom `reasoningMessage`
  slot is wired exactly as in the canonical reference. Backend caveat:
  AG2's `ConversableAgent` does not natively emit AG-UI
  `REASONING_MESSAGE_*` events the way LangGraph's `deepagents` does,
  so the reasoning slot may render empty on every turn until a future
  AG2 release adds reasoning emission. The tool chain
  (`tool-rendering-reasoning-chain` backend at
  `src/agents/tool_rendering_reasoning_chain.py`, mounted at
  `/tool-rendering-reasoning-chain/`) still exercises end-to-end.

### Batch 2 — Dedicated AG2 sub-apps

These demos own their own `ConversableAgent(s)` plus FastAPI sub-app
mounted at a named path (`agent_server.py` mounts each one before the
catch-all `/`). The Next.js runtime points an `HttpAgent` at the
matching path so each demo gets its own ContextVariables-backed state
slot, isolated from the shared default agent.

- `shared-state-read-write` — bidirectional shared state via AG2
  `ContextVariables` + `ReplyResult`. Agent calls `get_current_preferences`
  to read UI-written prefs and `set_notes` to write back.
- `subagents` — supervisor `ConversableAgent` that delegates to three
  sub-`ConversableAgent`s (research/writing/critique) exposed as tools;
  each delegation appends to `delegations` in shared state for the live
  log UI.

## Deferred (require per-demo agent specialization)

AG2's AG-UI integration mounts a single `AGUIStream` over one
`ConversableAgent` at the FastAPI root. Achieving per-demo specialized
behavior (tailored system prompts, dedicated tool sets, backend-owned
A2UI tools, MCP integration, vision input, structured-output BYOC, etc.)
requires adding additional Python agent modules AND either (a) mounting
each as its own ASGI app at a distinct path and pointing a dedicated
`HttpAgent({ url })` at it from a per-demo Next.js runtime route, or
(b) adopting AG2's `GroupChat` to host multiple specialized agents
behind a single stream with router logic. Both approaches are feasible
but represent a distinct engineering investment and are not a pure port
of the langgraph-python cell.

The following demos fall into that bucket and are **deferred**, not
strictly "missing primitive" skips:

- `agent-config` — needs the agent to re-materialize system prompt from
  forwardedProps on every turn (AG2 ConversableAgent supports this but a
  dedicated runtime wiring is required).
- `auth` — pure runtime `onRequest` hook demo; dedicated `/api/copilotkit-auth`
  route; agent stays unchanged. Straightforward but requires a new route.
- `byoc-hashbrown`, `byoc-json-render` — streaming structured-output BYOC
  with Zod-validated catalogs; each has its own runtime route, catalog,
  renderer, and supporting components.
- `beautiful-chat` — branded starter chat with OGUI + A2UI + MCP combined
  runtime; large cross-cutting port.
- `multimodal` — vision-capable AG2 agent + dedicated `/api/copilotkit-multimodal`.
- `voice` — frontend voice STT; needs dedicated `/api/copilotkit-voice` and
  the lazy-init agent shape from langgraph-python.

## Skipped (missing primitive)

- `gen-ui-interrupt` — requires a LangGraph-style `interrupt()` that
  round-trips a resumable graph pause through the event stream. AG2's
  `human_input_mode` is a synchronous request/reply; it does not resume
  the same run from a persisted checkpoint.
- `interrupt-headless` — same underlying primitive as `gen-ui-interrupt`.
- `hitl-in-chat-booking` — booking variant of the langgraph
  `useInterrupt`-driven HITL flow; same missing primitive as above.
  AG2 has the simpler `hitl-in-chat` (synchronous `useHumanInTheLoop`)
  but cannot reproduce the resumable interrupt round-trip.
