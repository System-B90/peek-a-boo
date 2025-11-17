'use server';

import { getSetting } from "@/server-api/settings";
import { HiveError, parseNetworkHostNotFoundError, HiveConnectionError, parseNetworkConnectionResetError, parseNetworkTimeoutError } from "@/shared-api/errors";

export async function hiveErrorHandler(error: unknown): Promise<unknown | HiveError>
{
    if (error instanceof HiveError) { return error; }

    const hostNotFound = parseNetworkHostNotFoundError(error);
    if (hostNotFound)
    {
        return new HiveConnectionError(`Failed to resolve DNS ${hostNotFound.hostname}. Check HIVE_HOSTNAME setting or enivornment variable.`);
    }

    const connectionReset = parseNetworkConnectionResetError(error);
    if (connectionReset)
    {
        return new HiveConnectionError(`Failed to connect to ${connectionReset.host}:${connectionReset.port}. Port returned TCP Reset. Is Hive running? Are the docker ports forwarded?`);
    }

    const connectionTimeout = parseNetworkTimeoutError(error);
    if (connectionTimeout)
    {
        return new HiveConnectionError(`Connection timed out on ${connectionTimeout.host}. Is Hive healthy?`);
    }


    return error;
}

export async function getHiveApiToken()
{
    try
    {
        const request = await fetch(`https://${await getSetting("HIVE_HOSTNAME")}/api/core/token/`, {
            method: 'POST',
            body: JSON.stringify({
                'username': await getSetting('HIVE_API_USERNAME'),
                'password': await getSetting('HIVE_API_PASSWORD'),
            }),
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const data = await request.json();
        return data as {
            refresh: string;
            access: string;
        };
    } catch (error: unknown)
    {
        throw await hiveErrorHandler(error);
    }
}

export async function performHiveApiRequest({ endpoint, contentType, accept }: { endpoint: string; contentType?: string, accept?: string; })
{
    try
    {
        const tokens = await getHiveApiToken();
        const response = await fetch(`https://${await getSetting("HIVE_HOSTNAME")}${endpoint}/`, {
            headers: {
                'Accept': accept ?? '*/*',
                'Content-Type': contentType ?? 'application/json',
                'Authorization': `Bearer ${tokens[ 'access' ]}`,
            }
        });
        if (response.headers.get('Content-Type') === 'application/json')
        {
            const data = await response.json();
            return data;
        }
        else if (/image\/\w+/gi.test(response.headers.get('Content-Type') ?? ''))
        {
            return response.blob();
        }
    } catch (error: unknown)
    {
        throw await hiveErrorHandler(error);
    }
}

export async function getHiveClasses()
{

    return await performHiveApiRequest({ endpoint: "/api/core/management/classes" });
}

export async function getHiveUserAvatar(userHiveId: number)
{
    return (await performHiveApiRequest({ endpoint: `/api/core/management/users/${userHiveId}/avatar/` }) as Blob).stream();
}
