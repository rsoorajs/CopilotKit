"use client";

/**
 * Interrupt (Headless) — NOT SUPPORTED for the Langroid integration.
 *
 * Same root cause as `/demos/gen-ui-interrupt`: this cell exercises
 * LangGraph's native `interrupt()` primitive in a fully-headless chat
 * surface, and Langroid does not expose an equivalent pause/resume hook.
 * Listed in `manifest.yaml :: not_supported_features`.
 */

import React from "react";

export default function InterruptHeadlessUnsupported() {
  return (
    <div
      data-testid="unsupported-interrupt-headless"
      className="mx-auto flex h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-black/50 dark:text-white/50">
          Not supported
        </p>
        <h1 className="text-xl font-semibold">
          Interrupt (headless) is not available on Langroid
        </h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          The headless interrupt demo wraps the same LangGraph{" "}
          <code>interrupt()</code> primitive used by{" "}
          <code>/demos/gen-ui-interrupt</code>. Langroid&rsquo;s ChatAgent
          does not expose an equivalent pause/resume primitive today, so the
          demo cannot be ported faithfully on either chat surface.
        </p>
      </div>
      <p className="text-xs text-black/50 dark:text-white/50">
        See the <code>langgraph-python</code> integration for the canonical
        implementation.
      </p>
    </div>
  );
}
