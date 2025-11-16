export const dynamic = "force-dynamic";

import { NextApiRequest } from "next";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function friendlyRedirectToLogin(request: NextRequest | NextApiRequest, originUrl: string, failedLoginAttempts?: number)
{
    const requestHeaders = await headers();

    const forwardedHost = requestHeaders.get('X-Forwarded-Host');
    const protocol = requestHeaders.get('X-Forwarded-Proto') || 'http';

    const redirectionUrl = forwardedHost ? new URL(`${protocol}://${forwardedHost}/login`) : new URL(request.url ?? '');
    redirectionUrl.pathname = `/login`;

    if (undefined !== failedLoginAttempts)
    {
        redirectionUrl.searchParams.set('failedLoginAttempts', failedLoginAttempts.toString(10));
    }

    const redirection = NextResponse.redirect(redirectionUrl, { statusText: 'UserNotLoggedInError' });

    redirection.cookies.set('postLoginRedirect', originUrl, {});

    return redirection;
}
