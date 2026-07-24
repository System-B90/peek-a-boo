/*
 * The VNC client password rides to the browser as a base64 cookie. Decoding it
 * lives here rather than inline in the auth provider so it can be tested
 * without mounting a React tree — see tests/backend/vnc-credentials.test.ts.
 */

/**
 * Decode the base64-encoded `vncClientPassword` cookie.
 *
 * Returns null when the value cannot be decoded, rather than throwing: a
 * malformed cookie must not take down the auth provider's effect. Callers are
 * expected to treat null as "no usable VNC password" and say so — silently
 * discarding it is what made this hard to diagnose in the first place.
 */
export function decodeVncClientPassword(encoded: string): null | string {
    try {
        return atob(encoded);
    } catch {
        return null;
    }
}
