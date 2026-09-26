export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { friendlyRedirectToLogin } from "@/app/api/login/redirect-to-login";

/**
 * Sends a logged-out visitor of /cli-auth through the Hive login and back.
 *
 * The page itself cannot do this: the post-login destination travels in the
 * `postLoginRedirect` cookie (read by /api/login), and a server component
 * cannot set cookies -- a route handler can.
 */
export async function GET(request: NextRequest) {
    const next = request.nextUrl.searchParams.get("next") ?? "";
    // Only ever back to the CLI page on this origin -- never an open redirect.
    const target = next.startsWith("/cli-auth?") ? next : "/cli-auth";
    return await friendlyRedirectToLogin(request, target);
}
