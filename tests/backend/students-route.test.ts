import { describe, expect, it, vi, beforeEach } from "vitest";

import { assertUserLoggedIn } from "@/app/api/common";
import { GET } from "@/app/api/students/[[...slug]]/route";
import { queryPostgres } from "@/server-api/postgres";
import { UserNotLoggedInError } from "@/shared-api/errors";

// `common.tsx` pulls in next-auth at import time, which throws without
// NEXTAUTH_SECRET. The route only needs its response helpers here.
vi.mock("@/server-api/next-auth", () => ({ authOptions: {} }));

// The not-logged-in branch of `catchHandler` reads request headers, which
// requires a Next request store that does not exist outside a server render.
vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: () => null })),
}));

vi.mock("@/app/api/common", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/app/api/common")>();
    return { ...actual, assertUserLoggedIn: vi.fn() };
});

vi.mock("@/server-api/postgres", () => ({
    queryPostgres: vi.fn(),
}));

// `catchHandler`'s redirect path parses `request.url`, so it must be a real one.
const request = {
    url: "https://peekaboo.test/api/students",
} as Parameters<typeof GET>[0];

/**
 * The API always answers HTTP 200 and signals failure in the body envelope
 * (`status: 0` success, `status: -1` error), so assertions read the body.
 */
async function envelope(response: Response) {
    return (await response.json()) as { status: number; error?: unknown };
}

/** The route reads `params` as a promise, matching the Next 15 signature. */
function params(slug?: Array<string>) {
    return { params: Promise.resolve({ slug }) };
}

describe("GET /api/students", () => {
    beforeEach(() => {
        vi.mocked(assertUserLoggedIn).mockReset().mockResolvedValue({} as never);
        vi.mocked(queryPostgres).mockReset().mockResolvedValue([]);
    });

    it("requires a session", async () => {
        vi.mocked(assertUserLoggedIn).mockRejectedValue(
            new UserNotLoggedInError("nope"),
        );

        await GET(request, params());

        // The roster must not be read at all for an unauthenticated caller;
        // where the response redirects to is `catchHandler`'s concern.
        expect(queryPostgres).not.toHaveBeenCalled();
    });

    it("queries every student when no slug is given", async () => {
        await GET(request, params());
        expect(queryPostgres).toHaveBeenCalledWith();
    });

    it("queries every student when the slug array is empty", async () => {
        await GET(request, params([]));
        expect(queryPostgres).toHaveBeenCalledWith();
    });

    it("filters by username when a slug is given", async () => {
        await GET(request, params(["alice"]));
        expect(queryPostgres).toHaveBeenCalledWith("alice");
    });

    it("rejects an empty-string slug rather than querying", async () => {
        const response = await GET(request, params([""]));

        expect((await envelope(response)).status).toBe(-1);
        expect(queryPostgres).not.toHaveBeenCalled();
    });
});
