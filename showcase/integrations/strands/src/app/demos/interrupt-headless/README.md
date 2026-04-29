# interrupt-headless (not supported on AWS Strands)

This feature is listed under `not_supported_features` in
`showcase/integrations/strands/manifest.yaml`.

## Why It Is Not Supported

`interrupt-headless` requires `useLangGraphInterrupt`'s resolve/respond
primitive — the headless variant of `gen-ui-interrupt`. AWS Strands does
not expose an equivalent first-class interrupt primitive, so the headless
variant is not portable without new Strands-side integration work.

See `showcase/integrations/strands/PARITY_NOTES.md` for full context.

## Ergonomic Replacements

For Strands-native HITL flows, see:

- `headless-complete` (`src/app/demos/headless-complete/`) — full headless
  chat implementation using `useAgent` directly.
- `hitl-in-chat` (`src/app/demos/hitl-in-chat/`) — `useHumanInTheLoop`
  ergonomic HITL.

## Files

- `page.tsx` — stub page that surfaces the unsupported message and links
  to the closest replacements.
