/**
 * Stub page for `gen-ui-interrupt`.
 *
 * This feature is listed under `not_supported_features` in
 * `showcase/integrations/strands/manifest.yaml` because it is built on
 * `useLangGraphInterrupt`, which hooks directly into the LangGraph
 * interrupt lifecycle. AWS Strands does not expose an equivalent
 * first-class interrupt primitive (see PARITY_NOTES.md).
 *
 * The ergonomic replacement Strands users can reach for is `hitl-in-chat`,
 * which uses `useHumanInTheLoop` on top of a regular frontend tool —
 * Strands supports that natively.
 */

export default function GenUIInterruptUnsupported() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FBFBFE] p-6">
      <div className="max-w-md rounded-2xl border border-[#E5E5ED] bg-white p-6 text-[#010507] shadow-sm">
        <h1 className="text-xl font-semibold">
          gen-ui-interrupt is not available on AWS Strands
        </h1>
        <p className="mt-3 text-sm text-[#3A3A46]">
          This feature is built on <code>useLangGraphInterrupt</code>, which
          hooks into the LangGraph interrupt lifecycle. AWS Strands does not
          expose an equivalent first-class interrupt primitive.
        </p>
        <p className="mt-3 text-sm text-[#3A3A46]">
          For an ergonomic replacement on Strands, see the{" "}
          <a
            className="font-medium text-[#5856D6] underline"
            href="/demos/hitl-in-chat"
          >
            hitl-in-chat
          </a>{" "}
          demo, which uses <code>useHumanInTheLoop</code> on top of a regular
          frontend tool.
        </p>
      </div>
    </div>
  );
}
