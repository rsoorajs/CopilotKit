// Docs-only snippet — not imported or rendered. Mirrors the per-framework
// voice page but isolates the two teaching shapes: the chat surface that
// auto-renders the mic button when the runtime advertises transcription,
// and the sample-audio button that bypasses the mic for Playwright /
// screenshot flows.
//
// Mirrors the convention from `tool-rendering/render-flight-tool.snippet.tsx`.

import { useState } from "react";
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";

// @region[voice-page]
// `<CopilotChat />` renders the mic button automatically when the runtime
// at `runtimeUrl` advertises `audioFileTranscriptionEnabled: true` on its
// `/info` endpoint. There's nothing to wire up on the chat surface itself.
export function VoicePage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit-voice" agent="voice-demo">
      <CopilotChat agentId="voice-demo" />
    </CopilotKit>
  );
}
// @endregion[voice-page]

// @region[sample-audio-button]
// Bypasses the microphone: fetches a bundled audio clip and POSTs it as
// multipart/form-data to the runtime's `/transcribe` endpoint. Useful for
// Playwright runs, screenshots, or anywhere prompting for mic permissions
// is awkward.
export function SampleAudioButton(props: {
  onTranscribed: (text: string) => void;
  runtimeUrl: string;
  audioSrc: string;
}) {
  const { onTranscribed, runtimeUrl, audioSrc } = props;
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      const audioRes = await fetch(audioSrc);
      const blob = await audioRes.blob();

      const formData = new FormData();
      formData.append("audio", blob, "sample.wav");

      const base = runtimeUrl.replace(/\/$/, "");
      const transcribeRes = await fetch(`${base}/transcribe`, {
        method: "POST",
        body: formData,
      });

      const json = (await transcribeRes.json()) as { text?: string };
      if (json.text) onTranscribed(json.text);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={status === "loading"}>
      {status === "loading" ? "Transcribing…" : "Play sample"}
    </button>
  );
}
// @endregion[sample-audio-button]
