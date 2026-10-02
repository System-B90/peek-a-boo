import path from "path";

import { defineSharedVitestConfig } from "@system-b90/test-kit/vitest";

// Integration tests against a real Mattermost started in Docker by
// @system-b90/test-kit/mattermost. Kept out of `test:unit` so that suite
// stays Docker-free.
export default defineSharedVitestConfig({
    include: [ "tests/integration/**/*.test.ts" ],
    alias: {
        "@": path.resolve(__dirname, "../src"),
    },
    test: {
        globalSetup: [ "tests/integration/mattermost-global-setup.ts" ],
        testTimeout: 30_000,
        // First run pulls the images; startup alone is ~15 s warm.
        hookTimeout: 300_000,
        env: {
            SYM_ENC_KEY:
                process.env.SYM_ENC_KEY ??
                Buffer.alloc(32, 1).toString("base64"),
        },
    },
});
