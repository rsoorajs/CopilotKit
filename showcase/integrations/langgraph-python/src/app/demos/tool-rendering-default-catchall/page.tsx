"use client";

// Tool Rendering — DEFAULT CATCH-ALL variant (simplest).
//
// This cell is the simplest point in the three-way progression. The
// backend exposes a handful of mock tools (get_weather, search_flights,
// get_stock_price, roll_dice) and the frontend ONLY opts into a single
// wildcard tool-call renderer — no per-tool renderers.
//
// `useDefaultRenderTool()` registers a single `*` wildcard renderer.
// Conceptually this is the "out-of-the-box" catch-all UI for tool
// calls; here we give it a shadcn-flavored visual by passing a custom
// `render` function that paints a shadcn Card + Badge for every tool
// call, regardless of name. Without this hook the runtime has NO `*`
// renderer, so `useRenderToolCall` falls through to `null` and tool
// calls are invisible — the user only sees the assistant's final text
// summary.

import React from "react";
import {
  CopilotKit,
  CopilotChat,
  useDefaultRenderTool,
} from "@copilotkit/react-core/v2";
import {
  ShadcnCatchallRenderer,
  type CatchallToolStatus,
} from "./_components/shadcn-catchall-renderer";
import { useSuggestions } from "./suggestions";

export default function ToolRenderingDefaultCatchallDemo() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="tool-rendering-default-catchall"
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
  // @region[default-catchall-zero-config]
  // Opt in to a single wildcard tool-call renderer. The conceptual
  // point of this cell is unchanged from a bare `useDefaultRenderTool()`
  // call — there are zero per-tool renderers, just one catch-all — but
  // the visual is rebuilt with inline-cloned shadcn primitives (Card +
  // Badge) so it matches the rest of the showcase's aesthetic.
  useDefaultRenderTool(
    {
      render: ({ name, parameters, status, result }) => (
        <ShadcnCatchallRenderer
          name={name}
          parameters={parameters}
          status={status as CatchallToolStatus}
          result={result}
        />
      ),
    },
    [],
  );
  // @endregion[default-catchall-zero-config]

  useSuggestions();

  return (
    <CopilotChat
      agentId="tool-rendering-default-catchall"
      className="h-full rounded-2xl"
    />
  );
}
