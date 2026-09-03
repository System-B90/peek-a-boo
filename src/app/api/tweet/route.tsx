export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { ApiSuccess, assertUserLoggedIn, catchHandler } from "@/app/api/common";
import { sendTweet } from "@/server-api/mattermost";

export async function POST(request: NextRequest) {
    try {
        // Without this, anyone who can reach the server can post arbitrary
        // messages and images to the configured Mattermost channel using the
        // server's own bot token.
        await assertUserLoggedIn();
        // `image` is the pre-recording field name; still sent by older clients.
        const { message, image, attachment } = await request.json();
        await sendTweet({ message, attachment: attachment ?? image });
        return ApiSuccess({ ok: "ok" });
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
