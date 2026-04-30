# Showcase D5 (e2e-deep) Runbook

Operational documentation for debugging and fixing showcase D5 probe failures locally.
Intended audience: engineers and AI agents working on showcase integrations.

## CLI Rules

ALWAYS use `bin/showcase` for all operations. Never raw `docker compose` or `docker build`.

```
bin/showcase up <slug>          # start container
bin/showcase rebuild <slug>     # code changes (new image)
bin/showcase test <slug> --d5   # run D5 probe
```

- **`rebuild`** handles symlink dereferencing that raw `docker build` cannot (`tools/` and `shared-tools/` are symlinks to `../../shared/`).
- **`recreate`** for env/config changes (same image, new container).
- **`rebuild`** for code changes (new image).

## Fixture Matching

D5 fixtures use `hasToolResult` (not `turnIndex`) for multi-turn disambiguation.

| Field                  | Meaning                                          |
| ---------------------- | ------------------------------------------------ |
| `hasToolResult: false` | First LLM call -- no tool result in messages yet |
| `hasToolResult: true`  | Follow-up call -- tool result present            |

`turnIndex` counts assistant messages, which varies across frameworks. **Do not use `turnIndex` in new fixtures.**

**Exception:** `mcp-subagents` supervisor chain uses `turnIndex` 1-3 for steps beyond the first, because `hasToolResult` alone cannot disambiguate 4+ sequential calls.

### Fixture locations

- **Source fixtures:** `showcase/harness/fixtures/d5/*.json` -- edit these, then rebuild bundle.
- **Bundle:** `showcase/aimock/d5-all.json` -- aggregate of all source fixtures. Rebuild after any source edit.

### Aimock debug logging

Add `--log-level debug` to the aimock command in `docker-compose.local.yml` to see fixture match/miss per request.

## Integration Patterns

These are canonical. Do not deviate.

### HITL (hitl-steps, hitl-approve-deny, hitl-text-input)

Backend agent has `tools=[]` (no backend tools). Frontend registers tools via `useHumanInTheLoop` or `useFrontendTool`. CopilotKit injects frontend tool definitions into the LLM call. Every HITL integration follows this pattern without exception.

### gen-ui-custom

`langgraph-python` uses the chart pattern (`useComponent` with `render_pie_chart`). All other integrations should also demonstrate meaningful custom generative UI. Do not replace charts/data-viz with trivial text-only components just to pass tests.

### tool-rendering

Frontend registers `useRenderTool` for `get_weather`. The v2 API uses `parameters` (not `args`) in the render callback. Backend has the actual tool.

### shared-state

Backend calls `set_notes` tool, must forward tool result back to LLM for the follow-up text response. Frameworks that don't auto-cycle (crewai, langroid) need explicit tool-execution loops.

## Docker Compose Environment

All providers must be routed through aimock. Required env vars in `x-integration-defaults`:

```
OPENAI_API_KEY / OPENAI_BASE_URL          -> http://aimock:4010/v1
ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL    -> http://aimock:4010
GOOGLE_API_KEY / GOOGLE_GEMINI_BASE_URL   -> http://aimock:4010
SPRING_AI_OPENAI_BASE_URL                 -> http://aimock:4010
```

Missing any of these means that provider's integrations bypass aimock and hit real APIs (or fail with an empty key).

## Debugging Sequence

1. Check container health: `docker compose -f showcase/docker-compose.local.yml ps`
2. Check container logs: `docker logs showcase-<slug> --tail 30`
3. Enable aimock debug: add `--log-level debug` to compose command
4. Run test: `bin/showcase test <slug> --d5 --verbose`
5. Check aimock logs for fixture matching: `docker logs showcase-aimock 2>&1 | grep "Fixture matched\|No fixture"`
6. If fixture matches but test fails: frontend/runtime issue (check component rendering, testid attributes)
7. If fixture does not match: check `hasToolResult`, `userMessage` substring matching
8. If zero aimock requests: check base URL env var for that provider

## Anti-Patterns

Earned by bugs. Do not repeat.

- **NEVER** change a demo's fundamental functionality to pass a test. The demo IS the point.
- **NEVER** replace chart/data-viz gen-ui with trivial text components.
- **NEVER** use `turnIndex` in new fixtures. Use `hasToolResult`.
- **NEVER** use raw `docker build`. Symlinks break. Use `bin/showcase rebuild`.
- **NEVER** assume "agent says done" means "D5 is green." Always run the actual test.
- **NEVER** add a backend tool for something that should be a frontend HITL tool.

## Dev Iteration Speed

Each integration service bind-mounts its host `src/` directory into the container via the `volumes` entry in `docker-compose.local.yml`:

```yaml
volumes:
  - ./integrations/<slug>/src:/app/src
```

This means **source edits take effect on container restart** without rebuilding the Docker image. The workflow becomes:

1. Edit code under `showcase/integrations/<slug>/src/`
2. Restart the container: `bin/showcase restart <slug>`
3. Re-run the test: `bin/showcase test <slug> --d5`

Use `bin/showcase rebuild <slug>` only when you change dependencies (requirements.txt, package.json) or non-src files (Dockerfile, entrypoint). For pure `src/` changes, restart is sufficient and much faster.
