import { expect, test } from "@playwright/test";

test.describe("Login Page", () => {
    test("renders the login form", async ({ page }) => {
        await page.goto("/login", { waitUntil: "commit" });

        await expect(
            page.getByRole("heading", { name: "Peek-a-boo" }),
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: "התחברות עם הייב" }),
        ).toBeVisible();
    });

    test("Sign in with Hive redirects to Hive's SSO login", async ({
        page,
    }) => {
        await page.goto("/login", { waitUntil: "commit" });

        await page.getByRole("button", { name: "התחברות עם הייב" }).click();

        await page.waitForURL(/hive\.org/, { timeout: 30_000 });
    });

    test("unauthenticated visitors are redirected away from the dashboard", async ({
        page,
    }) => {
        await page.goto("/", { waitUntil: "commit" });
        await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    });
});
