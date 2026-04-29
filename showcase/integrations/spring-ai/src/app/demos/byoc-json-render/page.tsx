"use client";

import React from "react";

export default function ByocJsonRenderUnsupported() {
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
          BYOC JSON Render — Not Supported by Spring AI
        </h1>
        <p style={{ color: "#555", lineHeight: 1.55, marginBottom: 16 }}>
          Spring AI&apos;s <code>BeanOutputConverter</code> only resolves on the
          final response, so there is no per-token JSON streaming to drive
          incremental rendering. The <code>@json-render</code> dependencies are
          also not installed in this integration.
        </p>
        <p style={{ color: "#555", lineHeight: 1.55 }}>
          See{" "}
          <a
            href="https://github.com/CopilotKit/CopilotKit/tree/main/showcase/integrations/spring-ai/src/app/demos/byoc-json-render/README.md"
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
