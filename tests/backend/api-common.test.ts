import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    ApiError,
    ApiErrorMaker,
    ApiSuccess,
    assertUserLoggedIn,
    catchHandler,
    getUserData,
} from "@/app/api/common";
import { ClientApiError, UserNotLoggedInError } from "@/shared-api/errors";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/server-api/next-auth", () => ({ authOptions: {} }));

function mockHeaders(values: Record<string, string>) {
    vi.mocked(headers).mockResolvedValue({
        get: (name: string) => values[name] ?? null,
    } as unknown as Awaited<ReturnType<typeof headers>>);
}

const SESSION = {
    user: { id: "7", name: "Dana", username: "dana" },
    accessToken: "token",
    refreshToken: "refresh",
};

/**
 * `common.tsx` reads ALLOW_LOGIN_BYPASS at module scope, so the bypass branch
 * can only be reached by re-importing with the env var already set.
 */
async function importWithBypass(value: string | undefined) {
    vi.resetModules();
    if (value === undefined) delete process.env.ALLOW_LOGIN_BYPASS;
    else process.env.ALLOW_LOGIN_BYPASS = value;
    return await import("@/app/api/common");
}

const originalBypass = process.env.ALLOW_LOGIN_BYPASS;

beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    mockHeaders({});
});

afterEach(() => {
    if (originalBypass === undefined) delete process.env.ALLOW_LOGIN_BYPASS;
    else process.env.ALLOW_LOGIN_BYPASS = originalBypass;
    vi.resetModules();
});

describe("getUserData", () => {
    it("returns the session for a logged-in user", async () => {
        vi.mocked(getServerSession).mockResolvedValue(SESSION as never);

        expect(await getUserData()).toEqual(SESSION);
    });

    it("throws UserNotLoggedInError when there is no session", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null as never);

        await expect(getUserData()).rejects.toBeInstanceOf(UserNotLoggedInError);
    });

    it("throws when the session carries TokenExpiredError", async () => {
        // An expired token is as good as no session: every downstream Hive
        // call would 401, so the user is sent back through login instead.
        vi.mocked(getServerSession).mockResolvedValue({
            ...SESSION,
            error: "TokenExpiredError",
        } as never);

        await expect(getUserData()).rejects.toBeInstanceOf(UserNotLoggedInError);
    });

    it("does not treat an unrelated error flag as logged out", async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            ...SESSION,
            error: "SomethingElse",
        } as never);

        await expect(getUserData()).resolves.toMatchObject({ accessToken: "token" });
    });

    it("returns a stub session without consulting next-auth when bypass is on", async () => {
        const common = await importWithBypass("true");

        const session = await common.getUserData();

        expect(session.user.username).toBe("dev");
        expect(getServerSession).not.toHaveBeenCalled();
    });

    it("requires the bypass flag to be exactly \"true\"", async () => {
        // A real security bypass: anything looser (truthy strings, "1", "TRUE")
        // would make it far too easy to enable by accident.
        for (const value of [ "1", "TRUE", "yes", "" ]) {
            const common = await importWithBypass(value);
            vi.mocked(getServerSession).mockResolvedValue(null as never);

            await expect(common.getUserData()).rejects.toBeInstanceOf(
                UserNotLoggedInError,
            );
        }
    });
});

describe("assertUserLoggedIn", () => {
    it("returns the session when logged in", async () => {
        vi.mocked(getServerSession).mockResolvedValue(SESSION as never);

        expect(await assertUserLoggedIn()).toEqual(SESSION);
    });

    it("propagates the logged-out throw", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null as never);

        await expect(assertUserLoggedIn()).rejects.toBeInstanceOf(
            UserNotLoggedInError,
        );
    });
});

describe("response envelopes", () => {
    it("wraps success data as { status: 0, data }", async () => {
        const response = ApiSuccess({ students: [ 1, 2 ] });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            status: 0,
            data: { students: [ 1, 2 ] },
        });
    });

    it("wraps undefined data without dropping the envelope", async () => {
        expect(await ApiSuccess().json()).toEqual({ status: 0 });
    });

    it("returns HTTP 200 with { status: -1 } for errors", async () => {
        // Load-bearing: safeApiFetcher branches on the body's `status`, not on
        // the HTTP status. Returning a 4xx/5xx here would make every error
        // surface as a transport failure instead of a handled one.
        const response = ApiError({ message: "nope" });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            status: -1,
            error: { message: "nope" },
        });
    });

    it("merges caller-supplied headers into the success response", async () => {
        const response = ApiSuccess({ ok: true }, undefined, {
            headers: { "X-Custom": "yes" },
        });

        expect(response.headers.get("X-Custom")).toBe("yes");
    });
});

describe("catchHandler", () => {
    const request = { url: "https://peekaboo.dev/api/students" } as never;

    it("redirects to /login on UserNotLoggedInError", async () => {
        mockHeaders({
            Referer: "https://peekaboo.dev/dashboard?tab=grid",
            "X-Forwarded-Host": "peekaboo.dev",
            "X-Forwarded-Proto": "https",
        });

        const response = await catchHandler(
            request,
            new UserNotLoggedInError("nope"),
        );

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
            "https://peekaboo.dev/login",
        );
    });

    it("stores the Referer pathname as postLoginRedirect", async () => {
        mockHeaders({
            Referer: "https://peekaboo.dev/dashboard?tab=grid",
            "X-Forwarded-Host": "peekaboo.dev",
        });

        const response = await catchHandler(
            request,
            new UserNotLoggedInError("nope"),
        );

        // Only the pathname: the query string is dropped, so a user is
        // returned to the page and not to a stale filter state.
        expect(response.cookies.get("postLoginRedirect")?.value).toBe(
            "/dashboard",
        );
    });

    it("falls back to / when there is no Referer", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });

        const response = await catchHandler(
            request,
            new UserNotLoggedInError("nope"),
        );

        expect(response.cookies.get("postLoginRedirect")?.value).toBe("/");
    });

    it("returns the error envelope for a ClientApiError", async () => {
        const response = await catchHandler(
            request,
            new ClientApiError("bad input"),
        );

        expect(response.status).toBe(200);
        expect((await response.json()).status).toBe(-1);
    });

    it("logs and envelopes a generic Error", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const response = await catchHandler(request, new Error("boom"));

        expect(consoleError).toHaveBeenCalled();
        expect((await response.json()).status).toBe(-1);
        consoleError.mockRestore();
    });

    it("envelopes a non-Error throw without logging", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const response = await catchHandler(request, "a bare string");

        expect(consoleError).not.toHaveBeenCalled();
        expect((await response.json()).status).toBe(-1);
        consoleError.mockRestore();
    });
});

describe("ApiErrorMaker", () => {
    it("serialises a plain object error", async () => {
        expect(await ApiErrorMaker({ code: "E_NOPE" }).json()).toEqual({
            status: -1,
            error: { code: "E_NOPE" },
        });
    });

    it("serialises an Error instance to an empty object", async () => {
        // Characterization: JSON.stringify(new Error("x")) is "{}" -- name and
        // message are non-enumerable. Clients therefore get a bare
        // { status: -1, error: {} } for any raw Error that reaches here, which
        // is why routes are expected to throw ClientApiError subclasses.
        expect(await ApiErrorMaker(new Error("boom")).json()).toEqual({
            status: -1,
            error: {},
        });
    });
});
