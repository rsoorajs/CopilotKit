import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { EventType, type BaseEvent, type RunAgentInput } from "@ag-ui/client";
import { Observable, type Subject } from "rxjs";
import { takeWhile } from "rxjs/operators";
import {
  MockStepwiseAgent,
  renderWithCopilotKit,
  runStartedEvent,
  runFinishedEvent,
  textMessageStartEvent,
  textMessageEndEvent,
  toolCallChunkEvent,
} from "../../__tests__/utils/test-helpers";
import { CopilotChat } from "../../components/chat/CopilotChat";
import { useCopilotKit } from "../../providers/CopilotKitProvider";
import { useCopilotChatConfiguration } from "../../providers/CopilotChatConfigurationProvider";
import { useAgent } from "../../hooks/use-agent";
import { Message } from "@ag-ui/core";

/**
 * Mock agent with accurate per-run `isRunning` lifecycle. Real AG-UI agents
 * back each `runAgent()` call with a stream that completes when the run
 * ends; that completion is what triggers `AbstractAgent`'s rxjs `finalize`
 * to flip `isRunning` to false and fire `onRunFinalized` (which `useAgent`
 * subscribes to and uses to re-render). The shared `MockStepwiseAgent`
 * returns the un-terminating `subject.asObservable()` for backward
 * compatibility with existing tests, so emitting `RUN_FINISHED` on it
 * neither completes the stream, flips `agent.isRunning`, nor triggers
 * `onRunFinalized` — the run pipeline stays alive until the test ends.
 *
 * The `takeWhile(..., true)` here makes the per-run observable terminate
 * on RUN_FINISHED / RUN_ERROR (the `true` second arg is "inclusive" — emit
 * the terminal event before completing). That terminates AG-UI's run
 * pipeline like a real agent, so renderers that gate on `agent.isRunning`
 * see the latest state without needing an unrelated event to force a
 * re-render.
 */
class IsRunningAccurateMockAgent extends MockStepwiseAgent {
  override run(_input: RunAgentInput): Observable<BaseEvent> {
    // Cast through unknown — `subject` is `private` on the parent.
    // A `protected` accessor on MockStepwiseAgent would be cleaner, but
    // that's a wider change touching several other test files.
    return (this as unknown as { subject: Subject<BaseEvent> }).subject.pipe(
      takeWhile(
        (event) =>
          event.type !== EventType.RUN_FINISHED &&
          event.type !== EventType.RUN_ERROR,
        true,
      ),
    );
  }
}

type RendererProps = {
  message: Message;
  position: "before" | "after";
  runId: string;
  messageIndex: number;
  messageIndexInRun: number;
  numberOfMessagesInRun: number;
  agentId: string;
  stateSnapshot: unknown;
};

/**
 * Renders an "Using CopilotKit Intelligence" indicator only when ALL of:
 *   1. position === "after"               (slot after the message)
 *   2. messageIndexInRun is the last in run
 *   3. agent.isRunning === true           (current run is in flight)
 *   4. the run is the latest on this thread
 *
 * The reactivity for (2) and (4) comes from `MemoizedCustomMessage`'s memo
 * inputs (`numberOfMessagesInRun`, `isInLatestRun`): when m_b2 streams in,
 * m_b1's `numberOfMessagesInRun` flips 1→2; when Run B starts, m_a1's
 * `isInLatestRun` flips true→false. Those prop changes invalidate the memo
 * and cause this renderer to re-evaluate. We deliberately do *not* try to
 * subscribe to in-flight agent events from inside this renderer — AG-UI
 * captures the subscriber list at run start (snapshot pattern), so a
 * subscription added mid-run never fires for the run it mounted into.
 */
