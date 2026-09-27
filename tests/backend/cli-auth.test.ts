import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as loginRedirect } from "@/app/api/cli-auth/login/route";
import { POST } from "@/app/api/cli-auth/redeem/route";
import {
    allowRedeemAttempt,
    CLI_HANDOFF_TTL_SECONDS,
    createHandoffCode,
    redeemHandoffCode,
    resetCliHandoffState,
} from "@/server-api/cli-handoff";

// `common.tsx` pulls in next-auth at import time, which throws without
// NEXTAUTH_SECRET. The routes only need its response helpers here.
vi.mock("@/server-api/next-auth", () => ({ authOptions: {} }));

// friendlyRedirectToLogin reads forwarded headers from the request store.
vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: () => null })),
}));

function redeemRequest(body: unknown, ip = "10.0.0.1") {
    return new Request("https://peekaboo.test/api/cli-auth/redeem", {
        body: typeof body === "string" ? body : JSON.stringify(body),
        headers: { "x-forwarded-for": ip },
        method: "POST",
    }) as Parameters<typeof POST>[0];
}

async function envelope(response: Response) {
    return (await response.json()) as {
        data?: { token: string };
        error?: { message?: string };
        status: number;
    };
}

describe("cli handoff codes", () => {
    beforeEach(() => resetCliHandoffState());
    afterEach(() => vi.useRealTimers());

    it("redeems a code for the token it was minted for", () => {
        const code = createHandoffCode("session-token");

        expect(code).not.toContain("session-token");
        expect(redeemHandoffCode(code)).toBe("session-token");
    });

    it("is single-use", () => {
        const code = createHandoffCode("session-token");
        redeemHandoffCode(code);

        expect(() => redeemHandoffCode(code)).toThrow(/already-used/);
    });

    it("mints a distinct code every time", () => {
        expect(createHandoffCode("a")).not.toBe(createHandoffCode("a"));
    });

    it("refuses an expired code", () => {
        vi.useFakeTimers();
        const code = createHandoffCode("session-token");
        vi.advanceTimersByTime((CLI_HANDOFF_TTL_SECONDS + 1) * 1000);

        expect(() => redeemHandoffCode(code)).toThrow(/expired/);
    });

    it("rate-limits redeem attempts per caller", () => {
        for (let i = 0; i < 20; i++) {
            expect(allowRedeemAttempt("1.2.3.4")).toBe(true);
        }
        expect(allowRedeemAttempt("1.2.3.4")).toBe(false);
        expect(allowRedeemAttempt("5.6.7.8")).toBe(true);
    });
});

describe("POST /api/cli-auth/redeem", () => {
    beforeEach(() => resetCliHandoffState());

    it("answers the token in the response envelope", async () => {
        const code = createHandoffCode("session-token");

        const body = await envelope(await POST(redeemRequest({ code })));

        expect(body).toEqual({ data: { token: "session-token" }, status: 0 });
    });

    it("rejects an unknown code", async () => {
        const body = await envelope(
            await POST(redeemRequest({ code: "nope" })),
        );

        expect(body.status).toBe(-1);
    });

    it("rejects a body without a code", async () => {
        expect((await envelope(await POST(redeemRequest({})))).status).toBe(-1);
        expect(
            (await envelope(await POST(redeemRequest("not json")))).status,
        ).toBe(-1);
    });

    it("stops answering after too many attempts", async () => {
        const code = createHandoffCode("session-token");
        for (let i = 0; i < 20; i++) {
            await POST(redeemRequest({ code: `guess-${i}` }, "9.9.9.9"));
        }

        const body = await envelope(
            await POST(redeemRequest({ code }, "9.9.9.9")),
        );

        expect(body.status).toBe(-1);
        // The real code survives the refused attempt.
        expect(redeemHandoffCode(code)).toBe("session-token");
    });
});

describe("GET /api/cli-auth/login", () => {
    function loginRequest(next: string) {
        const url = new URL("https://peekaboo.test/api/cli-auth/login");
        url.searchParams.set("next", next);
        return { nextUrl: url, url: url.toString() } as unknown as Parameters<
            typeof loginRedirect
        >[0];
    }

    it("sends the visitor to log in and back to the CLI page", async () => {
        const response = await loginRedirect(
            loginRequest("/cli-auth?port=52400&code=ABCD-EFGH"),
        );

        expect(new URL(response.headers.get("location")!).pathname).toBe(
            "/login",
        );
        expect(response.cookies.get("postLoginRedirect")?.value).toBe(
            "/cli-auth?port=52400&code=ABCD-EFGH",
        );
    });

    it("never redirects anywhere but the CLI page", async () => {
        const response = await loginRedirect(
            loginRequest("https://evil.test/"),
        );

        expect(response.cookies.get("postLoginRedirect")?.value).toBe(
            "/cli-auth",
        );
    });
});
