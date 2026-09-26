import { describe, expect, it } from "vitest";

import { getAuthenticationErrorMessage } from "@/shared-api/auth-error";

describe("getAuthenticationErrorMessage", () => {
    it("returns null when there is no error", () => {
        expect(getAuthenticationErrorMessage(null)).toBeNull();
    });

    it("explains Hive being unreachable on OAuth failures", () => {
        const message = getAuthenticationErrorMessage("OAuthCallback");
        expect(message).toBe(getAuthenticationErrorMessage("OAuthSignin"));
        expect(message).toContain("הייב");
    });

    it("distinguishes timeout and network errors", () => {
        const timeout = getAuthenticationErrorMessage("Timeout");
        const network = getAuthenticationErrorMessage("NetworkError");
        expect(timeout).not.toBe(network);
        expect(timeout).not.toBe(getAuthenticationErrorMessage("Unknown"));
    });

    it("falls back to a generic message for unknown codes", () => {
        expect(getAuthenticationErrorMessage("Weird")).toBeTruthy();
    });
});