const IntelligenceIndicator: React.FC<RendererProps> = ({
  message,
  position,
  runId,
  messageIndexInRun,
  numberOfMessagesInRun,
  agentId,
}) => {
  const { copilotkit } = useCopilotKit();
  const config = useCopilotChatConfiguration();
  const { agent } = useAgent({ agentId });

  if (position !== "after") return null;
  if (!config) return null;
  if (!agent?.isRunning) return null;
  if (messageIndexInRun !== numberOfMessagesInRun - 1) return null;

  // The run must be the latest run on this thread. We derive "latest" from
  // the most recent run-associated message in agent.messages rather than
  // from getRunIdsForThread (which only populates from STATE_SNAPSHOT
  // events).
  const messageRunId = copilotkit.getRunIdForMessage(
    agentId,
    config.threadId,
    message.id,
  );
  if (!messageRunId || messageRunId !== runId) return null;
  // Walk back to find the latest run-associated message. Skipping a message
  // that lacks `getRunIdForMessage` is intentional — not an error path. The
  // runId association can land a tick after the message itself is appended
  // to `agent.messages` (handleNewMessage runs on TEXT_MESSAGE_END or via
  // active-run lookup), so during that window the most recent message may
  // legitimately have no runId yet. The early `!messageRunId` short-circuit
  // above handles "this slot has no runId yet"; the loop here finds the
  // newest available runId among earlier messages.
  let latestRunId: string | undefined;
  for (let i = agent.messages.length - 1; i >= 0; i--) {
    const r = copilotkit.getRunIdForMessage(
      agentId,
      config.threadId,
      agent.messages[i]!.id,
    );
    if (r) {
      latestRunId = r;
      break;
    }
  }
  if (latestRunId !== messageRunId) return null;

  return (
    <div
      data-testid={`intelligence-indicator-${message.id}`}
      data-run-id={messageRunId}
    >
      Using CopilotKit Intelligence
    </div>
  );
};

const expectIndicatorOn = (messageId: string) => {
  expect(
    screen.getByTestId(`intelligence-indicator-${messageId}`).textContent,
  ).toContain("Using CopilotKit Intelligence");
};

const expectNoIndicatorOn = (messageId: string) => {
  expect(
    screen.queryByTestId(`intelligence-indicator-${messageId}`),
  ).toBeNull();
};

const expectNoIndicatorAnywhere = () => {
  expect(screen.queryAllByTestId(/^intelligence-indicator-/).length).toBe(0);
};

/**
 * Emit one assistant message scoped to the currently-active run, with `n` tool
 * calls under the same parentMessageId. The textMessage envelope ensures the
 * message is associated with the current run (handleNewMessage uses input.runId
 * for new messages added during a run).
 */
const emitAssistantMessageWithToolCalls = (
  agent: MockStepwiseAgent,
  messageId: string,
  toolCalls: Array<{ id: string; arg: string }>,
) => {
  agent.emit(textMessageStartEvent(messageId));
  agent.emit(textMessageEndEvent(messageId));
  for (const tc of toolCalls) {
    agent.emit(
      toolCallChunkEvent({
        toolCallId: tc.id,
        toolCallName: "bash",
        parentMessageId: messageId,
        delta: tc.arg,
      }),
    );
  }
};

/** Emit RUN_STARTED to begin a run. */
const startRun = (agent: MockStepwiseAgent) => {
  agent.emit(runStartedEvent());
};

/**
 * Render the chat alongside `<RunAgentHarness />` so tests can drive runs by
 * clicking the harness's button instead of typing into the textbox.
 */
const renderForIndicator = (agent: MockStepwiseAgent) =>
  renderWithCopilotKit({
    agent,
    renderCustomMessages: [{ render: IntelligenceIndicator }],
    children: (
      <>
        <RunAgentHarness />
        <div style={{ height: 400 }}>
          <CopilotChat welcomeScreen={false} />
        </div>
      </>
    ),
  });

/**
 * Test harness that exposes `copilotkit.runAgent` as a click-driven button.
 * Drives runs the same way `<CopilotChat />` does in real life — resolve the
 * agent via `useAgent`, then `copilotkit.runAgent({ agent })`. No
 * textbox-typing scaffolding because the tests below are about
 * agent → renderer behavior, not user input.
 */
const RunAgentHarness: React.FC = () => {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent();
  const handleClick = React.useCallback(() => {
    if (!agent) return;
    // Don't `void` the rejection: the only failure signal otherwise is
    // `triggerRun`'s second `waitFor` timing out 1s later with no causal
    // info. Logging here surfaces the actual cause (e.g. a registry miss
    // or `detachActiveRun` race) immediately, then re-throws so vitest's
    // unhandled-rejection handling fails the test loudly.
    copilotkit.runAgent({ agent }).catch((err: unknown) => {
      console.error("[test] copilotkit.runAgent rejected:", err);
      throw err;
    });
  }, [copilotkit, agent]);
  return (
    <button data-testid="trigger-run" onClick={handleClick}>
      run
    </button>
  );
};

/**
 * Trigger one runAgent call and wait until the agent has actually started
 * (isRunning=true). Without this, subsequent `emit()` calls could land
 * before the run pipeline is set up. If a previous run is still finalizing
 * (RUN_FINISHED emitted but isRunning hasn't flipped yet), wait for it first
 * — otherwise `copilotkit.runAgent`'s internal `await detachActiveRun()`
 * races with the cleanup.
 */
