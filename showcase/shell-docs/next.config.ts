import type { NextConfig } from "next";

// NEXT_PUBLIC_BASE_URL is inlined automatically by Next.js at build time
// because of the NEXT_PUBLIC_ prefix. Do NOT re-declare it in an `env` block —
// doing so bakes the build-time value into server code and overrides runtime env.
//
// Fail fast during an actual `next build` if the variable is missing, so we
// never ship broken absolute URLs. Other invocations that also load this
// config (e.g. `next lint`, `next dev`) only warn, because failing them on a
// missing value would be noise — consumers are expected to handle the dev
// fallback themselves (e.g. `process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3003"`).
//
// Use NEXT_PHASE — the Next.js-canonical signal for production builds —
// rather than sniffing process.argv, which is fragile (e.g. broken under
// wrappers, turbo runs, or when invoked programmatically).
const isNextBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  if (isNextBuild) {
    throw new Error(
      "NEXT_PUBLIC_BASE_URL is required for `next build` of showcase/shell-docs. " +
        "Set it in the environment (e.g. https://your-domain.example) before running the build.",
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    "[shell-docs] NEXT_PUBLIC_BASE_URL is not set; consumers should fall back to a sensible dev default (e.g. http://localhost:3003).",
  );
}

// NEXT_PUBLIC_SHELL_URL points at the shell (showcase) host, which owns
// `/integrations` and `/matrix` — the live integration explorer and
// feature-matrix pages. Components use it directly in cross-host hrefs
// (e.g. the top-nav "Integrations" link). Same validation pattern as
// NEXT_PUBLIC_BASE_URL above: fail at `next build` if missing; warn in dev.
if (!process.env.NEXT_PUBLIC_SHELL_URL) {
  if (isNextBuild) {
    throw new Error(
      "NEXT_PUBLIC_SHELL_URL is required for `next build` of showcase/shell-docs. " +
        "Set it to the shell host before running the build.",
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    "[shell-docs] NEXT_PUBLIC_SHELL_URL is not set; consumers should fall back to a sensible dev default (e.g. http://localhost:3000).",
  );
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/frontend-actions",
        destination: "/frontend-tools",
        permanent: true,
      },
      {
        source: "/troubleshooting/migrate-to-v2",
        destination: "/migrate/v2",
        permanent: true,
      },
      {
        source: "/troubleshooting/migrate-to-1.10.X",
        destination: "/migrate/1.10.X",
        permanent: true,
      },
      {
        source: "/troubleshooting/migrate-to-1.8.2",
        destination: "/migrate/1.8.2",
        permanent: true,
      },
      {
        source: "/concepts/oss-vs-cloud",
        destination: "/concepts/oss-vs-enterprise",
        permanent: true,
      },
      {
        source: "/quickstart",
        destination: "/",
        permanent: true,
      },

      // /unselected/* tree retired. Most files were either canonical at
      // root or duplicated content from `integrations/built-in-agent/`.
      // Per-path redirects below handle the BIA-canonical mappings; the
      // catch-all at the bottom funnels everything else to root (where
      // either the canonical version now lives or the soft-default
      // serves the right framework view).
      { source: "/unselected", destination: "/", permanent: true },
      {
        source: "/unselected/quickstart",
        destination: "/built-in-agent/quickstart",
        permanent: true,
      },
      {
        source: "/unselected/advanced-configuration",
        destination: "/built-in-agent/advanced-configuration",
        permanent: true,
      },
      {
        source: "/unselected/mcp-servers",
        destination: "/built-in-agent/mcp-servers",
        permanent: true,
      },
      {
        source: "/unselected/model-selection",
        destination: "/built-in-agent/model-selection",
        permanent: true,
      },
      {
        source: "/unselected/server-tools",
        destination: "/built-in-agent/server-tools",
        permanent: true,
      },
      {
        source: "/unselected/shared-state",
        destination: "/built-in-agent/shared-state",
        permanent: true,
      },
      {
        source: "/unselected/generative-ui/mcp-apps",
        destination: "/built-in-agent/generative-ui/mcp-apps",
        permanent: true,
      },
      // Cat C promotions whose canonical home moved off the unselected
      // tail (e.g. `unselected/ag-ui` → `backend/ag-ui`).
      { source: "/unselected/ag-ui", destination: "/backend/ag-ui", permanent: true },
      {
        source: "/unselected/copilot-runtime",
        destination: "/backend/copilot-runtime",
        permanent: true,
      },
      // troubleshooting/migrate-to-* in unselected → existing
      // /migrate/* canonical (already redirected at the
      // /troubleshooting/migrate-to-* level).
      {
        source: "/unselected/troubleshooting/migrate-to-v2",
        destination: "/migrate/v2",
        permanent: true,
      },
      {
        source: "/unselected/troubleshooting/migrate-to-1.10.X",
        destination: "/migrate/1.10.X",
        permanent: true,
      },
      {
        source: "/unselected/troubleshooting/migrate-to-1.8.2",
        destination: "/migrate/1.8.2",
        permanent: true,
      },
      // Tutorials and interrupt-based moved out of unselected/ to root.
      {
        source: "/unselected/tutorials/:path*",
        destination: "/tutorials/:path*",
        permanent: true,
      },
      {
        source:
          "/unselected/generative-ui/your-components/interrupt-based",
        destination:
          "/generative-ui/your-components/interrupt-based",
        permanent: true,
      },
      // agent-app-context was concept-per-framework only; no canonical
      // root home. Send legacy URLs to `/` rather than 404 — readers
      // who stored the old link will land on docs and can navigate.
      {
        source: "/unselected/agent-app-context",
        destination: "/",
        permanent: true,
      },
      // Catch-all: any remaining /unselected/* path lands on its
      // canonical root equivalent (Cat A files: coding-agents,
      // custom-look-and-feel/*, frontend-tools, etc.).
      {
        source: "/unselected/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
