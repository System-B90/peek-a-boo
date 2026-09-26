import { describe, expect, it } from "vitest";

import { shouldSyncQueryParams } from "@/components/query-params-provider";

describe("shouldSyncQueryParams", () => {
    it("leaves /login alone so NextAuth's ?error= survives", () => {
        expect(shouldSyncQueryParams("/login")).toBe(false);
    });

    it("syncs on app pages", () => {
        expect(shouldSyncQueryParams("/")).toBe(true);
        expect(shouldSyncQueryParams("/vnc/abc")).toBe(true);
    });
});
