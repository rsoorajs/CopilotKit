import { test, expect } from "@playwright/test";

test.describe("HITL in chat — booking flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demos/hitl-in-chat");
  });

  test("page loads with chat input", async ({ page }) => {
    await expect(page.getByPlaceholder("Type a message")).toBeVisible();
  });

  // Regression: the broad `userMessage: "Alice"` fixture in
  // showcase/aimock/feature-parity.json was intercepting this suggestion and
  // returning a generic "Nice to meet you, Alice! ... Tokyo" greeting, so the
  // book_call HITL flow never fired. The fixture pair added in the same PR
  // as this test (full-sentence userMessage match, ordered before the broad
  // Alice match) routes the suggestion to a `book_call` toolCall, which is
  // what makes the time-picker card render.
  test("'Schedule a 1:1 with Alice' suggestion renders the time-picker", async ({
    page,
  }) => {
    const input = page.getByPlaceholder("Type a message");
    await input.fill("Schedule a 1:1 with Alice next week to review Q2 goals.");
    await input.press("Enter");

    const card = page.locator('[data-testid="time-picker-card"]');
    await expect(card).toBeVisible({ timeout: 60000 });

    // The Tokyo greeting starts with "Nice to meet you, Alice" — if any
    // assistant message contains that, the broad Alice fixture won and the
    // fix has regressed.
    await expect(page.getByText(/Nice to meet you, Alice/i)).toHaveCount(0);

    // The card should advertise the booking and the attendee parsed by the
    // fixture's toolCall arguments.
    await expect(card.getByText(/With Alice/i)).toBeVisible();

    // At least one selectable time slot is present.
    const slots = page.locator('[data-testid="time-picker-slot"]');
    expect(await slots.count()).toBeGreaterThan(0);
  });

  test("picking a time slot resolves the HITL with a confirmation", async ({
    page,
  }) => {
    const input = page.getByPlaceholder("Type a message");
    await input.fill("Schedule a 1:1 with Alice next week to review Q2 goals.");
    await input.press("Enter");

    const slot = page.locator('[data-testid="time-picker-slot"]').first();
    await expect(slot).toBeVisible({ timeout: 60000 });
    await slot.click();

    // The picked-state card replaces the slot grid.
    await expect(
      page.locator('[data-testid="time-picker-picked"]'),
    ).toBeVisible({ timeout: 10000 });

    // Agent's follow-up confirmation arrives next.
    await expect(
      page
        .locator('[data-role="assistant"]')
        .filter({ hasText: /Booked.*Alice/i })
        .first(),
    ).toBeVisible({ timeout: 30000 });
  });

  // The other suggestion in the demo. Same HITL flow, different
  // attendee/topic. Pinned here so a missing/regressed aimock fixture for
  // this suggestion (or a wiring regression in this integration's
  // useHumanInTheLoop binding) fails CI loudly instead of silently falling
  // through to "the agent rambled at me with no toolCall."
  test("'Book a call with sales' suggestion runs the HITL flow end-to-end", async ({
    page,
  }) => {
    const input = page.getByPlaceholder("Type a message");
    await input.fill(
      "Please book an intro call with the sales team to discuss pricing.",
    );
    await input.press("Enter");

    const card = page.locator('[data-testid="time-picker-card"]');
    await expect(card).toBeVisible({ timeout: 60000 });
    await expect(card.getByText(/Sales team/i)).toBeVisible();

    const slot = page.locator('[data-testid="time-picker-slot"]').first();
    await slot.click();

    await expect(
      page.locator('[data-testid="time-picker-picked"]'),
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page
        .locator('[data-role="assistant"]')
        .filter({ hasText: /Booked.*sales team/i })
        .first(),
    ).toBeVisible({ timeout: 30000 });
  });
});
