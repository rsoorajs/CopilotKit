"use client";

// Agent Config Object demo (AG2).
//
// The frontend writes a typed config object (tone / expertise /
// responseLength) into agent state via `agent.setState({...})`. AG2's
// AGUIStream maps initial state into ContextVariables on every run; the
// agent reads them and rebuilds its system prompt per turn.
//
// References:
// - src/agents/agent_config_agent.py — the AG2 ConversableAgent backing this.

import { CopilotChat, CopilotKit, useAgent } from "@copilotkit/react-core/v2";
import { useEffect } from "react";

import { ConfigCard } from "./config-card";
import type { AgentConfig } from "./config-types";
import { useAgentConfig } from "./use-agent-config";

const RUNTIME_URL = "/api/copilotkit";
const AGENT_ID = "agent-config-demo";

function ConfigStateSync({ config }: { config: AgentConfig }) {
  const { agent } = useAgent({ agentId: AGENT_ID });
  useEffect(() => {
    if (!agent) return;
    try {
      // AG-UI AbstractAgent#setState maps to AG2 ContextVariables on each run.
      (agent as unknown as { setState?: (s: unknown) => void }).setState?.(
        config,
      );
    } catch (err) {
      console.warn("[agent-config] setState failed", err);
    }
  }, [agent, config]);
  return null;
}

export default function AgentConfigDemoPage() {
  const { config, setTone, setExpertise, setResponseLength } = useAgentConfig();

  return (
    <CopilotKit runtimeUrl={RUNTIME_URL} agent={AGENT_ID}>
      <div className="flex h-screen flex-col gap-3 p-6">
        <header>
          <h1 className="text-lg font-semibold">Agent Config Object</h1>
          <p className="text-sm text-neutral-600">
            Forwarded props let the frontend tell the agent how to behave. This
            demo passes <code>tone</code>, <code>expertise</code>, and{" "}
            <code>responseLength</code> through agent state; the AG2 agent reads
            them from ContextVariables and rebuilds its system prompt per turn.
          </p>
        </header>
        <ConfigCard
          config={config}
          onToneChange={setTone}
          onExpertiseChange={setExpertise}
          onResponseLengthChange={setResponseLength}
        />
        <ConfigStateSync config={config} />
        <div className="flex-1 overflow-hidden rounded-md border border-neutral-200">
          <CopilotChat agentId={AGENT_ID} className="h-full rounded-md" />
        </div>
      </div>
    </CopilotKit>
  );
}
