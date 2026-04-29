# Headless Chat (Complete)

## What This Demo Shows

Full chat implementation built from scratch on `useAgent` — no
`<CopilotChat />`, no `<CopilotChatMessageView>`, no
`<CopilotChatAssistantMessage>`. Demonstrates that every CopilotKit
rendering surface (text, reasoning, tool-call renders, custom-message
slots) can be re-composed by hand from the low-level hooks.

## How to Interact

Try asking your Copilot to:

- "What's the weather in Tokyo?"
- "What's AAPL trading at right now?"
- "Highlight 'meeting at 3pm' in yellow."

## Technical Details

- **Backend**: A dedicated AG2 `ConversableAgent` (see
  `src/agents/headless_complete.py`) mounted at `/headless-complete/`
  on the Python agent server. Exposes `get_weather` and
  `get_stock_price` as backend tools.
- **Frontend tool**: `highlight_note` is registered on the frontend
  via `useComponent`, which surfaces through the same
  `useRenderToolCall` path the manual hook consumes.
- **Manual composition**: `use-rendered-messages.tsx` mirrors
  CopilotChatMessageView's role dispatch, walking each message and
  producing a `renderedContent` node. The list (message-list.tsx)
  drops that node into a `<UserBubble>` or `<AssistantBubble>`
  chrome wrapper.
- **Chrome only**: the bubbles, typing indicator, and input bar
  contain zero imports from `@copilotkit/react-core`'s chat
  primitives — they're pure presentational components.
