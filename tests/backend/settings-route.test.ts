import { beforeEach, describe, expect, it, vi } from "vitest";

import { assertUserLoggedIn } from "@/app/api/common";
import { GET as GET_DEFAULTS } from "@/app/api/settings/default/route";
import { GET, POST } from "@/app/api/settings/route";
import {
    getDefaultSettings,
    getSettings,
    saveSettings,
} from "@/server-api/settings";
import { UserNotLoggedInError } from "@/shared-api/errors";

vi.mock("@/server-api/next-auth", () => ({ authOptions: {} }));
vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: () => null })),
}));
vi.mock("@/app/api/common", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/app/api/common")>();
    return { ...actual, assertUserLoggedIn: vi.fn() };
});
vi.mock("@/server-api/settings", () => ({
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    getDefaultSettings: vi.fn(),
}));

const CURRENT = { HIVE_HOSTNAME: "hive.org", MATTERMOST_URL: "https://mm" };

function request(body?: unknown) {
    return {
        url: "https://peekaboo.test/api/settings",
        json: async () => body,
    } as unknown as Parameters<typeof GET>[0];
}

async function envelope(response: Response) {
    return (await response.json()) as { status: number; data?: unknown };
}

describe("/api/settings", () => {
    beforeEach(() => {
        vi.mocked(assertUserLoggedIn)
            .mockReset()
            .mockResolvedValue({} as never);
        vi.mocked(getSettings)
            .mockReset()
            .mockResolvedValue({ ...CURRENT } as never);
        vi.mocked(saveSettings)
            .mockReset()
            .mockResolvedValue(undefined as never);
        vi.mocked(getDefaultSettings)
            .mockReset()
            .mockResolvedValue({ HIVE_HOSTNAME: "d" } as never);
    });

    it("GET returns the merged settings", async () => {
        const body = await envelope(await GET(request()));
        expect(body).toMatchObject({ status: 0, data: CURRENT });
    });

    it("POST merges the body over the current settings", async () => {
        const body = await envelope(
            await POST(request({ MATTERMOST_URL: "https://new" })),
        );
        expect(body.status).toBe(0);
        expect(saveSettings).toHaveBeenCalledWith({
            HIVE_HOSTNAME: "hive.org",
            MATTERMOST_URL: "https://new",
        });
    });

    it("GET /default returns the defaults", async () => {
        const body = await envelope(await GET_DEFAULTS(request()));
        expect(body).toMatchObject({ status: 0, data: { HIVE_HOSTNAME: "d" } });
    });

    it.each([
        ["GET", () => GET(request())],
        ["POST", () => POST(request({ HIVE_HOSTNAME: "evil" }))],
        ["GET /default", () => GET_DEFAULTS(request())],
    ])("%s requires a session", async (_name, call) => {
        vi.mocked(assertUserLoggedIn).mockRejectedValue(
            new UserNotLoggedInError("nope"),
        );
        await call();
        expect(getSettings).not.toHaveBeenCalled();
        expect(saveSettings).not.toHaveBeenCalled();
        expect(getDefaultSettings).not.toHaveBeenCalled();
    });
});
