import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/class/[[...slug]]/route";
import { assertUserLoggedIn } from "@/app/api/common";
import { getHiveClasses } from "@/server-api/hive";
import { UserNotLoggedInError } from "@/shared-api/errors";

// Same harness as students-route.test.ts: keep next-auth and the request
// store out of a plain vitest run.
vi.mock("@/server-api/next-auth", () => ({ authOptions: {} }));
vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: () => null })),
}));
vi.mock("@/app/api/common", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/app/api/common")>();
    return { ...actual, assertUserLoggedIn: vi.fn() };
});
vi.mock("@/server-api/hive", () => ({ getHiveClasses: vi.fn() }));

const request = { url: "https://peekaboo.test/api/class" } as Parameters<
    typeof GET
>[0];

function params(slug?: Array<string>) {
    return { params: Promise.resolve({ slug }) };
}

async function envelope(response: Response) {
    return (await response.json()) as {
        status: number;
        data?: unknown;
        error?: unknown;
    };
}

describe("GET /api/class", () => {
    beforeEach(() => {
        vi.mocked(assertUserLoggedIn)
            .mockReset()
            .mockResolvedValue({} as never);
        vi.mocked(getHiveClasses)
            .mockReset()
            .mockResolvedValue([{ id: 1, name: "כיתה א" }] as never);
    });

    it("requires a session before reading Hive", async () => {
        vi.mocked(assertUserLoggedIn).mockRejectedValue(
            new UserNotLoggedInError("nope"),
        );
        await GET(request, params());
        expect(getHiveClasses).not.toHaveBeenCalled();
    });

    it("returns the Hive class list", async () => {
        const body = await envelope(await GET(request, params()));
        expect(body.status).toBe(0);
        expect(body.data).toEqual([{ id: 1, name: "כיתה א" }]);
    });

    it("rejects a slug, which is not implemented", async () => {
        const body = await envelope(await GET(request, params(["7"])));
        expect(body.status).toBe(-1);
        expect(getHiveClasses).not.toHaveBeenCalled();
    });

    it("reports a Hive failure in the envelope", async () => {
        vi.mocked(getHiveClasses).mockRejectedValue(new Error("hive down"));
        const body = await envelope(await GET(request, params()));
        expect(body.status).toBe(-1);
    });
});
