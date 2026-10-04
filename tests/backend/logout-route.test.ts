import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
    headers: async () => new Headers(),
}));

const { GET } = await import("@/app/api/logout/route");

function setCookieHeaders(response: Response): Array<string> {
    return response.headers.getSetCookie();
}

describe("/api/logout", () => {
    it("redirects to the login page", async () => {
        const response = await GET(
            new NextRequest("https://peek.example/api/logout"),
        );
        expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
            "/login",
        );
    });

    // Regression: a `__Secure-` cookie set without `Secure` is ignored by
    // browsers, so the NextAuth session survived logout on https.
    it("expires the secure NextAuth session cookie with the Secure flag", async () => {
        const response = await GET(
            new NextRequest("https://peek.example/api/logout"),
        );
        const cookie = setCookieHeaders(response).find((c) =>
            c.startsWith("__Secure-next-auth.session-token="),
        );
        expect(cookie).toBeDefined();
        expect(cookie).toMatch(/Max-Age=0/i);
        expect(cookie).toMatch(/;\s*Secure/i);
        expect(cookie).toMatch(/Path=\//i);
    });

    it("expires chunked NextAuth session cookies", async () => {
        const request = new NextRequest("https://peek.example/api/logout", {
            headers: {
                cookie: "__Secure-next-auth.session-token.0=a; __Secure-next-auth.session-token.1=b",
            },
        });
        const names = setCookieHeaders(await GET(request)).map(
            (c) => c.split("=")[0],
        );
        expect(names).toEqual(
            expect.arrayContaining([
                "__Secure-next-auth.session-token.0",
                "__Secure-next-auth.session-token.1",
                "vncClientPassword",
                "next-auth.session-token",
            ]),
        );
    });
});
