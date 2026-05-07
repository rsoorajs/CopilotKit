/**
 * Suggestion prompts surfaced in the chat composer. Each suggestion
 * exercises the iframe <-> host bridge by asking the agent to produce an
 * interactive sandboxed UI that calls one of the host-side sandbox functions
 * (see `sandbox-functions.ts`). Iframe-specific constraints (no <form>, no
 * type='submit', use addEventListener) live in the system prompt — keep
 * suggestion titles and messages user-facing.
 */
export const openGenUiSuggestions = [
  {
    title: "Build a calculator",
    message:
      "Build a modern calculator UI. When the user presses '=', call " +
      "`Websandbox.connection.remote.evaluateExpression({ expression })` with the " +
      "current display expression, then show the returned value. Show a history " +
      "of previously computed values below the display.",
  },
  {
    title: "Ping the host",
    message:
      "Build a small card with a 'Say hi to the host' button. When clicked, call " +
      "`Websandbox.connection.remote.notifyHost({ message: 'Hi from the sandbox!' })` " +
      "and display the returned confirmation object (including `receivedAt`) in the card.",
  },
  {
    title: "Inline expression evaluator",
    message:
      "Build a tiny UI with a text input and an 'Evaluate' button. When clicked, read " +
      "the input value, call `Websandbox.connection.remote.evaluateExpression({ expression })`, " +
      "and render the returned `value` (on success) or `error` (on failure) below the input.",
  },
];
