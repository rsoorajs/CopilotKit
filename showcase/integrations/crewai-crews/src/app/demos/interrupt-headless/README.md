# Headless Interrupt -- Not Supported (CrewAI Crews)

CrewAI Crews has no equivalent to LangGraph's `interrupt()` primitive: the `ChatWithCrewFlow` execution model in `ag-ui-crewai` runs each crew turn to completion and emits AG-UI `RUN_FINISHED` directly, with no surface for pausing mid-execution to await a resume payload. The headless flavor (resolve interrupts from a plain button grid -- no chat, no `useInterrupt` render prop) shares the same dependency on upstream pause/resume support that does not exist in CrewAI today.

For a working example see `showcase/integrations/langgraph-python/src/app/demos/interrupt-headless`.
