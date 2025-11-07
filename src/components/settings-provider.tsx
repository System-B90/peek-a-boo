'use client';

import { createContext, useContext, useState } from "react";

export type SettingsContext = {
    default: boolean;
    wsProxyUrl: string;
};


const SettingsContextProvider = createContext<SettingsContext>({
    default: true,
    wsProxyUrl: '',
});

export const SettingsProvider = ({
    children,
    defaultWsProxyUrl,
}: { children: React.ReactNode; defaultWsProxyUrl: string; }) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [wsProxyUrl, _setWsProxyUrl] = useState<string>(defaultWsProxyUrl);

    return (
        <SettingsContextProvider.Provider value={{
            default: false,
            wsProxyUrl,
        }} >
            {children}
        </SettingsContextProvider.Provider>
    );
};

export function useSettings() {
    const context = useContext(SettingsContextProvider);
    if (context.default) {
        throw Error('useSettings must be used inside SettingsProvider!');
    }
    return context;
}
