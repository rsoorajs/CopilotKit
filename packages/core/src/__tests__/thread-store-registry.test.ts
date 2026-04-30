import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ThreadStoreRegistry } from "../core/thread-store-registry";
import type { CopilotKitCore, CopilotKitCoreSubscriber } from "../core/core";
import type { ɵThreadStore } from "../threads";

// Minimal mock of CopilotKitCore that supports subscribing and notification.
// Mirrors the real CopilotKitCore.notifySubscribers contract: takes a handler
// plus an errorMessage, and wraps each subscriber call in try/catch so that
// a single subscriber throwing does not abort delivery to siblings.
function createMockCore() {
  const subscribers = new Set<CopilotKitCoreSubscriber>();

  const core = {
    notifySubscribers: vi.fn(
      async (
        fn: (s: CopilotKitCoreSubscriber) => unknown,
        errorMessage: string,
      ) => {
        for (const subscriber of subscribers) {
          try {
            await fn(subscriber);
          } catch (err) {
            console.error(errorMessage, err);
          }
        }
      },
    ),
    subscribe(subscriber: CopilotKitCoreSubscriber) {
      subscribers.add(subscriber);
      return { unsubscribe: () => subscribers.delete(subscriber) };
    },
  } as unknown as CopilotKitCore;

  return { core, subscribers };
}

// Build a typed minimal stub of ɵThreadStore. The registry only stores and
// hands the reference back to subscribers; the methods are never invoked in
// these tests. Using `vi.fn()` for every property keeps the shape honest
// against the real interface without an `as unknown` cast.
function makeStore(_id = "store-a"): ɵThreadStore {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    setContext: vi.fn(),
    refresh: vi.fn(),
    fetchNextPage: vi.fn(),
    renameThread: vi.fn(),
    archiveThread: vi.fn(),
    deleteThread: vi.fn(),
    getState: vi.fn(),
    select: vi.fn(),
  } satisfies ɵThreadStore;
}

