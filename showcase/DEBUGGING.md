# Showcase Local Debugging Playbook

Quick-reference for running, debugging, and iterating on showcase integrations locally.

## Prerequisites

See [README.md](README.md) for Docker/Colima/OrbStack setup, API key configuration, and the general layout of the showcase directory. This document assumes you have a working Docker engine and a populated `.env` file.

## CLI Reference

The unified CLI is at `bin/showcase`. It wraps Docker Compose and adds debugging-specific commands. All commands can be run from any directory -- paths are resolved relative to the script itself.

```sh
# From repo root:
./showcase/bin/showcase <command> [args...]

# Or from within showcase/:
./bin/showcase <command> [args...]
```

### Core Commands

| Command                    | Description                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `showcase up [slug...]`    | Start containers (rebuilds if source changed). No args = infra only (aimock, pocketbase, dashboard) |
| `showcase down [slug...]`  | Stop containers. No args = stop everything                                                          |
| `showcase build [slug...]` | Build Docker images without starting containers                                                     |
| `showcase ps`              | Show running containers and their status                                                            |
| `showcase ports`           | Print slug-to-host-port mapping (from `shared/local-ports.json`)                                    |
| `showcase logs <slug>`     | Follow container logs (supports `--grep`, `--since`, `-n`, `--no-follow`)                           |

### Debugging Commands

| Command                      | Description                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `showcase aimock-rebuild`    | Rebuild local aimock from a source checkout and redeploy the container                               |
| `showcase recreate <slug>`   | Force-recreate a service (picks up a newly built image)                                              |
| `showcase test <slug>`       | Run probe tests against a running service                                                            |
| `showcase fixtures validate` | Check fixture JSON files for structural errors, duplicates, and common mistakes                      |
| `showcase doctor`            | Diagnose common local stack issues (Docker engine, Depot interception, stale images, port conflicts) |
| `showcase diff-logs <slug>`  | Show log output for a specific time window, filtering out noise from before your change              |

## The Debugging Loop

This is the iterative process for going from a red probe to green. Each section below is a phase you will cycle through. Most debugging sessions follow the same pattern: establish baseline, trace what aimock sees, fix, re-test.

### Phase 1: Establish the Red Baseline

Start the infrastructure and run the failing test to see the exact error:

```sh
showcase up aimock mastra        # or whatever slug is failing
showcase test mastra --d5 --verbose
```

What to look for in the output -- the specific probe name and error message. Common patterns:

- **"chained reply missing fragments after 30000ms"** -- fixture matching issue. The agent is sending requests that don't match any fixture, so aimock returns 404 and the agent stalls.
- **"timeout"** -- container not responding. The service may not have started, may be crash-looping, or may be listening on the wrong port. Check logs first.
- **"404"** -- endpoint not found. The demo route doesn't exist, or the agent backend path is wrong. Check the integration's routing config.
- **"JS error on page"** -- a frontend error is crashing the demo. Use Playwright UI mode (`npx playwright test --ui`) from the integration directory to see the browser and open DevTools.

### Phase 2: Trace Fixture Matching

When an agent loops, stalls, or produces wrong output, the answer is almost always in what aimock is matching (or failing to match):

```sh
showcase logs aimock --grep "fixture|match|NO match|404"
```

What the log lines mean:

- **"matched fixture X at turnIndex N"** -- aimock found a fixture for this request and is returning it. If the same turnIndex repeats, the supervisor is stuck in a loop (re-sending the same request and getting the same canned response).
- **"NO match"** -- the request pattern doesn't match any fixture. This means either the fixture is missing, or the request shape has changed (different model, different system prompt, different tool definitions).
- **Repeated matches at the same turnIndex** -- the agent's retry/loop logic is firing because it didn't get the response it expected from the previous turn. The fixture chain is broken somewhere upstream.

### Phase 3: The aimock Edit-Build-Deploy-Test Cycle

This is the most repeated cycle during debugging. When you need to change aimock's behavior (response format, fixture matching logic, streaming behavior), the `aimock-rebuild` command automates the full rebuild-and-redeploy:

```sh
# 1. Edit aimock source (e.g., src/responses.ts, src/fixture-matcher.ts)

# 2. Rebuild and redeploy:
showcase aimock-rebuild --from /path/to/aimock

# 3. Run the test:
showcase test mastra --d5 --verbose --cycle
```

The `--cycle` flag on `test` automatically dumps aimock's log delta on failure, saving you from running a separate `logs` command after each failed attempt.

