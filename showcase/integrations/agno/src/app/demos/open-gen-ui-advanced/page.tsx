"use client";

/**
 * Open-Ended Generative UI (Advanced) — Agno.
 * -------------------------------------------
 * The agent streams ONE `generateSandboxedUi` tool call; the runtime's
 * `OpenGenerativeUIMiddleware` (enabled by `openGenerativeUI: { agents: [...] }`
 * in `api/copilotkit-ogui/route.ts`) converts that stream into
 * `open-generative-ui` activity events. Passing `openGenerativeUI` to
 * CopilotKit here activates the built-in `OpenGenerativeUIActivityRenderer`,
 * which mounts the agent-authored HTML + CSS inside a sandboxed iframe — and
 * registers our host-side sandbox functions so the iframe can call back into
 * the host page.
 *
 * Reference: https://docs.copilotkit.ai/generative-ui/open-generative-ui
 */

import React from "react";
import {
  CopilotKit,
  CopilotChat,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { openGenUiSandboxFunctions } from "./sandbox-functions";
import { openGenUiSuggestions } from "./suggestions";

export default function OpenGenUiAdvancedDemo() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-ogui"
      agent="open-gen-ui-advanced"
      openGenerativeUI={{ sandboxFunctions: openGenUiSandboxFunctions }}
    >
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useConfigureSuggestions({
    suggestions: openGenUiSuggestions,
    available: "always",
  });

  return (
    <div className="flex h-full w-full flex-col p-3">
      <CopilotChat
        agentId="open-gen-ui-advanced"
        className="flex-1 rounded-2xl"
      />
    </div>
  );
}
