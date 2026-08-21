import { describe, expect, it } from "vitest";

import { decodeVncClientPassword } from "@/shared-api/vnc-credentials";

/*
 * Regression coverage for #30. The auth provider used to call
 * atob(cookies["vncClientPassword"]) unguarded inside a `try { ... } catch {}`.
 * Two things went wrong together: the cookie is absent for any session without
 * VNC credentials, so atob decoded the literal string "undefined" and threw —
 * and the empty catch discarded the error, leaving VNC unauthenticated with
 * nothing logged to explain it.
 *
 * These assert the decode contract the provider now depends on: never throw,
 * and report undecodable input as null so the caller can say something.
 */
describe("decodeVncClientPassword", () => {
    it("decodes a well-formed base64 password", () => {
        expect(decodeVncClientPassword(btoa("hunter2"))).toBe("hunter2");
    });

    it("returns null instead of throwing on malformed base64", () => {
        // "!!!" is not a valid base64 alphabet; atob throws on it directly.
        expect(() => decodeVncClientPassword("!!!")).not.toThrow();
        expect(decodeVncClientPassword("!!!")).toBeNull();
    });

    // The exact shape of the original bug: the missing cookie reaches the
    // decoder as the string "undefined", which is not valid base64.
    it("returns null for the string a missing cookie used to produce", () => {
        expect(() => decodeVncClientPassword("undefined")).not.toThrow();
        expect(decodeVncClientPassword("undefined")).toBeNull();
    });

    it("decodes an empty string to an empty string", () => {
        expect(decodeVncClientPassword("")).toBe("");
    });
});
