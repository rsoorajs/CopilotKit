"use client";

/**
 * gen-ui-interrupt — NOT SUPPORTED on AG2
 *
 * The LangGraph version of this demo uses LangGraph's native `interrupt()`
 * primitive, which pauses the running graph and emits a resumable interrupt
 * payload over the AG-UI stream. The frontend then resumes the SAME graph
 * run from a persisted checkpoint via
 * `copilotkit.runAgent({ forwardedProps: { command: { resume } } })`.
 *
 * AG2's `human_input_mode` is a synchronous request/reply hook on a
 * `ConversableAgent`; it does not pause-and-resume the same run from a
 * persisted checkpoint, so the resumable interrupt round-trip cannot be
 * reproduced faithfully.
 *
 * For an inline-in-chat HITL surface on AG2 see `/demos/hitl-in-chat`,
 * which uses the higher-level `useHumanInTheLoop` hook (the same UX that
 * langgraph's `useInterrupt` exposes via `useHumanInTheLoop` on top).
 *
 * For an out-of-chat HITL surface on AG2 see `/demos/hitl-in-app`.
 */

import React from "react";
import Link from "next/link";

export default function GenUiInterruptUnsupportedPage() {
  return (
    <div className="flex justify-center items-center h-screen w-full p-6">
      <div className="max-w-2xl w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <div className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
          Not supported on AG2
        </div>
        <h1 className="text-2xl font-semibold mb-3">
          gen-ui-interrupt is not available on AG2
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-4 leading-relaxed">
          This demo depends on LangGraph&apos;s native{" "}
          <code className="px-1 rounded bg-[var(--muted)]">interrupt()</code>{" "}
          primitive — the graph pauses, emits a resumable payload over the
          AG-UI stream, and the frontend resumes the same run from a persisted
          checkpoint. AG2&apos;s{" "}
          <code className="px-1 rounded bg-[var(--muted)]">
            human_input_mode
          </code>{" "}
          is a synchronous request/reply hook and does not round-trip a
          resumable pause through the event stream, so the AG-UI interrupt
          contract cannot be reproduced faithfully.
        </p>
        <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
          Equivalent in-chat HITL flows on AG2 are available via the
          higher-level{" "}
          <code className="px-1 rounded bg-[var(--muted)]">
            useHumanInTheLoop
          </code>{" "}
          hook.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/demos/hitl-in-chat"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-sm font-medium"
          >
            Try hitl-in-chat (in-chat HITL on AG2) →
          </Link>
          <Link
            href="/demos/hitl-in-app"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-sm font-medium"
          >
            Try hitl-in-app (out-of-chat HITL on AG2) →
          </Link>
        </div>
      </div>
    </div>
  );
}
