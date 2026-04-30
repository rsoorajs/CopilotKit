"""ADK scheduling agent for the interrupt-adapted demos.

Powers both gen-ui-interrupt and interrupt-headless. The LangGraph reference
uses `interrupt()` with checkpoint/resume; ADK has no equivalent primitive, so
we adapt via Strategy B: the backend agent defines a system prompt that
instructs it to call `schedule_meeting`, and the frontend registers that tool
via `useFrontendTool` with an async handler that renders a time-picker and
returns a Promise that only resolves when the user picks a slot (or cancels).

No backend tools — `schedule_meeting` is satisfied entirely by the frontend.
"""

from __future__ import annotations

from google.adk.agents import LlmAgent
from ag_ui_adk import AGUIToolset

from agents.shared_chat import get_model

_INSTRUCTION = (
    "You are a scheduling assistant. Whenever the user asks you to book a call "
    "or schedule a meeting, you MUST call the `schedule_meeting` tool. Pass a "
    "short `topic` describing the purpose of the meeting and, if known, an "
    "`attendee` describing who the meeting is with.\n\n"
    "The `schedule_meeting` tool is implemented on the client: it surfaces a "
    "time-picker UI to the user and returns the user's selection. After the "
    "tool returns, briefly confirm whether the meeting was scheduled and at "
    "what time, or note that the user cancelled. Do NOT ask for approval "
    "yourself — always call the tool and let the picker handle the decision.\n\n"
    "Keep responses short and friendly. After you finish executing tools, "
    "always send a brief final assistant message summarizing what happened so "
    "the message persists."
)

interrupt_agent = LlmAgent(
    name="InterruptAgent",
    model=get_model(),
    instruction=_INSTRUCTION,
    tools=[AGUIToolset()],
)
