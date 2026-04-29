# Agentic Chat (Reasoning)

## What This Demo Shows

Demonstrates visible display of the agent's reasoning / thinking chain
via a custom `reasoningMessage` slot. CopilotChat discriminates messages
by `message.role === "reasoning"` and renders them via the
`reasoningMessage` slot (default: `CopilotChatReasoningMessage`); this
cell overrides that slot with a tagged amber `ReasoningBlock` that
labels the chain "Agent reasoning".

## How to Interact

Ask the agent any question that benefits from step-by-step thinking;
when the underlying model emits reasoning content the amber block will
render above the final answer.

## Technical Details

- Slot wiring: `<CopilotChat messageView={{ reasoningMessage: ReasoningBlock }} />`
- Reasoning block: `./reasoning-block.tsx`
- Backend agent: shares the default `src/agents/agent.py`. Note that
  AG2's `ConversableAgent` does not natively emit AG-UI
  `REASONING_MESSAGE_*` events the way LangGraph's `deepagents` does, so
  the custom slot is plumbed but may not fire on every turn — the
  primary intent here is to show the slot-override pattern.

## Reference

- packages/react-core/src/v2/components/chat/CopilotChatMessageView.tsx