**Without the CLI** (the manual equivalent, for understanding what the commands do under the hood):

```sh
cd /path/to/aimock && npm run build
DEPOT_DISABLE=1 docker buildx build --builder desktop-linux --load -t aimock:local .
docker compose -f tests/docker-compose.integrations.yml up -d --force-recreate aimock
sleep 5 && docker logs showcase-aimock 2>&1 | tail -3
```

The CLI version handles the Depot bypass, builder selection, compose file path, and container readiness check automatically.

### Phase 4: Integration Code Fixes

When aimock is behaving correctly but the integration itself has bugs (wrong tool definitions, broken agent wiring, frontend rendering issues):

```sh
# Edit integration source (integrations/<slug>/src/...)
showcase build <slug>           # rebuild the Docker image
showcase recreate <slug>        # pick up the new image
showcase test <slug> --d5 --verbose
```

Or combine build + recreate in one step:

```sh
showcase recreate <slug> --build
```

Use the Playwright UI mode directly (`npx playwright test --ui` from the integration directory) for interactive debugging of frontend issues where the DOM isn't rendering what the probe expects.

### Phase 5: Fixture Iteration

When adding or modifying aimock fixtures (the JSON files that define canned responses):

```sh
# 1. Edit fixture JSON (showcase/aimock/*.json)

# 2. Validate fixtures for common errors (malformed JSON, duplicate keys,
#    missing required fields, turnIndex gaps):
showcase fixtures validate

# 3. Recreate aimock to pick up the changed fixture files:
showcase recreate aimock

# 4. Test:
showcase test <slug> --d5 --verbose
```

Fixtures are baked into the aimock Docker image at build time. Simply editing the JSON file on disk does nothing until the container is recreated with the updated files. This is the most common "why isn't my fix working?" mistake.

### Phase 6: Verify Green

Once you believe the fix is in, run the full probe suite for the slug to confirm everything passes:

```sh
showcase test <slug> --d5 --verbose
# Expected: all probes pass, no timeouts, no fixture mismatches
```

If you want extra confidence, run the test command multiple times to check for flakes.

## Gotchas and Common Mistakes

### restart vs recreate

`docker compose restart` reuses the existing container and image. If you have rebuilt an image, the restarted container still runs the OLD image. This is the single most common source of "I rebuilt but nothing changed."

Always use `showcase recreate` (which runs `docker compose up --force-recreate`) when you need the new image:

```sh
# WRONG -- still uses old image:
docker compose restart mastra

# RIGHT -- picks up new image:
showcase recreate mastra
```

### Depot intercepts Docker builds

On machines with Depot CLI installed, `docker build` is silently proxied through Depot's remote builders. This causes two problems:

1. The `--load` flag may not work as expected (the image stays on the remote builder instead of being loaded locally).
2. Build caching behaves differently, and local filesystem mounts may not resolve.

The `aimock-rebuild` command handles this automatically by setting `DEPOT_DISABLE=1` and using `--builder desktop-linux`.

If you are building manually:

```sh
DEPOT_DISABLE=1 docker buildx build --builder desktop-linux --load -t myimage:local .
```

Run `showcase doctor` to check if Depot is intercepting your builds. The doctor command tests for the Depot shim and warns you if it is active.

### Aimock is stateless; the Responses API is not

The OpenAI Responses API uses `item_reference` to point to previous response items by ID. Aimock does not track conversation state across requests, so it cannot resolve these references dynamically. The synthetic assistant message fix handles this for `turnIndex`-based matching, but other stateful API features (e.g., conversation branching, response chaining by ID) may surface similar issues.

If you see errors about unresolvable item references, the fix is usually to ensure the fixture chain includes all necessary prior-turn context in each response, rather than relying on aimock to remember previous turns.

### Sub-agent calls are independent LLM requests

Each framework's sub-agent (e.g., Mastra's `Agent.generate()`, CrewAI's crew member, LangGraph's tool-calling node) hits aimock as a completely separate HTTP request with a different system prompt and user message. Fixtures for sub-agents must be added explicitly -- they do not inherit from the supervisor's fixture chain.

When debugging multi-agent flows:

1. Use `showcase logs aimock --grep "match"` to see ALL requests, not just the top-level one.
2. Each sub-agent request needs its own fixture with the correct system prompt pattern and turnIndex.
3. The order of sub-agent calls may not be deterministic -- fixtures should be robust to reordering.

### Production vs local aimock behavior

