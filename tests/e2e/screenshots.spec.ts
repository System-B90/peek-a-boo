import { expect, type Page, test } from "@playwright/test";

/**
 * Release screenshots. Captures the main screens into
 * `release-screenshots/` (repo root), which e2e.yml uploads as an artifact and
 * release.yml attaches to the GitHub Release on `v*` tags. Keep the list in
 * step with the app's user-facing pages (see CLAUDE.md, "Release screenshots").
 *
 * The only assertion is that the page was actually served: a 5xx (e.g. an
 * nginx 502 page) fails the test instead of shipping as a "screenshot".
 */

const OUT_DIR = "release-screenshots";

/** Navigates, retrying 5xx responses for up to ~30s while the stack warms up. */
async function open(page: Page, url: string): Promise<void> {
    let status = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
        const res = await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 60_000,
        });
        status = res?.status() ?? 0;
        if (status > 0 && status < 500) {
            break;
        }
        await page.waitForTimeout(3_000);
    }
    expect(status, `${url} was not served (HTTP ${status})`).toBeLessThan(500);
}

/** Logged-in screens: a redirect to /login means the SSO auth state is missing. */
async function openAuthed(page: Page, url: string): Promise<void> {
    await open(page, url);
    await expect(
        page,
        `${url} redirected to login (auth state missing)`,
    ).not.toHaveURL(/\/login/);
}

async function shoot(page: Page, name: string): Promise<void> {
    // Let the grid and fonts settle so the shot isn't a loading skeleton.
    await page
        .waitForLoadState("networkidle", { timeout: 10_000 })
        .catch(() => {});
    await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: true });
}

test.describe("Release screenshots", () => {
    test.describe.configure({ timeout: 90_000 });

    test("login", async ({ browser }) => {
        const context = await browser.newContext({
            storageState: { cookies: [], origins: [] },
        });
        const page = await context.newPage();
        await open(page, "/login");
        await shoot(page, "01-login");
        await context.close();
    });

    test("dashboard", async ({ page }) => {
        await openAuthed(page, "/");
        await page
            .getByPlaceholder("Filters...")
            .waitFor({ timeout: 15_000 })
            .catch(() => {});
        await shoot(page, "02-dashboard");
    });

    test("mentees", async ({ page }) => {
        await openAuthed(page, "/mentees");
        await shoot(page, "03-mentees");
    });

    test("settings", async ({ page }) => {
        await openAuthed(page, "/settings");
        await shoot(page, "04-settings");
    });
});
