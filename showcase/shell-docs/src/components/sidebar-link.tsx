"use client";

// SidebarLink — framework-aware client-side anchor used for every
// entry in the docs sidebar. Resolves its final href based on the
// active FrameworkContext: when a framework is selected, the href is
// `/<framework>/<slug>`; otherwise it falls through to `/<slug>`.
//
// `framework` is URL-derived (see framework-provider) so the resolved
// href is identical during SSR and post-hydration — no transient
// fallback path needed.

import React from "react";
import Link from "next/link";
import { useFramework } from "./framework-provider";

export interface SidebarLinkProps {
  slug: string;
  /** Rendered text. */
  children: React.ReactNode;
  /** Style class. */
  className?: string;
  /** Active-state data attribute. */
  active?: boolean;
  /**
   * The render context. `"docs"` = we're on `/docs/*`; `"framework"`
   * = we're on `/<framework>/*`. Currently unused by the resolver (see
   * note below) — kept optional on the interface for call-site clarity.
   */
  scope?: "docs" | "framework";
  /**
   * Deprecated. Previously held a server-rendered best-guess href used
   * before hydration; the component now resolves the href identically
   * during SSR and on the client, so this value is ignored. Kept on the
   * interface for call-site compatibility.
   */
  fallbackHref?: string;
  /**
   * When true, the link does not render unless a framework is active
   * (URL-scoped) or stored in localStorage. Used for sidebar entries
   * whose root MDX is a routing shim — e.g. Quickstart, whose real
   * content lives per-framework. Without this, the entry shows on `/`
   * but clicks land on the shim page.
   */
  hideWhenUnscoped?: boolean;
}

export function SidebarLink({
  slug,
  children,
  className,
  active,
  scope: _scope,
  fallbackHref: _fallbackHref,
  hideWhenUnscoped,
}: SidebarLinkProps) {
  const { framework, storedFramework } = useFramework();

  // Prefer URL-active framework, then stored preference, then bare slug.
  // Using storedFramework here means sidebar links on unscoped pages (like
  // the root overview) navigate directly to the framework-scoped URL —
  // avoiding the visible RouterPivot redirect that would otherwise flicker
  // in the URL bar.
  const activeFramework = framework ?? storedFramework;
  if (hideWhenUnscoped && !activeFramework) return null;
  const href = activeFramework ? `/${activeFramework}/${slug}` : `/${slug}`;

  return (
    <Link
      href={href}
      data-active={active ? "true" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}
