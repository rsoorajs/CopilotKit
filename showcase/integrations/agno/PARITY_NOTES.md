# Agno — Parity Notes

Tracking notes for feature-matrix parity between this package and
`showcase/integrations/langgraph-python/` (canonical reference).

## Ported

See `manifest.yaml` for the authoritative list.

### Initial parity push

- `prebuilt-sidebar`, `prebuilt-popup` — chrome demos using the shared main agent
- `chat-slots`, `chat-customization-css` — chat customization paths
- `headless-simple` — minimal useAgent surface
- `frontend-tools`, `frontend-tools-async` — useFrontendTool (sync + async handlers)
- `readonly-state-agent-context` — useAgentContext read-only context
- `tool-rendering-default-catchall`, `tool-rendering-custom-catchall` — wildcard-only tool rendering variants (new `get_stock_price` + `roll_dice` tools added to the Agno main agent)
- `hitl-in-chat` booking flow — useHumanInTheLoop with a new `book_call` external-execution tool
- `hitl-in-app` — frontend-tool + app-level approval dialog (frontend-only)

### Second pass (deferred-demo recovery)

- `agentic-chat-reasoning`, `reasoning-default-render`,
  `tool-rendering-reasoning-chain` — reasoning family. Verified Agno's AGUI
  interface emits `REASONING_MESSAGE_*` events (`agno/os/interfaces/agui/utils.py`
  imports `ReasoningMessageStartEvent` / `ReasoningMessageContentEvent` /
  `ReasoningMessageEndEvent`). Added a new `reasoning_agent` Python module
  with `reasoning=True` plus a second `AGUI` interface mounted at prefix
  `/reasoning`. The Next.js runtime aliases the three reasoning agent names to
  an `HttpAgent` targeting `/reasoning/agui`.
- `headless-complete` — full chat from scratch on `useAgent` +
  `CopilotChatConfigurationProvider` + manual `useRenderToolCall` /
  `useRenderActivityMessage` / `useRenderCustomMessages` composition. Reuses
  the Agno main agent via the default `/api/copilotkit` endpoint. MCP-Apps
  activity surface is intentionally omitted — Agno's AGUI adapter doesn't
  expose an MCP-Apps runtime. Every other generative-UI branch (per-tool
  renderers, `useComponent` frontend tools, reasoning, custom messages,
  wildcard catch-all) is wired in.
- `auth` — dedicated `/api/copilotkit-auth` runtime using
  `createCopilotRuntimeHandler` from `@copilotkit/runtime/v2` with an
  `onRequest` hook that rejects requests lacking a static Bearer token.
  Authenticated target is the Agno main agent at `/agui`.

### Fourth pass (manifest fill — first half)

- `cli-start` — informational demo entry (no route/agent) advertising the
  copy-paste starter command for Agno. Mirrors the canonical
  `langgraph-python` cli-start cell.
- `gen-ui-tool-based` — already shipped as a haiku-renderer demo (frontend-only
  via `useFrontendTool` + `render`); now declared in `manifest.yaml` so the
  showcase picks it up. Wired to the main agent under the `gen-ui-tool-based`
  alias in `src/app/api/copilotkit/route.ts`.
- `hitl-in-chat-booking` — manifest entry pointing at the existing
  `hitl-in-chat` time-picker booking surface (same files, distinct cell). The
  Agno main agent's `book_call` external-execution tool already drives this
  flow.

### Fifth pass (manifest fill — second half)

- `mcp-apps` — runtime `mcpApps.servers` middleware against the public
  Excalidraw MCP server. Backed by a no-tools Agno agent
  (`mcp_apps_agent.py`) mounted at `/mcp-apps/agui` so the LLM only sees the
  MCP-injected toolset.
- `open-gen-ui` / `open-gen-ui-advanced` — shared dedicated runtime
  (`/api/copilotkit-ogui`) with the `openGenerativeUI` flag that wires the
  middleware. Backed by a no-tools Agno agent (`open_gen_ui_agent.py`)
  mounted at `/open-gen-ui/agui`. Advanced cell adds host-side sandbox
  functions (`evaluateExpression`, `notifyHost`) on the provider.
- `agent-config` — typed config object (tone/expertise/responseLength)
  forwarded via the provider's `properties` prop. The Agno backend mounts a
  custom AGUI handler at `/agent-config/agui` (`agent_server.py::
  _run_agent_config`) that reads `RunAgentInput.forwarded_props` and builds
  a per-request Agno Agent from `agents.agent_config_agent.build_agent(...)`
  before delegating to the stock AGUI stream mapper. Agno has no
  LangGraph-style configurable channel, so the per-request factory is the
  cleanest path to dynamic system prompts here.
- `voice` — V2 runtime under `/api/copilotkit-voice` with a guarded
  `TranscriptionServiceOpenAI`. Targets the Agno main agent at `/agui` for
  the chat side; transcription is purely runtime-side.
- `multimodal` — vision-capable Agno agent (`multimodal_agent.py`, gpt-4o)
  on its own `/multimodal/agui` interface, scoped via
  `/api/copilotkit-multimodal`. Image attachments forward natively; PDF
  flattening helper (`_maybe_flatten_pdf_part`) lives next to the agent for
  use if the AGUI converter needs assistance.
