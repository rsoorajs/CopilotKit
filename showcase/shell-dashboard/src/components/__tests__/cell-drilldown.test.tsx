/**
 * Unit tests for CellDrilldown — per-cell dimension detail panel.
 */
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { CellDrilldown } from "../cell-drilldown";
import type { LiveStatusMap, StatusRow } from "@/lib/live-status";

function row(
  key: string,
  dimension: string,
  state: StatusRow["state"],
  overrides?: Partial<StatusRow>,
): StatusRow {
  return {
    id: `id-${key}`,
    key,
    dimension,
    state,
    signal: {},
    observed_at: "2026-04-20T00:00:00Z",
    transitioned_at: "2026-04-20T00:00:00Z",
    fail_count: 0,
    first_failure_at: null,
    ...overrides,
  };
}

function mapOf(rows: StatusRow[]): LiveStatusMap {
  const m: LiveStatusMap = new Map();
  for (const r of rows) m.set(r.key, r);
  return m;
}

describe("CellDrilldown", () => {
  it("renders all 5 badge dimensions", () => {
    const live = mapOf([
      row("health:lgp", "health", "green"),
      row("e2e:lgp/agentic-chat", "e2e", "green"),
      row("smoke:lgp", "smoke", "green"),
    ]);
    const { getByTestId, getByText } = render(
      <CellDrilldown
        slug="lgp"
        featureId="agentic-chat"
        integrationName="LangGraph Python"
        featureName="Agentic Chat"
        liveStatus={live}
        onClose={() => {}}
      />,
    );
    expect(getByTestId("cell-drilldown")).toBeDefined();
    expect(getByText("Health")).toBeDefined();
    expect(getByText("E2E")).toBeDefined();
    expect(getByText("Smoke")).toBeDefined();
    expect(getByText("D5 (Deep)")).toBeDefined();
    expect(getByText("D6 (Parity)")).toBeDefined();
  });

  it("shows integration and feature name in header", () => {
    const { getByText } = render(
      <CellDrilldown
        slug="lgp"
        featureId="agentic-chat"
        integrationName="LangGraph Python"
        featureName="Agentic Chat"
        liveStatus={new Map()}
        onClose={() => {}}
      />,
    );
    expect(getByText("LangGraph Python")).toBeDefined();
    expect(getByText("Agentic Chat")).toBeDefined();
  });

  it("shows rollup tone", () => {
    const live = mapOf([
      row("health:lgp", "health", "red", {
        fail_count: 5,
        first_failure_at: "2026-04-19T10:00:00Z",
        signal: { error: "connection timeout" },
      }),
    ]);
    const { getByText } = render(
      <CellDrilldown
        slug="lgp"
        featureId="agentic-chat"
        integrationName="LangGraph Python"
        featureName="Agentic Chat"
        liveStatus={live}
        onClose={() => {}}
      />,
    );
    // Rollup should display "red"
    expect(getByText("red")).toBeDefined();
  });

  it("shows fail_count and first_failure_at for red badges", () => {
    const live = mapOf([
      row("health:lgp", "health", "red", {
        fail_count: 5,
        first_failure_at: "2026-04-19T10:00:00Z",
        signal: { error: "connection timeout" },
      }),
    ]);
    const { getByTestId } = render(
      <CellDrilldown
        slug="lgp"
        featureId="agentic-chat"
        integrationName="LangGraph Python"
        featureName="Agentic Chat"
        liveStatus={live}
        onClose={() => {}}
      />,
    );
    const healthBadge = getByTestId("drilldown-badge-health");
    expect(healthBadge.textContent).toContain("5");
    expect(healthBadge.textContent).toContain("Apr");
  });

  it("shows signal payload for red badges", () => {
    const live = mapOf([
      row("e2e:lgp/agentic-chat", "e2e", "red", {
        fail_count: 2,
        first_failure_at: "2026-04-18T12:00:00Z",
        signal: { error: "assertion failed", step: "login" },
      }),
    ]);
    const { getByTestId } = render(
      <CellDrilldown
        slug="lgp"
        featureId="agentic-chat"
        integrationName="LangGraph Python"
        featureName="Agentic Chat"
        liveStatus={live}
        onClose={() => {}}
      />,
    );
    const signalEl = getByTestId("signal-payload");
    expect(signalEl.textContent).toContain("assertion failed");
    expect(signalEl.textContent).toContain("login");
  });

  it("does not show failure details for green badges", () => {
    const live = mapOf([
      row("health:lgp", "health", "green"),
      row("e2e:lgp/agentic-chat", "e2e", "green"),
    ]);
    const { queryAllByTestId } = render(
      <CellDrilldown
        slug="lgp"
        featureId="agentic-chat"
        integrationName="LangGraph Python"
        featureName="Agentic Chat"
        liveStatus={live}
        onClose={() => {}}
      />,
    );
    expect(queryAllByTestId("fail-count").length).toBe(0);
    expect(queryAllByTestId("signal-payload").length).toBe(0);
  });

  it("calls onClose when close button is clicked", () => {
    let closed = false;
    const { getByTestId } = render(
      <CellDrilldown
        slug="lgp"
        featureId="agentic-chat"
        integrationName="LangGraph Python"
        featureName="Agentic Chat"
        liveStatus={new Map()}
        onClose={() => {
          closed = true;
        }}
      />,
    );
    fireEvent.click(getByTestId("drilldown-close"));
    expect(closed).toBe(true);
  });

  it("renders strikethrough 'n/a' for dimensions with no data (not '?')", () => {
    const { getByTestId } = render(
      <CellDrilldown
        slug="lgp"
        featureId="agentic-chat"
        integrationName="LangGraph Python"
        featureName="Agentic Chat"
        liveStatus={new Map()}
        onClose={() => {}}
      />,
    );
    const healthBadge = getByTestId("drilldown-badge-health");
    expect(healthBadge.textContent).toContain("n/a");
    // Verify strikethrough styling is applied
    const strikethroughEl = healthBadge.querySelector(".line-through");
    expect(strikethroughEl).not.toBeNull();
  });
});
