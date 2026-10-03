import { expect, test } from "@playwright/test";

// Guided tours and the help drawer (#97).
test.describe("Onboarding", () => {
    test("does not auto-start a tour under automation", async ({ page }) => {
        await page.goto("/", { waitUntil: "commit" });
        await expect(page.getByPlaceholder("Filters...")).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    test("help drawer replays the home tour step by step", async ({ page }) => {
        await page.goto("/", { waitUntil: "commit" });
        await page.getByRole("button", { name: "Open help" }).click();

        await expect(page.getByText("Keyboard shortcuts")).toBeVisible();
        await page
            .getByRole("button", { name: "Replay the tour" })
            .first()
            .click();

        const card = page.getByRole("dialog", { name: "Welcome to Peek-a-Boo" });
        await expect(card).toBeVisible();
        await expect(card.getByText("1 of 6")).toBeVisible();

        await page.keyboard.press("Enter");
        await expect(
            page.getByRole("dialog", { name: "Your students" }),
        ).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog", { name: "Your students" })).toHaveCount(0);
    });

    test("settings page registers its own tour", async ({ page }) => {
        await page.goto("/settings", { waitUntil: "commit" });
        await page.getByRole("button", { name: "Open help" }).click();
        await page.getByRole("button", { name: "Replay the tour" }).click();

        await expect(
            page.getByRole("dialog", { name: "Peek-a-Boo settings" }),
        ).toBeVisible();
    });
});
