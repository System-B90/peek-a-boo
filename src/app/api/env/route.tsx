import { NextRequest } from "next/server";

import { assertUserLoggedIn, ApiSuccess, catchHandler } from "@/app/api/common";
import { getSetting } from "@/server-api/settings";

export async function GET(request: NextRequest) {
    try {
        await assertUserLoggedIn();

        return ApiSuccess({
            // Relative paths (the default, served by nginx) are resolved
            // against the page origin client-side. Bare `npm run dev` has no
            // nginx, so it talks to websockify directly.
            WEBSOCKET_URL:
                process.env.WEBSOCKET_URL ??
                (process.env.NODE_ENV === "development"
                    ? "ws://localhost:60800"
                    : "/ws"),
            HIVE_HOSTNAME: await getSetting("HIVE_HOSTNAME"),
        });
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
