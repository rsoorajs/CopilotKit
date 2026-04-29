# Tool Rendering (Reasoning Chain)

## What This Demo Shows

A single cell that composes two patterns:

1. **Reasoning tokens** rendered via a custom `reasoningMessage` slot
   — the same approach as the `agentic-chat-reasoning` cell.
2. **Sequential tool calls** rendered with:
   - `get_weather` → `<WeatherCard />`
   - `search_flights` → `<FlightListCard />`
   - everything else → `<CustomCatchallRenderer />`

## How to Interact

- "What's the weather in Tokyo?"
- "Find flights from SFO to JFK."
- "How is AAPL doing?"
- "Roll a 20-sided die for me."

## Technical Details

- Backend agent: `src/agents/tool_rendering_reasoning_chain.py` — a
  travel & lifestyle concierge with `get_weather`, `search_flights`,
  `get_stock_price`, and `roll_dice`. Mounted at
  `/tool-rendering-reasoning-chain/` on the agent server.
- Frontend: `useRenderTool` for `get_weather` and `search_flights`,
  `useDefaultRenderTool` for the catch-all, and a custom
  `reasoningMessage` slot.
- Note: AG2's `ConversableAgent` does not natively emit AG-UI
  `REASONING_MESSAGE_*` events the way LangGraph's `deepagents` does,
  so the reasoning slot may render empty until/if a reasoning event
  arrives. The tool chain still exercises end-to-end.
