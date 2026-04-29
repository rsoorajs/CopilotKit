/**
 * Stub page for `interrupt-headless`.
 *
 * This feature is listed under `not_supported_features` in
 * `showcase/integrations/strands/manifest.yaml`. It is the headless variant
 * of `gen-ui-interrupt` — same root cause: `useLangGraphInterrupt` requires
 * the LangGraph interrupt lifecycle, which AWS Strands does not expose.
 *
 * See PARITY_NOTES.md for context.
 */

export default function InterruptHeadlessUnsupported() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FBFBFE] p-6">
      <div className="max-w-md rounded-2xl border border-[#E5E5ED] bg-white p-6 text-[#010507] shadow-sm">
        <h1 className="text-xl font-semibold">
          interrupt-headless is not available on AWS Strands
        </h1>
        <p className="mt-3 text-sm text-[#3A3A46]">
          This feature requires <code>useLangGraphInterrupt</code>'s
          resolve/respond primitive. AWS Strands does not expose an equivalent
          first-class interrupt primitive, so the headless variant is not
          portable without new Strands-side integration work.
        </p>
        <p className="mt-3 text-sm text-[#3A3A46]">
          For a Strands-native HITL flow, see the{" "}
          <a
            className="font-medium text-[#5856D6] underline"
            href="/demos/headless-complete"
          >
            headless-complete
          </a>{" "}
          and{" "}
          <a
            className="font-medium text-[#5856D6] underline"
            href="/demos/hitl-in-chat"
          >
            hitl-in-chat
          </a>{" "}
          demos.
        </p>
      </div>
    </div>
  );
}
