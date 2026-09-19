import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    authenticateHiveUser,
    getHiveApiTokenByCreds,
    getHiveClasses,
    performHiveApiRequest,
} from "@/server-api/hive";
import { getSetting } from "@/server-api/settings";
import { HiveConnectionError, HiveError } from "@/shared-api/errors";

vi.mock("@/server-api/settings", () => ({ getSetting: vi.fn() }));

const SETTINGS: Record<string, string> = {
    HIVE_HOSTNAME: "hive.test",
    HIVE_API_USERNAME: "api",
    HIVE_API_PASSWORD: "api-pw",
};

type Reply = { body?: unknown; contentType?: string; blob?: Blob };

/** Replaces global fetch and records the calls. */
function stubFetch(responder: (url: string, index: number) => Error | Reply) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string, init?: RequestInit) => {
            const reply = responder(String(url), calls.length);
            calls.push({ url: String(url), init });
            if (reply instanceof Error) throw reply;
            const contentType = reply.contentType ?? "application/json";
            if (reply.blob) {
                return new Response(reply.blob, {
                    headers: { "Content-Type": contentType },
                });
            }
            return new Response(JSON.stringify(reply.body ?? {}), {
                headers: { "Content-Type": contentType },
            });
        }),
    );
    return calls;
}

/** A fetch rejection shaped like undici's, with the system error as `cause`. */
const fetchFailure = (cause: Record<string, unknown>) =>
    new TypeError("fetch failed", { cause });

beforeEach(() => {
    vi.mocked(getSetting).mockImplementation(async (key: string) => SETTINGS[key] ?? "");
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("getHiveApiTokenByCreds", () => {
    it("POSTs the credentials as JSON to Hive's token endpoint", async () => {
        const calls = stubFetch(() => ({
            body: { access: "acc", refresh: "ref" },
        }));

        const tokens = await getHiveApiTokenByCreds("svc", "secret");

        expect(tokens).toEqual({ access: "acc", refresh: "ref" });
        expect(calls[0].url).toBe("https://hive.test/api/core/token/");
        expect(calls[0].init?.method).toBe("POST");
        expect(JSON.parse(calls[0].init?.body as string)).toEqual({
            username: "svc",
            password: "secret",
        });
    });

    it("builds the URL from the HIVE_HOSTNAME setting", async () => {
        vi.mocked(getSetting).mockImplementation(async (key: string) =>
            key === "HIVE_HOSTNAME" ? "other.hive" : "",
        );
        const calls = stubFetch(() => ({ body: {} }));

        await getHiveApiTokenByCreds("svc", "secret");

        expect(calls[0].url).toBe("https://other.hive/api/core/token/");
    });
});

describe("network-error classification", () => {
    it("maps a DNS failure to an actionable HiveConnectionError", async () => {
        stubFetch(() =>
            fetchFailure({
                code: "ENOTFOUND",
                syscall: "getaddrinfo",
                hostname: "hive.nowhere",
            }),
        );

        await expect(getHiveApiTokenByCreds("svc", "pw")).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof HiveConnectionError &&
                error.message.includes('hive.nowhere'),
        );
    });

    it("maps a TCP reset to a HiveConnectionError naming host and port", async () => {
        stubFetch(() =>
            fetchFailure({ code: "ECONNRESET", host: "hive.test", port: 443 }),
        );

        await expect(getHiveApiTokenByCreds("svc", "pw")).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof HiveConnectionError &&
                error.message.includes("hive.test:443"),
        );
    });

    it("maps a connect timeout to a HiveConnectionError", async () => {
        stubFetch(() =>
            fetchFailure({
                code: "CONNECT_TIMEOUT",
                address: "10.0.0.5",
                port: 443,
            }),
        );

        await expect(getHiveApiTokenByCreds("svc", "pw")).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof HiveConnectionError &&
                error.message.includes("10.0.0.5"),
        );
    });

    it("passes an unrecognised failure through unchanged", async () => {
        // Only connection-level failures are reclassified; anything else must
        // reach the caller intact rather than being flattened into a
        // misleading "Hive is down" message.
        const original = new Error("something else entirely");
        stubFetch(() => original);

        await expect(getHiveApiTokenByCreds("svc", "pw")).rejects.toBe(original);
    });
});

