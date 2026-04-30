"""LlamaIndex agent backing the In-Chat HITL (useHumanInTheLoop) demo.

The `book_call` tool is defined on the frontend via `useHumanInTheLoop`.
The LlamaIndex AG-UI workflow router (AGUIChatWorkflow) does NOT
dynamically pick up frontend-declared tools from the CopilotKit run
request — it only recognises tools registered via the `frontend_tools`
constructor argument. Without a backend-side stub the workflow never
emits `ToolCallChunkWorkflowEvent` for `book_call`, so the CopilotKit
runtime never transitions the render status to "executing" and the
time-picker buttons stay disabled.

The stub below provides just enough schema for the LLM to call
`book_call` and for the workflow to emit the proper AG-UI events.
Actual execution happens on the frontend; the stub is never invoked
because CopilotKit intercepts the tool call before the backend can
process the result.

Mirrors `langgraph-python/src/agents/hitl_in_chat_agent.py`.
"""

from __future__ import annotations

import os

from llama_index.core.tools import FunctionTool
from llama_index.llms.openai import OpenAI
from llama_index.protocols.ag_ui.router import get_ag_ui_workflow_router

_openai_kwargs = {}
if os.environ.get("OPENAI_BASE_URL"):
    _openai_kwargs["api_base"] = os.environ["OPENAI_BASE_URL"]


def _book_call_stub(topic: str, attendee: str) -> str:
    """Ask the user to pick a time slot for a call.

    The picker UI presents fixed candidate slots; the user's choice is
    returned to the agent.
    """
    # Frontend-only tool — CopilotKit intercepts the call and renders the
    # TimePickerCard.  This stub satisfies the AGUIChatWorkflow tool
    # registry so the proper AG-UI events are emitted.
    return ""


_book_call_tool = FunctionTool.from_defaults(
    fn=_book_call_stub,
    name="book_call",
    description=(
        "Ask the user to pick a time slot for a call. The picker UI "
        "presents fixed candidate slots; the user's choice is returned "
        "to the agent."
    ),
)


hitl_in_chat_router = get_ag_ui_workflow_router(
    llm=OpenAI(model="gpt-4o-mini", **_openai_kwargs),
    frontend_tools=[_book_call_tool],
    backend_tools=[],
    system_prompt=(
        "You help users book an onboarding call with the sales team. "
        "When they ask to book a call, call the frontend-provided "
        "`book_call` tool with a short topic and the user's name. "
        "Keep any chat reply to one short sentence."
    ),
    initial_state={},
)
