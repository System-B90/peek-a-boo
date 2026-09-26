import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
    it("answers 200 {status: ok} without a session", async () => {
        const response = await GET();
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: "ok" });
        expect(response.headers.get("Cache-Control")).toBe("no-store");
    });
});
