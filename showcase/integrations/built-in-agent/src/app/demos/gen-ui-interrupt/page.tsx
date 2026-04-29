"use client";

// Not supported by built-in-agent.
//
// `gen-ui-interrupt` requires the LangGraph `useInterrupt` primitive,
// which is built on graph-level interrupt/resume nodes — a feature of
// the LangGraph runtime. The built-in-agent uses TanStack AI's
// chat-completions adapter, which has no equivalent graph-interrupt
// concept. See `langgraph-python` for a working implementation.

import React from "react";

export default function GenUiInterruptUnsupported() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFC] px-6">
      <div className="max-w-lg rounded-2xl border border-[#DBDBE5] bg-white p-8 text-center shadow-sm">
        <span className="inline-block rounded-full border border-[#FFAC4D33] bg-[#FFAC4D]/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#57575B]">
          Not supported
        </span>
        <h1 className="mt-3 text-xl font-semibold text-[#010507]">
          Gen UI Interrupt
        </h1>
        <p className="mt-2 text-sm text-[#57575B]">
          This demo isn&apos;t supported by the built-in-agent integration.
          The <code className="font-mono text-xs">useInterrupt</code> primitive
          requires a graph-interrupt runtime such as LangGraph. The
          built-in-agent runs on TanStack AI&apos;s chat-completions adapter
          and has no equivalent.
        </p>
        <p className="mt-3 text-sm text-[#57575B]">
          See the <span className="font-mono text-xs">langgraph-python</span>{" "}
          integration for a working implementation.
        </p>
      </div>
    </div>
  );
}
