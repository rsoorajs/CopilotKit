"use client";

/**
 * Gen UI Interrupt — NOT SUPPORTED for the Langroid integration.
 *
 * The langgraph-python implementation pauses the agent mid-run via
 * LangGraph's native `interrupt()` primitive, lets the frontend's
 * `useInterrupt` hook render a payload, and resumes once the user
 * resolves it. Langroid's ChatAgent has no equivalent: there is no
 * supported way to pause an in-flight `llm_response_async` call,
 * surface a payload to the client, and resume from the same execution
 * context.
 *
 * Listed in `manifest.yaml :: not_supported_features`. The dashboard
 * picks up the `not_supported_features` array and dims this row instead
 * of linking it as a runnable demo.
 */

import React from "react";

export default function GenUiInterruptUnsupported() {
  return (
    <div
      data-testid="unsupported-gen-ui-interrupt"
      className="mx-auto flex h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-black/50 dark:text-white/50">
          Not supported
        </p>
        <h1 className="text-xl font-semibold">
          Gen UI Interrupt is not available on Langroid
        </h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          This demo relies on LangGraph&rsquo;s <code>interrupt()</code>{" "}
          primitive, which lets the agent pause mid-run and surface a payload to
          the frontend until the user resolves it. Langroid&rsquo;s ChatAgent
          does not expose an equivalent pause/resume hook today, so the demo
          cannot be ported faithfully.
        </p>
      </div>
      <p className="text-xs text-black/50 dark:text-white/50">
        See the <code>langgraph-python</code> integration for the canonical
        implementation.
      </p>
    </div>
  );
}
