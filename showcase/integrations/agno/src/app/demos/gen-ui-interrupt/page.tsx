"use client";

/**
 * Gen UI Interrupt — NOT SUPPORTED for Agno.
 *
 * The canonical LangGraph version of this demo uses LangGraph's native
 * `interrupt()` graph primitive plus the `useInterrupt` hook to pause a
 * graph run mid-execution and surface a payload that the frontend renders
 * inline in the chat. The user picks a slot, the frontend resumes the run
 * via `copilotkit.runAgent({ forwardedProps: { command: { resume } } })`,
 * and the agent continues with the user-supplied value.
 *
 * Agno has no equivalent graph-level interrupt primitive — an Agno agent
 * runs to completion on each invocation and does not expose a pause /
 * resume API that can carry client-supplied state across a suspension.
 * This demo is therefore stubbed rather than ported.
 *
 * See `manifest.yaml` → `not_supported_features` and the README for
 * details and pointers to the closest available patterns.
 */

import Link from "next/link";

export default function GenUiInterruptUnsupportedPage() {
  return (
    <div
      data-testid="gen-ui-interrupt-unsupported"
      className="flex min-h-screen w-full items-center justify-center bg-[#FAFAFC] px-6 py-12"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#DBDBE5] bg-white p-8 shadow-[0_10px_40px_-20px_rgba(1,5,7,0.18)]">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#DBDBE5] bg-[#FAFAFC] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#57575B]">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#F2A2A2]" />
          Not supported on Agno
        </div>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#010507]">
          Gen UI Interrupt
        </h1>
        <p className="mb-4 text-sm leading-relaxed text-[#3A3A46]">
          This demo relies on a graph-level <code>interrupt()</code> primitive
          (LangGraph) that pauses a run mid-execution and resumes it with a
          client-supplied value. Agno does not currently expose an equivalent
          primitive, so the demo is documented but not runnable on this
          integration.
        </p>
        <p className="mb-6 text-sm leading-relaxed text-[#3A3A46]">
          The closest Agno-supported pattern for blocking on user input is{" "}
          <Link
            href="/demos/hitl-in-chat"
            className="font-medium text-[#6366F1] underline-offset-2 hover:underline"
          >
            in-chat human-in-the-loop
          </Link>
          {" "}via <code>useHumanInTheLoop</code>, which renders a card inside
          the chat and waits for the user to confirm before the agent
          proceeds.
        </p>
        <div className="text-xs text-[#57575B]">
          See the canonical implementation in{" "}
          <code>
            showcase/integrations/langgraph-python/src/app/demos/gen-ui-interrupt
          </code>
          .
        </div>
      </div>
    </div>
  );
}
