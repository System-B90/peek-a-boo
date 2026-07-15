import { describe, expect, it } from "vitest";

import {
    parseNetworkConnectionResetError,
    parseNetworkHostNotFoundError,
    parseNetworkTimeoutError,
} from "@/shared-api/errors";

function dnsNotFoundError(hostname: string) {
    const cause = { code: "ENOTFOUND", syscall: "getaddrinfo", hostname };
    return Object.assign(new Error("getaddrinfo ENOTFOUND"), { cause });
}

describe("parseNetworkHostNotFoundError", () => {
    it("extracts the hostname from a matching DNS failure", () => {
        const result = parseNetworkHostNotFoundError(dnsNotFoundError("hive.org"));
        expect(result).toEqual({
            code: "ENOTFOUND",
            syscall: "getaddrinfo",
            hostname: "hive.org",
        });
    });

    it("returns undefined for a non-Error input", () => {
        expect(parseNetworkHostNotFoundError("not an error")).toBeUndefined();
    });

    it("returns undefined when the error code does not match", () => {
        const error = Object.assign(new Error("boom"), {
            cause: { code: "ECONNREFUSED", syscall: "getaddrinfo", hostname: "hive.org" },
        });
        expect(parseNetworkHostNotFoundError(error)).toBeUndefined();
    });

    it("returns undefined when the syscall does not match", () => {
        const error = Object.assign(new Error("boom"), {
            cause: { code: "ENOTFOUND", syscall: "connect", hostname: "hive.org" },
        });
        expect(parseNetworkHostNotFoundError(error)).toBeUndefined();
    });

    it("returns undefined when hostname is not a string", () => {
        const error = Object.assign(new Error("boom"), {
            cause: { code: "ENOTFOUND", syscall: "getaddrinfo", hostname: 123 },
        });
        expect(parseNetworkHostNotFoundError(error)).toBeUndefined();
    });
});

describe("parseNetworkConnectionResetError", () => {
    it("extracts host/port from a matching ECONNRESET failure", () => {
        const error = Object.assign(new Error("reset"), {
            cause: { code: "ECONNRESET", host: "bluz.dev", port: 443 },
        });
        expect(parseNetworkConnectionResetError(error)).toEqual({
            host: "bluz.dev",
            code: "ECONNRESET",
            port: 443,
        });
    });

    it("returns undefined when there is no cause", () => {
        expect(parseNetworkConnectionResetError(new Error("plain"))).toBeUndefined();
    });

    it("returns undefined when the code does not match", () => {
        const error = Object.assign(new Error("reset"), {
            cause: { code: "ETIMEDOUT", host: "bluz.dev", port: 443 },
        });
        expect(parseNetworkConnectionResetError(error)).toBeUndefined();
    });
});

describe("parseNetworkTimeoutError", () => {
    it("extracts host/port from a matching CONNECT_TIMEOUT failure", () => {
        const error = Object.assign(new Error("timeout"), {
            cause: { code: "CONNECT_TIMEOUT", address: "hive.org", port: 443 },
        });
        expect(parseNetworkTimeoutError(error)).toEqual({
            host: "hive.org",
            code: "CONNECT_TIMEOUT",
            port: 443,
        });
    });

    it("returns undefined when the port is missing", () => {
        const error = Object.assign(new Error("timeout"), {
            cause: { code: "CONNECT_TIMEOUT", address: "hive.org" },
        });
        expect(parseNetworkTimeoutError(error)).toBeUndefined();
    });
});
