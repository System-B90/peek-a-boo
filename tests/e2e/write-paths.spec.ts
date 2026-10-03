import path from "node:path";

import { expect, test } from "@playwright/test";

// Write paths, session teardown and the VNC bridge (#60).

test.describe("Settings", () => {
    test("a saved setting survives a reload", async ({ page }) => {
        await page.goto("/settings");
        const field = page.getByLabel("Mattermost URL");
        await expect(field).not.toHaveValue("", { timeout: 15_000 });
        const original = await field.inputValue();
        const marker = `https://mattermost-e2e-${Date.now()}.test`;

        const save = async (value: string) => {
            await field.fill(value);
            await page.getByRole("button", { name: "Save Settings" }).click();
            await expect(page.getByText("Settings saved!").last()).toBeVisible();
        };

        try {
            await save(marker);
            await page.reload();
            await expect(field).toHaveValue(marker, { timeout: 15_000 });
        } finally {
            await save(original);
        }
    });
});

test.describe("Logout", () => {
    test("clears the session cookies and sends the user to login", async ({
        browser,
    }) => {
        // Its own context: logging out must not touch the shared auth state.
        const context = await browser.newContext({
            storageState: path.join(__dirname, "..", ".auth", "user.json"),
        });
        const page = await context.newPage();

        await page.goto("/api/logout");
        await expect(page).toHaveURL(/\/login/);

        const cookies = await context.cookies();
        for (const name of [
            "vncClientPassword",
            "username",
            "name",
            "next-auth.session-token",
            "__Secure-next-auth.session-token",
        ]) {
            const cookie = cookies.find((c) => c.name === name);
            expect(cookie?.value ?? "", name).toBe("");
        }

        await page.goto("/");
        await expect(page).toHaveURL(/\/login/);
        await context.close();
    });
});

test.describe("VNC bridge", () => {
    test("the /ws endpoint completes a websocket handshake", async ({
        page,
    }) => {
        await page.goto("/");
        const outcome = await page.evaluate(
            async () =>
                await new Promise<string>((resolve) => {
                    const url = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws?token=e2e-probe`;
                    const socket = new WebSocket(url, ["binary"]);
                    socket.addEventListener("open", () => {
                        resolve("open");
                        socket.close();
                    });
                    socket.addEventListener("error", () => resolve("error"));
                    setTimeout(() => resolve("timeout"), 10_000);
                }),
        );
        expect(outcome).toBe("open");
    });
});
