import { headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { friendlyRedirectToLogin } from "@/app/api/login/redirect-to-login";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

function mockHeaders(values: Record<string, string>) {
    vi.mocked(headers).mockResolvedValue({
        get: (name: string) => values[name] ?? null,
    } as unknown as Awaited<ReturnType<typeof headers>>);
}

const request = { url: "https://internal.local:3000/api/students" } as never;

beforeEach(() => {
    vi.mocked(headers).mockReset();
});

describe("friendlyRedirectToLogin host resolution", () => {
    it("builds the URL from the forwarded host and protocol", () => {
        // Behind nginx the app only ever sees an internal origin, so the
        // forwarded headers are the only way to send the browser somewhere it
        // can actually reach.
        mockHeaders({
            "X-Forwarded-Host": "peekaboo.dev",
            "X-Forwarded-Proto": "https",
        });

        return friendlyRedirectToLogin(request, "/dashboard").then((response) => {
            expect(response.headers.get("location")).toBe(
                "https://peekaboo.dev/login",
            );
        });
    });

    it("defaults the protocol to http when only the host is forwarded", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });

        const response = await friendlyRedirectToLogin(request, "/dashboard");

        expect(response.headers.get("location")).toBe("http://peekaboo.dev/login");
    });

    it("keeps a forwarded port", async () => {
        mockHeaders({
            "X-Forwarded-Host": "peekaboo.dev:8443",
            "X-Forwarded-Proto": "https",
        });

        const response = await friendlyRedirectToLogin(request, "/dashboard");

        expect(response.headers.get("location")).toBe(
            "https://peekaboo.dev:8443/login",
        );
    });

    it("falls back to the request URL when nothing is forwarded", async () => {
        mockHeaders({});

        const response = await friendlyRedirectToLogin(request, "/dashboard");

        // Same origin as the request, with the path swapped for /login.
        expect(response.headers.get("location")).toBe(
            "https://internal.local:3000/login",
        );
    });

    it("replaces the path rather than appending to it", async () => {
        mockHeaders({});

        const response = await friendlyRedirectToLogin(
            { url: "https://internal.local/api/deep/nested/route" } as never,
            "/dashboard",
        );

        expect(response.headers.get("location")).toBe(
            "https://internal.local/login",
        );
    });
});

describe("friendlyRedirectToLogin response shape", () => {
    it("sets the postLoginRedirect cookie to the origin path", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });

        const response = await friendlyRedirectToLogin(request, "/students/42");

        expect(response.cookies.get("postLoginRedirect")?.value).toBe(
            "/students/42",
        );
    });

    it("tags the response with the UserNotLoggedInError statusText", async () => {
        // The client reads this to tell an auth bounce apart from any other
        // redirect it might follow.
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });

        const response = await friendlyRedirectToLogin(request, "/dashboard");

        expect(response.statusText).toBe("UserNotLoggedInError");
        expect(response.status).toBe(307);
    });
});

describe("friendlyRedirectToLogin failedLoginAttempts", () => {
    it("omits the query param when no count is given", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });

        const response = await friendlyRedirectToLogin(request, "/dashboard");

        expect(response.headers.get("location")).not.toContain(
            "failedLoginAttempts",
        );
    });

    it("adds the count when given", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });

        const response = await friendlyRedirectToLogin(request, "/dashboard", 3);

        expect(response.headers.get("location")).toBe(
            "http://peekaboo.dev/login?failedLoginAttempts=3",
        );
    });

    it("includes an explicit zero", async () => {
        // The guard is `!== undefined`, not truthiness, so a first failure
        // reported as 0 still reaches the login page.
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });

        const response = await friendlyRedirectToLogin(request, "/dashboard", 0);

        expect(response.headers.get("location")).toContain(
            "failedLoginAttempts=0",
        );
    });
});
