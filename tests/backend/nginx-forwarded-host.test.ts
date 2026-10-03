import { readFileSync } from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

// Regression: nginx forwarded no X-Forwarded-Host, so /api/logout built its
// redirect from `Host: $host`, which has no port, and a deployment on :8443
// was sent to :443 (connection refused).
describe("nginx app proxy headers", () => {
    const template = readFileSync(
        path.join(process.cwd(), "nginx", "nginx.conf.template"),
        "utf8",
    );
    const app = template.slice(template.indexOf("location / {"));

    it("forwards the host with its port", () => {
        expect(app).toMatch(/proxy_set_header X-Forwarded-Host \$http_host;/);
    });

    it("forwards the scheme", () => {
        expect(app).toMatch(/proxy_set_header X-Forwarded-Proto \$scheme;/);
    });
});
