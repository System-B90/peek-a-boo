"use client";

import { createContext, useContext, useMemo } from "react";

import { useAuth } from "@/components/auth-provider";
import { buildWebsocketProxyUrl } from "@/shared-api/websocket-url";

export type SettingsContext = {
    default: boolean;
    wsProxyUrl: string;
    hostname: string;
};

const SettingsContextProvider = createContext<SettingsContext>({
    default: true,
    wsProxyUrl: "",
    hostname: "",
});

export const SettingsProvider = ({
    children,
    hostname,
}: {
    children: React.ReactNode;
    hostname: string;
}) => {
    const { clientEnvConfig } = useAuth();
    const wsProxyUrl = useMemo(
        () =>
            typeof window === "undefined"
                ? ""
                : buildWebsocketProxyUrl(
                    clientEnvConfig.WEBSOCKET_URL,
                    window.location,
                    hostname,
                ),
        [hostname, clientEnvConfig],
    );

    return (
        <SettingsContextProvider.Provider
            value={{
                default: false,
                wsProxyUrl,
                hostname,
            }}
        >
            {children}
        </SettingsContextProvider.Provider>
    );
};

export function useSettings() {
    const context = useContext(SettingsContextProvider);
    if (context.default) {
        throw Error("useSettings must be used inside SettingsProvider!");
    }
    return context;
}
