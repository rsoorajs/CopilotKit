import React from "react";
import Link from "next/link";

// `Callout` is owned by `docs-callout.tsx` (broader type surface: info |
// tip | warn | warning | error | danger | note). Re-exported here so
// historical imports from `@/components/mdx-components` keep working.
export { Callout } from "@/components/docs-callout";

export function Cards({
  children,
  className: _className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">{children}</div>
  );
}

export function Card({
  title,
  description,
  href,
  icon,
  className,
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  // Match the docs-landing pointer-card style:
  // - bordered surface, accent border on hover, subtle shadow on hover
  // - title flips to accent color on hover via `group-hover` so the link
  //   feels active without using a default underline (prose CSS would
  //   otherwise add one to the wrapping <a>)
  // - linked variant suppresses the prose underline with `no-underline`
  const mergedClassName = [
    "block group rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4",
    href
      ? "no-underline hover:border-[var(--accent)] hover:shadow-sm transition"
      : "transition-colors",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon && (
        <div className="mb-2 text-[var(--text-muted)]" aria-hidden>
          {icon}
        </div>
      )}
      <div
        className={`font-semibold text-[var(--text)] text-sm${
          href ? " group-hover:text-[var(--accent)]" : ""
        }`}
      >
        {title}
      </div>
      {description && (
        <div className="text-xs text-[var(--text-muted)] mt-1">
          {description}
        </div>
      )}
      {children && (
        <div className="text-xs text-[var(--text-secondary)] mt-2">
          {children}
        </div>
      )}
    </>
  );

  if (href) {
    // Rewrite /reference/v2/... paths to /reference/...
    const resolvedHref = href.replace(/^\/reference\/v2\//, "/reference/");
    return (
      <Link href={resolvedHref} className={mergedClassName}>
        {content}
      </Link>
    );
  }

  return <div className={mergedClassName}>{content}</div>;
}

export function Accordions({ children }: { children: React.ReactNode }) {
  return <div className="my-4 space-y-2">{children}</div>;
}

export function Accordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--text)] select-none hover:bg-[var(--bg-elevated)] transition-colors">
        {title}
      </summary>
      <div className="px-4 pb-4 text-sm text-[var(--text-secondary)]">
        {children}
      </div>
    </details>
  );
}
