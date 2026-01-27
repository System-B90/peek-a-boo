import { NextRequest } from "next/server";
import { ApiSuccess, catchHandler } from "@/app/api/common";
import { getAuthSystem } from "@/server-api/auth";

export async function GET(request: NextRequest)
{
    try
    {
        return ApiSuccess({
            AUTH_SYSTEM: getAuthSystem(),
        });
    } catch (e: unknown)
    {
        return catchHandler(request, e);
    }
}
