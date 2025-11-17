export const dynamic = "force-dynamic";

import { isUserSegel, verifyUser } from "@/server-api/ldap";
import { NextRequest } from "next/server";
import { ApiSuccess, catchHandler, setUserData } from "@/app/api/common";
import { JWTUserData } from "@/server-api/enc";
import { ClientApiError } from "@/shared-api/errors";
import { sendAdminMessage } from "@/server-api/mattermost";
import { headers } from "next/headers";
import assert from "assert";
import { getSetting } from "@/server-api/settings";

const ALLOW_LOGIN_BYPASS = process.env.ALLOW_LOGIN_BYPASS === "true";

export async function POST(request: NextRequest)
{
    try
    {
        const { username, password }: { username: string; password: string; } =
            await request.json();
        if (!username || !password)
        {
            throw new ClientApiError("Invalid username or password!");
        }
        let clientSideUserData: JWTUserData;
        if (!ALLOW_LOGIN_BYPASS)
        {
            const user = await verifyUser(username.toString(), password.toString());
            const requestHeaders = await headers();
            const origin =
                requestHeaders.get("X-Forwarded-For") ??
                requestHeaders.get("origin") ??
                request.nextUrl.toString();
            if (!isUserSegel(user))
            {
                sendAdminMessage({
                    message: `Login blocked for ${user.sAMAccountName} to ${origin}.`,
                });
                throw new ClientApiError("Authentication failed!");
            }

            sendAdminMessage({
                message: `${user.sAMAccountName} logged in from ${origin}.`,
            });

            clientSideUserData = {
                name: user.cn,
                username: user.sAMAccountName,
                webSocketHost: "",
                vncClientPassword: await getSetting("VNC_CLIENT_PASSWORD") ?? "",
            };
        } else
        {
            assert(ALLOW_LOGIN_BYPASS === true);
            clientSideUserData = {
                name: username,
                username: username,
                webSocketHost: "",
                vncClientPassword: await getSetting("VNC_CLIENT_PASSWORD") ?? "",
            };
        }

        const response = ApiSuccess(clientSideUserData);
        setUserData(clientSideUserData, response);
        response.cookies.set(
            "vncClientPassword",
            btoa(clientSideUserData.vncClientPassword)
        );
        response.cookies.set("username", clientSideUserData.username);
        response.cookies.set("name", clientSideUserData.name);
        return response;
    } catch (error: unknown)
    {
        console.error(error);
        return catchHandler(request, error);
    }
}
