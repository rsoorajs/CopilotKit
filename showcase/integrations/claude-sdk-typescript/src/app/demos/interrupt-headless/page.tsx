/**
 * Interrupt (Headless) — UNSUPPORTED for the Claude SDK integration.
 *
 * Listed under `not_supported_features` in manifest.yaml. The Claude Agent
 * SDK pass-through this integration runs on top of does not currently
 * expose interrupt-driven control flow, so the canonical interrupt-headless
 * cell cannot be ported here. See the README in this folder.
 */

export default function InterruptHeadlessUnsupportedPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FBFBFE] p-8">
      <div className="max-w-xl rounded-2xl border border-[#E5E5ED] bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-[#010507]">
          Interrupt (Headless) — Not Supported
        </h1>
        <p className="mt-3 text-sm text-[#3A3A46]">
          This feature is not supported by the Claude Agent SDK (TypeScript)
          integration. The Claude SDK pass-through this integration runs on top
          of does not currently expose interrupt-driven control flow primitives.
        </p>
        <p className="mt-3 text-sm text-[#3A3A46]">
          See the canonical implementation in the LangGraph or Pydantic AI
          integrations, where the underlying agent runtime exposes the
          interrupt machinery this demo requires.
        </p>
      </div>
    </div>
  );
}
