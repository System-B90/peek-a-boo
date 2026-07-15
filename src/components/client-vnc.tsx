 
"use client";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import {
    RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { VncScreenHandle, VncScreenProps } from "react-vnc";

import { useAuth } from "@/components/auth-provider";
import { useSettings } from "@/components/settings-provider";

const VncScreen = dynamic(
    () => import("react-vnc").then((mod) => mod.VncScreen),
    { ssr: false },
);

type SecurityFailureParams = Exclude<
    VncScreenProps["onSecurityFailure"],
    undefined
>;
type ConnectParams = Exclude<VncScreenProps["onConnect"], undefined>;
type CredentialsRequiredParams = Exclude<
    VncScreenProps["onCredentialsRequired"],
    undefined
>;
type DisconnectParams = Exclude<VncScreenProps["onDisconnect"], undefined>;
type DesktopNameParams = Exclude<VncScreenProps["onDesktopName"], undefined>;
type CapabilitiesParams = Exclude<VncScreenProps["onCapabilities"], undefined>;
type EventOf<T extends (...args: any) => any> = Parameters<T>[0];

export type VncConnectEvent = EventOf<ConnectParams>;
export type VncDisconnectEvent = EventOf<DisconnectParams>;
export type VncDesktopNameEvent = EventOf<DesktopNameParams>;
export type VncSecurityFailureEvent = EventOf<SecurityFailureParams>;
export type VncCredentialsRequiredEvent = EventOf<CredentialsRequiredParams>;
export type VncCapabilitiesEvent = EventOf<CapabilitiesParams>;

export type VncClientProps = {
    width: number;
    height: number;
} & Omit<VncScreenProps, "rfbOptons" | "url">;

export function ClientVNC({
    vncRef,
    onSecurityFailure,
    ...props
}: { vncRef: RefObject<null | VncScreenHandle> } & VncClientProps) {
    const { vncClientPassword } = useAuth();
    const { wsProxyUrl } = useSettings();
    const containerRef = useRef<HTMLDivElement>(null);
    const isConnecting = useRef(false);
    const isViewOnly = props.viewOnly ?? true;
    const [connectionError, setConnectionError] = useState(false);

    const onSecurityFailureWrapper: SecurityFailureParams = useCallback(
        (event) => {
            console.error(`Security Failure! ${vncClientPassword}`);
            vncRef.current?.sendCredentials({
                password: vncClientPassword,
                target: "",
                username: "",
            });
            if (onSecurityFailure) {
                onSecurityFailure(event);
            }
        },
        [vncClientPassword, vncRef, onSecurityFailure],
    );

    const connectMe = useCallback(() => {
        setConnectionError(false);
        if (isConnecting.current) {
            return;
        }
        isConnecting.current = true;
        vncRef.current?.connect();
    }, [vncRef, isConnecting, setConnectionError]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const timer = setTimeout(() => {
            connectMe();
        }, 1000);
        return () => clearTimeout(timer);
    }, [connectMe]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        setInterval(() => {
            const hasCanvasChild =
                (containerRef.current?.getElementsByTagName("canvas").length ??
                    0) > 0;
            if (hasCanvasChild) {
                return;
            }
            isConnecting.current = false;
            setConnectionError(true);
        }, 1000);
    }, [containerRef, isConnecting, setConnectionError]);

    return (
        <div
            className="relative flex items-center content-center justify-center"
            ref={containerRef}
        >
            {connectionError ? <div className="absolute flex flex-col items-center justify-center content-center">
                <Typography>Connection Error</Typography>
                <Button onClick={connectMe}>Retry</Button>
                <br />
                <br />
            </div> : null}
            <VncScreen
                autoConnect={false}
                background="var(--color-secondary-dark)"
                debug={true}
                focusOnClick={false}
                onSecurityFailure={onSecurityFailureWrapper}
                qualityLevel={9} // Max quality
                ref={vncRef}
                retryDuration={15}
                rfbOptions={{
                    shared: true,
                    credentials: {
                        password: vncClientPassword,
                        username: "",
                        target: "",
                    },
                }}
                scaleViewport={true}
                showDotCursor={true}
                style={{ width: props.width, height: props.height }}
                url={wsProxyUrl}
                viewOnly={isViewOnly}
                {...props}
            />
        </div>
    );
}
