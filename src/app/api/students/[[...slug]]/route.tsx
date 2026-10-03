export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { ApiSuccess, assertUserLoggedIn, catchHandler } from "@/app/api/common";
import { getStudents } from "@/server-api/students";
import { ClientApiError } from "@/shared-api/errors";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug?: Array<string> }> },
) {
    try {
        const { slug } = await params;
        await assertUserLoggedIn();
        if (typeof slug === "undefined" || !slug || slug.length === 0) {
            return ApiSuccess(await getStudents());
        }
        const studentUsername = slug[0] as string;
        if (!studentUsername) {
            throw new ClientApiError("Username parameter is required!");
        }
        return ApiSuccess(await getStudents(studentUsername));
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
