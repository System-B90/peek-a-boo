export const dynamic = "force-dynamic";

import { AuthSessionData } from "@system-b90/hive-nextauth";
import { NextApiRequest } from "next";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { friendlyRedirectToLogin } from "@/app/api/login/redirect-to-login";
import { authOptions } from "@/server-api/next-auth";
import { ClientApiError, UserNotLoggedInError } from "@/shared-api/errors";

const ALLOW_LOGIN_BYPASS = process.env.ALLOW_LOGIN_BYPASS === "true";

function bypassSessionData(): AuthSessionData {
    // Dev-only stub session used when ALLOW_LOGIN_BYPASS=true; clearance/gender
    // are cast through `unknown` to avoid importing @system-b90/hive-core's
    // enums just for a placeholder value.
    return {
        user: {
            id: "dev",
            name: "Dev User",
            email: null,
            username: "dev",
            clearance: 0,
            program: null,
            gender: 0,
            display_name: "Dev User",
            is_teacher: false,
        },
        accessToken: "",
        refreshToken: "",
    } as unknown as AuthSessionData;
}

export async function getUserData(): Promise<AuthSessionData> {
    if (ALLOW_LOGIN_BYPASS) {
        return bypassSessionData();
    }

    const session = (await getServerSession(
        authOptions,
    )) as AuthSessionData | null;

    if (!session || session.error === "TokenExpiredError") {
        throw new UserNotLoggedInError(
            "User must be logged in to use this api!",
        );
    }

    return session;
}

export type ApiResponseHeaders = Record<string, string>;
export type ApiResponseInit =
    | (Omit<ResponseInit, "headers" | "status"> & {
          headers: ApiResponseHeaders;
      })
    | undefined;
export type ApiCacheControl =
    "immutable" | "must-revalidate" | "no-cache" | "no-store" | number;
export function ApiResponseMaker(
    data: unknown,
    cacheControl?: ApiCacheControl,
    init?: ApiResponseInit,
) {
    const additionalHeaders: ApiResponseHeaders = {};

    if (init === undefined) {
        init = { headers: additionalHeaders };
    } else if (init !== undefined && init.headers) {
        init.headers = { ...init.headers, ...additionalHeaders };
    }

    return new NextResponse(JSON.stringify({ status: 0, data: data }), {
        status: 200,
        ...init,
    });
}
export function ApiErrorMaker(e: unknown) {
    return new NextResponse(JSON.stringify({ status: -1, error: e }), {
        status: 200,
    });
}

export function ApiError(e: unknown) {
    return ApiErrorMaker(e);
}

export function ApiAccessError(e: unknown) {
    return ApiErrorMaker(e);
}

export function ApiSuccess(
    data?: unknown,
    cacheControl?: ApiCacheControl,
    init?: ApiResponseInit,
) {
    return ApiResponseMaker(data, cacheControl, init);
}

export async function catchHandler<T extends NextApiRequest | NextRequest>(
    request: T,
    e: unknown,
) {
    if (e instanceof UserNotLoggedInError) {
        const requestHeaders = headers();
        const refferer = (await requestHeaders).get("Referer");
        const reffererPathname = refferer ? new URL(refferer).pathname : "/";
        return await friendlyRedirectToLogin(request, reffererPathname);
    }

    if (e instanceof ClientApiError) {
        return ApiErrorMaker(e);
    }

    if (e instanceof Error) {
        console.error(e, e.stack);
    }
    return ApiError(e);
}

export async function assertUserLoggedIn(): Promise<AuthSessionData> {
    const userData = await getUserData();
    return userData;
}
