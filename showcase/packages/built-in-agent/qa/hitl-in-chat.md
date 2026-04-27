# QA: In-Chat HITL — Built-in Agent (TanStack AI)

## Prerequisites

- Set `OPENAI_API_KEY` environment variable
- Run `npm install && npm run dev` from the built-in-agent package directory
- Demo is accessible at `http://localhost:3000/demos/hitl`

## Test Steps

### 1. Basic Functionality

- [ ] Navigate to the hitl demo page
- [ ] Verify the chat interface loads in a centered max-w-4xl container
- [ ] Verify the chat input placeholder "Type a message" is visible
- [ ] Send a basic message
- [ ] Verify the agent responds

### 2. Feature-Specific Checks

#### Suggestions

- [ ] Verify "Simple plan" suggestion button is visible
- [ ] Verify "Complex plan" suggestion button is visible
- [ ] Click the "Simple plan" suggestion
- [ ] Verify it triggers a message about planning a trip to Mars in 5 steps

#### Human-in-the-Loop Feedback (useHumanInTheLoop)

- [ ] Send "Plan a trip to Mars in 5 steps"
- [ ] Verify the StepSelector card appears (`data-testid="select-steps"`)
- [ ] Verify step items are displayed with checkboxes (`data-testid="step-item"`)
- [ ] Verify step text is visible (`data-testid="step-text"`)
- [ ] Verify the selected count display shows "N/N selected"
- [ ] Toggle a step checkbox off and verify the count decreases
- [ ] Toggle it back on and verify the count increases
- [ ] Click "Confirm (N)" button
- [ ] Verify the agent continues processing after confirmation

#### Review and Accept/Reject

- [ ] Trigger a task that generates steps
- [ ] Verify Accept and Reject buttons are available in the step selector
- [ ] Click Accept and verify the card shows "Accepted" status
- [ ] In a new conversation, trigger the same flow and click Reject
- [ ] Verify the card shows "Rejected" status
- [ ] Verify buttons are disabled after a decision is made

### 3. Error Handling

- [ ] Send an empty message (should be handled gracefully)
- [ ] Verify no console errors during normal usage

## Expected Results

- Chat loads within 3 seconds
- Agent responds within 10 seconds
- Step selector renders with toggleable checkboxes
- Accept/Reject flow completes without errors
- No UI errors or broken layouts
