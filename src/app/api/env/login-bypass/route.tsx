export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { ApiSuccess, catchHandler } from "@/app/api/common";

const ALLOW_LOGIN_BYPASS = process.env.ALLOW_LOGIN_BYPASS === "true";

export async function GET(request: NextRequest) {
    try {
        return ApiSuccess({ ALLOW_LOGIN_BYPASS });
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
