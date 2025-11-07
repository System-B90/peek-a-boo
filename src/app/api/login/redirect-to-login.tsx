export const dynamic = "force-dynamic";

import { NextApiRequest } from "next";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function friendlyRedirectToLogin(request: NextRequest | NextApiRequest, originUrl: string, failedLoginAttempts?: number) {
    const requestHeaders = await headers();

    const forwardedHost = requestHeaders.get('X-Forwarded-Host');

    const redirectionUrl = forwardedHost ? new URL(`https://${forwardedHost}/login`) : new URL(request.url ?? '');
    redirectionUrl.pathname = `/login`;

    redirectionUrl.searchParams.set('from', originUrl);
    if (undefined !== failedLoginAttempts) {
        redirectionUrl.searchParams.set('failedLoginAttempts', failedLoginAttempts.toString(10));
    }
    return NextResponse.redirect(redirectionUrl, { statusText: 'UserNotLoggedInError' });
}
