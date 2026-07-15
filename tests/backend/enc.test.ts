import { afterEach, describe, expect, it, vi } from "vitest";

import { getJwtSecret } from "@/server-api/enc";

describe("getJwtSecret", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("returns the configured JWT secret", () => {
        vi.stubEnv("JWT_SECRET", "super-secret-value");
        expect(getJwtSecret()).toBe("super-secret-value");
    });

    it("throws when JWT_SECRET is not set", () => {
        vi.stubEnv("JWT_SECRET", "");
        expect(() => getJwtSecret()).toThrow(
            "JWT_SECRET environment variable has not been set!",
        );
    });
});
