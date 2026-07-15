import { NextRequest } from "next/server";

import { assertUserLoggedIn, ApiSuccess, catchHandler } from "@/app/api/common";
import { getSetting } from "@/server-api/settings";

export async function GET(request: NextRequest) {
    try {
        await assertUserLoggedIn();

        return ApiSuccess({
            WEBSOCKET_PORT: parseInt(
                process.env.WEBSOCKER_PORT ??
                    (process.env.NODE_ENV === "development" ? "60800" : "443"),
            ),
            WEBSOCKET_SERVER_HOSTNAME:
                process.env.WEBSOCKET_SERVER_HOSTNAME ??
                `wss.${process.env.HOSTNAME}`,
            WEBSOCKET_PROTOCOL_PREFIX:
                process.env.NODE_ENV === "development" ? "ws" : "wss",
            HIVE_HOSTNAME: await getSetting("HIVE_HOSTNAME"),
        });
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
