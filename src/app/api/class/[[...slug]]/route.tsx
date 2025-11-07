export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { ApiSuccess, assertUserLoggedIn, catchHandler } from "@/app/api/common";
import { ClientApiError } from "@/shared-api/errors";
import { getHiveClasses } from "@/server-api/hive";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: Array<string> }> },
) {
    try {
        const { slug } = await params;
        await assertUserLoggedIn();

        if (slug) { throw new ClientApiError('Not implemented!'); }

        return ApiSuccess(await getHiveClasses());
    } catch (e: unknown) {
        return catchHandler(request, e);
    }
}
