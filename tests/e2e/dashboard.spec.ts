import { expect, test } from "@playwright/test";

test.describe("Dashboard", () => {
    test("loads the student grid for a logged-in mentor", async ({
        page,
    }) => {
        await page.goto("/", { waitUntil: "commit" });

        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.getByPlaceholder("Filters...")).toBeVisible({
            timeout: 15_000,
        });
    });

    test("navigates to the settings page", async ({ page }) => {
        await page.goto("/settings", { waitUntil: "commit" });

        await expect(page).not.toHaveURL(/\/login/);
    });
});
