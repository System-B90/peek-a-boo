"use server";

import { Clearance, HiveError, hiveFetch } from "@system-b90/hive-core";

import { getSetting } from "@/server-api/settings";
import { RawHiveClass } from "@/shared-api/types";

type HiveApiTokens = {
    refresh: string;
    access: string;
};

export async function getHiveApiTokenByCreds(
    username: string,
    password: string,
): Promise<HiveApiTokens> {
    const request = await hiveFetch(
        `https://${await getSetting("HIVE_HOSTNAME")}/api/core/token/`,
        {
            method: "POST",
            body: JSON.stringify({
                username: username,
                password: password,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
    const data = await request.json();
    return data as {
        refresh: string;
        access: string;
    };
}

export async function getHiveApiToken(): Promise<HiveApiTokens> {
    const username = await getSetting("HIVE_API_USERNAME");
    const password = await getSetting("HIVE_API_PASSWORD");
    return await getHiveApiTokenByCreds(username, password);
}

export async function performHiveApiRequest({
    endpoint,
    contentType,
    accept,
    tokens,
}: {
    endpoint: string;
    contentType?: string;
    accept?: string;
    tokens?: HiveApiTokens;
}) {
    const response = await hiveFetch(
        `https://${await getSetting("HIVE_HOSTNAME")}${endpoint}/`,
        {
            headers: {
                Accept: accept ?? "*/*",
                "Content-Type": contentType ?? "application/json",
                Authorization: `Bearer ${(tokens ?? (await getHiveApiToken()))["access"]}`,
            },
        },
    );
    if (response.headers.get("Content-Type") === "application/json") {
        const data = await response.json();
        return data;
    } else if (
        /image\/\w+/gi.test(response.headers.get("Content-Type") ?? "")
    ) {
        return await response.blob();
    }
}

export async function getHiveClasses() {
    const data = await performHiveApiRequest({
        endpoint: "/api/core/management/classes",
    });
    if (!data) {
        return [];
    }
    if (!Array.isArray(data)) {
        return [];
    }
    return data as Array<RawHiveClass>;
}

export async function getHiveUserAvatar(userHiveId: number) {
    return (
        (await performHiveApiRequest({
            endpoint: `/api/core/management/users/${userHiveId}/avatar`,
        })) as Blob
    ).stream();
}

export async function authenticateHiveUser(
    username: string,
    password: string,
): Promise<{
    username: string;
    displayName: string;
    clearance: Clearance;
}> {
    const tokens = await getHiveApiTokenByCreds(username, password);
    if (!tokens.access || !tokens.refresh) {
        throw new HiveError("Authentication failed");
    }
    const userData = await performHiveApiRequest({
        endpoint: "/api/core/management/users/me",
        tokens: tokens,
    });
    return {
        username: username,
        displayName: userData.display_name ? userData.display_name : username,
        clearance: userData.clearance as Clearance,
    };
}
