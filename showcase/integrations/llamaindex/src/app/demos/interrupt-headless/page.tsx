"use client";

/**
 * interrupt-headless is NOT supported by the LlamaIndex integration.
 *
 * Like gen-ui-interrupt, this feature requires a graph-interrupt API that
 * pauses agent execution and resumes it with a user-supplied value. LlamaIndex
 * FunctionAgent does not expose such a primitive, so the headless interrupt
 * flow cannot be modeled on this runtime.
 *
 * For headless HITL in LlamaIndex, see /demos/headless-simple and
 * /demos/headless-complete combined with the frontend-tool pattern from
 * /demos/hitl-in-chat.
 */
export default function InterruptHeadlessUnsupportedPage() {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="max-w-md p-8 rounded-2xl border border-dashed border-gray-300 text-center">
        <h1 className="text-xl font-semibold mb-3">Not supported</h1>
        <p className="text-sm text-gray-600 mb-2">
          <code>interrupt-headless</code> requires a graph-interrupt API that
          LlamaIndex FunctionAgent does not expose.
        </p>
        <p className="text-sm text-gray-600">
          See <code>/demos/headless-simple</code> +{" "}
          <code>/demos/hitl-in-chat</code> for the equivalent headless +
          frontend-tool HITL pattern.
        </p>
      </div>
    </div>
  );
}
