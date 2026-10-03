export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIES = [
    "vncClientPassword",
    "username",
    "name",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
];

/** The fixed session cookies, plus any NextAuth chunks (`…session-token.0`). */
function cookiesToClear(request: NextRequest): Array<string> {
    const chunks = request.cookies
        .getAll()
        .map((cookie) => cookie.name)
        .filter((name) => /next-auth\.session-token\.\d+$/.test(name));
    return [...new Set([...SESSION_COOKIES, ...chunks])];
}

export async function GET(request: NextRequest) {
    const requestHeaders = await headers();
    const forwardedHost = requestHeaders.get("X-Forwarded-Host");
    const protocol = requestHeaders.get("X-Forwarded-Proto") ?? "http";
    const redirectionUrl = forwardedHost
        ? new URL(`${protocol}://${forwardedHost}/login`)
        : new URL(request.url ?? "");
    redirectionUrl.pathname = `/login`;
    const response = NextResponse.redirect(redirectionUrl);
    for (const name of cookiesToClear(request)) {
        // Browsers ignore a `__Secure-` cookie set without `Secure`, so the
        // NextAuth session cookie on https used to survive logout.
        response.cookies.set(name, "", {
            maxAge: 0,
            path: "/",
            secure: name.startsWith("__Secure-"),
        });
    }
    return response;
}
