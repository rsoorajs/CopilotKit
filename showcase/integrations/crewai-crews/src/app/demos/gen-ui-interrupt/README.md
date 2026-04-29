# Generative UI Interrupt -- Not Supported (CrewAI Crews)

CrewAI Crews has no equivalent to LangGraph's `interrupt()` primitive: the `ChatWithCrewFlow` execution model in `ag-ui-crewai` runs each crew turn to completion and emits AG-UI `RUN_FINISHED` directly, with no surface for pausing mid-execution to await UI input. The generative-UI flavor of interrupt -- which renders a custom React component while the run is paused and resumes with a typed payload -- has no port path until upstream CrewAI/AG-UI introduces a pause/resume primitive.

For a working example see `showcase/integrations/langgraph-python/src/app/demos/gen-ui-interrupt`.