Production aimock uses `--proxy-only`, which silently forwards unmatched requests to real OpenAI. Local aimock returns 404 for unmatched requests. This difference matters:

- **Production can mask missing fixtures** -- the real LLM fills in, and the test may pass by coincidence. You won't know the fixture is incomplete until something changes in the LLM's behavior.
- **Local surfaces fixture gaps immediately** -- 404 errors make missing fixtures obvious. This is a feature, not a bug.
- **Local is the better environment for catching fixture gaps early.** If your test passes locally with all requests matched by fixtures, it will pass in production. The reverse is not guaranteed.

## Workflows by Use Case

### "A D5 probe is failing on CI"

This is the most common debugging scenario. The goal is to reproduce the failure locally, where you have full access to logs and can iterate quickly.

1. `showcase doctor` -- verify your local stack is healthy before chasing red herrings.
2. `showcase up aimock <slug>` -- start the failing integration plus aimock.
3. `showcase test <slug> --d5 --verbose --cycle` -- reproduce the failure locally. The `--cycle` flag dumps aimock logs on failure.
4. `showcase logs aimock --grep "fixture|match"` -- trace what aimock is seeing. Is the fixture matched? Is it the right turnIndex?
5. Fix the issue (fixture, aimock source, or integration code), then:
   - Fixture change: `showcase recreate aimock` then re-test.
   - Aimock source change: `showcase aimock-rebuild --from ~/proj/cpk/aimock` then re-test.
   - Integration code change: `showcase recreate <slug> --build` then re-test.

### "I changed aimock source and need to test it"

The `aimock-rebuild` command handles the full cycle: build the npm package, build the Docker image with Depot bypass, force-recreate the aimock container, and wait for readiness.

```sh
showcase aimock-rebuild --from ~/proj/cpk/aimock
showcase test <slug> --d5 --verbose
```

### "I added a new fixture and it is not being matched"

Fixture matching issues are the most subtle to debug. Work through this checklist:

```sh
# Check for JSON syntax errors, duplicate turnIndex values, missing fields:
showcase fixtures validate

# Recreate aimock to pick up the new fixture file:
showcase recreate aimock

# Watch what aimock is actually matching in real-time:
showcase logs aimock --grep "match"

# Run the test with log dump on failure:
showcase test <slug> --d5 --cycle
```

If the fixture validates and aimock still says "NO match", the request pattern has diverged from what the fixture expects. Compare the logged request (system prompt, model, tools) against the fixture's match criteria.

### "A container is running but returning errors"

```sh
# Check for stale images, port conflicts, missing env vars:
showcase doctor

# Look at recent logs only (skip startup noise):
showcase diff-logs <slug> --since 5m

# Try a fresh container (sometimes state gets corrupted):
showcase recreate <slug>
```

### "I want to see only logs from my last test run"

The test command writes a timestamp marker, and `diff-logs` can use it:

```sh
showcase test <slug> --d5 --verbose      # this writes .last-test-ts
showcase diff-logs aimock --since last-test --grep "fixture"
```

This filters out all log output from before your test started, showing only what happened during the test run itself.

## Environment Variables

| Variable            | Purpose                                                                            | Default                                                                         |
| ------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `AIMOCK_SRC`        | Path to local aimock checkout for `aimock-rebuild`                                 | `../../aimock` relative to `showcase/` (sibling of repo root), then `../aimock` |
| `SHOWCASE_LOCAL`    | Use localhost ports instead of Railway URLs in the shell app                       | unset                                                                           |
| `DEPOT_DISABLE`     | Bypass Depot CLI for local Docker builds                                           | unset (set to `1` to disable)                                                   |
| `OPENAI_API_KEY`    | Required for all integrations (even with aimock, some init code validates the key) | none                                                                            |
| `ANTHROPIC_API_KEY` | Required for Claude Agent SDK demos                                                | none                                                                            |

## Quick Diagnostic Commands

```sh
# Is everything OK?
showcase doctor

# What's running?
showcase ps

# What port is mastra on?
showcase ports | grep mastra

# Show aimock's fixture matching in real-time:
showcase logs aimock --grep "fixture|match|NO match"

# Last 5 minutes of error logs:
showcase diff-logs <slug> --since 5m --grep "error|Error|ERR"

# Validate all fixture files:
showcase fixtures validate

# Full reset -- stop everything, rebuild, restart:
showcase down
showcase build <slug>
showcase up aimock <slug>
showcase test <slug> --d5 --verbose
```
