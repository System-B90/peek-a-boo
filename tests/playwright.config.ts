import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    testMatch: "**/*.spec.ts",
    timeout: 30_000,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1,
    reporter: process.env.CI ? [["html"], ["github"]] : [["html"], ["list"]],
    use: {
        baseURL: process.env.BASE_URL ?? "https://peekaboo.dev",
        ignoreHTTPSErrors: true,
        screenshot: "only-on-failure",
        video: "on-first-retry",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "login",
            testMatch: /login\.spec\.ts/,
            use: {
                ...devices["Desktop Chrome"],
                storageState: { cookies: [], origins: [] },
            },
        },
        {
            name: "setup",
            testMatch: /auth\.setup\.ts/,
            timeout: 120_000,
        },
        {
            name: "chromium",
            testIgnore: [/login\.spec\.ts/, /auth\.setup\.ts/],
            use: {
                ...devices["Desktop Chrome"],
                // Resolved against the config's directory rather than
                // process.cwd() so `npx playwright test` works from any cwd.
                storageState: path.join(__dirname, ".auth", "user.json"),
            },
            dependencies: ["setup"],
        },
    ],
});