describe("ThreadStoreRegistry", () => {
  let registry: ThreadStoreRegistry;
  let core: CopilotKitCore;

  beforeEach(() => {
    ({ core } = createMockCore());
    registry = new ThreadStoreRegistry(core);
  });

  it("register then get returns the same store", () => {
    const store = makeStore();
    registry.register("agent-1", store);
    expect(registry.get("agent-1")).toBe(store);
  });

  it("getAll returns all registered stores", () => {
    const storeA = makeStore("a");
    const storeB = makeStore("b");
    registry.register("agent-1", storeA);
    registry.register("agent-2", storeB);
    const all = registry.getAll();
    expect(all["agent-1"]).toBe(storeA);
    expect(all["agent-2"]).toBe(storeB);
  });

  it("second register for the same agentId replaces the first and fires unregistered then registered", async () => {
    const onRegistered = vi.fn();
    const onUnregistered = vi.fn();
    const subscriber: CopilotKitCoreSubscriber = {
      onThreadStoreRegistered: onRegistered,
      onThreadStoreUnregistered: onUnregistered,
    };
    (
      core as unknown as { subscribe: (s: CopilotKitCoreSubscriber) => unknown }
    ).subscribe(subscriber);

    const first = makeStore("first");
    const second = makeStore("second");
    registry.register("agent-1", first);
    await Promise.resolve();
    expect(onRegistered).toHaveBeenCalledTimes(1);
    expect(onUnregistered).not.toHaveBeenCalled();

    registry.register("agent-1", second);
    await Promise.resolve();

    expect(registry.get("agent-1")).toBe(second);
    expect(onUnregistered).toHaveBeenCalledTimes(1);
    expect(onUnregistered).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: "agent-1" }),
    );
    expect(onRegistered).toHaveBeenCalledTimes(2);
    expect(onRegistered).toHaveBeenLastCalledWith(
      expect.objectContaining({ agentId: "agent-1", store: second }),
    );
    // The unregister notification for the previous store must fire before
    // the second register notification — subscribers rely on this ordering
    // to tear down stale subscriptions before wiring up the replacement.
    expect(onUnregistered.mock.invocationCallOrder[0]).toBeLessThan(
      onRegistered.mock.invocationCallOrder[1],
    );
  });

  it("unregister removes the store", () => {
    registry.register("agent-1", makeStore());
    registry.unregister("agent-1");
    expect(registry.get("agent-1")).toBeUndefined();
  });

  it("unregister on a missing key is a no-op and does not throw", () => {
    expect(() => registry.unregister("nonexistent")).not.toThrow();
  });

  it("register fires onThreadStoreRegistered on subscribers", async () => {
    const onRegistered = vi.fn();
    const subscriber: CopilotKitCoreSubscriber = {
      onThreadStoreRegistered: onRegistered,
    };
    // Attach subscriber directly so notifySubscribers reaches it
    (
      core as unknown as { subscribe: (s: CopilotKitCoreSubscriber) => unknown }
    ).subscribe(subscriber);

    const store = makeStore();
    registry.register("agent-1", store);

    // notifyRegistered is fire-and-forget (void); flush microtasks
    await Promise.resolve();

    expect(onRegistered).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: "agent-1", store }),
    );
  });

  it("unregister fires onThreadStoreUnregistered on subscribers", async () => {
    const onUnregistered = vi.fn();
    const subscriber: CopilotKitCoreSubscriber = {
      onThreadStoreUnregistered: onUnregistered,
    };
    (
      core as unknown as { subscribe: (s: CopilotKitCoreSubscriber) => unknown }
    ).subscribe(subscriber);

    registry.register("agent-1", makeStore());
    registry.unregister("agent-1");

    await Promise.resolve();

    expect(onUnregistered).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: "agent-1" }),
    );
  });

  it("unregister does not fire event when key was never registered", async () => {
    const onUnregistered = vi.fn();
    const subscriber: CopilotKitCoreSubscriber = {
      onThreadStoreUnregistered: onUnregistered,
    };
    (
      core as unknown as { subscribe: (s: CopilotKitCoreSubscriber) => unknown }
    ).subscribe(subscriber);

    registry.unregister("nonexistent");
    await Promise.resolve();

    expect(onUnregistered).not.toHaveBeenCalled();
  });

  describe("subscriber error isolation", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it("a throwing subscriber does not prevent register from succeeding or other subscribers from firing", async () => {
      const throwing = vi.fn(() => {
        throw new Error("subscriber boom");
      });
      const ok = vi.fn();
      const subscriberA: CopilotKitCoreSubscriber = {
        onThreadStoreRegistered: throwing,
      };
      const subscriberB: CopilotKitCoreSubscriber = {
        onThreadStoreRegistered: ok,
      };
      (
        core as unknown as { subscribe: (s: CopilotKitCoreSubscriber) => unknown }
      ).subscribe(subscriberA);
      (
        core as unknown as { subscribe: (s: CopilotKitCoreSubscriber) => unknown }
      ).subscribe(subscriberB);

      const store = makeStore();
      registry.register("agent-1", store);

      // Registration must complete synchronously and the store must be
      // retrievable even though one subscriber threw.
      expect(registry.get("agent-1")).toBe(store);

      await Promise.resolve();

      expect(throwing).toHaveBeenCalledTimes(1);
      expect(ok).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe("getAll() snapshot isolation", () => {
    it("mutating the returned record does not affect the registry's internal state", () => {
      const storeA = makeStore("a");
      const storeB = makeStore("b");
      registry.register("agent-1", storeA);
      registry.register("agent-2", storeB);

      const snapshot = registry.getAll() as Record<string, ɵThreadStore>;
      // Mutate the returned reference — registry must be unaffected.
      delete snapshot["agent-1"];
      snapshot["agent-3"] = makeStore("c");

      expect(registry.get("agent-1")).toBe(storeA);
      expect(registry.get("agent-2")).toBe(storeB);
      expect(registry.get("agent-3")).toBeUndefined();
    });
  });
});
