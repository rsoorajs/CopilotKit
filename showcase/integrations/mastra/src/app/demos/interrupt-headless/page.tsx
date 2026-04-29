export default function InterruptHeadlessNotSupported() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-xl space-y-3 text-center">
        <h1 className="text-2xl font-semibold">Not supported by mastra</h1>
        <p className="text-sm text-muted-foreground">
          The <code>interrupt-headless</code> demo (resolve interrupts from a
          plain button grid via <code>useHeadlessInterrupt</code>) relies on
          AG-UI <code>INTERRUPT</code> custom events, which the Mastra adapter
          does not emit. See <code>README.md</code> for details, or browse the
          langgraph-python integration for a working reference.
        </p>
      </div>
    </main>
  );
}
