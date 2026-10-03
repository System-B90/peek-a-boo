 
"use client";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
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
import { enqueueSnackbarWithSubtext } from "@/components/snackbar-utils";

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

export type VncConnectEvent = Parameters<ConnectParams>[0];
export type VncDisconnectEvent = Parameters<DisconnectParams>[0];
export type VncDesktopNameEvent = Parameters<DesktopNameParams>[0];
export type VncSecurityFailureEvent = Parameters<SecurityFailureParams>[0];
export type VncCredentialsRequiredEvent = Parameters<CredentialsRequiredParams>[0];
export type VncCapabilitiesEvent = Parameters<CapabilitiesParams>[0];

export type VncClientProps = {
    width: number;
    height: number;
} & Omit<VncScreenProps, "rfbOptons" | "url">;

export function ClientVNC({
    vncRef,
    onSecurityFailure,
    onDisconnect,
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
            // Never log the password itself: it ends up in the browser console.
            console.error("VNC security failure; retrying with stored credentials");
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

    const onDisconnectWrapper: DisconnectParams = useCallback(
        (event) => {
            if (!event?.detail?.clean) {
                enqueueSnackbarWithSubtext(
                    enqueueSnackbar,
                    "Failed to connect to student machine!",
                    "Connection closed unexpectedly",
                    { variant: "error", preventDuplicate: true },
                );
            }
            onDisconnect?.(event);
        },
        [onDisconnect],
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
        const watchdog = setInterval(() => {
            const hasCanvasChild =
                (containerRef.current?.getElementsByTagName("canvas").length ??
                    0) > 0;
            if (hasCanvasChild) {
                return;
            }
            isConnecting.current = false;
            setConnectionError(true);
        }, 1000);
        // Without this every mounted card leaked a 1s interval for good.
        return () => clearInterval(watchdog);
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
                onDisconnect={onDisconnectWrapper}
            />
        </div>
    );
}
