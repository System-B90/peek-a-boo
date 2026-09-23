import { promises as fs } from "fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
    promises: { readFile: vi.fn(), writeFile: vi.fn() },
}));

const ENV_KEYS = [
    "VNC_CLIENT_PASSWORD",
    "HIVE_HOSTNAME",
    "HIVE_PASSWORD",
    "HIVE_API_USERNAME",
    "HIVE_API_PASSWORD",
    "HIVE_POSTGRES_USERNAME",
    "MATTERMOST_URL",
    "MATTERMOST_ACCESS_TOKEN",
    "TWEET_CHANNEL_ID",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [ k, process.env[k] ]));
    for (const key of ENV_KEYS) delete process.env[key];
    vi.mocked(fs.readFile).mockReset();
    vi.mocked(fs.writeFile).mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
    for (const [ key, value ] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    vi.resetModules();
});

/**
 * Re-imports the module with the current env.
 *
 * DEFAULT_SETTINGS is built once at module scope, so every env-dependent case
 * needs a fresh import; `cachedSettings` lives there too, which is what makes
 * this the only way to test the cache lifecycle.
 */
async function freshSettings() {
    vi.resetModules();
    return await import("@/server-api/settings");
}

function fileContains(values: Record<string, unknown>) {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(values) as never);
}

function noSettingsFile() {
    vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));
}

describe("getSetting precedence", () => {
    it("prefers settings.json over the env default", async () => {
        process.env.HIVE_HOSTNAME = "hive.from-env";
        fileContains({ HIVE_HOSTNAME: "hive.from-file" });
        const settings = await freshSettings();

        expect(await settings.getSetting("HIVE_HOSTNAME")).toBe("hive.from-file");
    });

    it("falls back to the env value when the file omits the key", async () => {
        process.env.HIVE_HOSTNAME = "hive.from-env";
        fileContains({ HIVE_PASSWORD: "pw" });
        const settings = await freshSettings();

        expect(await settings.getSetting("HIVE_HOSTNAME")).toBe("hive.from-env");
    });

    it("treats an empty string in the file as absent", async () => {
        // A settings form that posts a blank field must not blank out a
        // working env-provided value.
        process.env.HIVE_HOSTNAME = "hive.from-env";
        fileContains({ HIVE_HOSTNAME: "" });
        const settings = await freshSettings();

        expect(await settings.getSetting("HIVE_HOSTNAME")).toBe("hive.from-env");
    });

    it("falls back to the hard-coded default when neither is set", async () => {
        noSettingsFile();
        const settings = await freshSettings();

        expect(await settings.getSetting("HIVE_HOSTNAME")).toBe("hive.org");
        expect(await settings.getSetting("HIVE_API_USERNAME")).toBe("api");
        expect(await settings.getSetting("HIVE_POSTGRES_USERNAME")).toBe(
            "grafanareader",
        );
    });

    it("returns defaults when the settings file does not exist", async () => {
        noSettingsFile();
        const settings = await freshSettings();

        expect(await settings.getSetting("MATTERMOST_URL")).toBe(
            "https://mattermost",
        );
    });

    it("returns defaults when the settings file is malformed", async () => {
        // JSON.parse throws inside the same try, so a corrupt file degrades to
        // defaults rather than taking every route down at once.
        vi.mocked(fs.readFile).mockResolvedValue("{not json" as never);
        const settings = await freshSettings();

        expect(await settings.getSetting("HIVE_HOSTNAME")).toBe("hive.org");
    });
});

describe("VNC password defaults", () => {
    it("base64-decodes VNC_CLIENT_PASSWORD from the environment", async () => {
        process.env.VNC_CLIENT_PASSWORD = btoa("TestVncPass1");
        const settings = await freshSettings();

        expect(await settings.getSetting("VNC_CLIENT_PASSWORD")).toBe(
            "TestVncPass1",
        );
    });

    it("defaults VNC_MASTER_PASSWORD to the CLIENT password", async () => {
        // Pinned as current behaviour, NOT endorsed. DEFAULT_SETTINGS reads
        // process.env.VNC_CLIENT_PASSWORD for both keys, so until an admin
        // sets a master password through the settings form, the master and
        // client VNC passwords are identical -- and install-client hands the
        // master one to every student machine.
        //
        // There is no VNC_MASTER_PASSWORD env var anywhere in the repo
        // (setup.py, ci_setup.py and docker-compose.yml all define only the
        // client one), so this cannot be "fixed" by reading the right
        // variable: doing so would silently set every existing deployment's
        // master password to "". See the PR discussion.
        process.env.VNC_CLIENT_PASSWORD = btoa("client-only");
        const settings = await freshSettings();

        expect(await settings.getSetting("VNC_MASTER_PASSWORD")).toBe(
            "client-only",
        );
        expect(await settings.getSetting("VNC_MASTER_PASSWORD")).toBe(
            await settings.getSetting("VNC_CLIENT_PASSWORD"),
        );
    });

    it("lets settings.json override the master password independently", async () => {
        // The escape hatch that makes the shared default survivable: once set
        // through the form, the two diverge.
        process.env.VNC_CLIENT_PASSWORD = btoa("client-only");
        fileContains({ VNC_MASTER_PASSWORD: "a-real-master-password" });
        const settings = await freshSettings();

        expect(await settings.getSetting("VNC_MASTER_PASSWORD")).toBe(
            "a-real-master-password",
        );
        expect(await settings.getSetting("VNC_CLIENT_PASSWORD")).toBe(
            "client-only",
        );
    });

    it("decodes an unset password to an empty string", async () => {
        noSettingsFile();
        const settings = await freshSettings();

        expect(await settings.getSetting("VNC_CLIENT_PASSWORD")).toBe("");
    });
});

