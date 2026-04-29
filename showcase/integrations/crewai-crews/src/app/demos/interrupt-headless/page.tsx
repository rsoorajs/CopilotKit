"use client";

/**
 * Headless Interrupt -- Not Supported by CrewAI Crews.
 *
 * See ./README.md for the rationale: ag-ui-crewai's `ChatWithCrewFlow`
 * has no pause/resume primitive equivalent to LangGraph's `interrupt()`.
 */

import React from "react";

export default function InterruptHeadlessUnsupported() {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="max-w-xl px-6 py-8 rounded-2xl border border-neutral-200 bg-white text-center">
        <h1 className="text-xl font-semibold mb-2">Not supported by crewai-crews</h1>
        <p className="text-sm text-neutral-600 mb-4">
          Headless Interrupt requires a pause/resume primitive that CrewAI
          Crews does not expose today.
        </p>
        <p className="text-xs text-neutral-500">
          See <code>./README.md</code> for details and a pointer to the
          LangGraph reference implementation.
        </p>
      </div>
    </div>
  );
}
