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
        const response = NextResponse.redirect(
            new URL(postLoginRedirect, request.url),
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
