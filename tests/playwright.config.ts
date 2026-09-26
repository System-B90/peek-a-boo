import path from "node:path";

import { devices } from "@playwright/test";
import { definePlaywrightConfig } from "@system-b90/test-kit/playwright";

export default definePlaywrightConfig({
    testDir: "./e2e",
    timeout: 30_000,
    fullyParallel: false,
    workers: 1,
    use: {
        baseURL: process.env.BASE_URL ?? "https://peekaboo.dev",
        screenshot: "only-on-failure",
        video: "on-first-retry",
        trace: "on-first-retry",
        // CI serves the stack as peekaboo.test without a hosts-file entry;
        // pin the name in Chromium instead (see .github/workflows/e2e.yml).
        launchOptions: process.env.HOST_RESOLVER_RULES
            ? { args: [`--host-resolver-rules=${process.env.HOST_RESOLVER_RULES}`] }
            : {},
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
