"use client";

// DocsLandingNext — the "what comes after the product overview" block on
// the docs landing at `/`. Renders one of two layouts based on whether
// the user has a stored framework preference:
//
//   - null  → "Pick your agent framework" heading + the categorized
//             integrations grid (Popular / Agent Frameworks /
//             Provider SDKs / …), so a fresh visitor's first action is
//             clearly to choose a backend. Mirrors the old docs-landing
//             picker shape so users see the same UI shell-internally
//             whether they arrived from the marketing landing or the
//             docs root.
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
import { StoredFrameworkHighlight } from "./stored-framework-highlight";
import { FRAMEWORK_CATEGORY_ORDER } from "@/lib/framework-categories";
import {
  getCategoryLabel,
  getIntegration,
  getIntegrations,
  type Integration,
} from "@/lib/registry";

function FrameworkPicker({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) {
  const integrations = getIntegrations()
    .slice()
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  // Bucket integrations by category, honoring the canonical ordering.
  const buckets = new Map<string, Integration[]>();
  for (const cat of FRAMEWORK_CATEGORY_ORDER) buckets.set(cat, []);
  buckets.set("other", []);
  for (const i of integrations) {
    const key = buckets.has(i.category) ? i.category : "other";
    buckets.get(key)!.push(i);
  }

  return (
    <section className="not-prose">
      <h2 className="text-xl font-semibold text-[var(--text)] mb-1">
        {heading}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-5">{description}</p>
      {[...buckets.entries()].map(([catId, items]) => {
        if (items.length === 0) return null;
        const label = catId === "other" ? "Other" : getCategoryLabel(catId);
        return (
          <div key={catId} className="mb-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-faint)] mb-3">
              {label}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map((i) => (
                <Link
                  key={i.slug}
                  href={`/${i.slug}`}
                  className="group relative flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:shadow-sm transition-all"
                >
                  {i.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.logo} alt="" className="w-5 h-5 shrink-0" />
                  ) : (
                    <span className="w-5 h-5 shrink-0" />
                  )}
                  <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)]">
                    {i.name}
                  </span>
                  <StoredFrameworkHighlight slug={i.slug} />
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function DocsLandingNext() {
  const { storedFramework, setStoredFramework } = useFramework();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!storedFramework) {
    return (
      <FrameworkPicker
        heading="Pick your agent framework"
        description="We store your choice locally so every page renders the right code. Once you pick a framework you can switch any time from the sidebar."
      />
    );
  }

  const integration = getIntegration(storedFramework);
  if (!integration) {
    // Stored slug doesn't match any current integration (renamed,
    // removed, or stale localStorage). Fall back to the picker.
    return (
      <FrameworkPicker
        heading="Pick your agent framework"
        description="Your previous choice is no longer available. Pick a framework to continue."
      />
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