describe("performHiveApiRequest content-type branching", () => {
    it("parses a JSON response", async () => {
        stubFetch(() => ({ body: { id: 7 } }));

        expect(
            await performHiveApiRequest({ endpoint: "/api/core/thing" }),
        ).toEqual({ id: 7 });
    });

    it("returns a blob for an image response", async () => {
        stubFetch((url) =>
            url.includes("/token/")
                ? { body: { access: "acc", refresh: "ref" } }
                : { blob: new Blob([ "png-bytes" ]), contentType: "image/png" },
        );

        const result = await performHiveApiRequest({ endpoint: "/avatar" });

        expect(result).toBeInstanceOf(Blob);
    });

    it("returns undefined for any other content type", async () => {
        // Silent undefined rather than a throw -- callers such as
        // getHiveClasses are written to treat it as "no data".
        stubFetch((url) =>
            url.includes("/token/")
                ? { body: { access: "acc", refresh: "ref" } }
                : { body: "plain", contentType: "text/html" },
        );

        expect(
            await performHiveApiRequest({ endpoint: "/whatever" }),
        ).toBeUndefined();
    });

    it("sends a bearer token and appends a trailing slash to the endpoint", async () => {
        const calls = stubFetch((url) =>
            url.includes("/token/")
                ? { body: { access: "acc", refresh: "ref" } }
                : { body: {} },
        );

        await performHiveApiRequest({ endpoint: "/api/core/thing" });

        const apiCall = calls.find((c) => c.url.includes("/api/core/thing"));
        expect(apiCall?.url).toBe("https://hive.test/api/core/thing/");
        const headers = new Headers(apiCall?.init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer acc");
    });

    it("uses supplied tokens instead of fetching a service token", async () => {
        const calls = stubFetch(() => ({ body: {} }));

        await performHiveApiRequest({
            endpoint: "/api/core/thing",
            tokens: { access: "given", refresh: "given-refresh" },
        });

        expect(calls).toHaveLength(1);
        expect(new Headers(calls[0].init?.headers).get("Authorization")).toBe(
            "Bearer given",
        );
    });

    it("honours a caller-supplied Accept header", async () => {
        const calls = stubFetch(() => ({ body: {} }));

        await performHiveApiRequest({
            endpoint: "/avatar",
            accept: "image/png",
            tokens: { access: "a", refresh: "r" },
        });

        expect(new Headers(calls[0].init?.headers).get("Accept")).toBe("image/png");
    });
});

describe("getHiveClasses defensive returns", () => {
    const classesReply = (body: unknown) => (url: string) =>
        url.includes("/token/")
            ? { body: { access: "acc", refresh: "ref" } }
            : { body };

    it("returns the array when Hive sends one", async () => {
        stubFetch(classesReply([ { id: 1 }, { id: 2 } ]));

        expect(await getHiveClasses()).toHaveLength(2);
    });

    it("returns [] for a non-array payload", async () => {
        // A Hive error body is an object, not a list; the grid must render
        // empty rather than crash on .map.
        stubFetch(classesReply({ detail: "Not found" }));

        expect(await getHiveClasses()).toEqual([]);
    });

    it("returns [] for a null payload", async () => {
        stubFetch(classesReply(null));

        expect(await getHiveClasses()).toEqual([]);
    });

    it("returns [] when the response is not JSON at all", async () => {
        stubFetch((url) =>
            url.includes("/token/")
                ? { body: { access: "acc", refresh: "ref" } }
                : { body: "<html>", contentType: "text/html" },
        );

        expect(await getHiveClasses()).toEqual([]);
    });
});

describe("authenticateHiveUser", () => {
    const withTokens = (tokens: unknown, me?: unknown) => (url: string) =>
        url.includes("/token/") ? { body: tokens } : { body: me ?? {} };

    it("returns the display name and clearance for valid credentials", async () => {
        stubFetch(
            withTokens(
                { access: "acc", refresh: "ref" },
                { display_name: "Dana C.", clearance: 3 },
            ),
        );

        expect(await authenticateHiveUser("dana", "pw")).toEqual({
            username: "dana",
            displayName: "Dana C.",
            clearance: 3,
        });
    });

    it("falls back to the username when Hive sends no display name", async () => {
        stubFetch(
            withTokens({ access: "acc", refresh: "ref" }, { clearance: 3 }),
        );

        expect((await authenticateHiveUser("dana", "pw")).displayName).toBe("dana");
    });

    it("throws HiveError when the access token is missing", async () => {
        // Hive answers 200 with an error body on bad credentials, so the
        // absent token is the only signal that login failed.
        stubFetch(withTokens({ refresh: "ref" }));

        await expect(authenticateHiveUser("dana", "wrong")).rejects.toBeInstanceOf(
            HiveError,
        );
    });

    it("throws HiveError when the refresh token is missing", async () => {
        stubFetch(withTokens({ access: "acc" }));

        await expect(authenticateHiveUser("dana", "wrong")).rejects.toBeInstanceOf(
            HiveError,
        );
    });

    it("surfaces a connection failure as HiveConnectionError", async () => {
        stubFetch(() =>
            fetchFailure({
                code: "ENOTFOUND",
                syscall: "getaddrinfo",
                hostname: "hive.nowhere",
            }),
        );

        await expect(
            authenticateHiveUser("dana", "pw"),
        ).rejects.toBeInstanceOf(HiveConnectionError);
    });
});
