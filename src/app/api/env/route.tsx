import { NextRequest } from "next/server";
import { assertUserLoggedIn, ApiSuccess, catchHandler } from "@/app/api/common";

export async function GET(request: NextRequest)
{
    try
    {
        await assertUserLoggedIn();

        return ApiSuccess({
            WEBSOCKET_PORT: process.env.NODE_ENV === 'development' ? 80 : 443,
            WEBSOCKET_SERVER_HOSTNAME: process.env.WEBSOCKET_SERVER_HOSTNAME,
            WEBSOCKET_PROTOCOL_PREFIX: process.env.NODE_ENV === 'development' ? 'ws' : 'wss',
            HIVE_HOSTNAME: process.env.HIVE_HOSTNAME,
        });
    } catch (e: unknown)
    {
        return catchHandler(request, e);
    }
}