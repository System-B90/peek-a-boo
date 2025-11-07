import { ClientApiError } from "@/shared-api/errors";

const MATTERMOST_URL = process.env.MATTERMOST_URL ?? 'https://mattermost.eshel.dom';

export async function sendMessage({ botToken, channelId, message, image, }: { botToken: string, channelId: string, message: string, image?: string, }) {
    const fileIds: Array<string> = [];
    if (image) {
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (!matches) { throw new ClientApiError('Mattermost sendMessage API accepts Base64 encoded images only!'); }
        const contentType = matches[1];
        const imageData64 = matches[2];
        const imageBuffer = Buffer.from(imageData64, 'base64');

        const form = new FormData();
        form.append('files', new Blob([imageBuffer], { type: contentType }), 'image.png');
        form.append('channel_id', channelId);

        const uploadRes = await fetch(`${MATTERMOST_URL}/api/v4/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${botToken}`,
            },
            body: form,
        });
        if (!uploadRes.ok) {
            throw new ClientApiError(`Failed to upload image to mattermost! ${await uploadRes.text()}`);
        }

        fileIds.push((await uploadRes.json()).file_infos[0].id);
    }


    const response = await fetch(`${MATTERMOST_URL}/api/v4/posts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            channel_id: channelId,
            message,
            file_ids: fileIds,
        }
        )
    });
    if (!response.ok) {
        throw new ClientApiError(`Failed to send mattermost message! ${await response.text()}`);
    }
    console.log(await response.text());
}
export async function sendBotMessage({ channelId, message, image, }: { channelId: string, message: string, image?: string, }) {
    return sendMessage({
        message,
        image: image,
        botToken: process.env.MATTERMOST_ACCESS_TOKEN ?? '',
        channelId: channelId,
    });
}

export async function sendTweet({ message, image }: { message: string; image?: string }) {
    return sendBotMessage({
        message,
        image: image,
        channelId: process.env.TWEET_CHANNEL_ID ?? '',
    });
}

export async function sendDirecMessage({ message, reciever, image }: { message: string; reciever: string; image?: string }) {
    return sendBotMessage({
        message,
        image: image,
        channelId: reciever,
    });
}

export async function sendAdminMessage({ message, image }: { message: string; image?: string }) {
    return sendBotMessage({
        message,
        image: image,
        channelId: 'bu4mwukaktngjg3hybsriojira',
    });
}
