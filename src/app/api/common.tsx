export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ClientApiError, UserNotLoggedInError } from "@/shared-api/errors";
import { friendlyRedirectToLogin } from "@/app/api/login/redirect-to-login";
import { getJwtSecret, JWTUserData } from "@/server-api/enc";
import jwt from 'jsonwebtoken';
import { NextApiRequest } from "next";

export async function getUserData()
{
    const jwtSecret = getJwtSecret();
    const authToken = (await cookies()).get('auth');
    if (!authToken)
    {
        throw new UserNotLoggedInError('User must be logged in to use this api!');
    }

    // Verify the JWT and get the user data
    try
    {
        try
        {
            const userData = jwt.verify(authToken.value, jwtSecret) as JWTUserData;
            return userData;
        }
        catch (error: unknown)
        {
            console.error(error);
            throw new Error('Error verifying JWT!');
        }
    }
    catch (e: unknown)
    {
        console.error(e);
        throw new Error('Error getting user data!');
    }
}

export async function setUserData(newData: JWTUserData, response?: NextResponse)
{
    // Generate a JWT with the user data and a secret key
    const token = jwt.sign(
        newData,
        getJwtSecret()
    );

    // Set the JWT as a cookie
    (response ? response.cookies : ((await cookies()))).set('auth', token, {
        httpOnly: true,
        secure: true, // Use HTTPS in production
        sameSite: 'strict',
        // 90min
        maxAge: 3600 * 1.5, // Change this to the desired session duration in seconds
        path: '/',
    });
}

export type ApiResponseHeaders = Record<string, string>;
export type ApiResponseInit = (Omit<ResponseInit, 'status' | 'headers'> & { headers: ApiResponseHeaders; }) | undefined;
export type ApiCacheControl = 'no-cache' | 'no-store' | 'immutable' | 'must-revalidate' | number;
export function ApiResponseMaker(data: unknown, cacheControl?: ApiCacheControl, init?: ApiResponseInit)
{
    const additionalHeaders: ApiResponseHeaders = {};

    if (init === undefined)
    {
        init = { headers: additionalHeaders };
    }
    else if (init !== undefined && init.headers)
    {
        init.headers = { ...init.headers, ...additionalHeaders };
    }

    return new NextResponse(JSON.stringify({ 'status': 0, 'data': data }), { status: 200, ...init });
}
export function ApiErrorMaker(e: unknown)
{
    return new NextResponse(JSON.stringify({ 'status': -1, 'error': e }), { status: 200 });
}

export function ApiError(e: unknown)
{
    return ApiErrorMaker(e);
}

export function ApiAccessError(e: unknown)
{
    return ApiErrorMaker(e);
}

export function ApiSuccess(data?: unknown, cacheControl?: ApiCacheControl, init?: ApiResponseInit)
{
    return ApiResponseMaker(data, cacheControl, init);
}

export async function catchHandler<T extends NextRequest | NextApiRequest>(request: T, e: unknown)
{
    if (e instanceof UserNotLoggedInError)
    {
        const requestHeaders = headers();
        const refferer = (await requestHeaders).get('Referer');
        const reffererPathname = refferer ? new URL(refferer).pathname : '/';
        return friendlyRedirectToLogin(request, reffererPathname);
    }

    if (e instanceof ClientApiError)
    {
        return ApiErrorMaker(e);
    }

    console.error(e);
    return ApiError(e);
}

export async function assertUserLoggedIn()
{
    const userData = await getUserData();
    return userData;
}
