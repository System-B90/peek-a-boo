import { type Page, test } from "@playwright/test";

/**
 * Release screenshots. Not assertions: captures the main screens into
 * `release-screenshots/` (repo root), which e2e.yml uploads as an artifact and
 * release.yml attaches to the GitHub Release on `v*` tags. Keep the list in
 * step with the app's user-facing pages (see CLAUDE.md, "Release screenshots").
 */

const OUT_DIR = "release-screenshots";

async function shoot(page: Page, name: string): Promise<void> {
    // Let the grid and fonts settle so the shot isn't a loading skeleton.
    await page
        .waitForLoadState("networkidle", { timeout: 10_000 })
        .catch(() => {});
    await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: true });
}

test.describe("Release screenshots", () => {
    test.describe.configure({ timeout: 60_000 });

    test("login", async ({ browser }) => {
        const context = await browser.newContext({
            storageState: { cookies: [], origins: [] },
        });
        const page = await context.newPage();
        await page.goto("/login", { waitUntil: "domcontentloaded" });
        await shoot(page, "01-login");
        await context.close();
    });

    test("dashboard", async ({ page }) => {
        await page.goto("/", { waitUntil: "commit" });
        await page
            .getByPlaceholder("Filters...")
            .waitFor({ timeout: 15_000 })
            .catch(() => {});
        await shoot(page, "02-dashboard");
    });

    test("mentees", async ({ page }) => {
        await page.goto("/mentees", { waitUntil: "commit" });
        await shoot(page, "03-mentees");
    });

    test("settings", async ({ page }) => {
        await page.goto("/settings", { waitUntil: "commit" });
        await shoot(page, "04-settings");
    });
});
