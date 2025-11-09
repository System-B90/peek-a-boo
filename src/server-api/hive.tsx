export async function getHiveApiToken() {
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

export async function performHiveApiRequest(endpoint: string) {
    const tokens = await getHiveApiToken();
    const request = await fetch(`https://${process.env.HIVE_HOSTNAME}${endpoint}/`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens['access']}`
        }
    });
    const data = await request.json();
    return data;
}

export async function getHiveClasses() {
    return await performHiveApiRequest("/api/core/management/classes")
}
