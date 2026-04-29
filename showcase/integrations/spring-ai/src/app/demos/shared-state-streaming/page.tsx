"use client";

import React from "react";

export default function SharedStateStreamingUnsupported() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
          Shared State Streaming — Not Supported by Spring AI
        </h1>
        <p style={{ color: "#555", lineHeight: 1.55, marginBottom: 16 }}>
          The ag-ui Spring AI adapter has no mid-stream state-delta API
          analogous to <code>copilotkit_emit_state</code>, so the agent cannot
          push partial state snapshots between tokens.
        </p>
        <p style={{ color: "#555", lineHeight: 1.55 }}>
          See{" "}
          <a
            href="https://github.com/CopilotKit/CopilotKit/tree/main/showcase/integrations/spring-ai/src/app/demos/shared-state-streaming/README.md"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            this demo&apos;s README
          </a>{" "}
          for details, and the LangGraph Python integration for a working
          implementation.
        </p>
      </div>
    </div>
  );
}
