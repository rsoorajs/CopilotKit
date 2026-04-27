# QA: State Streaming — Built-in Agent (TanStack AI)

## Prerequisites

- Set `OPENAI_API_KEY` environment variable
- Run `npm install && npm run dev` from the built-in-agent package directory
- Demo is accessible at `http://localhost:3000/demos/shared-state-streaming`

## Test Steps

### 1. Basic Functionality

- [ ] Navigate to the shared-state-streaming demo page
- [ ] Verify the chat interface loads with title "State Streaming"
- [ ] Verify the chat input placeholder "Type a message..." is visible
- [ ] Send a basic message (e.g. "Hello! What can you do?")
- [ ] Verify the agent responds

### 2. Feature-Specific Checks

#### Suggestions

- [ ] Verify "Get started" suggestion button is visible

#### Note: Stub Demo

- [ ] This demo is currently a stub (TODO: implement full state streaming)
- [ ] Verify the basic CopilotChat loads and accepts messages
- [ ] Verify the agent responds to messages
- [ ] No custom UI components are expected beyond the chat interface

### 3. Error Handling

- [ ] Send an empty message (should be handled gracefully)
- [ ] Verify no console errors during normal usage

## Expected Results

- Chat loads within 3 seconds
- Agent responds within 10 seconds
- No UI errors or broken layouts
