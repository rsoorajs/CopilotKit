"use client";

/**
 * Interrupt (Headless) — placeholder.
 *
 * PydanticAI's AG-UI bridge does not expose a graph-interrupt primitive,
 * so this feature is marked unsupported in `manifest.yaml`. See the
 * sibling README.md for the full rationale and a pointer to the working
 * reference in the langgraph-python integration.
 */

import React from "react";

export default function InterruptHeadlessUnsupported() {
  return (
    <div className="flex justify-center items-center h-screen w-full bg-[#FAFAFC]">
      <div className="max-w-md w-full rounded-2xl border border-[#DBDBE5] bg-white p-6 shadow-sm">
        <span className="inline-block rounded-full border border-[#FFAC4D33] bg-[#FFAC4D]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#57575B]">
          Not supported by pydantic-ai
        </span>
        <h1 className="mt-3 text-xl font-semibold text-[#010507]">
          Interrupt (Headless)
        </h1>
        <p className="mt-2 text-sm text-[#57575B]">
          PydanticAI's AG-UI bridge has no equivalent of LangGraph's{" "}
          <code className="rounded bg-[#F0F0F4] px-1 py-0.5 font-mono text-xs">
            interrupt()
          </code>{" "}
          primitive — without it, the headless interrupt resume protocol
          this cell demonstrates has no surface area to bind to.
        </p>
        <p className="mt-3 text-sm text-[#57575B]">
          See the working reference in the{" "}
          <span className="font-medium text-[#010507]">langgraph-python</span>{" "}
          integration, and{" "}
          <code className="rounded bg-[#F0F0F4] px-1 py-0.5 font-mono text-xs">
            src/app/demos/interrupt-headless/README.md
          </code>{" "}
          for the full rationale.
        </p>
      </div>
    </div>
  );
}
