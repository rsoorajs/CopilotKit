"use client";

/**
 * Gen UI Interrupt — NOT SUPPORTED on Claude Agent SDK (Python).
 *
 * The langgraph `useInterrupt` flow depends on the LangGraph runtime's
 * built-in `interrupt()` primitive (a graph-level pause/resume protocol
 * with thread-scoped checkpointing). The Claude Agent SDK does not expose
 * an equivalent primitive — its Anthropic Messages stream has no
 * pause/resume/`Command(resume=...)` semantics.
 *
 * For human-in-the-loop on this backend see the `hitl` and `hitl-in-app`
 * cells, both of which model approval gating with regular tool calls
 * rather than graph-level interrupts.
 */

import React from "react";
import Link from "next/link";

export default function GenUiInterruptUnsupported() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6">
      <div className="max-w-xl rounded-2xl border border-[#E5E5ED] bg-white/80 p-8 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.18)] backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-[#7C7C8A]">
          Not supported on this integration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#010507]">
          Gen UI Interrupt
        </h1>
        <p className="mt-3 text-sm text-[#3A3A46]">
          The <code>useInterrupt</code> flow depends on LangGraph&apos;s built-in
          graph-level <code>interrupt()</code> / <code>Command(resume=...)</code>{" "}
          protocol. The Claude Agent SDK&apos;s Anthropic Messages stream has
          no equivalent pause/resume primitive, so this demo is not available
          on the claude-sdk-python integration.
        </p>
        <p className="mt-3 text-sm text-[#3A3A46]">
          For human-in-the-loop on this backend, see the{" "}
          <Link className="font-medium text-[#6366F1] underline" href="/demos/hitl">
            hitl
          </Link>{" "}
          and{" "}
          <Link
            className="font-medium text-[#6366F1] underline"
            href="/demos/hitl-in-app"
          >
            hitl-in-app
          </Link>{" "}
          cells — both model approval gating with regular tool calls rather
          than graph-level interrupts.
        </p>
      </div>
    </div>
  );
}
