import { describe, it, expect, beforeEach } from "vitest";
import { CopilotKitCore } from "../core";
import { ProxiedCopilotRuntimeAgent } from "../agent";
import { MockAgent } from "./test-utils";

describe("CopilotKitCore.registerProxiedAgent", () => {
  let core: CopilotKitCore;

  beforeEach(() => {
    core = new CopilotKitCore({ runtimeUrl: "http://localhost:4000" });
  });

  it("registers a proxy under agentId and routes outbound to remoteAgentId", () => {
    const { agent, unregister } = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });

    expect(agent).toBeInstanceOf(ProxiedCopilotRuntimeAgent);
    expect(agent.agentId).toBe("chat-1");
    expect(agent.remoteAgentId).toBe("default");
    expect(core.getAgent("chat-1")).toBe(agent);

    // The HTTP url is built from remoteAgentId, not agentId — chat-1's
    // outbound /run hits /agent/default/run on the runtime.
    expect((agent as unknown as { url: string }).url).toContain(
      "/agent/default/run",
    );
    expect((agent as unknown as { url: string }).url).not.toContain("chat-1");

    unregister();
    expect(core.getAgent("chat-1")).toBeUndefined();
  });

  it("throws when agentId is already registered locally", () => {
    core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });

    expect(() =>
      core.registerProxiedAgent({
        agentId: "chat-1",
        remoteAgentId: "support",
      }),
    ).toThrow(/already registered/);
  });

  it("throws when agentId collides with an agents__unsafe_dev_only entry", () => {
    const local = new MockAgent({});
    const collidingCore = new CopilotKitCore({
      agents__unsafe_dev_only: { existing: local as any },
    });

    expect(() =>
      collidingCore.registerProxiedAgent({
        agentId: "existing",
        remoteAgentId: "default",
      }),
    ).toThrow(/already registered/);
  });

  it("unregister is idempotent and does not strip a replacement", () => {
    const first = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    first.unregister();
    expect(core.getAgent("chat-1")).toBeUndefined();

    // Calling unregister twice must not re-fire onAgentsChanged or otherwise
    // misbehave.
    expect(() => first.unregister()).not.toThrow();

    // After a fresh register at the same id, the stale unregister handle from
    // `first` must NOT remove the new entry.
    const second = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "support",
    });
    first.unregister();
    expect(core.getAgent("chat-1")).toBe(second.agent);
  });

  it("notifies onAgentsChanged on register and unregister", async () => {
    const events: string[][] = [];
    core.subscribe({
      onAgentsChanged: ({ agents }) => {
        events.push(Object.keys(agents));
      },
    });

    const { unregister } = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    // notifyAgentsChanged is async — yield once to let the subscriber fire.
    await new Promise((r) => setTimeout(r, 0));
    expect(events.at(-1)).toContain("chat-1");

    unregister();
    await new Promise((r) => setTimeout(r, 0));
    expect(events.at(-1)).not.toContain("chat-1");
  });

  it("inherits headers from core when registered", () => {
    core.setHeaders({ Authorization: "Bearer abc" });
    const { agent } = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    expect(agent.headers?.Authorization).toBe("Bearer abc");
  });
});
