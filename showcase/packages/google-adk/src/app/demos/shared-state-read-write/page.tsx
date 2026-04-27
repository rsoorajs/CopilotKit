"use client";

import React, { useEffect, useRef } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import {
  CopilotChat,
  useAgent,
  UseAgentUpdate,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";

import { PreferencesCard, Preferences } from "./preferences-card";
import { NotesCard } from "./notes-card";

const INITIAL_PREFERENCES: Preferences = {
  name: "",
  tone: "casual",
  language: "English",
  interests: [],
};

interface RWAgentState {
  preferences: Preferences;
  notes: string[];
}

export default function SharedStateReadWriteDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="shared-state-read-write">
      <DemoContent />
    </CopilotKit>
  );
}

function DemoContent() {
  const { agent } = useAgent({
    agentId: "shared-state-read-write",
    updates: [UseAgentUpdate.OnStateChanged],
  });

  useConfigureSuggestions({
    suggestions: [
      { title: "Greet me", message: "Say hi and introduce yourself." },
      {
        title: "Remember something",
        message:
          "Remember that I prefer morning meetings and that I don't eat dairy.",
      },
      {
        title: "Plan a weekend",
        message: "Suggest a weekend plan based on my interests.",
      },
    ],
    available: "always",
  });

  const agentState = agent.state as RWAgentState | undefined;
  const preferences = agentState?.preferences ?? INITIAL_PREFERENCES;
  const notes = agentState?.notes ?? [];

  // Seed initial preferences exactly once, AFTER agent.state has been
  // observed at least once. The previous mount-only effect with empty
  // deps could fire before the runtime hydrated state on reload, wiping
  // backend-persisted preferences with INITIAL_PREFERENCES.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (agentState === undefined) return; // wait for first state event
    seededRef.current = true;
    if (!agentState?.preferences) {
      agent.setState({
        preferences: INITIAL_PREFERENCES,
        notes: [],
      } as RWAgentState);
    }
  }, [agent, agentState]);

  // Read latest agent state inside the handlers via the closure-fresh
  // `agentState` rather than the destructured `preferences` / `notes`.
  // Concurrent edits (rapid prefs change followed by Clear notes) under
  // the prior implementation could revert the in-flight prefs change
  // because both handlers wrote a whole-state snapshot computed at
  // render time.
  const handlePreferencesChange = (next: Preferences) => {
    agent.setState({
      preferences: next,
      notes: agentState?.notes ?? [],
    } as RWAgentState);
  };

  const handleClearNotes = () => {
    agent.setState({
      preferences: agentState?.preferences ?? INITIAL_PREFERENCES,
      notes: [],
    } as RWAgentState);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50">
      <aside className="p-4 md:w-[360px] md:shrink-0 overflow-y-auto space-y-4">
        <PreferencesCard value={preferences} onChange={handlePreferencesChange} />
        <NotesCard notes={notes} onClear={handleClearNotes} />
      </aside>
      <main className="flex-1 flex flex-col min-h-0">
        <CopilotChat
          agentId="shared-state-read-write"
          className="flex-1 min-h-0"
          labels={{ chatInputPlaceholder: "Chat with the agent..." }}
        />
      </main>
    </div>
  );
}
