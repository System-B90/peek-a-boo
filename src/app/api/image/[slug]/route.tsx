import { assertUserLoggedIn } from "@/app/api/common";
import { promises as fs } from 'fs';
import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string; }>; }
)
{
    try
    {
        const { slug } = await params;
        await assertUserLoggedIn();
        const fileData = await fs.readFile(process.cwd() + `/src/hanichim-info/${slug}.png`);
        return new NextResponse(fileData);
        /* eslint-disable @typescript-eslint/no-unused-vars */
    } catch (_error: unknown)
    {
        // console.error(error);
        return new NextResponse();
    }
}
