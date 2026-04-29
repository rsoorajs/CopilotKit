"use client";

// Not supported by google-adk.
//
// gen-ui-interrupt depends on LangGraph's `interrupt()` primitive and the
// `on_interrupt` custom events that the `useInterrupt` hook subscribes to.
// `ag-ui-adk` (the AG-UI middleware that wraps Google ADK `LlmAgent`s)
// has no equivalent pause/resume primitive and does not emit those events,
// so this demo cannot be implemented against ADK. See README.md for the
// reference implementation in langgraph-python.

import React from "react";

export default function GenUiInterruptDemo() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#FAFAFC] p-8">
      <div
        data-testid="gen-ui-interrupt-not-supported"
        className="max-w-md rounded-2xl border border-[#DBDBE5] bg-white p-8 text-center shadow-[0_20px_40px_-20px_rgba(1,5,7,0.15)]"
      >
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#57575B]">
          Not supported by google-adk
        </div>
        <h1 className="mb-3 text-xl font-semibold text-[#010507]">
          gen-ui-interrupt
        </h1>
        <p className="text-sm leading-relaxed text-[#57575B]">
          This demo depends on LangGraph&apos;s <code>interrupt()</code>{" "}
          primitive and the <code>useInterrupt</code> hook&apos;s{" "}
          <code>on_interrupt</code> backend events, which <code>ag-ui-adk</code>{" "}
          does not emit. See the canonical implementation in the{" "}
          <strong>langgraph-python</strong> integration.
        </p>
      </div>
    </div>
  );
}
