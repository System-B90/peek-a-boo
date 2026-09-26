/*
 * The VNC bridge is reached through the main domain (https://<host>/ws), not a
 * dedicated wss.* hostname. Resolving the configured URL lives here so it can
 * be tested without a browser — see tests/backend/websocket-url.test.ts.
 */

/**
 * Build the websocket URL for a student's VNC stream.
 *
 * `configured` is either absolute (`ws://localhost:60800`, used by bare
 * `npm run dev`) or a path on the current origin (`/ws`), which is resolved
 * against `page` and gets `wss:` for https pages, `ws:` otherwise.
 */
export function buildWebsocketProxyUrl(
    configured: string,
    page: { protocol: string; host: string },
    token: string,
): string {
    const base = /^wss?:\/\//i.test(configured)
        ? configured
        : `${page.protocol === "https:" ? "wss:" : "ws:"}//${page.host}${configured}`;
    return `${base}?token=${encodeURIComponent(token)}`;
}
