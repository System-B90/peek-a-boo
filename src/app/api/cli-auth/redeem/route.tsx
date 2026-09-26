export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { ApiSuccess, catchHandler } from "@/app/api/common";
import {
    allowRedeemAttempt,
    rateLimitKeyForRequest,
    redeemHandoffCode,
} from "@/server-api/cli-handoff";
import { ClientApiError } from "@/shared-api/errors";

/**
 * Redeems a CLI login handoff code for the next-auth session token it was
 * minted for. Deliberately unauthenticated -- the caller (the CLI, not a
 * browser) has no session yet; the single-use, short-TTL code is the
 * credential.
 */
export async function POST(request: NextRequest) {
    try {
        if (!allowRedeemAttempt(rateLimitKeyForRequest(request))) {
            throw new ClientApiError("Too many attempts. Try again shortly.");
        }
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            throw new ClientApiError("Request body must be JSON.");
        }
        const code = (body as { code?: unknown } | null)?.code;
        if (typeof code !== "string" || !code) {
            throw new ClientApiError("Missing or invalid code.");
        }
        return ApiSuccess({ token: redeemHandoffCode(code) });
    } catch (e: unknown) {
        return await catchHandler(request, e);
    }
}
