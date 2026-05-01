"use client";
/**
 * DepthChip — colored chip showing achieved depth D0-D5.
 *
 * Color mapping:
 *   D5    = emerald — deep multi-turn e2e coverage
 *   D3-D4 = amber/yellow — meaningful e2e but not yet D5
 *   D1-D2 = red — basic health only, needs work
 *   D0    = gray — exists but no live probe data
 *   unshipped = transparent + dashed border, displays "--"
 *   unsupported = slate border + slate fill, displays "🚫"
 *                 (architectural limit — framework cannot support feature)
 *   regression = red (danger)
 */

export interface DepthChipProps {
  depth: 0 | 1 | 2 | 3 | 4 | 5;
  status: "wired" | "stub" | "unshipped" | "unsupported";
  /** When true, chip renders in red regardless of depth. */
  regression?: boolean;
}

/** Background color class by depth tier. */
function depthColorClass(depth: number, regression?: boolean): string {
  if (regression) {
    return "bg-[var(--danger)] text-white";
  }
  switch (depth) {
    case 5:
      return "bg-emerald-600 text-white";
    case 3:
    case 4:
      return "bg-[var(--amber)] text-white";
    case 1:
    case 2:
      return "bg-[var(--danger)] text-white";
    case 0:
    default:
      return "bg-[var(--text-muted)]/20 text-[var(--text-muted)]";
  }
}

export function DepthChip({ depth, status, regression }: DepthChipProps) {
  if (status === "unshipped") {
    return (
      <span
        data-testid="depth-chip"
        data-status="unshipped"
        className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 rounded text-[10px] font-semibold tabular-nums border border-dashed border-[var(--text-muted)]/40 text-[var(--text-muted)]/60"
        title="unshipped"
      >
        --
      </span>
    );
  }

  if (status === "unsupported") {
    // Distinct from "unshipped": architectural limit, not undone work.
    // A slate border + slate fill + 🚫 emoji + descriptive tooltip
    // signals "cannot be supported" rather than "to be done".
    return (
      <span
        data-testid="depth-chip"
        data-status="unsupported"
        className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 rounded text-[10px] font-semibold tabular-nums border border-slate-500/40 bg-slate-500/10 text-slate-400"
        title="Not supported by this framework"
      >
        🚫
      </span>
    );
  }

  const colorClass = depthColorClass(depth, regression);

  return (
    <span
      data-testid="depth-chip"
      data-depth={String(depth)}
      className={`inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 rounded text-[10px] font-semibold tabular-nums ${colorClass}`}
      title={`Depth ${depth}${regression ? " (regression)" : ""}`}
    >
      D{depth}
    </span>
  );
}
