export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { assertUserLoggedIn, catchHandler } from "@/app/api/common";
import { getSetting } from "@/server-api/settings";

/**
 * Callback landing page after a successful NextAuth Hive sign-in. Sets the
 * client-readable cookies the VNC/UI code reads directly (vncClientPassword,
 * username, name), then redirects to wherever the user was headed before
 * being sent to /login.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await assertUserLoggedIn();

        const postLoginRedirect =
            request.cookies.get("postLoginRedirect")?.value || "/";
        // request.url resolves to the container-internal address (e.g.
        // localhost:3000) behind the nginx proxy, not the public-facing
        // host — build the redirect off NEXTAUTH_URL instead.
        const response = NextResponse.redirect(
            new URL(postLoginRedirect, process.env.NEXTAUTH_URL || request.url),
        );

        response.cookies.set(
            "vncClientPassword",
            btoa((await getSetting("VNC_CLIENT_PASSWORD")) ?? ""),
        );
        response.cookies.set("username", session.user.username);
        response.cookies.set(
            "name",
            session.user.display_name || session.user.name,
        );
        response.cookies.set("postLoginRedirect", "");

        return response;
    } catch (error: unknown) {
        console.error(error);
        return await catchHandler(request, error);
    }
}
