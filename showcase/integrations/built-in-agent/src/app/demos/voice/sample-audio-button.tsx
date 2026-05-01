"use client";

import { useState } from "react";

/**
 * Sample-audio button for the voice demo. Bypasses the microphone entirely:
 * fetches a bundled audio clip from /public and POSTs it as multipart/form-data
 * to the runtime's `/transcribe` endpoint. Matches the REST-mode payload shape
 * used by `transcribeAudio()` in `@copilotkit/react-core`'s
 * transcription-client.ts when the provider runs with `useSingleEndpoint={false}`.
 */
export interface SampleAudioButtonProps {
  onTranscribed: (text: string) => void;
  runtimeUrl: string;
  audioSrc: string;
  sampleLabel: string;
}

// @region[sample-audio-button]
export function SampleAudioButton({
  onTranscribed,
  runtimeUrl,
  audioSrc,
  sampleLabel,
}: SampleAudioButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      const audioRes = await fetch(audioSrc);
      if (!audioRes.ok) {
        throw new Error(`Failed to fetch sample audio: ${audioRes.status}`);
      }
      const blob = await audioRes.blob();
      const formData = new FormData();
      formData.append("audio", blob, "sample.wav");
      const base = runtimeUrl.replace(/\/$/, "");
      const transcribeRes = await fetch(`${base}/transcribe`, {
        method: "POST",
        body: formData,
      });
      if (!transcribeRes.ok) {
        throw new Error(`Transcribe failed: ${transcribeRes.status}`);
      }
      const json = (await transcribeRes.json()) as { text?: string };
      if (!json.text) {
        throw new Error("Transcribe returned no text");
      }
      onTranscribed(json.text);
      setStatus("idle");
    } catch (err) {
      console.error("[voice-demo] sample transcription failed", err);
      setStatus("error");
    }
  }

  return (
    <div
      data-testid="voice-sample-audio"
      className="flex items-center gap-3 rounded-md border border-black/10 bg-black/[0.02] px-3 py-2 text-sm"
    >
      <button
        type="button"
        data-testid="voice-sample-audio-button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded border border-black/10 bg-white px-3 py-1 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
      >
        {status === "loading" ? "Transcribing…" : "Play sample"}
      </button>
      <span className="text-black/60">Sample: &ldquo;{sampleLabel}&rdquo;</span>
      {status === "error" && (
        <span
          data-testid="voice-sample-audio-error"
          className="ml-auto text-red-600"
        >
          Error — see console
        </span>
      )}
    </div>
  );
}
// @endregion[sample-audio-button]
