"use client";

import { safeApiFetcher } from "@/client-api/common-utils";
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from "react";
import { enqueueApiErrorSnackbar } from "./snackbar-utils";

export type ClientEnvConfig = {
    WEBSOCKET_PORT: number;
    WEBSOCKET_SERVER_HOSTNAME: string;
    WEBSOCKET_PROTOCOL_PREFIX: string;
    HIVE_HOSTNAME: string;
};

export type AuthContext = {
    default: boolean;
    vncClientPassword: string;
    username: string;
    displayName: string;
    clientEnvConfig: ClientEnvConfig;
    showMentorAccessBar: boolean;
    setShowMentorAccessBar: Dispatch<SetStateAction<boolean>>;
};

const AuthContextProvider = createContext<AuthContext>({
    default: true,
    vncClientPassword: "",
    username: "",
    displayName: "",
    clientEnvConfig: {
        WEBSOCKET_PORT: 0,
        WEBSOCKET_SERVER_HOSTNAME: "",
        WEBSOCKET_PROTOCOL_PREFIX: "",
        HIVE_HOSTNAME: '',
    },
    showMentorAccessBar: true,
    setShowMentorAccessBar: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode; }) =>
{
    const [ cookies, setCookies ] = useState<Record<string, string>>({
        __parsedCookies: "false",
    });
    const [ vncClientPassword, setVncClientPassword ] = useState<string>("");
    const [ username, setUsername ] = useState<string>("");
    const [ displayName, setDisplayName ] = useState<string>("");
    const [ clientEnvConfig, setClientEnvConfig ] = useState<ClientEnvConfig>({
        WEBSOCKET_PORT: parseInt(process.env.WEBSOCKER_PORT ?? (process.env.NODE_ENV === 'development' ? '60800' : '443')),
        WEBSOCKET_SERVER_HOSTNAME: process.env.WEBSOCKET_SERVER_HOSTNAME ?? `wss.${process.env.HOSTNAME}`,
        WEBSOCKET_PROTOCOL_PREFIX: process.env.WEBSOCKET_PROTOCOL_PREFIX ?? 'wss',
        HIVE_HOSTNAME: process.env.HIVE_HOSTNAME ?? 'hive.org',
    });
    const [ showMentorAccessBar, setShowMentorAccessBar ] = useState<boolean>(true);


    useEffect(() =>
    {
        if (typeof document === "undefined")
        {
            return;
        }

        const cookieString = document.cookie;
        const cookieObject: Record<string, string> = cookieString
            .split(";")
            .reduce((acc, curr) =>
            {
                const [ key, value ] = curr.trim().split("=");
                return { ...acc, [ key ]: decodeURIComponent(value) };
            }, {});

        cookieObject[ "__parsedCookies" ] = "true";

        setCookies(cookieObject);
    }, [ setCookies ]);

    useMemo(() =>
    {
        const clientPassword = cookies[ "vncClientPassword" ];
        if (!clientPassword && cookies[ "__parsedCookies" ] === "true")
        {
            window.location.pathname = `/login`;
            return;
        }
        if (!clientPassword)
        {
            return;
        }
        console.log(`setVncClientPassword : ${clientPassword}`);
        setVncClientPassword(atob(clientPassword));
    }, [ cookies, setVncClientPassword ]);

    useEffect(() =>
    {
        if (cookies[ "__parsedCookies" ] !== "true")
        {
            return;
        }
        setDisplayName(cookies[ "name" ]);
        setUsername(cookies[ "username" ]);
        try
        {
            console.log(`setVncClientPassword : ${cookies[ "vncClientPassword" ]}`);
            setVncClientPassword(atob(cookies[ "vncClientPassword" ]));
        } catch { }
    }, [ cookies, setDisplayName, setUsername, setVncClientPassword ]);

    useEffect(() =>
    {
        safeApiFetcher('/api/env').then(setClientEnvConfig).catch((error) => { enqueueApiErrorSnackbar('Failed to fetch server configuration!', error); });
    }, [ setClientEnvConfig ]);

    return (
        <AuthContextProvider.Provider
            value={ {
                default: false,
                vncClientPassword,
                username,
                displayName,
                clientEnvConfig,
                showMentorAccessBar, setShowMentorAccessBar,
            } }
        >
            { children }
        </AuthContextProvider.Provider>
    );
};

export function useAuth()
{
    const context = useContext(AuthContextProvider);
    if (context.default)
    {
        throw Error("useAuth must be used inside AuthProvider!");
    }
    return context;
}
