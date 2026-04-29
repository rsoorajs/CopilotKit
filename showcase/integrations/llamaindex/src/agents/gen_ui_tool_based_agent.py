"""LlamaIndex agent for the Tool-Based Generative UI demo.

The frontend registers `render_bar_chart` and `render_pie_chart` tools via
`useComponent`. The AG-UI protocol forwards those tool definitions to the
agent at request time, so the backend agent itself declares no bespoke
tools — the LLM sees the frontend tools through the AG-UI request payload
and picks one to call when the user asks for a chart.

Mirrors `langgraph-python/src/agents/gen_ui_tool_based.py`.
"""

from __future__ import annotations

from llama_index.llms.openai import OpenAI
from llama_index.protocols.ag_ui.router import get_ag_ui_workflow_router


SYSTEM_PROMPT = """You are a data visualization assistant.

When the user asks for a chart, call `render_bar_chart` or `render_pie_chart`
with a concise title, short description, and a `data` array of
`{label, value}` items. Pick bar for comparisons over a small set of
categories; pick pie for composition / share-of-whole.

Keep chat responses brief -- let the chart do the talking."""


gen_ui_tool_based_router = get_ag_ui_workflow_router(
    llm=OpenAI(model="gpt-4o-mini"),
    frontend_tools=[],
    backend_tools=[],
    system_prompt=SYSTEM_PROMPT,
    initial_state={},
)
