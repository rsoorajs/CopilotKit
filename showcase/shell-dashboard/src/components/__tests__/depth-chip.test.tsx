/**
 * Unit tests for DepthChip — renders correct text + class for D0-D6,
 * unshipped, and regression states.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DepthChip } from "../depth-chip";

describe("DepthChip", () => {
  it.each([0, 1, 2, 3, 4, 5, 6])(
    "renders D%i for depth=%i with wired status",
    (depth) => {
      const { getByTestId } = render(
        <DepthChip depth={depth as 0 | 1 | 2 | 3 | 4 | 5 | 6} status="wired" />,
      );
      const chip = getByTestId("depth-chip");
      expect(chip.textContent).toBe(`D${depth}`);
    },
  );

  it("renders D0 with gray background class", () => {
    const { getByTestId } = render(<DepthChip depth={0} status="wired" />);
    const chip = getByTestId("depth-chip");
    expect(chip.className).toContain("text-muted");
  });

  it("renders D1 with amber background class", () => {
    const { getByTestId } = render(<DepthChip depth={1} status="wired" />);
    const chip = getByTestId("depth-chip");
    expect(chip.className).toContain("amber");
  });

  it("renders D2 with amber background class", () => {
    const { getByTestId } = render(<DepthChip depth={2} status="wired" />);
    const chip = getByTestId("depth-chip");
    expect(chip.className).toContain("amber");
  });

  it("renders D3 with blue/accent background class", () => {
    const { getByTestId } = render(<DepthChip depth={3} status="wired" />);
    const chip = getByTestId("depth-chip");
    expect(chip.className).toContain("accent");
  });

  it("renders D4 with blue/accent background class", () => {
    const { getByTestId } = render(<DepthChip depth={4} status="wired" />);
    const chip = getByTestId("depth-chip");
    expect(chip.className).toContain("accent");
  });

  it("renders D5 with emerald background class", () => {
    const { getByTestId } = render(<DepthChip depth={5} status="wired" />);
    const chip = getByTestId("depth-chip");
    expect(chip.className).toContain("emerald");
  });

  it("renders D6 with emerald background class", () => {
    const { getByTestId } = render(<DepthChip depth={6} status="wired" />);
    const chip = getByTestId("depth-chip");
    expect(chip.className).toContain("emerald");
  });

  it("renders '--' for unshipped status with dashed border", () => {
    const { getByTestId } = render(<DepthChip depth={0} status="unshipped" />);
    const chip = getByTestId("depth-chip");
    expect(chip.textContent).toBe("--");
    expect(chip.className).toContain("border-dashed");
    expect(chip.getAttribute("data-status")).toBe("unshipped");
  });

  it("renders 🚫 emoji for unsupported with descriptive tooltip", () => {
    const { getByTestId } = render(
      <DepthChip depth={0} status="unsupported" />,
    );
    const chip = getByTestId("depth-chip");
    expect(chip.textContent).toBe("🚫");
    // Distinct attribute lets the matrix and tests differentiate from unshipped.
    expect(chip.getAttribute("data-status")).toBe("unsupported");
    expect(chip.getAttribute("title")).toBe("Not supported by this framework");
  });

  it("unsupported renders distinctly from unshipped (different glyph + status)", () => {
    // Each render reuses the jsdom document, so we have to scope each query
    // to its own container instead of relying on the global getByTestId.
    const { container: cU } = render(
      <DepthChip depth={0} status="unshipped" />,
    );
    const { container: cNS } = render(
      <DepthChip depth={0} status="unsupported" />,
    );
    const unshippedChip = cU.querySelector(
      "[data-testid='depth-chip']",
    ) as HTMLElement;
    const unsupportedChip = cNS.querySelector(
      "[data-testid='depth-chip']",
    ) as HTMLElement;
    expect(unshippedChip).toBeDefined();
    expect(unsupportedChip).toBeDefined();
    expect(unshippedChip.textContent).not.toBe(unsupportedChip.textContent);
    expect(unshippedChip.getAttribute("data-status")).not.toBe(
      unsupportedChip.getAttribute("data-status"),
    );
  });

  it("renders stub status same as wired (D0 gray)", () => {
    const { getByTestId } = render(<DepthChip depth={0} status="stub" />);
    const chip = getByTestId("depth-chip");
    expect(chip.textContent).toBe("D0");
  });

  it("renders regression with danger color", () => {
    const { getByTestId } = render(
      <DepthChip depth={2} status="wired" regression />,
    );
    const chip = getByTestId("depth-chip");
    expect(chip.className).toContain("danger");
  });
});
