"use client";

/**
 * Interrupt Headless — NOT SUPPORTED on Claude Agent SDK (Python).
 *
 * The headless-interrupt cell drives the same LangGraph `interrupt()`
 * primitive as `gen-ui-interrupt` — just from a plain button grid instead
 * of a chat-rendered card. The Claude Agent SDK has no equivalent
 * pause/resume primitive, so this cell is not available on the
 * claude-sdk-python integration.
 *
 * For human-in-the-loop on this backend see `hitl` and `hitl-in-app`.
 */

import React from "react";
import Link from "next/link";

export default function InterruptHeadlessUnsupported() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6">
      <div className="max-w-xl rounded-2xl border border-[#E5E5ED] bg-white/80 p-8 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.18)] backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-[#7C7C8A]">
          Not supported on this integration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#010507]">
          Headless Interrupt
        </h1>
        <p className="mt-3 text-sm text-[#3A3A46]">
          This demo resolves LangGraph <code>interrupt()</code> events from a
          plain button grid (no chat). The Claude Agent SDK has no equivalent
          graph-level pause/resume primitive, so the headless interrupt flow is
          not available on the claude-sdk-python integration.
        </p>
        <p className="mt-3 text-sm text-[#3A3A46]">
          For human-in-the-loop on this backend, see the{" "}
          <Link
            className="font-medium text-[#6366F1] underline"
            href="/demos/hitl"
          >
            hitl
          </Link>{" "}
          and{" "}
          <Link
            className="font-medium text-[#6366F1] underline"
            href="/demos/hitl-in-app"
          >
            hitl-in-app
          </Link>{" "}
          cells.
        </p>
      </div>
    </div>
  );
}
