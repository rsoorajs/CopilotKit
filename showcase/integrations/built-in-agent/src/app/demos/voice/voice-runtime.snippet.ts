// Docs-only snippet — not imported or run. Mirrors the per-framework
// voice runtime route but isolates the teaching points: register a
// `TranscriptionService` on the V2 runtime, expose `/transcribe`, and
// short-circuit cleanly when credentials are missing.
//
// Mirrors the convention from `tool-rendering/render-flight-tool.snippet.tsx`.

import type { NextRequest } from "next/server";
import {
  CopilotRuntime,
  TranscriptionService,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import type { TranscribeFileOptions } from "@copilotkit/runtime/v2";
import { TranscriptionServiceOpenAI } from "@copilotkit/voice";
import OpenAI from "openai";

declare const myAgent: unknown;

// @region[transcription-service-guard]
// Wrapper that returns a clean 4xx (rather than an opaque 5xx) when
// OPENAI_API_KEY is missing, then delegates to the OpenAI-backed
// TranscriptionServiceOpenAI when the key is present. Subclass
// `TranscriptionService` from @copilotkit/runtime/v2 and override
// `transcribeFile` to plug in any provider — Whisper, AssemblyAI,
// Deepgram, your own model.
class GuardedOpenAITranscriptionService extends TranscriptionService {
  private delegate: TranscriptionServiceOpenAI | null;

  constructor() {
    super();
    const apiKey = process.env.OPENAI_API_KEY;
    this.delegate = apiKey
      ? new TranscriptionServiceOpenAI({ openai: new OpenAI({ apiKey }) })
      : null;
  }

  async transcribeFile(options: TranscribeFileOptions): Promise<string> {
    if (!this.delegate) {
      // The substring "api key" maps the runtime's default error path
      // to AUTH_FAILED → 401, surfaced cleanly to the chat client.
      throw new Error(
        "OPENAI_API_KEY not configured (api key missing). " +
          "Set OPENAI_API_KEY to enable voice transcription.",
      );
    }
    return this.delegate.transcribeFile(options);
  }
}
// @endregion[transcription-service-guard]

// @region[voice-runtime]
// Wire the V2 CopilotRuntime directly: the V1 Next.js wrapper drops
// `transcriptionService` on the floor, so use `createCopilotRuntimeHandler`
// from `@copilotkit/runtime/v2` instead. With `transcriptionService`
// registered, the runtime advertises `audioFileTranscriptionEnabled: true`
// on `/info` (which is what tells <CopilotChat /> to render the mic
// button) and routes `POST /transcribe` to the service.
const runtime = new CopilotRuntime({
  agents: { "voice-demo": myAgent },
  transcriptionService: new GuardedOpenAITranscriptionService(),
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit-voice",
});

export const POST = (req: NextRequest) => handler(req);
export const GET = (req: NextRequest) => handler(req);
// @endregion[voice-runtime]
