export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest)
{
    const requestHeaders = await headers();
    const forwardedHost = requestHeaders.get('X-Forwarded-Host');
    const protocol = requestHeaders.get('X-Forwarded-Proto') ?? 'http';
    const redirectionUrl = forwardedHost ? new URL(`${protocol}://${forwardedHost}/login`) : new URL(request.url ?? '');
    redirectionUrl.pathname = `/login`;
    const response = NextResponse.redirect(redirectionUrl);
    response.cookies.set("vncClientPassword", '');
    response.cookies.set("username", '');
    response.cookies.set("name", '');
    response.cookies.set("auth", '');
    return response;
}
