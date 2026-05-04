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

/**
 * Isolation behavior — ports the cases from the deleted
 * `use-agent-thread-isolation.test.tsx` to the new explicit-registration model.
 *
 * The old design implicitly cloned a registry agent per (agentId, threadId).
 * The new model: callers register a distinct proxy per logical "chat", each
 * with its own local agentId. Multiple proxies can point at the same
 * `remoteAgentId` to share a runtime agent without sharing in-memory state.
 */
describe("CopilotKitCore.registerProxiedAgent — isolation", () => {
  let core: CopilotKitCore;

  beforeEach(() => {
    core = new CopilotKitCore({ runtimeUrl: "http://localhost:4000" });
  });

  it("two proxies registered against the same remoteAgentId are distinct instances", () => {
    const a = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    const b = core.registerProxiedAgent({
      agentId: "chat-2",
      remoteAgentId: "default",
    });

    expect(a.agent).not.toBe(b.agent);
    expect(core.getAgent("chat-1")).toBe(a.agent);
    expect(core.getAgent("chat-2")).toBe(b.agent);
    expect(a.agent.agentId).toBe("chat-1");
    expect(b.agent.agentId).toBe("chat-2");
    expect(a.agent.remoteAgentId).toBe("default");
    expect(b.agent.remoteAgentId).toBe("default");
  });

  it("two proxies share the same outbound URL (both route to remoteAgentId)", () => {
    const a = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    const b = core.registerProxiedAgent({
      agentId: "chat-2",
      remoteAgentId: "default",
    });

    const urlA = (a.agent as unknown as { url: string }).url;
    const urlB = (b.agent as unknown as { url: string }).url;
    expect(urlA).toBe(urlB);
    expect(urlA).toContain("/agent/default/run");
    expect(urlA).not.toContain("chat-1");
    expect(urlA).not.toContain("chat-2");
  });

  it("isolates messages between two proxies pointing to the same remoteAgentId", () => {
    const a = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    const b = core.registerProxiedAgent({
      agentId: "chat-2",
      remoteAgentId: "default",
    });

    a.agent.addMessage({
      id: "msg-a-1",
      role: "user",
      content: "hello from chat-1",
    });

    expect(a.agent.messages).toHaveLength(1);
    expect(b.agent.messages).toHaveLength(0);

    b.agent.addMessage({
      id: "msg-b-1",
      role: "user",
      content: "hello from chat-2",
    });

    expect(a.agent.messages).toHaveLength(1);
    expect(b.agent.messages).toHaveLength(1);
    expect(a.agent.messages[0]?.id).toBe("msg-a-1");
    expect(b.agent.messages[0]?.id).toBe("msg-b-1");
  });

  it("isolates state between two proxies pointing to the same remoteAgentId", () => {
    const a = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    const b = core.registerProxiedAgent({
      agentId: "chat-2",
      remoteAgentId: "default",
    });

    a.agent.setState({ counter: 1 });
    b.agent.setState({ counter: 99 });

    expect(a.agent.state).toEqual({ counter: 1 });
    expect(b.agent.state).toEqual({ counter: 99 });
  });

  it("each proxy can hold its own threadId without affecting others", () => {
    const a = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    const b = core.registerProxiedAgent({
      agentId: "chat-2",
      remoteAgentId: "default",
    });

    a.agent.threadId = "thread-a";
    b.agent.threadId = "thread-b";

    expect(a.agent.threadId).toBe("thread-a");
    expect(b.agent.threadId).toBe("thread-b");
  });

  it("getAgent returns the same proxy instance across calls (no per-call clone)", () => {
    const { agent } = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });

    expect(core.getAgent("chat-1")).toBe(agent);
    expect(core.getAgent("chat-1")).toBe(agent);
  });

  it("registering before runtime connects yields a proxy in pending runtimeMode", () => {
    // Disconnected core (no runtime URL set) — proxy still mints, but in a
    // mode that doesn't try to call out before /info has been resolved.
    const offlineCore = new CopilotKitCore({});
    const { agent } = offlineCore.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    expect(agent).toBeInstanceOf(ProxiedCopilotRuntimeAgent);
    // The proxy is registered and queryable even with no runtime URL.
    expect(offlineCore.getAgent("chat-1")).toBe(agent);
  });

  it("a proxy registered with a remote id that doesn't (yet) exist on the runtime is still usable for in-memory ops", () => {
    // The runtime might not know `phantom` — the proxy is opaque about that.
    // Registering doesn't validate against /info; the user vouches for the
    // remote id. Local subscriber bookkeeping (messages, state, threadId)
    // works regardless.
    const { agent } = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "phantom",
    });

    agent.addMessage({ id: "m", role: "user", content: "test" });
    agent.setState({ ok: true });
    agent.threadId = "t";

    expect(agent.messages).toHaveLength(1);
    expect(agent.state).toEqual({ ok: true });
    expect(agent.threadId).toBe("t");
    expect(agent.remoteAgentId).toBe("phantom");
  });

  it("registering, unregistering, and re-registering the same agentId yields a fresh proxy", () => {
    const first = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });
    first.agent.addMessage({
      id: "m-1",
      role: "user",
      content: "before unregister",
    });

    first.unregister();

    const second = core.registerProxiedAgent({
      agentId: "chat-1",
      remoteAgentId: "default",
    });

    expect(second.agent).not.toBe(first.agent);
    // The fresh proxy starts empty — no carry-over from the previous proxy.
    expect(second.agent.messages).toHaveLength(0);
  });
});
