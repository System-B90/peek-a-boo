import { getSetting } from "@/server-api/settings";
import {
    MattermostApiError,
    MattermostConnectionError,
    parseNetworkHostNotFoundError,
} from "@/shared-api/errors";
import { parseMediaAttachment } from "@/shared-api/media-attachment";

export async function sendMessage({
    botToken,
    channelId,
    message,
    attachment,
}: {
    botToken: string;
    channelId: string;
    message: string;
    /** Base64 data URI of an image or a video to post alongside the message. */
    attachment?: string;
}) {
    const MATTERMOST_URL = await getSetting("MATTERMOST_URL");
    try {
        const fileIds: Array<string> = [];
        if (attachment) {
            const { contentType, data64, filename } =
                parseMediaAttachment(attachment);
            const attachmentBuffer = Buffer.from(data64, "base64");

            const form = new FormData();
            form.append(
                "files",
                new Blob([attachmentBuffer], { type: contentType }),
                filename,
            );
            form.append("channel_id", channelId);

            const uploadRes = await fetch(`${MATTERMOST_URL}/api/v4/files`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${botToken}`,
                },
                body: form,
            });
            if (!uploadRes.ok) {
                throw new MattermostApiError(
                    `Failed to upload attachment to mattermost! ${await uploadRes.text()}`,
                );
            }

            fileIds.push((await uploadRes.json()).file_infos[0].id);
        }

        const response = await fetch(`${MATTERMOST_URL}/api/v4/posts`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${botToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                channel_id: channelId,
                message,
                file_ids: fileIds,
            }),
        });
        if (!response.ok) {
            throw new MattermostApiError(
                `Failed to send mattermost message! ${await response.text()}`,
            );
        }
        return await response.text();
    } catch (error: unknown) {
        if (!(error instanceof Error)) {
            throw error;
        }
        const networkHostError = parseNetworkHostNotFoundError(error);
        if (networkHostError) {
            throw new MattermostConnectionError(
                `${networkHostError.hostname} is unreachable! Please check MATTERMOST_URL in settings or environment variables.`,
            );
        }
        throw error;
    }
}

export async function sendBotMessage({
    channelId,
    message,
    attachment,
}: {
    channelId: string;
    message: string;
    attachment?: string;
}) {
    const botToken = await getSetting("MATTERMOST_ACCESS_TOKEN");
    return await sendMessage({
        message,
        attachment,
        botToken,
        channelId,
    });
}

export async function sendTweet({
    message,
    attachment,
}: {
    message: string;
    attachment?: string;
}) {
    const channelId = await getSetting("TWEET_CHANNEL_ID");
    return await sendBotMessage({
        message,
        attachment,
        channelId,
    });
}

export async function sendDirecMessage({
    message,
    reciever,
    attachment,
}: {
    message: string;
    reciever: string;
    attachment?: string;
}) {
    return await sendBotMessage({
        message,
        attachment,
        channelId: reciever,
    });
}

export async function sendAdminMessage({
    message,
    attachment,
}: {
    message: string;
    attachment?: string;
}) {
    return await sendBotMessage({
        message,
        attachment,
        channelId: "bu4mwukaktngjg3hybsriojira",
    });
}
