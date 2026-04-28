// UnscopedDocsPage — server component for routes that aren't already
// framework-scoped. Two cases:
//
//   - `/<feature>` where `<feature>` isn't a registered integration slug
//     (e.g. `/threads`, `/frontend-tools`). RouterPivot redirects the
//     visitor to `/<effectiveFramework>/<feature>` on mount.
//   - `/integrations/<framework>/...` legacy URLs. Renders the
//     framework-scoped sidebar inline; no pivot redirect needed.
//
// Shared between `app/[[...slug]]/page.tsx` and the
// `app/[framework]/[[...slug]]/page.tsx` fall-through (when the first
// URL segment isn't a registered integration).

import React from "react";
import { notFound } from "next/navigation";
import { DocsPageView } from "@/components/docs-page-view";
import {
  FrameworkGuardedContent,
  RouterPivot,
} from "@/components/router-pivot";
import { CONTENT_DIR, buildNavTree, loadDoc, readMeta } from "@/lib/docs-render";
import { getIntegration } from "@/lib/registry";

export async function UnscopedDocsPage({ slugPath }: { slugPath: string }) {
  const doc = loadDoc(slugPath);
  if (!doc) notFound();

  let navTree;
  let sidebarTitle = "CopilotKit Docs";
  let backLink = null;
  let showPivot = true;
  const integrationMatch = slugPath.match(/^integrations\/([^/]+)/);
  if (integrationMatch) {
    const framework = integrationMatch[1];
    if (!getIntegration(framework)) notFound();
    const frameworkDir = `${CONTENT_DIR}/integrations/${framework}`;
    const frameworkMeta = readMeta(frameworkDir);
    sidebarTitle =
      frameworkMeta?.title ||
      framework.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    navTree = buildNavTree(frameworkDir, `integrations/${framework}`);
    backLink = { label: "← Back to Docs", href: "/" };
    showPivot = false;
  } else {
    navTree = buildNavTree(CONTENT_DIR);
  }

  // Pivot redirects to /<effectiveFramework>/<slugPath>. Only feature
  // pages (those declaring a defaultCell in frontmatter) use the pivot —
  // generic doc pages render their body directly.
  const pivot =
    showPivot && doc.fm.defaultCell ? (
      <div className="mb-8">
        <RouterPivot slugPath={slugPath} />
      </div>
    ) : null;

  const contentIsFrameworkScoped = showPivot && !!doc.fm.defaultCell;

  return (
    <DocsPageView
      slugPath={slugPath}
      slugHrefPrefix=""
      sidebarTitle={sidebarTitle}
      backLink={backLink}
      navTree={navTree}
      bannerSlot={pivot}
      ContentWrapper={
        contentIsFrameworkScoped ? FrameworkGuardedContent : undefined
      }
    />
  );
}
