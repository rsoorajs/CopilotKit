// <Steps>/<Step> — numbered step blocks with a left-side connector line.
//
// Reference (docs.copilotkit.ai) uses fumadocs' `Steps`: each step is
// numbered via a small circle on the left and a thin vertical line
// connects consecutive steps. We approximate that here in pure CSS —
// no client-side JS needed, so this works inside RSC-rendered MDX.
//
// Numbering is CSS counter-driven (see `.docs-steps` / `.docs-step__badge`
// in `globals.css`) rather than React-injected indices. That way a
// `<Step>` hidden by a gate like `<WhenFrameworkHas>` doesn't advance
// the counter — visible steps stay 1, 2, 3, … in the reader's view
// regardless of which gates pass.

import React from "react";

export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="docs-steps"
      style={{
        position: "relative",
        paddingLeft: "2rem",
        borderLeft: "1px solid var(--border)",
        marginLeft: "0.75rem",
        margin: "1.5rem 0 1.5rem 0.75rem",
      }}
    >
      {children}
    </div>
  );
}

interface StepProps {
  title?: string;
  children?: React.ReactNode;
}

export function Step({ title, children }: StepProps) {
  return (
    <div
      style={{
        position: "relative",
        paddingBottom: "1.5rem",
      }}
    >
      {/* numbered badge — number rendered via CSS counter (globals.css) */}
      <div
        aria-hidden
        className="docs-step__badge"
        style={{
          position: "absolute",
          left: "-2.75rem",
          top: "-0.125rem",
          width: "1.5rem",
          height: "1.5rem",
          borderRadius: "999px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontSize: "0.75rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      />
      {title && (
        <h4
          style={{
            fontWeight: 600,
            marginBottom: "0.375rem",
            marginTop: 0,
            fontSize: "1rem",
            color: "var(--text)",
          }}
        >
          {title}
        </h4>
      )}
      <div style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}
