"use client";

// Not supported by google-adk.
//
// interrupt-headless depends on the same LangGraph `interrupt()` primitive
// as gen-ui-interrupt, plus `useHeadlessInterrupt` subscribing to the
// agent's `on_interrupt` custom-event stream to render the resume UI in
// an external app surface. `ag-ui-adk` does not emit those events, so the
// headless surface has no signal to render against. See README.md for the
// reference implementation in langgraph-python.

import React from "react";

export default function InterruptHeadlessDemo() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#FAFAFC] p-8">
      <div
        data-testid="interrupt-headless-not-supported"
        className="max-w-md rounded-2xl border border-[#DBDBE5] bg-white p-8 text-center shadow-[0_20px_40px_-20px_rgba(1,5,7,0.15)]"
      >
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#57575B]">
          Not supported by google-adk
        </div>
        <h1 className="mb-3 text-xl font-semibold text-[#010507]">
          interrupt-headless
        </h1>
        <p className="text-sm leading-relaxed text-[#57575B]">
          This demo depends on LangGraph&apos;s <code>interrupt()</code>{" "}
          primitive and the <code>useHeadlessInterrupt</code> hook&apos;s{" "}
          <code>on_interrupt</code> backend events, which <code>ag-ui-adk</code>{" "}
          does not emit. See the canonical implementation in the{" "}
          <strong>langgraph-python</strong> integration.
        </p>
      </div>
    </div>
  );
}