describe("getSettings merge", () => {
    it("overlays the file onto the defaults", async () => {
        process.env.HIVE_API_USERNAME = "env-api";
        fileContains({ HIVE_HOSTNAME: "hive.from-file" });
        const settings = await freshSettings();

        const all = await settings.getSettings();

        expect(all.HIVE_HOSTNAME).toBe("hive.from-file");
        expect(all.HIVE_API_USERNAME).toBe("env-api");
    });

    it("keeps the default when the file's value is null", async () => {
        fileContains({ HIVE_HOSTNAME: null });
        const settings = await freshSettings();

        expect((await settings.getSettings()).HIVE_HOSTNAME).toBe("hive.org");
    });

    it("exposes every declared key", async () => {
        noSettingsFile();
        const settings = await freshSettings();

        expect(Object.keys(await settings.getSettings()).sort()).toEqual([
            "HIVE_API_PASSWORD",
            "HIVE_API_USERNAME",
            "HIVE_HOSTNAME",
            "HIVE_PASSWORD",
            "HIVE_POSTGRES_USERNAME",
            "MATTERMOST_ACCESS_TOKEN",
            "MATTERMOST_URL",
            "TWEET_CHANNEL_ID",
            "VNC_CLIENT_PASSWORD",
            "VNC_MASTER_PASSWORD",
        ]);
    });
});

describe("cache lifecycle", () => {
    it("reads the settings file only once", async () => {
        fileContains({ HIVE_HOSTNAME: "hive.from-file" });
        const settings = await freshSettings();

        await settings.getSetting("HIVE_HOSTNAME");
        await settings.getSetting("HIVE_PASSWORD");
        await settings.getSetting("HIVE_HOSTNAME");

        expect(vi.mocked(fs.readFile)).toHaveBeenCalledTimes(1);
    });

    it("serves a stale value after the file changes underneath it", async () => {
        // Nothing watches the file; only saveSettings invalidates. Pinned so
        // the constraint is visible to anyone editing settings.json by hand on
        // a running container and wondering why nothing changed.
        fileContains({ HIVE_HOSTNAME: "first" });
        const settings = await freshSettings();
        expect(await settings.getSetting("HIVE_HOSTNAME")).toBe("first");

        fileContains({ HIVE_HOSTNAME: "second" });

        expect(await settings.getSetting("HIVE_HOSTNAME")).toBe("first");
    });

    it("saveSettings invalidates the cache", async () => {
        fileContains({ HIVE_HOSTNAME: "first" });
        const settings = await freshSettings();
        await settings.getSetting("HIVE_HOSTNAME");

        fileContains({ HIVE_HOSTNAME: "second" });
        await settings.saveSettings({ HIVE_HOSTNAME: "second" } as never);

        expect(await settings.getSetting("HIVE_HOSTNAME")).toBe("second");
    });

    it("saveSettings writes pretty-printed JSON to SETTINGS_PATH", async () => {
        noSettingsFile();
        const settings = await freshSettings();
        const payload = { HIVE_HOSTNAME: "hive.new" } as never;

        await settings.saveSettings(payload);

        const [ path, written ] = vi.mocked(fs.writeFile).mock.calls[0];
        expect(path).toBe(settings.SETTINGS_PATH);
        expect(written).toBe(JSON.stringify(payload, null, 4));
    });

    it("getDefaultSettings ignores the file entirely", async () => {
        process.env.HIVE_HOSTNAME = "hive.from-env";
        fileContains({ HIVE_HOSTNAME: "hive.from-file" });
        const settings = await freshSettings();

        expect((await settings.getDefaultSettings()).HIVE_HOSTNAME).toBe(
            "hive.from-env",
        );
    });
});
