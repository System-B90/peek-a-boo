/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from "next/dynamic";
import { RefObject, useCallback, useMemo, useRef } from "react";
import { VncScreenHandle, VncScreenProps } from "react-vnc";
import { useSettings } from "./settings-provider";
import { useAuth } from "@/components/auth-provider";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";

const VncScreen = dynamic(() => import('react-vnc').then(mod => mod.VncScreen), { ssr: false });

type SecurityFailureParams = Exclude<VncScreenProps[ 'onSecurityFailure' ], undefined>;
type ConnectParams = Exclude<VncScreenProps[ 'onConnect' ], undefined>;
type CredentialsRequiredParams = Exclude<VncScreenProps[ 'onCredentialsRequired' ], undefined>;
type DisconnectParams = Exclude<VncScreenProps[ 'onDisconnect' ], undefined>;
type DesktopNameParams = Exclude<VncScreenProps[ 'onDesktopName' ], undefined>;
type CapabilitiesParams = Exclude<VncScreenProps[ 'onCapabilities' ], undefined>;

type EventOf<T extends (...args: any) => any> = Parameters<T>[ 0 ];

export type VncConnectEvent = EventOf<ConnectParams>;
export type VncDisconnectEvent = EventOf<DisconnectParams>;
export type VncDesktopNameEvent = EventOf<DesktopNameParams>;
export type VncSecurityFailureEvent = EventOf<SecurityFailureParams>;
export type VncCredentialsRequiredEvent = EventOf<CredentialsRequiredParams>;
export type VncCapabilitiesEvent = EventOf<CapabilitiesParams>;

export type VncClientProps = {
    width: number;
    height: number;
} & Omit<VncScreenProps, 'url' | 'rfbOptons'>;

export default function ClientVNC({ vncRef, onSecurityFailure, ...props }: { vncRef: RefObject<VncScreenHandle | null>; } & VncClientProps)
{
    const { vncClientPassword } = useAuth();
    const { wsProxyUrl } = useSettings();
    const isConnecting = useRef(false);
    const isViewOnly = props.viewOnly ?? true;

    const onSecurityFailureWrapper: SecurityFailureParams = useCallback((event) =>
    {
        console.error(`Security Failure! ${vncClientPassword}`);
        vncRef.current?.sendCredentials({ password: vncClientPassword, target: '', username: '' });
        if (onSecurityFailure) { onSecurityFailure(event); }
    }, [ vncClientPassword, vncRef, onSecurityFailure ]);

    const connectMe = useCallback(() =>
    {
        if (isConnecting.current) { return; }
        isConnecting.current = true;
        vncRef.current?.connect();
    }, [ vncRef, isConnecting ]);

    useMemo(() =>
    {
        if (typeof window === 'undefined') { return; }
        setTimeout(() =>
        {
            connectMe();
        }, 1000);
    }, [ connectMe ]);

    return (
        <ErrorBoundary errorComponent={ ({ error, reset }) => (
            <div>
                <h2>Connection Error</h2>
                <p>{ error.message }</p>
                <button onClick={ () => { if (reset) { reset(); } connectMe(); } }>Retry</button>
            </div>
        ) }>
            <VncScreen
                url={ wsProxyUrl }
                scaleViewport={ true }
                background="#000000"
                style={ { width: props.width, height: props.height } }
                ref={ vncRef }
                viewOnly={ isViewOnly }
                showDotCursor={ true }
                rfbOptions={ {
                    shared: true,
                    credentials: {
                        password: vncClientPassword,
                        username: "",
                        target: "",
                    }
                } }
                autoConnect={ false }
                qualityLevel={ 9 } // Max quality
                retryDuration={ 5 }
                focusOnClick={ false }
                onSecurityFailure={ onSecurityFailureWrapper }
                debug={ true }
                { ...props }
            />
        </ErrorBoundary>
    );
}