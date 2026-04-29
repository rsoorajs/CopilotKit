"use client";

import React from "react";

export default function InterruptHeadlessUnsupported() {
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
          Headless Interrupt — Not Supported by Spring AI
        </h1>
        <p style={{ color: "#555", lineHeight: 1.55, marginBottom: 16 }}>
          Spring AI&apos;s <code>ChatClient</code> has no graph-interrupt
          primitive, so <code>useAgent</code>&apos;s interrupt channel never
          fires against this backend.
        </p>
        <p style={{ color: "#555", lineHeight: 1.55 }}>
          See{" "}
          <a
            href="https://github.com/CopilotKit/CopilotKit/tree/main/showcase/integrations/spring-ai/src/app/demos/interrupt-headless/README.md"
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
