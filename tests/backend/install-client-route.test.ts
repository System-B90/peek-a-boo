import { headers } from "next/headers";
import { describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/install-client/route";
import { getSetting } from "@/server-api/settings";

vi.mock("next/headers", () => ({
    headers: vi.fn(),
}));

vi.mock("@/server-api/settings", () => ({
    getSetting: vi.fn(),
}));

function mockHeaders(values: Record<string, string>) {
    vi.mocked(headers).mockResolvedValue({
        get: (name: string) => values[name] ?? null,
    } as unknown as Awaited<ReturnType<typeof headers>>);
}

function mockSettings(values: Record<string, string>) {
    vi.mocked(getSetting).mockImplementation(
        async (key: string) => values[key],
    );
}

describe("GET /api/install-client", () => {
    it("builds a PowerShell command that downloads the installer via the forwarded host", async () => {
        mockHeaders({
            "X-Forwarded-Host": "peekaboo.dev:8443",
            "X-Forwarded-Proto": "https",
        });
        mockSettings({
            VNC_MASTER_PASSWORD: "master-pw",
            VNC_CLIENT_PASSWORD: "client-pw",
        });

        const response = await GET();
        const command = (await response.json()) as string;

        expect(command).toContain(
            "https://peekaboo.dev:8443/bin/tightvnc-setup-64bit.msi",
        );
    });

    it("falls back to http when X-Forwarded-Proto is absent", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });
        mockSettings({
            VNC_MASTER_PASSWORD: "master-pw",
            VNC_CLIENT_PASSWORD: "client-pw",
        });

        const response = await GET();
        const command = (await response.json()) as string;

        expect(command).toContain(
            "http://peekaboo.dev/bin/tightvnc-setup-64bit.msi",
        );
    });

    it("embeds the master and client VNC passwords as msiexec CONTROLPASSWORD/PASSWORD args", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });
        mockSettings({
            VNC_MASTER_PASSWORD: "s3cret-master",
            VNC_CLIENT_PASSWORD: "s3cret-client",
        });

        const response = await GET();
        const command = (await response.json()) as string;

        expect(command).toContain('VALUE_OF_CONTROLPASSWORD=`"s3cret-master`"');
        expect(command).toContain('VALUE_OF_PASSWORD=`"s3cret-client`"');
    });

    it("escapes double quotes inside passwords so the generated command stays well-formed", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });
        mockSettings({
            VNC_MASTER_PASSWORD: 'weird"pw',
            VNC_CLIENT_PASSWORD: "client-pw",
        });

        const response = await GET();
        const command = (await response.json()) as string;

        expect(command).toContain('VALUE_OF_CONTROLPASSWORD=`"weird`"pw`"');
    });

    it("always enables shared connections and password-protected settings/connections", async () => {
        mockHeaders({ "X-Forwarded-Host": "peekaboo.dev" });
        mockSettings({
            VNC_MASTER_PASSWORD: "master-pw",
            VNC_CLIENT_PASSWORD: "client-pw",
        });

        const response = await GET();
        const command = (await response.json()) as string;

        expect(command).toContain("SET_ALWAYSSHARED=1");
        expect(command).toContain("SET_USECONTROLAUTHENTICATION=1");
        expect(command).toContain("SET_USEVNCAUTHENTICATION=1");
    });
});
