export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { ApiSuccess, catchHandler } from "@/app/api/common";
import { sendTweet } from "@/server-api/mattermost";

export async function POST(request: NextRequest) {
    try {
        const { message, image } = await request.json();
        await sendTweet({ message, image });
        return ApiSuccess({ ok: "ok" });
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
