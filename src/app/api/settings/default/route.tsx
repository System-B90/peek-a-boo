import { NextRequest } from "next/server";

import { assertUserLoggedIn, ApiSuccess, catchHandler } from "@/app/api/common";
import { getDefaultSettings } from "@/server-api/settings";

export async function GET(request: NextRequest) {
    try {
        await assertUserLoggedIn();

        const settings = await getDefaultSettings();

        return ApiSuccess(settings);
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
