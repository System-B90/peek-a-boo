import { expect, test } from "@playwright/test";

test.describe("Login Page", () => {
    test("renders the login form", async ({ page }) => {
        await page.goto("/login", { waitUntil: "commit" });

        await expect(
            page.getByRole("heading", { name: "Login" }),
        ).toBeVisible();
        await expect(page.locator("#username")).toBeVisible();
        await expect(page.locator("#password")).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Login" }),
        ).toBeVisible();
    });

    test("shows an error on invalid credentials", async ({ page }) => {
        await page.goto("/login", { waitUntil: "commit" });

        await page.locator("#username").fill("not-a-real-user");
        await page.locator("#password").fill("wrong-password");
        await page.getByRole("button", { name: "Login" }).click();

        await expect(page.getByText(/\d{3}/)).toBeVisible({
            timeout: 15_000,
        });
        await expect(page).toHaveURL(/\/login/);
    });

    test("unauthenticated visitors are redirected away from the dashboard", async ({
        page,
    }) => {
        await page.goto("/", { waitUntil: "commit" });
        await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    });
});
