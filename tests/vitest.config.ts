import path from "path";

import { defineSharedVitestConfig } from "@system-b90/test-kit/vitest";

export default defineSharedVitestConfig({
    include: [ "tests/backend/**/*.test.ts" ],
    alias: {
        "@": path.resolve(__dirname, "../src"),
    },
    test: {
        // Mock fallbacks so `npm run test:unit` runs without a configured
        // environment (settings/auth modules throw at import if these are unset).
        env: {
            SYM_ENC_KEY:
                process.env.SYM_ENC_KEY ??
                Buffer.alloc(32, 1).toString("base64"),
        },
    },
});
