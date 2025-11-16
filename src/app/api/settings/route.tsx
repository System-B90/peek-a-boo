import { NextRequest } from "next/server";
import
{
    assertUserLoggedIn,
    ApiSuccess,
    catchHandler
} from "@/app/api/common";

import { promises as fs } from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "settings.json");

export type UserControlledSettings = {
    VNC_CLIENT_PASSWORD: string;
    HIVE_HOSTNAME: string;
    HIVE_PASSWORD: string;
    HIVE_API_PASSWORD: string;
    MATTERMOST_URL: string;
    MATTERMOST_ACCESS_TOKEN: string;
    TWEET_CHANNEL_ID: string;
};

// ---------- Helpers ----------

async function loadSettings(): Promise<UserControlledSettings>
{
    try
    {
        const raw = await fs.readFile(SETTINGS_PATH, "utf8");
        return JSON.parse(raw);
    } catch (_)
    {
        // file does not exist yet → return defaults
        return {
            VNC_CLIENT_PASSWORD: atob(process.env.VNC_CLIENT_PASSWORD ?? ""),
            HIVE_HOSTNAME: process.env.HIVE_HOSTNAME ?? 'hive.org',
            HIVE_PASSWORD: process.env.HIVE_PASSWORD ?? '',
            HIVE_API_PASSWORD: process.env.HIVE_API_PASSWORD ?? '',
            MATTERMOST_URL: process.env.MATTERMOST_URL ?? 'https://mattermost',
            MATTERMOST_ACCESS_TOKEN: process.env.MATTERMOST_ACCESS_TOKEN ?? '',
            TWEET_CHANNEL_ID: process.env.TWEET_CHANNEL_ID ?? '',
        };
    }
}

async function saveSettings(data: UserControlledSettings)
{
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(data, null, 4));
}

// ---------- GET ----------

export async function GET(request: NextRequest)
{
    try
    {
        await assertUserLoggedIn();

        const settings = await loadSettings();

        return ApiSuccess(settings);
    } catch (e: unknown)
    {
        return catchHandler(request, e);
    }
}

// ---------- POST ----------

export async function POST(request: NextRequest)
{
    try
    {
        await assertUserLoggedIn();

        const body = await request.json();
        const current = await loadSettings();

        const updated: UserControlledSettings = {
            ...current,
            ...body
        };

        await saveSettings(updated);

        return ApiSuccess({});
    } catch (e: unknown)
    {
        return catchHandler(request, e);
    }
}
