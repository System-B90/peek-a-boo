import path from "node:path";

import { expect, Page, test as setup } from "@playwright/test";

const AUTH_FILE = path.join(__dirname, "..", ".auth", "user.json");

const HIVE_ADMIN_USERNAME = "admin";
const HIVE_ADMIN_PASSWORD = "Password1";

type FetchResult = {
    ok: boolean;
    status: number;
    body: string;
};

// Requests go through the page's own fetch, not page.request: CI resolves the
// e2e host only inside Chromium (--host-resolver-rules), so Node-side
// requests cannot reach it.
async function browserFetch(
    page: Page,
    url: string,
    form?: Record<string, string>,
): Promise<FetchResult> {
    return await page.evaluate(
        async ({ url, form }) => {
            const response = await fetch(url, {
                method: form ? "POST" : "GET",
                body: form ? new URLSearchParams(form) : undefined,
            });
            return {
                ok: response.ok,
                status: response.status,
                body: await response.text(),
            };
        },
        { url, form },
    );
}

async function waitForAuthApi(page: Page, baseURL: string): Promise<void> {
    for (let attempt = 1; attempt <= 10; attempt++) {
        try {
            const response = await browserFetch(
                page,
                `${baseURL}/api/auth/csrf`,
            );
            if (response.ok) {
                return;
            }
        } catch {
            // Ignore error and retry
        }
        await page.waitForTimeout(3_000);
    }
    throw new Error("NextAuth API is not ready");
}

async function startHiveSso(page: Page, baseURL: string): Promise<void> {
    await waitForAuthApi(page, baseURL);

    const csrfResponse = await browserFetch(page, `${baseURL}/api/auth/csrf`);
    if (!csrfResponse.ok) {
        throw new Error(`CSRF request failed: ${csrfResponse.status}`);
    }

    const { csrfToken } = JSON.parse(csrfResponse.body);
    const signInResponse = await browserFetch(
        page,
        `${baseURL}/api/auth/signin/hive`,
        {
            csrfToken,
            callbackUrl: `${baseURL}/api/login`,
            json: "true",
        },
    );
    if (!signInResponse.ok) {
        throw new Error(`Sign-in request failed: ${signInResponse.status}`);
    }

    const signInData = JSON.parse(signInResponse.body);
    await page.goto(signInData.url, { waitUntil: "commit", timeout: 60_000 });
    await page.waitForURL(/hive\.org/, { timeout: 60_000 });
}

setup("authenticate", async ({ page }) => {
    const baseURL = setup.info().project.use.baseURL as string;

    await page.goto("/login", { waitUntil: "commit" });
    await startHiveSso(page, baseURL);

    const usernameField = page
        .locator(
            "input[name='username'], input[name='login'], input[type='text']",
        )
        .first();
    const passwordField = page
        .locator("input[name='password'], input[type='password']")
        .first();

    await usernameField.waitFor({ state: "visible", timeout: 30_000 });
    await usernameField.fill(HIVE_ADMIN_USERNAME);
    await passwordField.fill(HIVE_ADMIN_PASSWORD);

    await page
        .locator("button[type='submit'], input[type='submit']")
        .first()
        .click();

    try {
        const authorizeButton = page.locator(
            "button:has-text('Authorize'), button:has-text('Allow'), input[type='submit'][value='Authorize']",
        );
        await authorizeButton.waitFor({ state: "visible", timeout: 5_000 });
        await authorizeButton.click();
    } catch {
        // No authorization screen — continue
    }

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 30_000,
    });
    await expect(page.getByPlaceholder("Filters...")).toBeVisible({
        timeout: 30_000,
    });

    await page.context().storageState({ path: AUTH_FILE });
});
