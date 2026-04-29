# gen-ui-interrupt (not supported on AWS Strands)

This feature is listed under `not_supported_features` in
`showcase/integrations/strands/manifest.yaml`.

## Why It Is Not Supported

`gen-ui-interrupt` is built on `useLangGraphInterrupt`, which hooks
directly into the LangGraph interrupt lifecycle. AWS Strands does not
expose an equivalent first-class interrupt primitive — there is no
runtime-level resolve/respond signal we can adapt to without writing new
Strands-side integration work.

See `showcase/integrations/strands/PARITY_NOTES.md` for full context.

## Ergonomic Replacement

Strands users should reach for the `hitl-in-chat` demo
(`src/app/demos/hitl-in-chat/`), which uses `useHumanInTheLoop` on top of
a regular frontend tool — Strands supports that natively.

## Files

- `page.tsx` — stub page that surfaces the unsupported message and links
  to the `hitl-in-chat` replacement.
