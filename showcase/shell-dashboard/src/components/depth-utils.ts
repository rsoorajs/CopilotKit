/**
 * Pure depth-derivation utility for the D0-D6 depth ladder.
 *
 * Walks D0 through D6 checking PocketBase live-status rows:
 *   D0 = cell exists with status wired or stub (static, no PB)
 *   D1 = health:<slug> green (integration-scoped)
 *   D2 = agent:<slug> green (integration-scoped)
 *   D3 = e2e:<slug>/<featureId> green (per-cell)
 *   D4 = chat:<slug> OR tools:<slug> green (integration-scoped)
 *   D5 = d5:<slug>/<d5FeatureType> green (per-cell, mapped via CATALOG_TO_D5_KEY)
 *   D6 = d6:<slug>/<featureId> green (per-cell)
 *
 * Achieved depth = highest D where ALL lower depths are also green.
 * Short-circuits: if any level is not green, stop there.
 */
import {
  keyFor,
  CATALOG_TO_D5_KEY,
  type LiveStatusMap,
} from "@/lib/live-status";

/** Minimal catalog cell shape consumed by depth derivation. */
export interface CatalogCell {
  id: string;
  integration: string;
  integration_name: string;
  feature: string | null;
  feature_name: string | null;
  status: "wired" | "stub" | "unshipped" | "unsupported";
  /** Historical high-water mark for this cell's depth. */
  max_depth: number;
  category: string | null;
  category_name: string | null;
}

/** Achieved depth on the D0-D6 ladder. */
export type AchievedDepth = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DepthResult {
  /** Highest contiguous depth achieved (0-6). */
  achieved: AchievedDepth;
  /** Whether achieved depth is below the historical high-water mark (max_depth). */
  isRegression: boolean;
}

function isGreen(live: LiveStatusMap, key: string): boolean {
  const row = live.get(key);
  return row?.state === "green";
}

/**
 * Check whether all D5 PB rows for a given (slug, catalogFeatureId) are green.
 * Returns false if the feature has no D5 mapping or any mapped row is missing/non-green.
 */
function isD5Green(
  live: LiveStatusMap,
  slug: string,
  featureId: string,
): boolean {
  const d5Keys = CATALOG_TO_D5_KEY[featureId];
  if (!d5Keys || d5Keys.length === 0) {
    return isGreen(live, keyFor("d5", slug, featureId));
  }
  return d5Keys.every((d5Key) => isGreen(live, keyFor("d5", slug, d5Key)));
}

/**
 * Derive the achieved depth for a single catalog cell.
 *
 * The walk is contiguous: if D1 is not green, achieved = D0 regardless
 * of D2/D3/D4/D5/D6 status (short-circuit).
 *
 * D5-as-bypass-for-D3/D4: per the harness model, the `e2e-deep` driver only
 * emits a `d5:<slug>/<featureType>` row after D3 (`e2e:<slug>/<featureId>`)
 * and D4 (`chat:<slug>` or `tools:<slug>`) probes have passed. So a green D5
 * row is sufficient evidence that D3 and D4 implicitly passed at some point,
 * even if the D3 (e2e) row is currently missing or red. After D2 passes we
 * therefore short-circuit to `achieved = 5` whenever D5 is green, then fall
 * through to the D6 check. We do NOT bypass D1 or D2 — those are independent
 * health/agent probes that are not implied by D5.
 */
export function deriveDepth(
  cell: CatalogCell,
  live: LiveStatusMap,
): DepthResult {
  // Unshipped and unsupported cells never advance past D0 — neither has any
  // probes attached, so there is no possibility of regression. (Unsupported
  // is a hard architectural floor; unshipped is "just unbuilt".)
  if (cell.status === "unshipped" || cell.status === "unsupported") {
    return { achieved: 0, isRegression: false };
  }

  // D0: cell exists (wired or stub) — always true if we reach here.
  let achieved: AchievedDepth = 0;

  // D1: health:<slug> green
  if (!isGreen(live, keyFor("health", cell.integration))) {
    return { achieved, isRegression: achieved < cell.max_depth };
  }
  achieved = 1;

  // D2: agent:<slug> green
  if (!isGreen(live, keyFor("agent", cell.integration))) {
    return { achieved, isRegression: achieved < cell.max_depth };
  }
  achieved = 2;

  // Cells without a feature have no per-cell D3/D5/D6 rows — stay at D2.
  if (cell.feature === null) {
    return { achieved, isRegression: achieved < cell.max_depth };
  }

  // D5-bypass: if the deep-probe row is green, D3 and D4 must have passed
  // at the time the d5 row was emitted. Skip the contiguous D3/D4 walk and
  // jump straight to D5, then proceed to the D6 check below.
  if (isD5Green(live, cell.integration, cell.feature)) {
    achieved = 5;
  } else {
    // D3: e2e:<slug>/<featureId> green (per-cell)
    if (!isGreen(live, keyFor("e2e", cell.integration, cell.feature))) {
      return { achieved, isRegression: achieved < cell.max_depth };
    }
    achieved = 3;

    // D4: chat:<slug> OR tools:<slug> green (integration-scoped)
    const chatGreen = isGreen(live, keyFor("chat", cell.integration));
    const toolsGreen = isGreen(live, keyFor("tools", cell.integration));
    if (!(chatGreen || toolsGreen)) {
      return { achieved, isRegression: achieved < cell.max_depth };
    }
    achieved = 4;

    // D5: d5:<slug>/<d5FeatureType> green (per-cell, via CATALOG_TO_D5_KEY).
    // Reaching this branch means the D5-bypass above was false, so D5 is
    // not green — stop at D4.
    return { achieved, isRegression: achieved < cell.max_depth };
  }

  // D6: d6:<slug>/<featureId> green (per-cell)
  if (isGreen(live, keyFor("d6", cell.integration, cell.feature))) {
    achieved = 6;
  }

  return { achieved, isRegression: achieved < cell.max_depth };
}
