import { test, expect } from "@playwright/test";

test("shared-state-read-write: page loads with recipe panel + chat", async ({
  page,
}) => {
  await page.goto("/demos/shared-state-read-write");
  await expect(
    page.getByRole("heading", { name: /shared state/i }),
  ).toBeVisible();
  await expect(page.getByText("Ingredients")).toBeVisible();
  // Two textboxes: recipe title input + chat input
  await expect(page.getByRole("textbox")).toHaveCount(2, { timeout: 15_000 });
});
