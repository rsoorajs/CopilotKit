"use client";

/**
 * gen-ui-interrupt is NOT supported by the LlamaIndex integration.
 *
 * LlamaIndex FunctionAgent has no graph-interrupt API equivalent to LangGraph's
 * `interrupt()` primitive. The interrupt-driven generative-UI pattern requires
 * the agent runtime to pause execution mid-step, surface a typed payload to the
 * frontend, and resume after the user responds. LlamaIndex does not expose such
 * a pause/resume hook in its agent loop, so this demo cannot be implemented
 * here without reinventing the runtime.
 *
 * For the equivalent UX in LlamaIndex, see /demos/hitl-in-chat which uses the
 * `useHumanInTheLoop` frontend-tool pattern instead — the agent calls a
 * frontend-defined tool, the UI renders inline, and the user's response flows
 * back as the tool result.
 */
export default function GenUiInterruptUnsupportedPage() {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="max-w-md p-8 rounded-2xl border border-dashed border-gray-300 text-center">
        <h1 className="text-xl font-semibold mb-3">Not supported</h1>
        <p className="text-sm text-gray-600 mb-2">
          <code>gen-ui-interrupt</code> requires a graph-interrupt API that
          LlamaIndex FunctionAgent does not expose.
        </p>
        <p className="text-sm text-gray-600">
          See <code>/demos/hitl-in-chat</code> for the equivalent UX using the
          <code> useHumanInTheLoop</code> frontend-tool pattern.
        </p>
      </div>
    </div>
  );
}
