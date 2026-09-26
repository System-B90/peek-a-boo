import { describe, expect, it } from "vitest";

import { buildWebsocketProxyUrl } from "@/shared-api/websocket-url";

describe("buildWebsocketProxyUrl", () => {
    it("resolves a relative path against the https page origin", () => {
        expect(
            buildWebsocketProxyUrl(
                "/ws",
                { protocol: "https:", host: "peekaboo.dev" },
                "pc-01",
            ),
        ).toBe("wss://peekaboo.dev/ws?token=pc-01");
    });

    it("keeps a non-standard port from the page host", () => {
        expect(
            buildWebsocketProxyUrl(
                "/ws",
                { protocol: "https:", host: "peekaboo.dev:8443" },
                "pc-01",
            ),
        ).toBe("wss://peekaboo.dev:8443/ws?token=pc-01");
    });

    it("never targets a wss.* subdomain", () => {
        const url = buildWebsocketProxyUrl(
            "/ws",
            { protocol: "https:", host: "peekaboo.dev" },
            "pc-01",
        );
        expect(url).not.toContain("wss.peekaboo.dev");
    });

    it("uses ws: on plain http pages", () => {
        expect(
            buildWebsocketProxyUrl(
                "/ws",
                { protocol: "http:", host: "localhost:3000" },
                "pc-01",
            ),
        ).toBe("ws://localhost:3000/ws?token=pc-01");
    });

    it("passes an absolute URL through", () => {
        expect(
            buildWebsocketProxyUrl(
                "ws://localhost:60800",
                { protocol: "http:", host: "localhost:3000" },
                "pc-01",
            ),
        ).toBe("ws://localhost:60800?token=pc-01");
    });
});
