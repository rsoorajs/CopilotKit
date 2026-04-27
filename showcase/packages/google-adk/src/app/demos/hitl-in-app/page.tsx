"use client";

import React, { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import {
  CopilotChat,
  useFrontendTool,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { z } from "zod";

import { ApprovalDialog, ApprovalRequest } from "./approval-dialog";

export default function HitlInAppDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="hitl_in_app">
      <DemoContent />
    </CopilotKit>
  );
}

function DemoContent() {
  // Queue of in-flight approval requests rather than a single-slot ref.
  // Gemini's parallel-tool-call paths can fire `request_approval` more
  // than once before the first resolves; the previous single-slot
  // `useState<ApprovalRequest | null>` orphaned the first promise on
  // any second call, leaving the agent waiting on a tool result that
  // never arrived. We render the head of the queue, advance on each
  // user decision, and let every Promise resolve in arrival order.
  const [pendingQueue, setPendingQueue] = useState<ApprovalRequest[]>([]);

  useFrontendTool({
    name: "request_approval",
    description:
      "Request user approval before performing a sensitive action. Pass a short summary of the action and a reason. Returns { accepted, reason? }.",
    parameters: z.object({
      summary: z.string().describe("Short summary of the proposed action."),
      reason: z.string().describe("Why the action is being proposed."),
    }),
    handler: async ({
      summary,
      reason,
    }: {
      summary: string;
      reason: string;
    }) => {
      const requestId = crypto.randomUUID();
      const decision = await new Promise<{
        accepted: boolean;
        reason?: string;
      }>((resolve) => {
        setPendingQueue((prev) => [
          ...prev,
          {
            id: requestId,
            summary,
            reason,
            resolve: (d) => {
              // Drop our own entry from the queue, then resolve. Filter
              // by id so concurrent resolves don't accidentally drop
              // each other.
              setPendingQueue((q) => q.filter((r) => r.id !== requestId));
              resolve(d);
            },
          },
        ]);
      });
      return decision;
    },
  });

  useConfigureSuggestions({
    suggestions: [
      {
        title: "Charge customer",
        message: "I want to charge the customer $100 for the upgrade.",
      },
      {
        title: "Delete record",
        message: "Delete the duplicate user record for atai@example.com.",
      },
    ],
    available: "always",
  });

  // Render only the head of the queue; subsequent approvals are answered
  // in arrival order as the user dispatches each decision.
  const head = pendingQueue[0];

  return (
    <div className="flex justify-center items-center h-screen w-full bg-gray-50">
      <div className="h-full w-full max-w-4xl">
        <CopilotChat
          agentId="hitl_in_app"
          className="h-full rounded-2xl"
          labels={{
            chatInputPlaceholder:
              "Ask the agent to do something that needs approval...",
          }}
        />
      </div>
      {head && <ApprovalDialog request={head} />}
    </div>
  );
}
