import { NextRequest } from "next/server";
import
{
    assertUserLoggedIn,
    ApiSuccess,
    catchHandler
} from "@/app/api/common";
import { getSettings, saveSettings, UserControlledSettings } from "@/server-api/settings";

export async function GET(request: NextRequest)
{
    try
    {
        await assertUserLoggedIn();

        const settings = await getSettings();

        return ApiSuccess(settings);
    } catch (e: unknown)
    {
        return catchHandler(request, e);
    }
}

export async function POST(request: NextRequest)
{
    try
    {
        await assertUserLoggedIn();

        const body = await request.json();
        const current = await getSettings();

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
