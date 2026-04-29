"use client";

/**
 * interrupt-headless — NOT SUPPORTED on AG2
 *
 * Same underlying primitive as `gen-ui-interrupt`: this demo resolves a
 * LangGraph `interrupt()` headlessly via `agent.subscribe` +
 * `copilotkit.runAgent({ forwardedProps: { command: { resume } } })` —
 * no chat, no `useInterrupt` render prop. The host page just listens on
 * the AG-UI stream for an interrupt event and resumes the same run
 * from a persisted checkpoint when the user picks a slot.
 *
 * AG2 has no equivalent resumable-pause primitive, so the headless
 * resume protocol cannot be reproduced. See `/demos/hitl-in-app` for the
 * supported AG2 pattern (out-of-chat approval surface via
 * `useFrontendTool` with an async handler).
 */

import React from "react";
import Link from "next/link";

export default function InterruptHeadlessUnsupportedPage() {
  return (
    <div className="flex justify-center items-center h-screen w-full p-6">
      <div className="max-w-2xl w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <div className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
          Not supported on AG2
        </div>
        <h1 className="text-2xl font-semibold mb-3">
          interrupt-headless is not available on AG2
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-4 leading-relaxed">
          This demo resolves a LangGraph{" "}
          <code className="px-1 rounded bg-[var(--muted)]">interrupt()</code>{" "}
          headlessly — the host page subscribes to the AG-UI stream and
          resumes the same run from a persisted checkpoint via{" "}
          <code className="px-1 rounded bg-[var(--muted)]">
            copilotkit.runAgent({"{"} forwardedProps: {"{"} command: {"{"}
            resume {"}}}}"})
          </code>
          . AG2 has no equivalent resumable-pause primitive on
          ConversableAgent, so the headless resume contract cannot be
          reproduced.
        </p>
        <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
          For an out-of-chat approval surface on AG2 use{" "}
          <code className="px-1 rounded bg-[var(--muted)]">
            useFrontendTool
          </code>{" "}
          with an async handler.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/demos/hitl-in-app"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-sm font-medium"
          >
            Try hitl-in-app (out-of-chat HITL on AG2) →
          </Link>
          <Link
            href="/demos/frontend-tools-async"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-sm font-medium"
          >
            Try frontend-tools-async →
          </Link>
        </div>
      </div>
    </div>
  );
}
