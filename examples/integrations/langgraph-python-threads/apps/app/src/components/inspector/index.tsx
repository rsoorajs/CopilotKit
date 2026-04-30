import { useEffect, useRef } from "react";
import { useCopilotKit } from "@copilotkit/react-core/v2";
// Side-effect import: registers the `cpk-web-inspector` custom element.
import "@copilotkit/web-inspector";

/**
 * Mounts the CopilotKit web inspector as a Lit-based custom element overlay.
 *
 * The inspector subscribes to the same `CopilotKitCore` instance the rest of
 * the app uses, so its Threads / AG-UI Events / Agent State views stay in
 * sync with whatever agent the chat is currently running. We assign `.core`
 * via a ref because Lit elements expect properties (not attributes) for
 * complex values, and React's standard prop pipeline would stringify them.
 */
export function Inspector() {
  const { copilotkit } = useCopilotKit();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current as (HTMLElement & { core?: unknown }) | null;
    if (!el) return;
    el.core = copilotkit;
  }, [copilotkit]);

  // `cpk-web-inspector` isn't in React's intrinsic JSX namespace. Casting the
  // tag avoids polluting global JSX type augmentations for a single example.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = "cpk-web-inspector" as unknown as any;
  return <Tag ref={ref} />;
}
