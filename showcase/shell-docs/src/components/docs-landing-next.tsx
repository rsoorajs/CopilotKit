"use client";

// DocsLandingNext — the "what comes after the product overview" block on
// the docs landing at `/`. Renders one of two layouts based on whether
// the user has a stored framework preference:
//
//   - null  → "Pick your agent framework" heading + IntegrationGrid,
//             so a fresh visitor's first action is clearly to choose a
//             backend.
//   - set   → "Continue with {FrameworkName}" heading + a small pointer
//             grid (Quickstart, framework landing, switch framework),
//             so a returning visitor lands on actionable next steps
//             instead of being prompted to re-pick.
//
// Renders null until mounted to avoid the SSR/CSR hydration mismatch that
// `storedFramework` reads from localStorage cause — same pattern as
// StoredFrameworkHighlight.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useFramework } from "./framework-provider";
import { IntegrationGrid } from "./integration-grid";
import { getIntegration } from "@/lib/registry";

export function DocsLandingNext() {
  const { storedFramework, setStoredFramework } = useFramework();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!storedFramework) {
    return (
      <div className="not-prose">
        <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
          Pick your agent framework
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
          We store your choice locally so every page renders the right code.
          Once you pick a framework you can switch any time from the sidebar.
        </p>
        <IntegrationGrid description="" />
      </div>
    );
  }

  const integration = getIntegration(storedFramework);
  if (!integration) {
    // Stored slug doesn't match any current integration (renamed,
    // removed, or stale localStorage). Fall back to the picker.
    return (
      <div className="not-prose">
        <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
          Pick your agent framework
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
          Your previous choice is no longer available. Pick a framework to
          continue.
        </p>
        <IntegrationGrid description="" />
      </div>
    );
  }

  return (
    <div className="not-prose">
      <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
        Continue with {integration.name}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
        We&apos;ll render every code snippet using {integration.name}. Pick up
        where you left off, or switch frameworks any time from the sidebar.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Link
          href={`/${integration.slug}/quickstart`}
          className="group flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 no-underline hover:border-[var(--accent)] hover:shadow-sm transition"
        >
          <div className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
            Quickstart
          </div>
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
            The {integration.name} quickstart guide.
          </div>
        </Link>
        <Link
          href={`/${integration.slug}`}
          className="group flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 no-underline hover:border-[var(--accent)] hover:shadow-sm transition"
        >
          <div className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
            Browse {integration.name} docs
          </div>
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Every topic rendered with {integration.name} snippets.
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setStoredFramework(null)}
          className="group flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 no-underline hover:border-[var(--accent)] hover:shadow-sm transition text-left cursor-pointer"
        >
          <div className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
            Switch framework
          </div>
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Show the framework picker again.
          </div>
        </button>
      </div>
    </div>
  );
}
