import { promises as fs } from "fs";
import path from "path";

export type UserControlledSettings = {
    VNC_CLIENT_PASSWORD: string;
    VNC_MASTER_PASSWORD: string;
    HIVE_HOSTNAME: string;
    HIVE_PASSWORD: string;
    HIVE_POSTGRES_HOSTNAME: string;
    HIVE_API_USERNAME: string;
    HIVE_API_PASSWORD: string;
    HIVE_POSTGRES_USERNAME: string;
    MATTERMOST_URL: string;
    MATTERMOST_ACCESS_TOKEN: string;
    TWEET_CHANNEL_ID: string;
};

export const SETTINGS_PATH = path.join(process.cwd(), "settings.json");

const DEFAULT_SETTINGS = {
    VNC_CLIENT_PASSWORD: atob(process.env.VNC_CLIENT_PASSWORD ?? ""),
    VNC_MASTER_PASSWORD: atob(process.env.VNC_CLIENT_PASSWORD ?? ""),
    HIVE_HOSTNAME: process.env.HIVE_HOSTNAME ?? "hive.org",
    HIVE_PASSWORD: process.env.HIVE_PASSWORD ?? "",
    HIVE_POSTGRES_HOSTNAME:
        process.env.HIVE_POSTGRES_HOSTNAME ?? "hive-postgres",
    HIVE_API_USERNAME: process.env.HIVE_API_USERNAME ?? "api",
    HIVE_API_PASSWORD: process.env.HIVE_API_PASSWORD ?? "",
    HIVE_POSTGRES_USERNAME:
        process.env.HIVE_POSTGRES_USERNAME ?? "grafanareader",
    MATTERMOST_URL: process.env.MATTERMOST_URL ?? "https://mattermost",
    MATTERMOST_ACCESS_TOKEN: process.env.MATTERMOST_ACCESS_TOKEN ?? "",
    TWEET_CHANNEL_ID: process.env.TWEET_CHANNEL_ID ?? "",
};

// Cache for runtime
let cachedSettings: null | UserControlledSettings = null;

async function loadSettingsFile(): Promise<UserControlledSettings> {
    try {
        const raw = await fs.readFile(SETTINGS_PATH, "utf8");
        return JSON.parse(raw);
    } catch {
        // file does not exist yet → return defaults
        return DEFAULT_SETTINGS;
    }
}

/**
 * Returns the merged setting:
 * 1. settings.json
 * 2. process.env fallback
 */
export async function getSetting(
    key: keyof UserControlledSettings,
): Promise<string> {
    if (!cachedSettings) {
        cachedSettings = await loadSettingsFile();
    }

    const fileValue = cachedSettings?.[key];
    if (fileValue && fileValue.length > 0) {
        return fileValue;
    }

    if (typeof DEFAULT_SETTINGS[key] !== "undefined") {
        return DEFAULT_SETTINGS[key];
    }

    return process.env[key] ?? "";
}

export async function getSettings(): Promise<UserControlledSettings> {
    if (!cachedSettings) {
        cachedSettings = { ...DEFAULT_SETTINGS };
        const loadedSettings = await loadSettingsFile();
        for (const key of Object.keys(loadedSettings) as Array<
            keyof UserControlledSettings
        >) {
            cachedSettings[key] = loadedSettings[key] ?? cachedSettings[key];
        }
    }
    return cachedSettings;
}

export async function saveSettings(data: UserControlledSettings) {
    cachedSettings = null;
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(data, null, 4));
}

export async function getDefaultSettings(): Promise<UserControlledSettings> {
    return DEFAULT_SETTINGS;
}
