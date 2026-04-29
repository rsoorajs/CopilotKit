"use client";

import React from "react";

// Custom welcomeScreen slot — Google ADK branded card wrapping the default
// input + suggestions props passed in by CopilotChatView. The wrapper MUST
// render `input` so the chat composer is reachable on first paint;
// otherwise the V2 textarea never mounts on the empty-thread state and the
// page reads as structurally not-ready.
export function CustomWelcomeScreen({
  input,
  suggestionView,
}: {
  input: React.ReactElement;
  suggestionView: React.ReactElement;
}) {
  return (
    <div
      data-testid="custom-welcome-screen"
      className="flex-1 flex flex-col items-center justify-center px-4"
    >
      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg text-center">
          <div className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-3">
            Custom Slot
          </div>
          <div className="text-4xl mb-2">✨</div>
          <h1 className="text-2xl font-bold">Powered by Google ADK</h1>
          <p className="mt-2 text-sm text-white/90">
            This chat surface uses CopilotChat&apos;s{" "}
            <code className="font-mono">welcomeScreen</code> slot — the welcome
            card, message bubbles, and disclaimer can all be replaced via props.
          </p>
        </div>
        <div className="w-full">{input}</div>
        <div className="mt-4 flex justify-center">{suggestionView}</div>
      </div>
    </div>
  );
}
