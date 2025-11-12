'use client';

import { useAuth } from "@/components/auth-provider";
import { createContext, useContext, useMemo, useState } from "react";

export type SettingsContext = {
    default: boolean;
    wsProxyUrl: string;
    hostname: string;
};


const SettingsContextProvider = createContext<SettingsContext>({
    default: true,
    wsProxyUrl: '',
    hostname: '',
});

export const SettingsProvider = ({
    children,
    hostname,
}: { children: React.ReactNode; hostname: string; }) =>
{
    const { clientEnvConfig } = useAuth();
    const [ wsProxyUrl, setWsProxyUrl ] = useState<string>('');

    useMemo(() =>
    {
        setWsProxyUrl(`${clientEnvConfig.WEBSOCKET_PROTOCOL_PREFIX}://${clientEnvConfig.WEBSOCKET_SERVER_HOSTNAME}:${clientEnvConfig.WEBSOCKET_PORT}?token=${hostname}`);
    }, [ setWsProxyUrl, hostname, clientEnvConfig ]);

    return (
        <SettingsContextProvider.Provider value={ {
            default: false,
            wsProxyUrl,
            hostname
        } } >
            { children }
        </SettingsContextProvider.Provider>
    );
};

export function useSettings()
{
    const context = useContext(SettingsContextProvider);
    if (context.default)
    {
        throw Error('useSettings must be used inside SettingsProvider!');
    }
    return context;
}
