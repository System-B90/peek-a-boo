"use server";

import { Clearance } from "@system-b90/hive-core";

import { getSetting } from "@/server-api/settings";
import {
    HiveError,
    parseNetworkHostNotFoundError,
    HiveConnectionError,
    parseNetworkConnectionResetError,
    parseNetworkTimeoutError,
} from "@/shared-api/errors";
import { RawHiveClass } from "@/shared-api/types";

export async function hiveErrorHandler(
    error: unknown,
): Promise<HiveError | unknown> {
    if (error instanceof HiveError) {
        return error;
    }

    const hostNotFound = parseNetworkHostNotFoundError(error);
    if (hostNotFound) {
        return new HiveConnectionError(
            `Failed to resolve DNS ${hostNotFound.hostname}. Check HIVE_HOSTNAME setting or enivornment variable.`,
        );
    }

    const connectionReset = parseNetworkConnectionResetError(error);
    if (connectionReset) {
        return new HiveConnectionError(
            `Failed to connect to ${connectionReset.host}:${connectionReset.port}. Port returned TCP Reset. Is Hive running? Are the docker ports forwarded?`,
        );
    }

    const connectionTimeout = parseNetworkTimeoutError(error);
    if (connectionTimeout) {
        return new HiveConnectionError(
            `Connection timed out on ${connectionTimeout.host}. Is Hive healthy?`,
        );
    }

    return error;
}

type HiveApiTokens = {
    refresh: string;
    access: string;
};

export async function getHiveApiTokenByCreds(
    username: string,
    password: string,
): Promise<HiveApiTokens> {
    try {
        const request = await fetch(
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
    } catch (error: unknown) {
        throw await hiveErrorHandler(error);
    }
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
    try {
        const response = await fetch(
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
    } catch (error: unknown) {
        throw await hiveErrorHandler(error);
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
    try {
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
            displayName: userData.display_name
                ? userData.display_name
                : username,
            clearance: userData.clearance as Clearance,
        };
    } catch (error: unknown) {
        throw await hiveErrorHandler(error);
    }
}
