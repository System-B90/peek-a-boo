'use server';

export async function getHiveApiToken()
{
    const request = await fetch(`https://${process.env.HIVE_HOSTNAME}/api/core/token/`, {
        method: 'POST',
        body: JSON.stringify({
            'username': process.env.HIVE_API_USERNAME ?? 'api',
            'password': process.env.HIVE_API_PASSWORD,
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
}

export async function performHiveApiRequest({ endpoint, contentType, accept }: { endpoint: string; contentType?: string, accept?: string; })
{
    const tokens = await getHiveApiToken();
    const response = await fetch(`https://${process.env.HIVE_HOSTNAME}${endpoint}/`, {
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
}

export async function getHiveClasses()
{
    return await performHiveApiRequest({ endpoint: "/api/core/management/classes" });
}

export async function getHiveUserAvatar(userHiveId: number)
{
    return (await performHiveApiRequest({ endpoint: `/api/core/management/users/${userHiveId}/avatar/` }) as Blob).stream();
}
