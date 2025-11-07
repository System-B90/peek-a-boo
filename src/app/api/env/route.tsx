import { NextRequest } from "next/server";
import { assertUserLoggedIn, ApiSuccess, catchHandler } from "@/app/api/common";

export async function GET(request: NextRequest) {
    try {
        await assertUserLoggedIn();

        return ApiSuccess({
            WEBSOCKET_PORT: process.env.WEBSOCKET_PORT,
            STUDENT_USERNAME_PREFIX: process.env.STUDENT_USERNAME_PREFIX,
            WEBSOCKET_SERVER_HOSTNAME: process.env.WEBSOCKET_SERVER_HOSTNAME,
            WEBSOCKET_PROTOCOL_PREFIX: process.env.WEBSOCKET_PROTOCOL_PREFIX,
            HIVE_URI: process.env.HIVE_URI,
        });
    } catch (e: unknown) {
        return catchHandler(request, e);
    }
}