import { useAuth } from "@/components/auth-provider";
import ClientVNC from "@/components/client-vnc";
import { SettingsProvider } from "@/components/settings-provider";
import { useRef } from "react";
import { VncScreenHandle } from "react-vnc";

export default function VncPage()
{
    const { clientEnvConfig } = useAuth();
    const vncRef = useRef<VncScreenHandle>(null);

    return (
        <div>
            <SettingsProvider
                defaultWsProxyUrl={ `${clientEnvConfig.WEBSOCKET_PROTOCOL_PREFIX}://${clientEnvConfig.WEBSOCKET_SERVER_HOSTNAME}:${clientEnvConfig.WEBSOCKET_PORT}?token=${desktopName}` }
            >
                <ClientVNC
                    vncRef={ vncRef }
                    width={ 1920 }
                    height={ 1080 }
                />
            </SettingsProvider>
        </div>
    );
}