const triggerRun = async (agent: MockStepwiseAgent) => {
  await waitFor(() => expect(agent.isRunning).toBe(false));
  fireEvent.click(screen.getByTestId("trigger-run"));
  await waitFor(() => expect(agent.isRunning).toBe(true));
};

describe('CopilotKitProvider — "Using CopilotKit Intelligence" indicator', () => {
  // Tracks agents created in each test so afterEach can complete() them
  // unconditionally — even if the test threw before reaching its own
  // complete() call. Without this, a Subject leaks across the test
  // boundary; rxjs doesn't log it but the observer list grows.
  const activeAgents: IsRunningAccurateMockAgent[] = [];
  const makeAgent = (): IsRunningAccurateMockAgent => {
    const agent = new IsRunningAccurateMockAgent();
    activeAgents.push(agent);
    return agent;
  };
  afterEach(() => {
    // Drain even if one agent's complete() throws — without try/catch, the
    // first thrown error would leave subsequent tracked agents un-completed
    // (and their Subjects leaked across the test boundary).
    while (activeAgents.length) {
      const agent = activeAgents.pop()!;
      try {
        agent.complete();
      } catch (err) {
        console.error("[test] agent.complete() threw during cleanup:", err);
      }
    }
  });

  /**
   * Walks through the user's exact scenario:
   *
   *   RUN A
   *     m_a1 (assistant)
   *       toolCall bash#1
   *       toolCall bash#2
   *   RUN B
   *     m_b1 (assistant)
   *       toolCall bash
   *     m_b2 (assistant)
   *       toolCall bash#1
   *       toolCall bash#2
   *
   * The indicator must render only after m_b2 while Run B is in flight, and
   * never appear on stale (already-finished) runs nor on non-last messages.
   */
  it("renders only after the last message of the latest in-flight run", async () => {
    const agent = makeAgent();
    renderForIndicator(agent);
    await screen.findByTestId("trigger-run");

    // ─── Phase 0: nothing in flight, nothing rendered ──────────────────────
    expectNoIndicatorAnywhere();

    // ─── Phase 1: Run A starts, m_a1 streams two tool calls ────────────────
    await triggerRun(agent);
    startRun(agent);
    emitAssistantMessageWithToolCalls(agent, "m_a1", [
      { id: "tc_a1_1", arg: '{"cmd":"ls"}' },
      { id: "tc_a1_2", arg: '{"cmd":"pwd"}' },
    ]);

    // m_a1 is the last (and only) message of the latest in-flight run.
    await waitFor(() => expectIndicatorOn("m_a1"));
    expect(screen.queryAllByTestId(/^intelligence-indicator-/).length).toBe(1);

    // ─── Phase 2: Run A finishes — indicator clears (latest-run is still
    // Run A but isRunning is now false on its slot, gated by isInLatestRun).
    agent.emit(runFinishedEvent());
    await waitFor(() => expectNoIndicatorAnywhere());

    // ─── Phase 3: Run B starts, m_b1 streams one tool call ─────────────────
    await triggerRun(agent);
    startRun(agent);
    emitAssistantMessageWithToolCalls(agent, "m_b1", [
      { id: "tc_b1", arg: '{"cmd":"echo b1"}' },
    ]);

    // Indicator on m_b1 — last message of latest in-flight run. m_a1 belongs
    // to now-stale Run A and stays empty.
    await waitFor(() => expectIndicatorOn("m_b1"));
    expectNoIndicatorOn("m_a1");
    expect(screen.queryAllByTestId(/^intelligence-indicator-/).length).toBe(1);

    // ─── Phase 4: m_b2 streams two tool calls — indicator moves to m_b2 ────
    emitAssistantMessageWithToolCalls(agent, "m_b2", [
      { id: "tc_b2_1", arg: '{"cmd":"echo b2-1"}' },
      { id: "tc_b2_2", arg: '{"cmd":"echo b2-2"}' },
    ]);
    await waitFor(() => expectIndicatorOn("m_b2"));
    expectNoIndicatorOn("m_b1");
    expectNoIndicatorOn("m_a1");
    expect(screen.queryAllByTestId(/^intelligence-indicator-/).length).toBe(1);

    // ─── Phase 5: Run B finishes — indicator vanishes everywhere ──────────
    agent.emit(runFinishedEvent());
    await waitFor(() => expectNoIndicatorAnywhere());

  });

  // ─── Per-condition focused tests ────────────────────────────────────────
  // The walkthrough already exercises every condition transition; these
  // focused tests pin down each condition individually so a regression points
  // directly at the broken gate.

  it("condition 1 (position): never renders at position=before", async () => {
    const agent = makeAgent();
    const positionsSeen = new Set<"before" | "after">();

    // Render IntelligenceIndicator as a child element rather than calling
    // it as a function — calling a hook-using component as a function is
    // brittle (it ties the parent's hook order to the inner component's
    // hook count, so any future hook addition silently breaks rules-of-hooks).
    const Probe: React.FC<RendererProps> = (props) => {
      positionsSeen.add(props.position);
      return <IntelligenceIndicator {...props} />;
    };

    renderWithCopilotKit({
      agent,
      renderCustomMessages: [{ render: Probe }],
      children: (
        <>
          <RunAgentHarness />
          <div style={{ height: 400 }}>
            <CopilotChat welcomeScreen={false} />
          </div>
        </>
      ),
    });
    await screen.findByTestId("trigger-run");

    await triggerRun(agent);
    startRun(agent);
    emitAssistantMessageWithToolCalls(agent, "m1", [{ id: "tc1", arg: "{}" }]);

    await waitFor(() => expectIndicatorOn("m1"));

    // The probe was invoked for "after" (the only DOM-visible indicator
    // confirms it). The "after"-only assertion is what matters; checking
    // that "before" was also invoked is collateral but cheap to keep.
    expect(positionsSeen.has("after")).toBe(true);
    expect(positionsSeen.has("before")).toBe(true);
    // Exactly one indicator in the DOM, on the after-slot of m1. If the
    // gate ever leaked into the before-slot, count would be 2.
    expect(screen.queryAllByTestId(/^intelligence-indicator-/).length).toBe(1);

    agent.emit(runFinishedEvent());
  });

  it("condition 2 (last-in-run): never renders on a non-last message of the run", async () => {
    const agent = makeAgent();
    renderForIndicator(agent);
    await screen.findByTestId("trigger-run");

    await triggerRun(agent);
    startRun(agent);
    emitAssistantMessageWithToolCalls(agent, "m_first", [
      { id: "tc_first", arg: "{}" },
    ]);
    // Wait for m_first's slot to render the indicator while it is still the
    // last message of the run, before adding m_second. Without this gate,
    // both messages would land in agent.messages synchronously and m_first's
    // renderer would never have been invoked while it was the last — turning
    // a reactive assertion into a "first-render correctness" test by accident.
    await waitFor(() => expectIndicatorOn("m_first"));

    emitAssistantMessageWithToolCalls(agent, "m_second", [
      { id: "tc_second", arg: "{}" },
    ]);

    await waitFor(() => expectIndicatorOn("m_second"));
    // m_first exists but is not the last message of the run → no indicator.
    expectNoIndicatorOn("m_first");

    agent.emit(runFinishedEvent());
  });

  it("condition 3 (in-flight): never renders when the agent is not running", async () => {
    const agent = makeAgent();
    renderForIndicator(agent);
    await screen.findByTestId("trigger-run");

    await triggerRun(agent);
    startRun(agent);
    emitAssistantMessageWithToolCalls(agent, "m_only", [
      { id: "tc", arg: "{}" },
    ]);

    // While the run is in flight: indicator is visible.
    await waitFor(() => expectIndicatorOn("m_only"));

    // emit(RUN_FINISHED) flips agent.isRunning to false on the registry
    // agent. MemoizedCustomMessage's memo invalidates (m_only is in the
    // latest run, so the isRunning gate fires), and the renderer
    // re-evaluates with isRunning=false → returns null.
    agent.emit(runFinishedEvent());
    await waitFor(() => expectNoIndicatorOn("m_only"));

  });

  it("condition 4 (latest-run): never renders on a stale run after a newer run starts", async () => {
    const agent = makeAgent();
    renderForIndicator(agent);
    await screen.findByTestId("trigger-run");

    // Run 1: complete it cleanly
    await triggerRun(agent);
    startRun(agent);
    emitAssistantMessageWithToolCalls(agent, "m_run1", [
      { id: "tc_run1", arg: "{}" },
    ]);
    await waitFor(() => expectIndicatorOn("m_run1"));
    agent.emit(runFinishedEvent());

    // Run 2: when it starts and emits its first message, m_run1's slot
    // re-renders because its `isInLatestRun` flips from true to false.
    await triggerRun(agent);
    startRun(agent);
    emitAssistantMessageWithToolCalls(agent, "m_run2", [
      { id: "tc_run2", arg: "{}" },
    ]);

    await waitFor(() => expectIndicatorOn("m_run2"));
    expectNoIndicatorOn("m_run1");

    agent.emit(runFinishedEvent());
  });
});
