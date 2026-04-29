# BYOC JSON Render — Not Supported by Spring AI

## What This Demo Would Show

A Bring-Your-Own-Component flow where the agent streams **structured JSON
per token** (not just final JSON) and the frontend renders it incrementally
via `@json-render` — UI cards materialize and update as the JSON arrives.

## Why Spring AI Cannot Support This

Two blockers:

1. Spring AI's `BeanOutputConverter` only resolves on the **final**
   response — it parses a complete buffered string into a typed object.
   There is no per-token JSON streaming primitive to drive incremental
   render. Token streams from `ChatClient` are free-form text.
2. The `@json-render` runtime dependencies are not installed in this
   integration's `package.json`, because the upstream support is missing.

## Where This Works

See the LangGraph Python integration:
[`showcase/integrations/langgraph-python/src/app/demos/byoc-json-render`](../../../../../langgraph-python/src/app/demos/byoc-json-render).
