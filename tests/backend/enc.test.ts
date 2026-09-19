import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `_encryptionKey` is module-scope state, so each case re-imports to get a
 * fresh cache.
 *
 * Note: `getSymetricalEncyptionKey` currently has **no caller anywhere in
 * `src/`** (see peek-a-boo#59). These tests pin its contract so the decision
 * to keep or delete it is a deliberate one rather than a silent rot.
 */
async function freshEnc() {
    vi.resetModules();
    return await import("@/server-api/enc");
}

const VALID_KEY = Buffer.alloc(32, 1).toString("base64");
const original = process.env.SYM_ENC_KEY;

beforeEach(() => {
    process.env.SYM_ENC_KEY = VALID_KEY;
});

afterEach(() => {
    if (original === undefined) delete process.env.SYM_ENC_KEY;
    else process.env.SYM_ENC_KEY = original;
    vi.resetModules();
});

describe("getSymetricalEncyptionKey", () => {
    it("imports an AES-GCM key usable for encrypt and decrypt", async () => {
        const { getSymetricalEncyptionKey } = await freshEnc();

        const key = await getSymetricalEncyptionKey();

        expect(key.type).toBe("secret");
        expect(key.algorithm).toMatchObject({ name: "AES-GCM" });
        expect(key.usages.sort()).toEqual([ "decrypt", "encrypt" ]);
    });

    it("throws when SYM_ENC_KEY is unset", async () => {
        delete process.env.SYM_ENC_KEY;
        const { getSymetricalEncyptionKey } = await freshEnc();

        await expect(getSymetricalEncyptionKey()).rejects.toThrow(
            /SYM_ENC_KEY environment variable has not been set/,
        );
    });

    it("throws on an empty SYM_ENC_KEY", async () => {
        process.env.SYM_ENC_KEY = "";
        const { getSymetricalEncyptionKey } = await freshEnc();

        await expect(getSymetricalEncyptionKey()).rejects.toThrow(
            /SYM_ENC_KEY/,
        );
    });

    it("caches the imported key across calls", async () => {
        const { getSymetricalEncyptionKey } = await freshEnc();

        const first = await getSymetricalEncyptionKey();
        const second = await getSymetricalEncyptionKey();

        // Same CryptoKey object: importKey is not re-run per request.
        expect(second).toBe(first);
    });

    it("keeps the cached key even after the env var changes", async () => {
        const { getSymetricalEncyptionKey } = await freshEnc();
        const first = await getSymetricalEncyptionKey();

        process.env.SYM_ENC_KEY = Buffer.alloc(32, 9).toString("base64");

        expect(await getSymetricalEncyptionKey()).toBe(first);
    });

    it("rejects a key of the wrong length", async () => {
        // AES-GCM 256 needs exactly 32 bytes; a short key is a configuration
        // error worth failing loudly on rather than silently truncating.
        process.env.SYM_ENC_KEY = Buffer.alloc(8, 1).toString("base64");
        const { getSymetricalEncyptionKey } = await freshEnc();

        await expect(getSymetricalEncyptionKey()).rejects.toThrow();
    });

    it("round-trips a payload with the imported key", async () => {
        const { getSymetricalEncyptionKey } = await freshEnc();
        const key = await getSymetricalEncyptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const plaintext = new TextEncoder().encode("vnc-password");

        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            plaintext,
        );
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext,
        );

        expect(new TextDecoder().decode(decrypted)).toBe("vnc-password");
    });
});
