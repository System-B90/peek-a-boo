/**
 * Name: cli-handoff.tsx
 * Purpose: Mint and redeem CLI login handoff codes. The browser hands the
 *          `peekaboo` CLI a single-use code instead of the raw session token;
 *          the CLI redeems it at POST /api/cli-auth/redeem, exactly once.
 * Created: 2026-09-27
 * Author: Michael K. Steinberg
 *
 * Ported from Bluz (ui/src/api-server/db-cli-handoff.ts). Bluz keeps codes in
 * Mongo; peek-a-boo has no database of its own, so they live in this
 * process's memory. That is enough: a code only has to survive the few
 * seconds between the /cli-auth page load and the CLI's redeem call, both of
 * which reach the same single Next.js container.
 */

import { randomBytes } from "crypto";

import { ClientApiError } from "@/shared-api/errors";

/** How long a handoff code is redeemable for. The whole round trip normally
 * completes in a few seconds. */
export const CLI_HANDOFF_TTL_SECONDS = 120;

// 24 bytes (192 bits) of crypto.randomBytes, base64url-encoded.
const CODE_BYTES = 24;

type PendingHandoff = { createdAt: number; token: string };

const pending = new Map<string, PendingHandoff>();

function isExpired(entry: PendingHandoff, now: number): boolean {
    return now - entry.createdAt > CLI_HANDOFF_TTL_SECONDS * 1000;
}

/** Drop expired codes so abandoned logins do not accumulate. */
function sweep(now: number) {
    for (const [code, entry] of pending) {
        if (isExpired(entry, now)) {
            pending.delete(code);
        }
    }
}

/** @returns The opaque handoff code to hand the browser (never the token). */
export function createHandoffCode(sessionToken: string): string {
    const now = Date.now();
    sweep(now);
    const code = randomBytes(CODE_BYTES).toString("base64url");
    pending.set(code, { createdAt: now, token: sessionToken });
    return code;
}

/**
 * Redeem a handoff code for its session token exactly once. The lookup and
 * the delete happen in one synchronous step, so a concurrent second
 * redemption finds nothing; "already used" and "unknown" are deliberately
 * indistinguishable.
 *
 * @throws ClientApiError when the code is unknown, already used, or expired.
 */
export function redeemHandoffCode(code: string): string {
    const entry = pending.get(code);
    pending.delete(code);
    if (!entry) {
        throw new ClientApiError("Invalid or already-used code.");
    }
    if (isExpired(entry, Date.now())) {
        throw new ClientApiError("Code has expired.");
    }
    return entry.token;
}

// Fixed-window, per-caller bound on redeem attempts. The codes carry 192 bits
// of entropy, so this is defense in depth rather than the primary control.
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 20;
const hits = new Map<string, Array<number>>();

/** @returns true when the caller is still under the limit (and records the hit). */
export function allowRedeemAttempt(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter(
        (timestamp) => timestamp > now - WINDOW_MS,
    );
    if (recent.length >= MAX_ATTEMPTS_PER_WINDOW) {
        hits.set(key, recent);
        return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
}

/** Caller identity for rate limiting: the real client IP behind nginx. */
export function rateLimitKeyForRequest(request: Request): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    return forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
}

/** Exists for tests: forget every code and counter. */
export function resetCliHandoffState() {
    pending.clear();
    hits.clear();
}
