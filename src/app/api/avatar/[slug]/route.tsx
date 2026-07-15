import { NextResponse } from "next/server";

import { assertUserLoggedIn } from "@/app/api/common";
import { getHiveUserAvatar } from "@/server-api/hive";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;
        await assertUserLoggedIn();
        const data = await getHiveUserAvatar(parseInt(slug));
        return new NextResponse(data);
    } catch {
        return new NextResponse();
    }
}
