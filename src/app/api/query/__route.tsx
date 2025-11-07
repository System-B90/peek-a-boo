export const dynamic = "force-dynamic";
import { queryPostgres } from "@/server-api/postgres";
import { NextRequest, NextResponse } from "next/server";
import { catchHandler } from "@/app/api/common";

export async function GET(
    request: NextRequest,
) {
    try {

        return NextResponse.json(await queryPostgres());
    } catch (e: unknown) {
        return catchHandler(request, e);
    }
}
