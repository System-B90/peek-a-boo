export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { ApiSuccess, catchHandler } from "@/app/api/common";
import { sendTweet } from "@/server-api/mattermost";

export async function POST(request: NextRequest) {
    try {
        // `image` is the pre-recording field name; still sent by older clients.
        const { message, image, attachment } = await request.json();
        await sendTweet({ message, attachment: attachment ?? image });
        return ApiSuccess({ ok: "ok" });
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
