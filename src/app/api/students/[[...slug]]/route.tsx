export const dynamic = "force-dynamic";

import { queryPostgres } from "@/server-api/postgres";
import { NextRequest } from "next/server";
import { ApiSuccess, assertUserLoggedIn, catchHandler } from "@/app/api/common";
import { ClientApiError } from "@/shared-api/errors";
import { hiveErrorHandler } from "@/server-api/hive";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug?: Array<string>; }>; },
)
{
    try
    {
        const { slug } = await params;
        await assertUserLoggedIn();
        if (typeof slug === 'undefined' || !slug || slug.length === 0)
        {
            return ApiSuccess(await queryPostgres());
        }
        const studentUsername = slug[ 0 ] as string;
        if (!studentUsername) { throw new ClientApiError('Username parameter is required!'); }
        return ApiSuccess(await queryPostgres(studentUsername));
    } catch (e: unknown)
    {
        return catchHandler(request, e);
    }
}
