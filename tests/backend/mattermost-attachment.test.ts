import { afterEach, describe, expect, it, vi } from "vitest";

import { sendTweet } from "@/server-api/mattermost";
import { getSetting } from "@/server-api/settings";
import { MattermostApiError } from "@/shared-api/errors";

vi.mock("@/server-api/settings", () => ({
    getSetting: vi.fn(),
}));

function mockSettings() {
    vi.mocked(getSetting).mockImplementation(
        async (key: string) =>
            ({
                MATTERMOST_ACCESS_TOKEN: "bot-token",
                MATTERMOST_URL: "https://mattermost",
                TWEET_CHANNEL_ID: "channel-id",
            })[key] ?? "",
    );
}

function mockFetch(responses: Array<Response>) {
    const fetchMock = vi.fn(async () => responses.shift() as Response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function jsonResponse(body: unknown) {
    return new Response(JSON.stringify(body), { status: 200 });
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe("sendTweet attachments", () => {
    it("uploads a screen recording as a .webm file before posting", async () => {
        mockSettings();
        const fetchMock = mockFetch([
            jsonResponse({ file_infos: [ { id: "file-id" } ] }),
            jsonResponse({ id: "post-id" }),
        ]);

        await sendTweet({
            message: "look at this",
            attachment: "data:video/webm;codecs=vp9;base64,QUJD",
        });

        const [ uploadUrl, uploadInit ] = fetchMock.mock.calls[0] as unknown as [
            string,
            RequestInit,
        ];
        expect(uploadUrl).toBe("https://mattermost/api/v4/files");
        const form = uploadInit.body as FormData;
        const file = form.get("files") as File;
        expect(file.name).toBe("recording.webm");
        expect(file.type).toBe("video/webm");
        expect(form.get("channel_id")).toBe("channel-id");

        const [ postUrl, postInit ] = fetchMock.mock.calls[1] as unknown as [
            string,
            RequestInit,
        ];
        expect(postUrl).toBe("https://mattermost/api/v4/posts");
        expect(JSON.parse(postInit.body as string)).toMatchObject({
            channel_id: "channel-id",
            file_ids: [ "file-id" ],
            message: "look at this",
        });
    });

    it("still uploads screenshots as image.png", async () => {
        mockSettings();
        const fetchMock = mockFetch([
            jsonResponse({ file_infos: [ { id: "file-id" } ] }),
            jsonResponse({ id: "post-id" }),
        ]);

        await sendTweet({
            message: "look at this",
            attachment: "data:image/png;base64,QUJD",
        });

        const form = (fetchMock.mock.calls[0] as unknown as [
            string,
            RequestInit,
        ])[1].body as FormData;
        expect((form.get("files") as File).name).toBe("image.png");
    });

    it("posts without files when there is no attachment", async () => {
        mockSettings();
        const fetchMock = mockFetch([ jsonResponse({ id: "post-id" }) ]);

        await sendTweet({ message: "no attachment" });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const init = (fetchMock.mock.calls[0] as unknown as [
            string,
            RequestInit,
        ])[1];
        expect(JSON.parse(init.body as string).file_ids).toEqual([]);
    });

    it("raises MattermostApiError when the upload fails", async () => {
        mockSettings();
        mockFetch([ new Response("nope", { status: 500 }) ]);

        await expect(
            sendTweet({
                message: "look at this",
                attachment: "data:video/webm;base64,QUJD",
            }),
        ).rejects.toThrow(MattermostApiError);
    });
});
