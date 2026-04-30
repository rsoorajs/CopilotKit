"use client";

/**
 * Headless Interrupt — NOT SUPPORTED for Agno.
 *
 * Same missing primitive as `gen-ui-interrupt`: the canonical LangGraph
 * version drives a picker UI rendered OUTSIDE the chat (in the app
 * surface) by listening for LangGraph's `interrupt()` event on the AG-UI
 * stream and resuming the run via the `resume` forwarded-prop pathway.
 *
 * Agno has no graph-level interrupt primitive — an Agno agent runs to
 * completion on each invocation and does not expose a pause / resume
 * API that can carry client-supplied state across a suspension. The
 * demo is therefore stubbed rather than ported.
 *
 * See `manifest.yaml` → `not_supported_features` and the README for
 * details and pointers to the closest available patterns.
 */

import Link from "next/link";

export default function InterruptHeadlessUnsupportedPage() {
  return (
    <div
      data-testid="interrupt-headless-unsupported"
      className="flex min-h-screen w-full items-center justify-center bg-[#FAFAFC] px-6 py-12"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#DBDBE5] bg-white p-8 shadow-[0_10px_40px_-20px_rgba(1,5,7,0.18)]">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#DBDBE5] bg-[#FAFAFC] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#57575B]">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#F2A2A2]" />
          Not supported on Agno
        </div>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#010507]">
          Headless Interrupt
        </h1>
        <p className="mb-4 text-sm leading-relaxed text-[#3A3A46]">
          This demo drives a picker UI rendered <em>outside</em> the chat by
          listening for LangGraph&apos;s <code>interrupt()</code> event on the
          AG-UI stream and resuming the paused run with the user&apos;s choice.
          Agno does not currently expose an equivalent pause/resume primitive,
          so the demo is documented but not runnable on this integration.
        </p>
        <p className="mb-6 text-sm leading-relaxed text-[#3A3A46]">
          The closest Agno-supported pattern for an in-app modal that blocks the
          agent on user input is{" "}
          <Link
            href="/demos/hitl-in-app"
            className="font-medium text-[#6366F1] underline-offset-2 hover:underline"
          >
            in-app human-in-the-loop
          </Link>{" "}
          via <code>useFrontendTool</code> with an async handler — the tool
          resolves only after the user interacts with a host-rendered modal.
        </p>
        <div className="text-xs text-[#57575B]">
          See the canonical implementation in{" "}
          <code>
            showcase/integrations/langgraph-python/src/app/demos/interrupt-headless
          </code>
          .
        </div>
      </div>
    </div>
  );
}
