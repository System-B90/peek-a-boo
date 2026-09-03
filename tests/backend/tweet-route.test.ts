import { beforeEach, describe, expect, it, vi } from "vitest";

import { assertUserLoggedIn } from "@/app/api/common";
import { POST } from "@/app/api/tweet/route";
import { sendTweet } from "@/server-api/mattermost";
import { UserNotLoggedInError } from "@/shared-api/errors";

vi.mock("@/server-api/next-auth", () => ({ authOptions: {} }));

vi.mock("next/headers", () => ({
    headers: vi.fn(async () => ({ get: () => null })),
}));

vi.mock("@/app/api/common", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/app/api/common")>();
    return { ...actual, assertUserLoggedIn: vi.fn() };
});

vi.mock("@/server-api/mattermost", () => ({
    sendTweet: vi.fn(),
}));

function makeRequest(body: unknown) {
    return {
        url: "https://peekaboo.test/api/tweet",
        json: async () => body,
    } as Parameters<typeof POST>[0];
}

describe("POST /api/tweet", () => {
    beforeEach(() => {
        vi.mocked(assertUserLoggedIn).mockReset().mockResolvedValue({} as never);
        vi.mocked(sendTweet).mockReset().mockResolvedValue(undefined as never);
    });

    it("refuses to post for an unauthenticated caller", async () => {
        vi.mocked(assertUserLoggedIn).mockRejectedValue(
            new UserNotLoggedInError("nope"),
        );

        await POST(makeRequest({ message: "hello" }));

        // The route posts to Mattermost with the server's own bot token, so an
        // anonymous caller must not reach it at all.
        expect(sendTweet).not.toHaveBeenCalled();
    });

    it("checks the session before reading the body", async () => {
        const order: Array<string> = [];
        vi.mocked(assertUserLoggedIn).mockImplementation(async () => {
            order.push("auth");
            throw new UserNotLoggedInError("nope");
        });
        const request = {
            url: "https://peekaboo.test/api/tweet",
            json: async () => {
                order.push("body");
                return {};
            },
        } as Parameters<typeof POST>[0];

        await POST(request);

        expect(order).toEqual(["auth"]);
    });

    it("forwards message and image once authenticated", async () => {
        await POST(makeRequest({ message: "hello", image: "data:image/png;base64,AAAA" }));

        expect(sendTweet).toHaveBeenCalledWith({
            message: "hello",
            attachment: "data:image/png;base64,AAAA",
        });
    });
});
