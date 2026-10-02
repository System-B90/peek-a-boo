import { MattermostClient } from "@system-b90/test-kit/mattermost";
import { beforeEach, describe, expect, inject, it, vi } from "vitest";

import { sendDirecMessage, sendMessage, sendTweet } from "@/server-api/mattermost";
import { getSetting } from "@/server-api/settings";
import { MattermostApiError, MattermostConnectionError } from "@/shared-api/errors";

// Settings come from Postgres/env in the app; here they point at the
// throwaway Mattermost the global setup started.
vi.mock("@/server-api/settings", () => ({
    getSetting: vi.fn(),
}));

const mm = inject("mattermost");
const admin = new MattermostClient(mm.url, mm.admin.token);

// 1x1 transparent PNG.
const PNG_DATA_URI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function useSettings(overrides: Record<string, string> = {}) {
    const settings: Record<string, string> = {
        MATTERMOST_URL: mm.url,
        MATTERMOST_ACCESS_TOKEN: mm.bot.token,
        TWEET_CHANNEL_ID: mm.channel.id,
        ...overrides,
    };
    vi.mocked(getSetting).mockImplementation(
        async (key: string) => settings[key] ?? "",
    );
}

async function latestBotPost(channelId: string) {
    const posts = await admin.getPosts(channelId);
    return posts.find((post) => post.user_id === mm.bot.id);
}

beforeEach(() => {
    useSettings();
});

describe("Mattermost integration", () => {
    it("sendTweet posts the message to the tweet channel as the bot", async () => {
        const message = `tweet ${crypto.randomUUID()}`;

        await sendTweet({ message });

        const post = await latestBotPost(mm.channel.id);
        expect(post?.message).toBe(message);
        expect(post?.file_ids ?? []).toHaveLength(0);
    });

    it("sendTweet uploads an image attachment and links it to the post", async () => {
        const message = `with image ${crypto.randomUUID()}`;

        await sendTweet({ message, attachment: PNG_DATA_URI });

        const post = await latestBotPost(mm.channel.id);
        expect(post?.message).toBe(message);
        expect(post?.file_ids).toHaveLength(1);
        const file = await admin.getFileInfo(post!.file_ids![0]);
        expect(file.mime_type).toBe("image/png");
        expect(file.size).toBeGreaterThan(0);
    });

    it("sendTweet uploads a screen recording as .webm", async () => {
        await sendTweet({
            message: `recording ${crypto.randomUUID()}`,
            attachment: "data:video/webm;codecs=vp9;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYEC",
        });

        const post = await latestBotPost(mm.channel.id);
        const file = await admin.getFileInfo(post!.file_ids![0]);
        expect(file.extension).toBe("webm");
    });

    it("sendDirecMessage delivers to a DM channel", async () => {
        const dm = await admin.getDirectChannel(mm.admin.id, mm.bot.id);
        const message = `dm ${crypto.randomUUID()}`;

        await sendDirecMessage({ message, reciever: dm.id });

        expect((await latestBotPost(dm.id))?.message).toBe(message);
    });

    it("rejects a bad bot token with MattermostApiError", async () => {
        await expect(
            sendMessage({
                botToken: "not-a-real-token",
                channelId: mm.channel.id,
                message: "should not post",
            }),
        ).rejects.toBeInstanceOf(MattermostApiError);
    });

    it("rejects a channel the bot cannot post to with MattermostApiError", async () => {
        await expect(
            sendMessage({
                botToken: mm.bot.token,
                channelId: "doesnotexist00000000000000",
                message: "should not post",
            }),
        ).rejects.toBeInstanceOf(MattermostApiError);
    });

    it("maps an unresolvable MATTERMOST_URL to MattermostConnectionError", async () => {
        useSettings({ MATTERMOST_URL: "http://mattermost.invalid" });

        await expect(sendTweet({ message: "unreachable" })).rejects.toBeInstanceOf(
            MattermostConnectionError,
        );
    });
});
