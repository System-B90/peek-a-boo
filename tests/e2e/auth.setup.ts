import path from "node:path";

import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = path.join(__dirname, "..", ".auth", "user.json");

const HIVE_ADMIN_USERNAME = "admin";
const HIVE_ADMIN_PASSWORD = "Password1";

setup("authenticate", async ({ page }) => {
    await page.goto("/login", { waitUntil: "commit" });

    await page.locator("#username").fill(HIVE_ADMIN_USERNAME);
    await page.locator("#password").fill(HIVE_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 30_000,
    });
    await expect(page.getByPlaceholder("Filters...")).toBeVisible({
        timeout: 30_000,
    });

    await page.context().storageState({ path: AUTH_FILE });
});