- `byoc-hashbrown` — dedicated `/api/copilotkit-byoc-hashbrown` runtime +
  `byoc_hashbrown_agent.py` whose system prompt steers the LLM toward the
  hashbrown UI-kit envelope shape (`{ "ui": [...] }`).
- `byoc-json-render` — dedicated `/api/copilotkit-byoc-json-render` runtime
  + `byoc_json_render_agent.py` whose system prompt steers the LLM toward
  the json-render flat element-tree spec (`{ root, elements }`).

### Sixth pass (A2UI fixed schema)

- `a2ui-fixed-schema` — dedicated `/api/copilotkit-a2ui-fixed-schema`
  runtime with `injectA2UITool: false`. New `a2ui_fixed_agent.py`
  mounted at `/a2ui-fixed-schema/agui` ships
  `flight_schema.json` + `booked_schema.json` and a single
  `display_flight` tool that emits an `a2ui_operations` container
  *directly* — no secondary LLM call — so the LLM only fills in data
  (origin/destination/airline/price). `booked_schema.json` is shipped
  as a sibling for when the SDK exposes per-button action handlers
  for fixed-schema surfaces.

### Third pass (state + multi-agent recovery)

- `shared-state-read-write` — bidirectional shared state with the UI
  writing `preferences` via `agent.setState(...)` and the agno agent
  writing `notes` back via a `set_notes` tool that mutates
  `run_context.session_state["notes"]`. Backed by a new
  `shared_state_read_write` agent module + a custom AGUI handler in
  `agent_server.py` mounted at `/shared-state-rw/agui`. The custom
  handler is a thin shim around `agno.os.interfaces.agui.utils`'s
  stream mapper that additionally emits a `StateSnapshotEvent` with the
  final `session_state` immediately before `RunFinishedEvent` — Agno's
  stock AGUI router does not emit state events, so without this shim
  agent-side state writes are invisible to a frontend subscribed via
  `useAgent({ updates: [OnStateChanged] })`.
- `subagents` — supervisor agno agent delegating to three specialized
  sub-agents (research / writing / critique). Each sub-agent is itself
  an Agno `Agent(...)` with its own system prompt, invoked via the
  delegation tools' `_invoke_sub_agent` helper. Every delegation
  appends an entry to `session_state["delegations"]` (with `running`
  status pre-flight, then flipped to `completed`/`failed` post-flight).
  Reuses the same `/subagents/agui` state-aware AGUI handler so the
  delegation log re-renders live.

## Skipped

The following demos from the canonical LangGraph-Python reference are intentionally
NOT ported to this package. Each has a concrete reason tied to a genuine framework
capability difference or infrastructure requirement that we couldn't validate in
this blitz pass.

### LangGraph-specific primitives (no direct Agno equivalent)

- `gen-ui-interrupt` — Uses LangGraph's `interrupt()` primitive to pause the graph
  mid-run and resolve from the UI. Agno's AgentOS AGUI adapter does not expose an
  equivalent long-running-resume primitive at this time. We already ship
  `hitl-in-chat-booking` + `hitl-in-app`, which cover the user-facing HITL scenario
  via Agno's native tool-approval path.
- `interrupt-headless` — Same root cause as `gen-ui-interrupt`. Headless resume
  from a button grid requires a pause/resume handle the Agno AGUI adapter does
  not currently surface.

### Require dedicated runtimes we haven't wired yet

These demos depend on dedicated `/api/copilotkit-<variant>/route.ts` runtimes in
the canonical reference. They are portable in principle — they just need new
route files each and supporting Python wiring — but doing them right requires
exercising Agno's runtime config paths we haven't validated yet. Deferred for a
follow-up parity pass rather than faked in.

- `beautiful-chat` — combined runtime (openGenerativeUI + a2ui + mcpApps)
- `byoc-hashbrown` — dedicated `/api/copilotkit-byoc-hashbrown` runtime, requires
  Agno structured-output streaming matching the hashbrown Zod catalog
- `byoc-json-render` — dedicated `/api/copilotkit-byoc-json-render` runtime,
  requires streaming JSON-schema-constrained output from Agno
- `multimodal` — dedicated `/api/copilotkit-multimodal` runtime; Agno supports
  multimodal input via `UserMessage(images=[...])` but wiring vision to an
  AGUI-served agent needs a runtime surface we haven't built
- `voice` — dedicated `/api/copilotkit-voice` runtime + `@copilotkit/voice`;
  voice STT is a frontend concern independent of the Agno agent
- `open-gen-ui`, `open-gen-ui-advanced` — dedicated `/api/copilotkit-ogui`
  runtime; requires openGenerativeUI middleware on a V2 runtime talking to
  an Agno agent
- `agent-config` — dedicated `/api/copilotkit-agent-config` runtime with typed
  config forwarding; needs Agno dynamic-system-prompt wiring per-request
- `mcp-apps` — requires Agno MCP client/server wiring; Agno has
  `agno.tools.mcp.MCPTools` but integration with the AGUI adapter's
  activity-message surface wasn't verified

### Not a real demo

- `cli-start` — Copy-paste starter command rendered by the dashboard as a
  command card with no route/agent. The equivalent starter for Agno is already
  advertised via `manifest.yaml`'s `starter:` section.
