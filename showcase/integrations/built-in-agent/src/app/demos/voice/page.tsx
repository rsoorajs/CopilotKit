"use client";

// Voice demo (built-in-agent).
//
// 1. The default mic button rendered by <CopilotChat /> when the runtime at
//    RUNTIME_URL advertises `audioFileTranscriptionEnabled: true`. Click,
//    speak, click again — text is transcribed into the composer.
// 2. <SampleAudioButton /> fetches a bundled sample.wav and POSTs it to the
//    same /transcribe endpoint, then writes the result into the composer
//    textarea (bypassing mic permissions for screenshots/Playwright).

import { useCallback } from "react";
import {
  CopilotKitProvider,
  CopilotChat,
} from "@copilotkit/react-core/v2";
import { SampleAudioButton } from "./sample-audio-button";

const RUNTIME_URL = "/api/copilotkit-voice";
const SAMPLE_AUDIO_PATH = "/demo-audio/sample.wav";
const SAMPLE_LABEL = "What is the weather in Tokyo?";

export default function VoiceDemoPage() {
  const handleTranscribed = useCallback((text: string) => {
    if (typeof document === "undefined") return;
    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="copilot-chat-textarea"]',
    );
    if (!textarea) {
      console.warn(
        "[voice-demo] could not find copilot-chat-textarea to populate",
      );
      return;
    }
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(textarea, text);
    } else {
      textarea.value = text;
    }
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
  }, []);

  return (
    <CopilotKitProvider
      runtimeUrl={RUNTIME_URL}
      useSingleEndpoint={false}
    >
      <div className="flex h-screen flex-col gap-3 p-6">
        <header>
          <h1 className="text-lg font-semibold">Voice input</h1>
          <p className="text-sm text-black/60">
            Click the microphone to record, or play the bundled sample audio.
            Speech is transcribed into the input field — you click send.
          </p>
        </header>
        <SampleAudioButton
          onTranscribed={handleTranscribed}
          runtimeUrl={RUNTIME_URL}
          audioSrc={SAMPLE_AUDIO_PATH}
          sampleLabel={SAMPLE_LABEL}
        />
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-black/10">
          <CopilotChat className="h-full" />
        </div>
      </div>
    </CopilotKitProvider>
  );
}
