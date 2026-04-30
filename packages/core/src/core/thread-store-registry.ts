import { type ɵThreadStore } from "../threads";
import type { CopilotKitCore } from "./core";
import { CopilotKitCoreFriendsAccess, CopilotKitCoreSubscriber } from "./core";

export class ThreadStoreRegistry {
  private _stores: Record<string, ɵThreadStore> = {};

  constructor(private core: CopilotKitCore) {}

  register(agentId: string, store: ɵThreadStore): void {
    if (agentId in this._stores) {
      // Capture and clear the previous store before notifying so subscribers
      // observing `onThreadStoreUnregistered` see a registry without `agentId`.
      // Note: subscribers must NOT rely on `registry.get(agentId)` inside the
      // unregister callback to recover the previous store — by the time the
      // microtask runs the new store is already registered. If a subscriber
      // needs the previous store, the unregister payload should carry it.
      delete this._stores[agentId];
      this.notifyUnregistered(agentId).catch((err) => {
        console.error(
          "ThreadStoreRegistry notifyUnregistered failed:",
          err,
        );
      });
    }
    this._stores[agentId] = store;
    this.notifyRegistered(agentId, store).catch((err) => {
      console.error("ThreadStoreRegistry notifyRegistered failed:", err);
    });
  }

  unregister(agentId: string): void {
    if (!(agentId in this._stores)) return;
    delete this._stores[agentId];
    this.notifyUnregistered(agentId).catch((err) => {
      console.error("ThreadStoreRegistry notifyUnregistered failed:", err);
    });
  }

  get(agentId: string): ɵThreadStore | undefined {
    return this._stores[agentId];
  }

  getAll(): Readonly<Record<string, ɵThreadStore>> {
    // Return a shallow copy so callers cannot mutate the registry's
    // internal state via the returned reference.
    return { ...this._stores };
  }

  private async notifyRegistered(
    agentId: string,
    store: ɵThreadStore,
  ): Promise<void> {
    await (
      this.core as unknown as CopilotKitCoreFriendsAccess
    ).notifySubscribers(
      (subscriber: CopilotKitCoreSubscriber) =>
        subscriber.onThreadStoreRegistered?.({
          copilotkit: this.core,
          agentId,
          store,
        }),
      "Subscriber onThreadStoreRegistered error:",
    );
  }

  private async notifyUnregistered(agentId: string): Promise<void> {
    await (
      this.core as unknown as CopilotKitCoreFriendsAccess
    ).notifySubscribers(
      (subscriber: CopilotKitCoreSubscriber) =>
        subscriber.onThreadStoreUnregistered?.({
          copilotkit: this.core,
          agentId,
        }),
      "Subscriber onThreadStoreUnregistered error:",
    );
  }
}
