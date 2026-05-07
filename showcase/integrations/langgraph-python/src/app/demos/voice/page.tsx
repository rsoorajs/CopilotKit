"use client";

// @region[voice-page]
import { CopilotKit } from "@copilotkit/react-core/v2";
import { VoiceChat } from "./voice-chat";

export default function VoiceDemoPage() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-voice"
      agent="voice-demo"
      useSingleEndpoint={false}
    >
      <VoiceChat />
    </CopilotKit>
  );
}
// @endregion[voice-page]
